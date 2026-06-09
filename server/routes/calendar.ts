import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/events', async (req, res) => {
  try {
    const [interviews, leaveRequests, tasks] = await Promise.all([
      storage.getAllInterviews(),
      storage.getAllLeaveRequests(),
      storage.getAllHrTasks()
    ]);

    const events: any[] = [];

    interviews.forEach(i => {
      events.push({
        id: `interview-${i.id}`,
        title: `Interview: ${i.interviewType}`,
        start: i.date,
        end: i.date,
        type: 'interview',
        status: i.status,
        color: '#3B82F6',
        metadata: { candidateId: i.candidateId, location: i.location }
      });
    });

    leaveRequests.forEach(l => {
      events.push({
        id: `leave-${l.id}`,
        title: `Leave: ${l.type}`,
        start: l.startDate,
        end: l.endDate,
        type: 'leave',
        status: l.status,
        color: l.status === 'approved' ? '#10B981' : l.status === 'pending' ? '#F59E0B' : '#EF4444',
        metadata: { userId: l.userId, reason: l.reason }
      });
    });

    tasks.forEach(t => {
      if (t.dueDate) {
        events.push({
          id: `task-${t.id}`,
          title: t.taskName,
          start: t.dueDate,
          end: t.dueDate,
          type: 'task',
          status: t.status,
          color: t.priority === 'high' ? '#EF4444' : t.priority === 'medium' ? '#F59E0B' : '#6B7280',
          metadata: { category: t.category, priority: t.priority }
        });
      }
    });

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
