import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [employees, departments] = await Promise.all([
      storage.getAllEmployees(),
      storage.getAllDepartments()
    ]);

    const orgData = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department === dept.name);
      const managers = deptEmployees.filter(e => e.position.toLowerCase().includes('manager') || e.position.toLowerCase().includes('director') || e.position.toLowerCase().includes('lead'));
      const members = deptEmployees.filter(e => !managers.some(m => m.id === e.id));

      return {
        id: `dept-${dept.id}`,
        name: dept.name,
        headCount: deptEmployees.length,
        budget: dept.budget,
        managers: managers.map(m => ({
          id: m.id,
          name: m.fullName,
          position: m.position,
          email: m.email,
          status: m.status
        })),
        members: members.map(m => ({
          id: m.id,
          name: m.fullName,
          position: m.position,
          email: m.email,
          status: m.status
        }))
      };
    });

    res.json(orgData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
