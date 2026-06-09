import { Router } from "express";
import { storage } from "../storage";
import crypto from "crypto";

const router = Router();

const PLATFORM_ENDPOINTS: Record<string, { api: string; docs: string; launchBase: string }> = {
  virti: {
    api: 'https://api.virti.com/v1',
    docs: 'https://docs.virti.com',
    launchBase: 'https://app.virti.com/experience'
  },
  virtway: {
    api: 'https://api.virtway.com/v2',
    docs: 'https://developer.virtway.com',
    launchBase: 'https://events.virtway.com/session'
  },
  engage_xr: {
    api: 'https://api.engagexr.com/v1',
    docs: 'https://developer.engagexr.com',
    launchBase: 'https://app.engagexr.com/room'
  },
  spatial: {
    api: 'https://api.spatial.io/v1',
    docs: 'https://developer.spatial.io',
    launchBase: 'https://www.spatial.io/s'
  },
};

router.get('/modules', async (_req, res) => {
  try { res.json(await storage.getAllVrTrainingModules()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/modules/:id', async (req, res) => {
  try {
    const m = await storage.getVrTrainingModule(parseInt(req.params.id));
    if (!m) return res.status(404).json({ error: 'Not found' });
    const sessions = await storage.getVrTrainingSessionsByModule(m.id);
    const employees = await storage.getAllEmployees();
    const enrichedSessions = sessions.map(s => ({
      ...s,
      employeeName: employees.find(e => e.id === s.employeeId)?.fullName || 'Unknown',
      employeePosition: employees.find(e => e.id === s.employeeId)?.position,
    }));
    const platformConfig = await storage.getVrPlatformConfig(m.platform);
    res.json({ ...m, sessions: enrichedSessions, platformConfig });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/modules', async (req, res) => {
  try {
    const platformInfo = PLATFORM_ENDPOINTS[req.body.platform] || PLATFORM_ENDPOINTS.virti;
    const externalModuleId = `vr-${req.body.platform}-${crypto.randomUUID().slice(0, 8)}`;

    const m = await storage.createVrTrainingModule({
      ...req.body,
      externalModuleId,
      launchUrl: `${platformInfo.launchBase}/${externalModuleId}`,
      embedUrl: `${platformInfo.launchBase}/${externalModuleId}/embed`,
      environmentConfig: {
        platform: req.body.platform,
        maxConcurrentUsers: 50,
        recordingEnabled: true,
        analyticsEnabled: true,
        vrHeadsetRequired: false,
        supportedDevices: ['VR Headset', 'Desktop Browser', 'Mobile'],
        interactionMode: req.body.category === 'Soft Skills' ? 'ai_roleplay' : 'guided_simulation',
        ...(req.body.environmentConfig || {}),
      }
    });

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created VR training module "${m.title}" on ${req.body.platform} (${externalModuleId})`,
      entityType: 'vr_training',
      entityId: m.id,
    });

    res.status(201).json(m);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/modules/:id', async (req, res) => {
  try {
    const m = await storage.updateVrTrainingModule(parseInt(req.params.id), req.body);
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/modules/:id', async (req, res) => {
  try { await storage.deleteVrTrainingModule(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/modules/:id/launch', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const module = await storage.getVrTrainingModule(parseInt(req.params.id));
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const platformConfig = await storage.getVrPlatformConfig(module.platform);
    const platformInfo = PLATFORM_ENDPOINTS[module.platform] || PLATFORM_ENDPOINTS.virti;

    const externalSessionId = `sess-${crypto.randomUUID().slice(0, 12)}`;
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const sessionUrl = `${platformInfo.launchBase}/${module.externalModuleId}?session=${externalSessionId}&token=${sessionToken}&user=${employee.fullName.replace(/\s/g, '+')}&lang=en`;

    const session = await storage.createVrTrainingSession({
      moduleId: module.id,
      employeeId: employee.id,
      status: 'launched',
      startedAt: new Date(),
      externalSessionId,
      sessionUrl,
      platformData: {
        platform: module.platform,
        launchedBy: (req.user as any)?.username || 'system',
        launchedAt: new Date().toISOString(),
        token: sessionToken,
        deviceType: req.body.deviceType || 'browser',
        environmentConfig: module.environmentConfig,
      },
    });

    await storage.createNotification({
      userId: employee.userId || 1,
      title: 'VR Training Session Ready',
      message: `Your VR training "${module.title}" is ready to launch on ${module.platform}. Click to enter the metaverse environment.`,
      type: 'vr_training',
      isRead: false,
      link: '/vr-training',
    });

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'LAUNCH',
      description: `Launched VR session for ${employee.fullName} — "${module.title}" (${externalSessionId})`,
      entityType: 'vr_training_session',
      entityId: session.id,
    });

    res.status(201).json({
      session,
      launchDetails: {
        sessionUrl,
        externalSessionId,
        platform: module.platform,
        platformName: platformConfig?.displayName || module.platform,
        moduleName: module.title,
        employeeName: employee.fullName,
        supportedDevices: (module.environmentConfig as any)?.supportedDevices || ['Desktop Browser'],
        instructions: getInstructions(module.platform),
      },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/webhooks/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { eventType, sessionId, data } = req.body;

    const allSessions = await storage.getVrTrainingSessionsByModule(0).catch(() => []);
    let sessions: any[] = [];
    const modules = await storage.getAllVrTrainingModules();
    for (const mod of modules) {
      const modSessions = await storage.getVrTrainingSessionsByModule(mod.id);
      sessions = sessions.concat(modSessions);
    }
    const session = sessions.find(s => s.externalSessionId === sessionId);

    if (!session) return res.status(404).json({ error: 'Session not found' });

    switch (eventType) {
      case 'session.started':
        await storage.updateVrTrainingSession(session.id, {
          status: 'in_progress',
          startedAt: new Date(),
          platformData: { ...(session.platformData as any || {}), lastEvent: 'started', startedAt: new Date().toISOString() },
        });
        break;
      case 'session.completed':
        await storage.updateVrTrainingSession(session.id, {
          status: 'completed',
          completedAt: new Date(),
          score: data?.score || null,
          timeSpent: data?.timeSpent || null,
          feedback: data?.feedback || null,
          platformData: {
            ...(session.platformData as any || {}),
            lastEvent: 'completed',
            completedAt: new Date().toISOString(),
            performanceMetrics: data?.metrics || {},
            aiAssessment: data?.aiAssessment || null,
          },
        });
        const module = modules.find(m => m.id === session.moduleId);
        if (module) {
          const allModSessions = await storage.getVrTrainingSessionsByModule(module.id);
          const completed = allModSessions.filter(s => s.status === 'completed');
          const avgScore = completed.length > 0 ? completed.reduce((sum, s) => sum + (s.score || 0), 0) / completed.length : 0;
          const completionRate = allModSessions.length > 0 ? (completed.length / allModSessions.length) * 100 : 0;
          await storage.updateVrTrainingModule(module.id, { avgScore: Math.round(avgScore), completionRate: Math.round(completionRate) } as any);
        }
        break;
      case 'session.failed':
        await storage.updateVrTrainingSession(session.id, {
          status: 'failed',
          platformData: { ...(session.platformData as any || {}), lastEvent: 'failed', error: data?.error },
        });
        break;
    }

    res.json({ received: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/sessions', async (req, res) => {
  try {
    const s = await storage.createVrTrainingSession(req.body);
    res.status(201).json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/sessions/:id', async (req, res) => {
  try {
    const s = await storage.updateVrTrainingSession(parseInt(req.params.id), req.body);
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/sessions/employee/:employeeId', async (req, res) => {
  try { res.json(await storage.getVrTrainingSessionsByEmployee(parseInt(req.params.employeeId))); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/platforms', async (_req, res) => {
  try {
    const configs = await storage.getAllVrPlatformConfigs();
    const allPlatforms = Object.entries(PLATFORM_ENDPOINTS).map(([key, info]) => {
      const config = configs.find(c => c.platform === key);
      return {
        platform: key,
        displayName: config?.displayName || key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        apiEndpoint: info.api,
        docsUrl: info.docs,
        launchBase: info.launchBase,
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
    const platformInfo = PLATFORM_ENDPOINTS[platform];
    if (!platformInfo) return res.status(400).json({ error: 'Unknown platform' });

    const config = await storage.upsertVrPlatformConfig({
      platform,
      displayName: platform.charAt(0).toUpperCase() + platform.slice(1).replace('_', ' '),
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
      description: `Connected VR platform: ${platform}`,
      entityType: 'vr_platform',
      entityId: config.id,
    });

    res.json(config);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/platforms/:platform/disconnect', async (req, res) => {
  try {
    const config = await storage.getVrPlatformConfig(req.params.platform);
    if (!config) return res.status(404).json({ error: 'Platform not found' });
    const updated = await storage.updateVrPlatformConfig(config.id, { status: 'disconnected', apiKeyConfigured: false });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (_req, res) => {
  try {
    const modules = await storage.getAllVrTrainingModules();
    const employees = await storage.getAllEmployees();
    const configs = await storage.getAllVrPlatformConfigs();
    let totalSessions = 0;
    let completedSessions = 0;
    let activeSessions = 0;
    for (const mod of modules) {
      const sessions = await storage.getVrTrainingSessionsByModule(mod.id);
      totalSessions += sessions.length;
      completedSessions += sessions.filter(s => s.status === 'completed').length;
      activeSessions += sessions.filter(s => s.status === 'in_progress' || s.status === 'launched').length;
    }
    res.json({
      totalModules: modules.length,
      activeModules: modules.filter(m => m.isActive).length,
      platforms: Array.from(new Set(modules.map(m => m.platform))),
      connectedPlatforms: configs.filter(c => c.status === 'connected').length,
      avgCompletionRate: modules.length > 0 ? Math.round(modules.reduce((s, m) => s + (m.completionRate || 0), 0) / modules.length) : 0,
      totalEmployees: employees.length,
      totalSessions,
      completedSessions,
      activeSessions,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

function getInstructions(platform: string): string[] {
  const common = ['Ensure a stable internet connection', 'Use headphones for best audio experience'];
  const platformSpecific: Record<string, string[]> = {
    virti: [
      'Click the session link or scan the QR code to enter the VR environment',
      'Compatible with Oculus Quest, HTC Vive, or desktop browser',
      'AI-powered avatars will guide you through roleplay scenarios',
      'Your performance is tracked and scored in real-time',
    ],
    virtway: [
      'Access via desktop browser or Virtway mobile app',
      'Choose your avatar and enter the virtual training space',
      'AI mentors will adapt difficulty based on your responses',
      'Complete all mission objectives to finish the module',
    ],
    engage_xr: [
      'Download the Engage XR app on your VR headset or PC',
      'Enter the session code provided in your launch link',
      'Join the virtual classroom with other participants',
      'Interactive whiteboards and 3D models available for learning',
    ],
    spatial: [
      'Open the Spatial.io link in your browser or VR headset',
      'Your avatar is auto-generated from your profile photo',
      'Navigate the 3D workspace using mouse or controllers',
      'Interact with training materials placed in the virtual space',
    ],
  };
  return [...(platformSpecific[platform] || platformSpecific.virti), ...common];
}

export default router;
