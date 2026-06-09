import { Router } from "express";
import { storage } from "../storage";
import { insertDepartmentSchema } from "@shared/schema";
import { enforceOrgScope, filterByOrg, stampOrg } from "../middleware/orgEnforce";

const router = Router();

router.use(enforceOrgScope);

router.get('/', async (req, res) => {
  try {
    const all = await storage.getAllDepartments();
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch departments', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const department = await storage.getDepartment(Number(req.params.id));
    if (!department) return res.status(404).json({ message: 'Department not found' });
    if (department.organizationId != null && department.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch department', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const validatedData = insertDepartmentSchema.parse(req.body);
    const department = await storage.createDepartment(stampOrg(validatedData, req.organizationId ?? undefined));
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new department',
      entityType: 'department',
      entityId: department.id
    });
    res.status(201).json(department);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create department', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    const validatedData = insertDepartmentSchema.partial().parse(req.body);
    const updatedDepartment = await storage.updateDepartment(departmentId, validatedData);
    if (!updatedDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated department details',
      entityType: 'department',
      entityId: departmentId
    });
    res.json(updatedDepartment);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update department', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    const deleted = await storage.deleteDepartment(departmentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Department not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted department',
      entityType: 'department',
      entityId: departmentId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete department', error: error.message });
  }
});

export default router;
