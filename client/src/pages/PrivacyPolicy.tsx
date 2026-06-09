import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  useEffect(() => { document.title = "Privacy Policy — CoreHR AI"; }, []);
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
        <h1 className="text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: June 9, 2026</p>

        {[
          {
            title: "1. Information We Collect",
            body: `We collect information you provide directly to us, including name, email address, and employment information when you create an account. We also automatically collect certain information about your device and how you interact with our services, including IP addresses, browser type, and pages visited.`
          },
          {
            title: "2. How We Use Your Information",
            body: `We use the information we collect to provide, maintain, and improve our HR services; process transactions; send administrative messages and updates; respond to comments and questions; and comply with legal obligations. HR data processed through CoreHR AI is used solely to deliver the services you request.`
          },
          {
            title: "3. Information Sharing",
            body: `We do not sell, trade, or rent your personal information to third parties. We may share information with vendors and service providers who perform services on our behalf, when required by law, or to protect the rights, property, and safety of CoreHR AI and our users.`
          },
          {
            title: "4. Data Retention",
            body: `We retain personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law (e.g., payroll records for tax compliance). You may request deletion of your data at any time via the GDPR Tools in the app.`
          },
          {
            title: "5. Security",
            body: `We implement industry-standard security measures including encryption at rest and in transit, CSRF protection, rate limiting, and role-based access control. We conduct regular security audits and maintain 0 known CVEs in our dependency chain.`
          },
          {
            title: "6. Your Rights (GDPR / CCPA)",
            body: `You have the right to access, correct, export, or delete your personal data. EU/UK residents have additional rights under GDPR. Submit requests via the Data Privacy page within the app or email privacy@corehr.ai. We will respond within 30 days.`
          },
          {
            title: "7. Cookies",
            body: `We use session cookies to authenticate you, and optional analytics cookies to improve the product. You can manage cookie preferences in your browser settings or via our Cookie Settings page.`
          },
          {
            title: "8. Changes to This Policy",
            body: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy and updating the "Last updated" date. Continued use of the service constitutes acceptance of the updated policy.`
          },
          {
            title: "9. Contact Us",
            body: `If you have any questions about this Privacy Policy, please contact us at privacy@corehr.ai or SmarThinkerz Corp, Data Privacy Team.`
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-3">{title}</h2>
            <p className="text-slate-600 leading-relaxed">{body}</p>
          </section>
        ))}

        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 text-sm">
          <Link href="/terms"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Terms of Service</span></Link>
          <Link href="/cookies"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Cookie Policy</span></Link>
          <Link href="/auth"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Sign In</span></Link>
        </div>
      </main>
    </div>
  );
}
