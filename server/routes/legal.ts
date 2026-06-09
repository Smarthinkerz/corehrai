import { Router, Request, Response } from "express";

const router = Router();

router.get("/terms", (_req: Request, res: Response) => {
  res.json({
    title: "Terms of Service",
    lastUpdated: "2026-05-01",
    content: `
# Terms of Service

**Effective Date: May 1, 2026**

## 1. Acceptance of Terms
By accessing or using HR Agent ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.

## 2. Description of Service
HR Agent is a cloud-based human resources management platform that provides tools for recruitment, employee management, performance tracking, compliance, analytics, and AI-powered HR insights.

## 3. Account Registration
- You must provide accurate, complete information when creating an account.
- You are responsible for maintaining the security of your account credentials.
- You must be at least 18 years old to use the Service.
- One person or entity may not maintain more than one free account.

## 4. Subscription Plans
- **Free Plan**: Limited to 3 users and 10 employees. Basic features only.
- **Professional Plan**: Up to 25 users and 100 employees. Full feature access excluding enterprise features.
- **Enterprise Plan**: Unlimited users and employees. All features including AI, advanced analytics, and custom integrations.
- Plans are billed monthly or annually. Prices are subject to change with 30 days notice.

## 5. Data Ownership
- You retain all rights to data you input into the Service.
- We do not sell your data to third parties.
- You grant us a limited license to process your data solely to provide the Service.

## 6. Acceptable Use
You agree not to:
- Use the Service for any unlawful purpose
- Attempt to gain unauthorized access to other accounts or systems
- Upload malicious content or code
- Resell or redistribute the Service without authorization
- Use the Service to discriminate against any person

## 7. Data Security
- We implement industry-standard security measures including encryption, access controls, and regular security audits.
- We comply with SOC 2 Type II requirements.
- Data is encrypted at rest and in transit.

## 8. Service Level Agreement
- We target 99.9% uptime for paid plans.
- Scheduled maintenance windows are communicated 48 hours in advance.
- Credits are issued for downtime exceeding SLA commitments.

## 9. Termination
- You may cancel your subscription at any time.
- We may suspend or terminate accounts that violate these terms.
- Upon termination, you may export your data within 30 days.

## 10. Limitation of Liability
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. OUR LIABILITY IS LIMITED TO THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.

## 11. Changes to Terms
We may modify these terms at any time. Material changes will be communicated via email 30 days before taking effect.

## 12. Governing Law
These terms are governed by the laws of the State of Delaware, United States.

## 13. Contact
For questions about these terms, contact legal@hragent.com.
    `.trim(),
  });
});

router.get("/privacy", (_req: Request, res: Response) => {
  res.json({
    title: "Privacy Policy",
    lastUpdated: "2026-05-01",
    content: `
# Privacy Policy

**Effective Date: May 1, 2026**

## 1. Introduction
HR Agent ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.

## 2. Information We Collect

### 2.1 Account Information
- Name, email address, username
- Organization name and billing information
- Role and department within your organization

### 2.2 HR Data
- Employee records, performance data, compliance records
- Recruitment data, candidate information
- Survey responses and engagement data
- Attendance and payroll data

### 2.3 Usage Data
- Login times and IP addresses
- Feature usage patterns
- Browser type and operating system

### 2.4 AI Processing Data
- Data processed by AI features for insights and recommendations
- AI model outputs and predictions

## 3. How We Use Your Information
- To provide and maintain the Service
- To process transactions and manage subscriptions
- To send administrative notifications
- To improve our Service through analytics
- To generate AI-powered insights (within your organization's data)
- To comply with legal obligations

## 4. Data Sharing
We do not sell your personal data. We may share data with:
- **Service Providers**: Cloud hosting, payment processing, email delivery
- **Legal Requirements**: When required by law or legal process
- **Business Transfers**: In connection with a merger or acquisition

## 5. Data Retention
- Active account data is retained while your account is active
- Deleted data is purged within 90 days
- Backup data is retained for 30 days after deletion
- Legal hold data is retained as required

## 6. Data Security
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- Role-based access controls
- Regular security audits and penetration testing
- SOC 2 Type II compliance

## 7. Your Rights (GDPR/CCPA)
You have the right to:
- **Access**: Request a copy of your personal data
- **Rectification**: Correct inaccurate data
- **Erasure**: Request deletion of your data
- **Portability**: Export your data in a standard format
- **Objection**: Object to certain processing activities
- **Restriction**: Limit how we process your data

To exercise these rights, contact privacy@hragent.com.

## 8. International Data Transfers
Data may be transferred to and processed in countries other than your own. We use Standard Contractual Clauses (SCCs) to ensure adequate protection.

## 9. Cookies
We use essential cookies for authentication and session management. Analytics cookies are used only with your consent.

## 10. Children's Privacy
The Service is not intended for individuals under 18 years of age.

## 11. Changes to This Policy
We will notify you of material changes via email or in-app notification at least 30 days before they take effect.

## 12. Contact
Data Protection Officer: dpo@hragent.com
General Privacy Inquiries: privacy@hragent.com
    `.trim(),
  });
});

router.get("/dpa", (_req: Request, res: Response) => {
  res.json({
    title: "Data Processing Agreement",
    lastUpdated: "2026-05-01",
    content: `
# Data Processing Agreement (DPA)

**Effective Date: May 1, 2026**

## 1. Scope
This Data Processing Agreement ("DPA") supplements the Terms of Service and applies to the processing of personal data by HR Agent on behalf of the Customer.

## 2. Definitions
- **Controller**: The Customer who determines the purposes and means of processing personal data.
- **Processor**: HR Agent, which processes personal data on behalf of the Controller.
- **Sub-processor**: A third party engaged by the Processor to process personal data.

## 3. Processing Details
- **Subject Matter**: Provision of HR management platform services
- **Duration**: For the term of the subscription agreement
- **Nature**: Storage, organization, retrieval, and analysis of HR data
- **Categories of Data Subjects**: Employees, candidates, contractors of the Customer
- **Types of Personal Data**: Names, contact information, employment records, performance data, payroll data

## 4. Obligations of the Processor
HR Agent shall:
- Process data only on documented instructions from the Controller
- Ensure persons authorized to process data are bound by confidentiality
- Implement appropriate technical and organizational security measures
- Assist the Controller in responding to data subject requests
- Delete or return all personal data upon termination
- Make available information necessary for audits

## 5. Sub-processors
Current sub-processors:
- Cloud hosting infrastructure
- Payment processing services
- Email delivery services
- AI model providers (data anonymized before processing)

Changes to sub-processors will be communicated 30 days in advance.

## 6. Security Measures
- Encryption at rest (AES-256) and in transit (TLS 1.3)
- Access controls and authentication
- Regular security assessments
- Incident response procedures
- Data backup and recovery

## 7. Data Breach Notification
In the event of a personal data breach, HR Agent will:
- Notify the Controller without undue delay (within 72 hours)
- Provide details of the breach and affected data
- Describe measures taken to address the breach

## 8. International Transfers
Transfers outside the EEA are protected by Standard Contractual Clauses (SCCs) as approved by the European Commission.

## 9. Audit Rights
The Controller may audit HR Agent's compliance with this DPA upon reasonable notice, subject to confidentiality obligations.

## 10. Contact
For DPA-related inquiries: legal@hragent.com
    `.trim(),
  });
});

export default router;
