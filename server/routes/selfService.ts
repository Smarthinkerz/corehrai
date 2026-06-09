import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { validateBody } from "../middleware/validate";

const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  department: z.string().max(100).optional(),
  profilePicture: z.string().url().optional().nullable(),
});

const leaveRequestSchema = z.object({
  type: z.enum(["annual", "sick", "personal", "maternity", "paternity", "unpaid", "other"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(1).max(500),
});

const leaveReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

const router = Router();

router.get('/profile', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...profile } = user;
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

router.put('/profile', validateBody(profileUpdateSchema), async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const { fullName, email, department, profilePicture } = req.body;
    const updated = await storage.updateUser(userId, { fullName, email, department, profilePicture });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    const { password, ...profile } = updated;
    await storage.createActivityLog({
      userId,
      action: 'UPDATE',
      description: 'Updated own profile',
      entityType: 'user',
      entityId: userId
    });
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

router.get('/leave-requests', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const requests = await storage.getLeaveRequestsByUser(userId);
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
  }
});

router.post('/leave-requests', validateBody(leaveRequestSchema), async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const { type, startDate, endDate, reason } = req.body;
    const request = await storage.createLeaveRequest({
      userId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'pending',
    });
    await storage.createActivityLog({
      userId,
      action: 'CREATE',
      description: `Submitted ${type} leave request`,
      entityType: 'leave_request',
      entityId: request.id
    });
    const allUsers = await storage.getAllUsers();
    const adminsAndManagers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
    const requestingUser = await storage.getUser(userId);
    for (const admin of adminsAndManagers) {
      await storage.createNotification({
        userId: admin.id,
        title: 'New Leave Request',
        message: `${requestingUser?.fullName || 'An employee'} submitted a ${type} leave request.`,
        type: 'info',
        link: '/self-service',
      });
    }
    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create leave request', error: error.message });
  }
});

router.delete('/leave-requests/:id', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const request = await storage.getLeaveRequest(Number(req.params.id));
    if (!request) return res.status(404).json({ message: 'Leave request not found' });
    if (request.userId !== userId) return res.status(403).json({ message: 'Cannot delete another user\'s leave request' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Can only cancel pending requests' });
    await storage.deleteLeaveRequest(request.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete leave request', error: error.message });
  }
});

router.get('/leave-requests/all', async (req, res) => {
  try {
    const userRole = (req.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Admin or manager access required' });
    }
    const requests = await storage.getAllLeaveRequests();
    const allUsers = await storage.getAllUsers();
    const enriched = requests.map(r => ({
      ...r,
      employeeName: allUsers.find(u => u.id === r.userId)?.fullName || 'Unknown',
    }));
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch all leave requests', error: error.message });
  }
});

router.patch('/leave-requests/:id/review', validateBody(leaveReviewSchema), async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const userRole = (req.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Admin or manager access required' });
    }
    const { status } = req.body;
    const request = await storage.getLeaveRequest(Number(req.params.id));
    if (!request) return res.status(404).json({ message: 'Leave request not found' });
    const updated = await storage.updateLeaveRequest(request.id, {
      status,
      reviewedBy: userId,
      reviewedAt: new Date(),
    });
    await storage.createNotification({
      userId: request.userId,
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${request.type} leave request has been ${status}.`,
      type: status === 'approved' ? 'success' : 'warning',
      link: '/self-service',
    });
    await storage.createActivityLog({
      userId,
      action: 'UPDATE',
      description: `${status} leave request #${request.id}`,
      entityType: 'leave_request',
      entityId: request.id
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to review leave request', error: error.message });
  }
});

router.get('/my-documents', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const docs = await storage.getDocumentsByEmployee(userId);
    const publicDocs = await storage.getPublicDocuments();
    const allDocs = [...docs, ...publicDocs.filter(d => !docs.some(e => e.id === d.id))];
    res.json(allDocs);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
});

export default router;
