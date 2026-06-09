import { Router } from "express";
import { storage } from "../storage";
import { insertDocumentSchema } from "@shared/schema";
import { enforceOrgScope, filterByOrg, stampOrg } from "../middleware/orgEnforce";

const router = Router();

router.use(enforceOrgScope);

router.get('/', async (req, res) => {
  try {
    const all = await storage.getAllDocuments();
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const all = await storage.getPublicDocuments();
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch public documents', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const document = await storage.getDocument(Number(req.params.id));
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (document.organizationId != null && document.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch document', error: error.message });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const documents = await storage.getDocumentsByCategory(req.params.category);
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch documents by category', error: error.message });
  }
});

router.get('/department/:department', async (req, res) => {
  try {
    const documents = await storage.getDocumentsByDepartment(req.params.department);
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch documents by department', error: error.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const documents = await storage.getDocumentsByEmployee(Number(req.params.employeeId));
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch documents by employee', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const documentData = {
      title: req.body.title,
      fileName: req.body.fileName,
      fileUrl: req.body.fileUrl,
      fileSize: req.body.fileSize,
      fileType: req.body.fileType,
      description: req.body.description || null,
      category: req.body.category,
      department: req.body.department || null,
      employeeId: req.body.employeeId || null,
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : false,
      status: req.body.status || 'active',
      version: req.body.version || '1.0',
      tags: req.body.tags || null,
      uploadedBy: req.body.uploadedBy || 1
    };
    const validatedData = insertDocumentSchema.parse(documentData);
    const document = await storage.createDocument(stampOrg(validatedData, req.organizationId ?? undefined));
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Uploaded document: ${document.title}`,
      entityType: 'document',
      entityId: document.id
    });
    res.status(201).json(document);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create document', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    const validatedData = insertDocumentSchema.partial().parse(updateData);
    const updatedDocument = await storage.updateDocument(documentId, validatedData);
    if (!updatedDocument) {
      return res.status(404).json({ message: 'Document not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: `Updated document: ${updatedDocument.title}`,
      entityType: 'document',
      entityId: documentId
    });
    res.json(updatedDocument);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update document', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    const document = await storage.getDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const deleted = await storage.deleteDocument(documentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Document not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: `Deleted document: ${document.title}`,
      entityType: 'document',
      entityId: documentId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
});

export default router;
