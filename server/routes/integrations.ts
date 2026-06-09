import { Router, Request, Response } from 'express';
import * as SlackService from '../services/integrations/slack';

const router = Router();

// Test Slack connection
router.get('/slack/test', async (req: Request, res: Response) => {
  try {
    const connectionStatus = await SlackService.verifySlackConnection();
    res.json(connectionStatus);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error testing Slack connection',
      error: error.message || 'Unknown error'
    });
  }
});

// Get list of Slack channels
router.get('/slack/channels', async (req: Request, res: Response) => {
  try {
    const channelsResult = await SlackService.getSlackChannels();
    res.json(channelsResult);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving Slack channels',
      error: error.message || 'Unknown error'
    });
  }
});

// Send message to a Slack channel
router.post('/slack/message', async (req: Request, res: Response) => {
  try {
    const { channelId, text, blocks } = req.body;
    
    if (!channelId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Channel ID and message text are required'
      });
    }
    
    const result = await SlackService.sendSlackMessage(channelId, text, blocks);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error sending Slack message',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;