import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(validatedData);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new user',
      entityType: 'user',
      entityId: user.id
    });
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create user', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const validatedData = insertUserSchema.partial().parse(req.body);
    const updatedUser = await storage.updateUser(userId, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated user details',
      entityType: 'user',
      entityId: userId
    });
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update user', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const deleted = await storage.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted user',
      entityType: 'user',
      entityId: userId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;
