import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = process.env.EMAIL_FROM || 'CoreHR AI <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
  console.warn('[email] RESEND_API_KEY not set — emails will fail to send.');
}

const resend = new Resend(RESEND_API_KEY || 'missing');

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const { to, subject, text, html, from = DEFAULT_FROM } = options;

  if (!RESEND_API_KEY) {
    throw new Error('Email service not configured: RESEND_API_KEY missing');
  }

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text: text || '',
    html: html || text || '',
  });

  if (error) {
    throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  }

  return {
    success: true,
    messageId: data?.id,
    previewUrl: undefined,
  };
};
