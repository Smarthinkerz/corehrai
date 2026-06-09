import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  useEffect(() => { document.title = "Cookie Policy — CoreHR AI"; }, []);
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
        <h1 className="text-4xl font-black text-slate-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: June 9, 2026</p>

        {[
          {
            title: "What Are Cookies?",
            body: `Cookies are small text files stored on your device when you visit a website. They help us deliver a better user experience, keep you logged in, and understand how you use our platform.`
          },
          {
            title: "Essential Cookies",
            body: `These cookies are strictly necessary for the Service to function. They include your session authentication cookie (HttpOnly, SameSite=Lax) which keeps you logged in, and a CSRF token cookie that protects against cross-site request forgery attacks. You cannot opt out of essential cookies.`
          },
          {
            title: "Functional Cookies",
            body: `We store your appearance preferences (dark mode, compact mode, language) in localStorage — not cookies — so they persist across sessions without being sent to the server. These are fully under your control and can be reset in Settings.`
          },
          {
            title: "Analytics Cookies",
            body: `If you have consented, we may use analytics tools to understand aggregate usage patterns and improve the product. These cookies do not identify you personally. You can opt out of analytics at any time via your browser or the cookie preferences below.`
          },
          {
            title: "Third-Party Cookies",
            body: `Integrated services (Slack, Zoom, Google, Stripe) may set their own cookies when you use those integrations. We do not control these third-party cookies. Please refer to each provider's cookie policy for details.`
          },
          {
            title: "Managing Cookies",
            body: `You can manage cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies will prevent you from logging in. For analytics opt-out, you can also use browser extensions like uBlock Origin.`
          },
          {
            title: "Cookie List",
            body: `• connect.sid — Session authentication (essential, session-scoped, HttpOnly)
• csrf-token — CSRF protection (essential, session-scoped, SameSite=Lax)
• appearanceSettings — Stored in localStorage, not a cookie (preferences)
• Analytics cookies — Only set with consent, can be opted out`
          },
          {
            title: "Contact",
            body: `Questions about our use of cookies? Email privacy@corehr.ai.`
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-3">{title}</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{body}</p>
          </section>
        ))}

        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 text-sm">
          <Link href="/privacy"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Privacy Policy</span></Link>
          <Link href="/terms"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Terms of Service</span></Link>
          <Link href="/auth"><span className="text-blue-600 hover:underline cursor-pointer font-medium">Sign In</span></Link>
        </div>
      </main>
    </div>
  );
}
