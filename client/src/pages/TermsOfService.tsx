import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  useEffect(() => { document.title = "Terms of Service — CoreHR AI"; }, []);
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Brain className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-black text-slate-900">CoreHR AI</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: June 9, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: `By accessing or using CoreHR AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. These terms apply to all users, including administrators, managers, and employees.`
          },
          {
            title: "2. Description of Service",
            body: `CoreHR AI is an enterprise HR software-as-a-service (SaaS) platform that provides workforce management, payroll, recruitment, onboarding, performance management, and AI-powered HR analytics. We reserve the right to modify or discontinue the Service at any time.`
          },
          {
            title: "3. Account Registration",
            body: `You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized account access. Accounts must not be shared between individuals.`
          },
          {
            title: "4. Subscription and Billing",
            body: `CoreHR AI is offered on a subscription basis. Fees are billed in advance. You authorize us to charge your payment method for all fees incurred. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are provided at our discretion in accordance with our refund policy.`
          },
          {
            title: "5. Acceptable Use",
            body: `You agree not to: use the Service for any unlawful purpose; upload malicious code; attempt to gain unauthorized access to any part of the Service; use the Service to process data in violation of applicable privacy laws; or resell or sublicense the Service without written permission.`
          },
          {
            title: "6. Data Ownership",
            body: `You retain all rights to the HR data you input into the Service. We process this data only to provide the Service as described in our Privacy Policy. Upon account termination, you may export your data. We will delete your data within 90 days of termination, unless required by law to retain it.`
          },
          {
            title: "7. Intellectual Property",
            body: `The Service, including all software, interfaces, and content, is owned by SmarThinkerz Corp and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service during your subscription period.`
          },
          {
            title: "8. Limitation of Liability",
            body: `To the maximum extent permitted by law, SmarThinkerz Corp shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the fees paid by you in the 12 months preceding the claim.`
          },
          {
            title: "9. Governing Law",
            body: `These Terms shall be governed by the laws of the jurisdiction in which SmarThinkerz Corp is incorporated, without regard to conflict of law provisions. Disputes shall be resolved by binding arbitration.`
          },
          {
            title: "10. Contact",
            body: `For questions about these Terms, contact us at legal@corehr.ai or SmarThinkerz Corp, Legal Department.`
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-3">{title}</h2>
            <p className="text-slate-600 leading-relaxed">{body}</p>
          </section>
        ))}

        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 text-sm">
          <Link href="/privacy"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Privacy Policy</span></Link>
          <Link href="/cookies"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Cookie Policy</span></Link>
          <Link href="/auth"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Sign In</span></Link>
        </div>
      </main>
    </div>
  );
}
