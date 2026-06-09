import usePageTitle from "@/hooks/usePageTitle";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Shield, Users, BarChart3, Brain } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
  role: z.string().default("user"),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [verifyComplete, setVerifyComplete] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    const verify = params.get("verify");

    if (reset) {
      setResetToken(reset);
      setShowResetPassword(true);
    }
    if (verify) {
      setVerifyToken(verify);
      handleVerifyEmail(verify);
    }
  }, []);

  const handleVerifyEmail = async (token: string) => {
    try {
      const res = await apiRequest("POST", "/api/verify-email", { token });
      if (res.ok) {
        setVerifyComplete(true);
      } else {
        const data = await res.json();
        setVerifyError(data.error || "Verification failed");
      }
    } catch {
      setVerifyError("Failed to verify email");
    }
  };

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "", email: "", fullName: "", password: "",
      confirmPassword: "", role: "user", department: "",
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  const onForgotPasswordSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/forgot-password", { email: data.email });
      setResetSent(true);
    } catch {
      toast({ title: "Error", description: "Failed to send reset email", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetPasswordSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/reset-password", {
        token: resetToken,
        newPassword: data.newPassword,
      });
      if (res.ok) {
        setResetComplete(true);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  if (verifyToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {verifyComplete ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Email Verified!</CardTitle>
                <CardDescription>Your email has been successfully verified. You can now log in.</CardDescription>
              </>
            ) : verifyError ? (
              <>
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
                <CardDescription>{verifyError}</CardDescription>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Verifying Email...</CardTitle>
                <CardDescription>Please wait while we verify your email address.</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => { setVerifyToken(""); window.history.replaceState({}, "", "/auth"); }}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            {resetComplete ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-center">Password Reset!</CardTitle>
                <CardDescription className="text-center">Your password has been successfully reset. You can now log in with your new password.</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Set New Password</CardTitle>
                <CardDescription>Enter your new password below.</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {resetComplete ? (
              <div className="text-center">
                <Button onClick={() => { setShowResetPassword(false); setResetComplete(false); window.history.replaceState({}, "", "/auth"); }}>
                  Go to Login
                </Button>
              </div>
            ) : (
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                  <FormField control={resetPasswordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Enter new password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={resetPasswordForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Confirm new password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            {resetSent ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
                <CardDescription className="text-center">If an account with that email exists, we've sent a password reset link. Check your inbox and spam folder.</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="text-center">
                <Button variant="outline" onClick={() => { setShowForgotPassword(false); setResetSent(false); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </div>
            ) : (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField control={forgotPasswordForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="Enter your email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CoreHR AI</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Enterprise HR Management Platform</p>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to sign in</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField control={loginForm.control} name="username" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl><Input placeholder="Enter your username" autoComplete="username" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Enter your password" autoComplete="current-password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>) : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center px-0 pb-0">
                  <p className="text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button onClick={() => setActiveTab("register")} className="text-blue-600 hover:underline focus:outline-none font-medium">Create one</button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Get started with CoreHR AI</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={registerForm.control} name="fullName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="Your full name" autoComplete="name" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={registerForm.control} name="username" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl><Input placeholder="Choose username" autoComplete="username" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={registerForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="your@email.com" autoComplete="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={registerForm.control} name="department" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. Engineering, HR" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={registerForm.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="Min 8 chars, 1 upper, 1 num" autoComplete="new-password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl><Input type="password" placeholder="Re-enter password" autoComplete="new-password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>) : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center px-0 pb-0">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <button onClick={() => setActiveTab("login")} className="text-blue-600 hover:underline focus:outline-none font-medium">Sign in</button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our{" "}
              <a href="/legal/terms" className="text-blue-500 hover:underline">Terms of Service</a> and{" "}
              <a href="/legal/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        <div className="md:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3">Enterprise HR Management</h2>
            <p className="text-lg text-blue-100 mb-8">AI-powered platform for modern HR teams</p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-2.5 shrink-0">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">AI-Powered Insights</h3>
                  <p className="text-sm text-blue-100">Smart analytics, sentiment analysis, and predictive workforce planning</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-2.5 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">Complete HR Suite</h3>
                  <p className="text-sm text-blue-100">Recruitment, onboarding, performance, payroll, and compliance</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-2.5 shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">Advanced Analytics</h3>
                  <p className="text-sm text-blue-100">Real-time dashboards, engagement tracking, and custom reports</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-2.5 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">Enterprise Security</h3>
                  <p className="text-sm text-blue-100">SOC 2 compliant, encrypted data, role-based access controls</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer
        role="contentinfo"
        className="border-t border-slate-200/70 bg-white/70 backdrop-blur-sm px-4 py-3 text-center text-xs text-slate-600"
        data-testid="auth-footer"
      >
        Part of the{" "}
        <a
          href="https://www.smarthinkerz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          data-testid="link-smarthinkerz"
        >
          SmarThinkerz Unified Intelligence Hub
        </a>
      </footer>
    </div>
  );
};

export default AuthPage;
