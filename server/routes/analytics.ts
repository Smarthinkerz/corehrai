import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/overview', async (_req, res) => {
  try {
    const [employees, candidates, departments, tasks, surveys, activities, jobPostings, interviews] = await Promise.all([
      storage.getAllEmployees(),
      storage.getAllCandidates(),
      storage.getAllDepartments(),
      storage.getAllHrTasks(),
      storage.getAllEngagementSurveys(),
      storage.getAllActivityLogs(),
      storage.getAllJobPostings(),
      storage.getAllInterviews(),
    ]);

    res.json({
      totalEmployees: employees.length,
      totalCandidates: candidates.length,
      totalDepartments: departments.length,
      openTasks: tasks.filter(t => t.status !== 'completed').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      activeSurveys: surveys.filter(s => s.status === 'active').length,
      totalActivities: activities.length,
      activeJobPostings: jobPostings.filter(j => j.status === 'active').length,
      totalInterviews: interviews.length,
      scheduledInterviews: interviews.filter(i => i.status === 'scheduled').length,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch overview', error: error.message });
  }
});

router.get('/department-stats', async (_req, res) => {
  try {
    const [employees, departments] = await Promise.all([
      storage.getAllEmployees(),
      storage.getAllDepartments(),
    ]);

    const stats = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department === dept.name);
      return {
        department: dept.name,
        employeeCount: deptEmployees.length,
        headcount: dept.headCount || 0,
      };
    });

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch department stats', error: error.message });
  }
});

router.get('/hiring-funnel', async (_req, res) => {
  try {
    const candidates = await storage.getAllCandidates();
    const stages: Record<string, number> = {};
    candidates.forEach(c => {
      stages[c.status] = (stages[c.status] || 0) + 1;
    });

    const funnel = Object.entries(stages).map(([stage, count]) => ({
      stage,
      count,
    }));

    res.json(funnel);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch hiring funnel', error: error.message });
  }
});

router.get('/activity-trends', async (_req, res) => {
  try {
    const activities = await storage.getAllActivityLogs();
    const dailyCounts: Record<string, number> = {};
    activities.forEach(a => {
      const day = new Date(a.timestamp).toISOString().split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const sorted = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date, count }));

    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch activity trends', error: error.message });
  }
});

router.get('/task-distribution', async (_req, res) => {
  try {
    const tasks = await storage.getAllHrTasks();
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    tasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });

    res.json({
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch task distribution', error: error.message });
  }
});

router.get('/candidate-sources', async (_req, res) => {
  try {
    const candidates = await storage.getAllCandidates();
    const sources: Record<string, number> = {};
    candidates.forEach(c => {
      const source = c.source || 'Direct';
      sources[source] = (sources[source] || 0) + 1;
    });

    res.json(Object.entries(sources).map(([name, value]) => ({ name, value })));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch candidate sources', error: error.message });
  }
});

export default router;
