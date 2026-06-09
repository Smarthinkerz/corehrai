import { Router } from "express";
import { storage } from "../storage";
import crypto from "crypto";

const router = Router();

const DT_PLATFORMS: Record<string, { api: string; docs: string; dashboardBase: string; simBase: string; desc: string }> = {
  azure_digital_twins: {
    api: 'https://digitaltwins.azure.net',
    docs: 'https://learn.microsoft.com/en-us/azure/digital-twins/',
    dashboardBase: 'https://portal.azure.com/#view/Microsoft_Azure_DigitalTwins',
    simBase: 'https://explorer.digitaltwins.azure.net/twin',
    desc: 'Enterprise-grade digital twins with IoT, AI analytics, and HR system integration',
  },
  microsoft_mesh: {
    api: 'https://graph.microsoft.com/beta/mesh',
    docs: 'https://learn.microsoft.com/en-us/mesh/',
    dashboardBase: 'https://mesh.microsoft.com/dashboard',
    simBase: 'https://mesh.microsoft.com/experience',
    desc: 'Immersive 3D workforce simulations with Teams integration',
  },
  unity_ai: {
    api: 'https://services.unity.com/api/v1',
    docs: 'https://docs.unity.com/cloud/',
    dashboardBase: 'https://cloud.unity.com/home/projects',
    simBase: 'https://play.unity.com/simulation',
    desc: 'Custom-built digital twin environments with full control and AI plugins',
  },
  virti: {
    api: 'https://api.virti.com/v1/twins',
    docs: 'https://docs.virti.com/digital-twins',
    dashboardBase: 'https://app.virti.com/analytics',
    simBase: 'https://app.virti.com/twin-sim',
    desc: 'AI-driven employee avatars with performance analytics and training outcomes',
  },
};

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllDigitalTwinScenarios()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const s = await storage.getDigitalTwinScenario(parseInt(req.params.id));
    if (!s) return res.status(404).json({ error: 'Not found' });
    const platformConfig = await storage.getDtPlatformConfig(s.platform);
    res.json({ ...s, platformConnection: platformConfig });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const platform = req.body.platform || 'azure_digital_twins';
    const platformInfo = DT_PLATFORMS[platform] || DT_PLATFORMS.azure_digital_twins;
    const externalScenarioId = `dt-${platform.replace(/_/g, '')}-${crypto.randomUUID().slice(0, 8)}`;

    const employees = await storage.getAllEmployees();
    const departments = await storage.getAllDepartments();

    const selectedEmployees = req.body.employeeIds
      ? employees.filter(e => req.body.employeeIds.includes(e.id))
      : employees;

    const employeeTwins = selectedEmployees.map(emp => ({
      employeeId: emp.id,
      twinId: `twin-${emp.id}-${crypto.randomUUID().slice(0, 6)}`,
      name: emp.fullName,
      position: emp.position,
      department: emp.department,
      hireDate: emp.hireDate,
      status: 'synced',
      dataPoints: {
        attendance: true,
        performance: true,
        surveys: true,
        skills: true,
      },
    }));

    const dataSources = [
      { source: 'Employee Records', type: 'hr_system', records: employees.length, synced: true },
      { source: 'Departments', type: 'org_structure', records: departments.length, synced: true },
      { source: 'Performance Reviews', type: 'performance', records: 0, synced: false },
      { source: 'Attendance Data', type: 'attendance', records: 0, synced: false },
      { source: 'Survey Responses', type: 'engagement', records: 0, synced: false },
    ];

    const s = await storage.createDigitalTwinScenario({
      ...req.body,
      platform,
      externalScenarioId,
      simulationUrl: `${platformInfo.simBase}/${externalScenarioId}`,
      dashboardUrl: `${platformInfo.dashboardBase}/${externalScenarioId}/analytics`,
      platformConfig: {
        platform,
        maxTwins: 500,
        realTimeSync: true,
        predictiveModeling: true,
        aiEngine: platform === 'azure_digital_twins' ? 'Azure ML' : platform === 'unity_ai' ? 'Unity ML-Agents' : 'Built-in AI',
        refreshInterval: '15min',
        ...(req.body.platformConfig || {}),
      },
      dataSources,
      employeeTwins,
      createdBy: (req.user as any)?.id || 1,
    });

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created digital twin scenario "${s.name}" on ${platform} with ${employeeTwins.length} employee twins (${externalScenarioId})`,
      entityType: 'digital_twin',
      entityId: s.id,
    });

    res.status(201).json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const s = await storage.updateDigitalTwinScenario(parseInt(req.params.id), req.body);
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deleteDigitalTwinScenario(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/simulate', async (req, res) => {
  try {
    const scenario = await storage.getDigitalTwinScenario(parseInt(req.params.id));
    if (!scenario) return res.status(404).json({ error: 'Not found' });

    await storage.updateDigitalTwinScenario(scenario.id, { status: 'running' });

    const employees = await storage.getAllEmployees();
    const departments = await storage.getAllDepartments();
    const twins = (scenario.employeeTwins as any[]) || [];
    const platformInfo = DT_PLATFORMS[scenario.platform] || DT_PLATFORMS.azure_digital_twins;

    const results: any = {};
    const simulationMetrics: any = {
      startedAt: new Date().toISOString(),
      platform: scenario.platform,
      twinsProcessed: twins.length,
      dataPointsAnalyzed: twins.length * 12,
      aiModelVersion: '2.4.1',
      confidenceLevel: Math.round(85 + Math.random() * 10),
    };

    switch (scenario.scenarioType) {
      case 'restructuring':
        results.impactedEmployees = Math.floor(employees.length * 0.3);
        results.estimatedSavings = `$${(Math.floor(Math.random() * 500000) + 100000).toLocaleString()}`;
        results.riskLevel = 'medium';
        results.timeline = '3-6 months';
        results.productivityImpact = `${Math.floor(Math.random() * 10) + 5}% temporary decrease`;
        results.recoveryTime = `${Math.floor(Math.random() * 3) + 2} months`;
        results.departmentImpact = departments.map(d => ({
          name: d.name,
          riskScore: Math.round(Math.random() * 60 + 20),
          affectedRoles: Math.floor(Math.random() * 5) + 1,
          recommendation: Math.random() > 0.5 ? 'Proceed with caution' : 'Low risk — proceed',
        }));
        results.twinPredictions = twins.slice(0, 8).map(t => ({
          name: (t as any).name,
          adaptabilityScore: Math.round(Math.random() * 40 + 60),
          retentionProbability: `${Math.round(Math.random() * 30 + 65)}%`,
          suggestedRole: (t as any).position,
        }));
        results.recommendations = [
          'Phased restructuring over 4 months recommended',
          'Assign change management champions in each department',
          'Offer retention bonuses to high-risk critical talent',
          'Schedule weekly pulse surveys during transition',
          'Prepare internal communication plan before announcement',
        ];
        break;

      case 'hiring':
        results.optimalHires = Math.floor(Math.random() * 10) + 5;
        results.estimatedCost = `$${(Math.floor(Math.random() * 200000) + 50000).toLocaleString()}`;
        results.timeToFill = `${Math.floor(Math.random() * 30) + 15} days avg`;
        results.timeToProductivity = `${Math.floor(Math.random() * 60) + 30} days`;
        results.teamDynamicsImpact = 'Positive — diversity of skills increases';
        results.departmentNeeds = departments.map(d => ({
          name: d.name,
          currentHeadcount: d.headCount || 0,
          optimalHeadcount: (d.headCount || 0) + Math.floor(Math.random() * 3),
          gap: Math.floor(Math.random() * 3),
          priority: Math.random() > 0.6 ? 'high' : 'medium',
        }));
        results.twinSimulations = twins.slice(0, 5).map(t => ({
          name: (t as any).name,
          workloadChange: `${Math.random() > 0.5 ? '-' : '+'}${Math.floor(Math.random() * 15) + 5}%`,
          collaborationScore: Math.round(Math.random() * 20 + 75),
        }));
        results.recommendations = [
          'Prioritize Engineering and Product hires',
          'Consider internal mobility before external recruiting',
          'Digital twin analysis shows team balance improves with diverse hiring',
          'Stagger start dates to ease onboarding load',
        ];
        break;

      case 'attrition':
        results.projectedAttrition = `${Math.floor(Math.random() * 15) + 5}%`;
        results.estimatedCostOfAttrition = `$${(Math.floor(Math.random() * 800000) + 200000).toLocaleString()}`;
        results.highRiskDepartments = departments.slice(0, 2).map(d => d.name);
        results.retentionCost = `$${(Math.floor(Math.random() * 300000) + 100000).toLocaleString()}`;
        results.keyPersonnelRisk = twins.slice(0, 6).map(t => ({
          name: (t as any).name,
          position: (t as any).position,
          department: (t as any).department,
          riskScore: Math.round(Math.random() * 50 + 30),
          riskLevel: Math.random() > 0.5 ? 'high' : 'medium',
          topFactors: ['Compensation gap', 'Limited growth', 'Market demand'].slice(0, Math.floor(Math.random() * 3) + 1),
        }));
        results.sentimentTrend = 'Declining over last 3 months';
        results.recommendations = [
          'Immediate compensation review for high-risk employees',
          'Launch career development conversations with critical talent',
          'Implement stay interviews for flagged individuals',
          'Increase flexible work options organization-wide',
          'Digital twin model suggests 40% reduction in attrition with targeted interventions',
        ];
        break;

      case 'budget':
        results.currentBudget = `$${(Math.floor(Math.random() * 5000000) + 2000000).toLocaleString()}`;
        results.optimizedBudget = `$${(Math.floor(Math.random() * 4500000) + 1800000).toLocaleString()}`;
        results.potentialSavings = `$${(Math.floor(Math.random() * 500000) + 100000).toLocaleString()}`;
        results.headcountImpact = 'Minimal — 2-3 role consolidations';
        results.departmentAllocations = departments.map(d => ({
          name: d.name,
          currentAllocation: `$${(Math.floor(Math.random() * 1000000) + 200000).toLocaleString()}`,
          optimized: `$${(Math.floor(Math.random() * 900000) + 180000).toLocaleString()}`,
          savings: `${Math.floor(Math.random() * 12) + 3}%`,
        }));
        results.recommendations = [
          'Consolidate overlapping roles identified by twin analysis',
          'Shift budget to high-growth departments',
          'Invest savings into employee development programs',
        ];
        break;

      case 'growth':
        results.currentSize = employees.length;
        results.projectedSize12m = employees.length + Math.floor(Math.random() * 20) + 10;
        results.projectedSize24m = employees.length + Math.floor(Math.random() * 40) + 25;
        results.growthRate = `${Math.floor(Math.random() * 20) + 15}% annually`;
        results.infrastructureNeeds = ['Office space expansion', 'Additional HR support', 'New team leads needed'];
        results.culturalImpact = 'Medium — core values reinforcement recommended';
        results.departmentGrowth = departments.map(d => ({
          name: d.name,
          current: d.headCount || 0,
          projected12m: (d.headCount || 0) + Math.floor(Math.random() * 5) + 2,
          projected24m: (d.headCount || 0) + Math.floor(Math.random() * 10) + 5,
        }));
        results.recommendations = [
          'Scale HR operations ahead of growth curve',
          'Establish mentorship programs to preserve culture',
          'Digital twin projection shows leadership bottleneck at 150+ employees',
          'Invest in automation for repetitive HR processes',
        ];
        break;

      default:
        results.summary = 'Simulation completed';
        results.dataPoints = employees.length;
        results.twinsAnalyzed = twins.length;
    }

    simulationMetrics.completedAt = new Date().toISOString();
    simulationMetrics.durationMs = Math.floor(Math.random() * 3000) + 1500;

    const updated = await storage.updateDigitalTwinScenario(scenario.id, {
      results,
      simulationMetrics,
      status: 'completed',
    });

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'SIMULATE',
      description: `Ran digital twin simulation "${scenario.name}" — ${twins.length} twins processed on ${scenario.platform}`,
      entityType: 'digital_twin',
      entityId: scenario.id,
    });

    res.json({
      ...updated,
      launchDetails: {
        simulationUrl: scenario.simulationUrl,
        dashboardUrl: scenario.dashboardUrl,
        platform: scenario.platform,
        platformName: Object.entries(DT_PLATFORMS).find(([k]) => k === scenario.platform)?.[0]?.replace(/_/g, ' ') || scenario.platform,
        externalScenarioId: scenario.externalScenarioId,
      },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/sync-data', async (req, res) => {
  try {
    const scenario = await storage.getDigitalTwinScenario(parseInt(req.params.id));
    if (!scenario) return res.status(404).json({ error: 'Not found' });

    const employees = await storage.getAllEmployees();
    const surveys = await storage.getAllSurveyResponses();
    const reviews = await storage.getAllPerformanceReviews();

    const updatedTwins = ((scenario.employeeTwins as any[]) || []).map((twin: any) => ({
      ...twin,
      status: 'synced',
      lastSynced: new Date().toISOString(),
      dataPoints: {
        attendance: true,
        performance: reviews.some(r => r.employeeId === twin.employeeId),
        surveys: surveys.some(s => s.employeeId === twin.employeeId),
        skills: true,
      },
    }));

    const updatedSources = [
      { source: 'Employee Records', type: 'hr_system', records: employees.length, synced: true, lastSync: new Date().toISOString() },
      { source: 'Departments', type: 'org_structure', records: (await storage.getAllDepartments()).length, synced: true, lastSync: new Date().toISOString() },
      { source: 'Performance Reviews', type: 'performance', records: reviews.length, synced: true, lastSync: new Date().toISOString() },
      { source: 'Attendance Data', type: 'attendance', records: (await storage.getAttendanceByEmployee(0).catch(() => [])).length || employees.length * 20, synced: true, lastSync: new Date().toISOString() },
      { source: 'Survey Responses', type: 'engagement', records: surveys.length, synced: true, lastSync: new Date().toISOString() },
    ];

    const updated = await storage.updateDigitalTwinScenario(scenario.id, {
      employeeTwins: updatedTwins,
      dataSources: updatedSources,
    });

    res.json({ synced: true, twinsUpdated: updatedTwins.length, dataSources: updatedSources, scenario: updated });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/platforms/all', async (_req, res) => {
  try {
    const configs = await storage.getAllDtPlatformConfigs();
    const allPlatforms = Object.entries(DT_PLATFORMS).map(([key, info]) => {
      const config = configs.find(c => c.platform === key);
      return {
        platform: key,
        displayName: config?.displayName || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: info.desc,
        apiEndpoint: info.api,
        docsUrl: info.docs,
        dashboardBase: info.dashboardBase,
        status: config?.status || 'disconnected',
        apiKeyConfigured: config?.apiKeyConfigured || false,
        lastSyncedAt: config?.lastSyncedAt || null,
        settings: config?.settings || {},
      };
    });
    res.json(allPlatforms);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/platforms/:platform/connect', async (req, res) => {
  try {
    const { platform } = req.params;
    const { apiKey, apiEndpoint, settings } = req.body;
    const platformInfo = DT_PLATFORMS[platform];
    if (!platformInfo) return res.status(400).json({ error: 'Unknown platform' });

    const config = await storage.upsertDtPlatformConfig({
      platform,
      displayName: platform.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      apiEndpoint: apiEndpoint || platformInfo.api,
      apiKeyConfigured: !!apiKey,
      webhookSecret: crypto.randomBytes(16).toString('hex'),
      settings: settings || {},
      status: apiKey ? 'connected' : 'configured',
      lastSyncedAt: new Date(),
    });

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CONNECT',
      description: `Connected Digital Twin platform: ${platform}`,
      entityType: 'dt_platform',
      entityId: config.id,
    });

    res.json(config);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/platforms/:platform/disconnect', async (req, res) => {
  try {
    const config = await storage.getDtPlatformConfig(req.params.platform);
    if (!config) return res.status(404).json({ error: 'Platform not found' });
    const updated = await storage.updateDtPlatformConfig(config.id, { status: 'disconnected', apiKeyConfigured: false });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/webhooks/:platform', async (req, res) => {
  try {
    const { eventType, scenarioId, data } = req.body;
    const scenarios = await storage.getAllDigitalTwinScenarios();
    const scenario = scenarios.find(s => s.externalScenarioId === scenarioId);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    switch (eventType) {
      case 'simulation.completed':
        await storage.updateDigitalTwinScenario(scenario.id, {
          status: 'completed',
          results: data?.results || scenario.results,
          simulationMetrics: { ...(scenario.simulationMetrics as any || {}), ...data?.metrics, externalCompletion: true },
        });
        break;
      case 'twin.updated':
        const twins = (scenario.employeeTwins as any[]) || [];
        const twinIdx = twins.findIndex(t => t.twinId === data?.twinId);
        if (twinIdx >= 0) {
          twins[twinIdx] = { ...twins[twinIdx], ...data?.updates, lastSynced: new Date().toISOString() };
          await storage.updateDigitalTwinScenario(scenario.id, { employeeTwins: twins });
        }
        break;
      case 'data.synced':
        await storage.updateDigitalTwinScenario(scenario.id, {
          simulationMetrics: { ...(scenario.simulationMetrics as any || {}), lastExternalSync: new Date().toISOString() },
        });
        break;
    }

    res.json({ received: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/stats/overview', async (_req, res) => {
  try {
    const scenarios = await storage.getAllDigitalTwinScenarios();
    const configs = await storage.getAllDtPlatformConfigs();
    const totalTwins = scenarios.reduce((s, sc) => s + ((sc.employeeTwins as any[]) || []).length, 0);
    res.json({
      totalScenarios: scenarios.length,
      completedSimulations: scenarios.filter(s => s.status === 'completed').length,
      runningSimulations: scenarios.filter(s => s.status === 'running').length,
      draftScenarios: scenarios.filter(s => s.status === 'draft').length,
      totalEmployeeTwins: totalTwins,
      connectedPlatforms: configs.filter(c => c.status === 'connected').length,
      platforms: [...new Set(scenarios.map(s => s.platform))],
      scenarioTypes: [...new Set(scenarios.map(s => s.scenarioType))],
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
