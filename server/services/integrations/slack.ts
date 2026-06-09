import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Slack client with the bot token
const slackToken = process.env.SLACK_API_TOKEN;
const slack = new WebClient(slackToken);

/**
 * Verify Slack API connection
 * @returns Promise resolving to an object with connection status and details
 */
export async function verifySlackConnection() {
  try {
    if (!slackToken) {
      return { success: false, message: 'Slack API token not configured' };
    }

    const response = await slack.auth.test();
    
    if (response.ok) {
      return {
        success: true,
        team: response.team,
        user: response.user,
        bot_id: response.bot_id,
        url: response.url
      };
    } else {
      return { success: false, message: 'Slack API connection failed', details: response };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Slack API connection error',
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Send a message to a Slack channel
 * @param channelId - The Slack channel ID to send the message to
 * @param text - The text of the message to send
 * @param blocks - Optional blocks for rich formatting
 * @returns Promise resolving to the result of the operation
 */
export async function sendSlackMessage(
  channelId: string,
  text: string,
  blocks?: any[]
) {
  try {
    if (!slackToken) {
      return { success: false, message: 'Slack API token not configured' };
    }

    const messagePayload: any = {
      channel: channelId,
      text: text
    };
    
    if (blocks && blocks.length > 0) {
      messagePayload.blocks = blocks;
    }
    
    const response = await slack.chat.postMessage(messagePayload);

    if (response.ok) {
      return {
        success: true,
        message: 'Message sent successfully',
        timestamp: response.ts,
        channel: response.channel
      };
    } else {
      return { 
        success: false, 
        message: 'Failed to send message', 
        details: response 
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Error sending Slack message',
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get a list of channels in the workspace
 * @returns Promise resolving to an array of channels
 */
export async function getSlackChannels() {
  try {
    if (!slackToken) {
      return { success: false, message: 'Slack API token not configured' };
    }

    const response = await slack.conversations.list({
      types: 'public_channel,private_channel'
    });

    if (response.ok && response.channels) {
      return {
        success: true,
        channels: response.channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          is_private: channel.is_private,
          num_members: channel.num_members
        }))
      };
    } else {
      return { 
        success: false, 
        message: 'Failed to retrieve channels', 
        details: response 
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Error retrieving Slack channels',
      error: error.message || 'Unknown error'
    };
  }
}