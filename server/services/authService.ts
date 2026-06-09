import { randomBytes, createHash } from "crypto";
import { db } from "../db";
import { passwordResetTokens, emailVerificationTokens, users, loginAuditLog } from "@shared/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { sendEmail } from "./emailService";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: number): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId,
    token: hashedToken,
    expiresAt,
  });

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const hashedToken = hashToken(token);
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, hashedToken),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    );
  return resetToken || null;
}

export async function markPasswordResetTokenUsed(tokenId: number) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}

export async function createEmailVerificationToken(userId: number): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    userId,
    token: hashedToken,
    expiresAt,
  });

  return token;
}

export async function validateEmailVerificationToken(token: string) {
  const hashedToken = hashToken(token);
  const [verifyToken] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, hashedToken),
        isNull(emailVerificationTokens.verifiedAt),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    );
  return verifyToken || null;
}

export async function markEmailVerified(tokenId: number, userId: number) {
  await db
    .update(emailVerificationTokens)
    .set({ verifiedAt: new Date() })
    .where(eq(emailVerificationTokens.id, tokenId));

  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, userId));
}

export async function recordLoginAttempt(data: {
  userId?: number;
  username: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}) {
  await db.insert(loginAuditLog).values({
    userId: data.userId || null,
    username: data.username,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    success: data.success,
    failureReason: data.failureReason || null,
  });
}

export async function incrementFailedLogins(userId: number): Promise<number> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return 0;

  const attempts = (user.failedLoginAttempts || 0) + 1;
  const updateData: any = { failedLoginAttempts: attempts };

  if (attempts >= 5) {
    updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
  return attempts;
}

export async function resetFailedLogins(userId: number) {
  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

export async function isAccountLocked(userId: number): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.lockedUntil) return false;
  if (new Date() > user.lockedUntil) {
    await db.update(users).set({ lockedUntil: null, failedLoginAttempts: 0 }).where(eq(users.id, userId));
    return false;
  }
  return true;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_URL || "https://localhost:5000"}/auth?reset=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset Your Password - HR Agent",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
          <h1 style="color: #1E40AF; margin: 0;">HR Agent</h1>
        </div>
        <div style="padding: 30px 0;">
          <h2 style="color: #1F2937;">Password Reset Request</h2>
          <p style="color: #4B5563; line-height: 1.6;">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
          <div style="text-align: center; padding: 20px 0;">
            <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #9CA3AF; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="border-top: 1px solid #E5E7EB; padding-top: 15px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px;">HR Agent - Enterprise HR Management Platform</p>
        </div>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.APP_URL || "https://localhost:5000"}/auth?verify=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify Your Email - HR Agent",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
          <h1 style="color: #1E40AF; margin: 0;">HR Agent</h1>
        </div>
        <div style="padding: 30px 0;">
          <h2 style="color: #1F2937;">Verify Your Email Address</h2>
          <p style="color: #4B5563; line-height: 1.6;">Welcome to HR Agent! Please verify your email address by clicking the button below. This link expires in 24 hours.</p>
          <div style="text-align: center; padding: 20px 0;">
            <a href="${verifyUrl}" style="background-color: #10B981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #9CA3AF; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div style="border-top: 1px solid #E5E7EB; padding-top: 15px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px;">HR Agent - Enterprise HR Management Platform</p>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, fullName: string, orgName?: string) {
  await sendEmail({
    to: email,
    subject: "Welcome to HR Agent!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
          <h1 style="color: #1E40AF; margin: 0;">HR Agent</h1>
        </div>
        <div style="padding: 30px 0;">
          <h2 style="color: #1F2937;">Welcome, ${fullName}!</h2>
          <p style="color: #4B5563; line-height: 1.6;">Your account${orgName ? ` for <strong>${orgName}</strong>` : ''} has been successfully created.</p>
          <p style="color: #4B5563; line-height: 1.6;">Here's what you can do with HR Agent:</p>
          <ul style="color: #4B5563; line-height: 2;">
            <li>Manage recruitment and onboarding</li>
            <li>Track employee performance and engagement</li>
            <li>Run compliance and workforce analytics</li>
            <li>AI-powered insights and automation</li>
          </ul>
        </div>
        <div style="border-top: 1px solid #E5E7EB; padding-top: 15px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px;">HR Agent - Enterprise HR Management Platform</p>
        </div>
      </div>
    `,
  });
}
