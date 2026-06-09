import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/export', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const employees = await storage.getAllEmployees();
    const userEmployee = employees.find((e: any) => e.userId === userId);

    const exportData: Record<string, any> = {
      exportDate: new Date().toISOString(),
      format: "GDPR Article 15 - Right of Access",
      account: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
    };

    if (userEmployee) {
      exportData.employeeProfile = {
        id: userEmployee.id,
        fullName: userEmployee.fullName,
        email: userEmployee.email,
        phone: userEmployee.phone,
        department: userEmployee.department,
        position: userEmployee.position,
        status: userEmployee.status,
        hireDate: userEmployee.hireDate,
      };
    }

    const activities = await storage.getAllActivityLogs();
    exportData.activityLogs = activities
      .filter((a: any) => a.userId === userId)
      .map((a: any) => ({
        action: a.action,
        description: a.description,
        entityType: a.entityType,
        createdAt: a.createdAt,
      }));

    await storage.createActivityLog({
      userId,
      action: 'EXPORT',
      description: 'GDPR data export requested',
      entityType: 'user',
      entityId: userId,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${userId}-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate data export" });
  }
});

router.post('/delete-request', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await storage.createActivityLog({
      userId,
      action: 'DELETE_REQUEST',
      description: 'GDPR data deletion request submitted',
      entityType: 'user',
      entityId: userId,
    });

    res.json({
      message: "Your data deletion request has been submitted. Our privacy team will process it within 30 days as required by GDPR Article 17.",
      requestId: `DEL-${Date.now()}`,
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit deletion request" });
  }
});

export default router;
