import { Router } from "express";
import { storage } from "../storage";
import { insertHrTaskSchema } from "@shared/schema";
import { enforceOrgScope, filterByOrg, stampOrg } from "../middleware/orgEnforce";

const router = Router();

router.use(enforceOrgScope);

router.get('/', async (req, res) => {
  try {
    const all = await storage.getAllHrTasks();
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await storage.getHrTask(Number(req.params.id));
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.organizationId != null && task.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const all = await storage.getHrTasksByCategory(req.params.category);
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch tasks by category', error: error.message });
  }
});

router.get('/assignee/:assigneeId', async (req, res) => {
  try {
    const all = await storage.getHrTasksByAssignee(Number(req.params.assigneeId));
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch tasks by assignee', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const requestData = { ...req.body };
    if (requestData.dueDate && typeof requestData.dueDate === 'string') {
      requestData.dueDate = new Date(requestData.dueDate);
    }
    const validatedData = insertHrTaskSchema.parse(requestData);
    const task = await storage.createHrTask(stampOrg(validatedData, req.organizationId ?? undefined));
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new task',
      entityType: 'task',
      entityId: task.id
    });
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create task', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const requestData = { ...req.body };
    if (requestData.dueDate && typeof requestData.dueDate === 'string') {
      requestData.dueDate = new Date(requestData.dueDate);
    }
    const taskId = Number(req.params.id);
    const validatedData = insertHrTaskSchema.partial().parse(requestData);
    const updatedTask = await storage.updateHrTask(taskId, validatedData);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated task details',
      entityType: 'task',
      entityId: taskId
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(updatedTask);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update task', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const requestData = { ...req.body };
    if (requestData.dueDate && typeof requestData.dueDate === 'string') {
      requestData.dueDate = new Date(requestData.dueDate);
    }
    const taskId = Number(req.params.id);
    const existingTask = await storage.getHrTask(taskId);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const validatedData = insertHrTaskSchema.partial().parse(requestData);
    let updatedTask = await storage.updateHrTask(taskId, validatedData);
    if (!updatedTask) {
      updatedTask = await storage.getHrTask(taskId);
      if (!updatedTask) {
        return res.status(500).json({ message: 'Failed to update and retrieve task' });
      }
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated task details',
      entityType: 'task',
      entityId: taskId
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(updatedTask);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update task', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const deleted = await storage.deleteHrTask(taskId);
    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted task',
      entityType: 'task',
      entityId: taskId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

export default router;
