import { Router } from "express";
import { storage } from "../storage";
import { insertEmployeeSchema } from "@shared/schema";
import { parsePagination, paginatedResponse } from "../middleware/pagination";
import { enforceOrgScope, filterByOrg, stampOrg } from "../middleware/orgEnforce";

const router = Router();

router.use(enforceOrgScope);

router.get('/', async (req, res) => {
  try {
    const all = await storage.getAllEmployees();
    const employees = filterByOrg(all, req.organizationId ?? undefined);
    if (req.query.page) {
      const params = parsePagination(req);
      const paginated = employees.slice(params.offset, params.offset + params.limit);
      return res.json(paginatedResponse(paginated, employees.length, params));
    }
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await storage.getEmployee(Number(req.params.id));
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (employee.organizationId != null && employee.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch employee', error: error.message });
  }
});

router.get('/department/:department', async (req, res) => {
  try {
    const all = await storage.getEmployeesByDepartment(req.params.department);
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch employees by department', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const requestData = { ...req.body };
    if (requestData.hireDate && typeof requestData.hireDate === 'string') {
      requestData.hireDate = new Date(requestData.hireDate);
    }
    const validatedData = insertEmployeeSchema.parse(requestData);
    const employee = await storage.createEmployee(stampOrg(validatedData, req.organizationId ?? undefined));
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new employee',
      entityType: 'employee',
      entityId: employee.id
    });
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create employee', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const existing = await storage.getEmployee(employeeId);
    if (!existing) return res.status(404).json({ message: 'Employee not found' });
    if (existing.organizationId != null && existing.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const requestData = { ...req.body };
    if (requestData.hireDate && typeof requestData.hireDate === 'string') {
      requestData.hireDate = new Date(requestData.hireDate);
    }
    const validatedData = insertEmployeeSchema.partial().parse(requestData);
    const updatedEmployee = await storage.updateEmployee(employeeId, validatedData);
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated employee details',
      entityType: 'employee',
      entityId: employeeId
    });
    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update employee', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const existing = await storage.getEmployee(employeeId);
    if (!existing) return res.status(404).json({ message: 'Employee not found' });
    if (existing.organizationId != null && existing.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const deleted = await storage.deleteEmployee(employeeId);
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted employee',
      entityType: 'employee',
      entityId: employeeId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete employee', error: error.message });
  }
});

export default router;
