import { Router } from "express";
import { storage } from "../storage";
import { sendEmail, type EmailOptions } from "../services/emailService";

const router = Router();

router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ message: 'Missing required email parameters' });
    }
    const emailOptions: EmailOptions = { to, subject, text, html };
    const result = await sendEmail(emailOptions);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'EMAIL',
      description: `Email sent to ${to}`,
      entityType: 'email',
      entityId: 0
    });
    res.json({ success: true, message: 'Email sent successfully', result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

export default router;
