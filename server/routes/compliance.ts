import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

function calculateRisk(record: any) {
  let risk: 'high' | 'medium' | 'low' = 'low';
  let standardizedStatus = record.status.toLowerCase();
  if (standardizedStatus === 'verified') standardizedStatus = 'compliant';
  if (standardizedStatus === 'pending') standardizedStatus = 'at-risk';
  if (standardizedStatus === 'expired') standardizedStatus = 'non-compliant';

  const now = new Date();
  const expiryDate = record.expiryDate ? new Date(record.expiryDate) : null;
  const daysUntilExpiry = expiryDate
    ? Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (standardizedStatus === 'non-compliant' || (expiryDate && daysUntilExpiry! < 0)) {
    risk = 'high';
  } else if (standardizedStatus === 'at-risk' || (expiryDate && daysUntilExpiry! < 30)) {
    risk = 'medium';
  }

  return {
    id: record.id,
    documentName: record.documentName,
    documentType: record.documentType,
    status: standardizedStatus,
    expiryDate: record.expiryDate?.toISOString() || null,
    risk,
    employeeId: record.employeeId
  };
}

router.get('/', async (req, res) => {
  try {
    const records = await storage.getAllComplianceRecords();
    const recordsWithRisk = records.map(calculateRisk);
    const pagination = parsePagination(req);
    const page = recordsWithRisk.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, recordsWithRisk.length, pagination));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch compliance records', error: error.message });
  }
});

router.post('/check', async (req, res) => {
  try {
    const records = await storage.getAllComplianceRecords();
    const updatedRecords = await Promise.all(records.map(async record => {
      let status = record.status;
      const now = new Date();
      if (record.expiryDate) {
        const expiryDate = new Date(record.expiryDate);
        if (expiryDate < now) {
          status = 'expired';
          await storage.updateComplianceRecord(record.id, { status });
        } else if ((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 30) {
          status = 'pending';
          await storage.updateComplianceRecord(record.id, { status });
        }
      }
      return { ...record, status };
    }));

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CHECK',
      description: 'Ran compliance check on all records',
      entityType: 'compliance',
      entityId: 0
    });

    const recordsWithRisk = updatedRecords.map(calculateRisk);
    res.json({
      success: true,
      message: 'Compliance check completed successfully',
      timestamp: new Date().toISOString(),
      recordsChecked: records.length,
      recordsUpdated: updatedRecords.filter(r => r.status !== records.find(or => or.id === r.id)?.status).length,
      records: recordsWithRisk
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to run compliance check', error: error.message });
  }
});

export default router;
