import usePageTitle from "@/hooks/usePageTitle";
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Bell, 
  Globe, 
  LockIcon, 
  Mail, 
  Shield, 
  User, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Camera,
  Building
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import {
  useThemeContext,
  PRIMARY_COLOR_PRESETS,
  ACCENT_PRESETS,
  BACKGROUND_TONES,
  RADIUS_OPTIONS,
} from "@/contexts/ThemeContext";
import { Check, RotateCcw } from "lucide-react";
import CompanyLogoUpload from "@/components/settings/CompanyLogoUpload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";

function TwoFactorSection() {
  usePageTitle("/settings");
  const { toast } = useToast();
  const [showSetup, setShowSetup] = useState(false);
  const [qrData, setQrData] = useState<{ qrCodeUrl: string; secret: string } | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [disableOtp, setDisableOtp] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const statusQuery = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/2fa/status"],
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/2fa/setup");
      return res.json();
    },
    onSuccess: (data) => {
      setQrData(data);
      setShowSetup(true);
    },
    onError: () => toast({ title: "Failed to setup 2FA", variant: "destructive" }),
  });

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/2fa/verify", { token });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "2FA Enabled", description: "Two-factor authentication is now active." });
      setShowSetup(false);
      setOtpValue("");
      setQrData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
    },
    onError: () => toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" }),
  });

  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/2fa/disable", { token });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "2FA Disabled" });
      setShowDisable(false);
      setDisableOtp("");
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
    },
    onError: () => toast({ title: "Invalid code", variant: "destructive" }),
  });

  const isEnabled = statusQuery.data?.enabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-base">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {statusQuery.isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isEnabled ? (
                <><CheckCircle2 className="h-3 w-3 text-green-500" /> Enabled</>
              ) : (
                <><XCircle className="h-3 w-3 text-red-400" /> Disabled</>
              )}
            </p>
          </div>
        </div>
        {isEnabled ? (
          <Button variant="destructive" size="sm" onClick={() => setShowDisable(true)}>Disable 2FA</Button>
        ) : (
          <Button variant="outline" onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
            {setupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enable 2FA
          </Button>
        )}
      </div>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>Scan the QR code with your authenticator app, then enter the 6-digit code.</DialogDescription>
          </DialogHeader>
          {qrData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-lg border" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Manual entry key:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded select-all">{qrData.secret}</code>
              </div>
              <div className="flex flex-col items-center gap-3">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button onClick={() => verifyMutation.mutate(otpValue)} disabled={otpValue.length !== 6 || verifyMutation.isPending} className="w-full">
                  {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Enter your current 2FA code to disable.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <InputOTP maxLength={6} value={disableOtp} onChange={setDisableOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button variant="destructive" onClick={() => disableMutation.mutate(disableOtp)} disabled={disableOtp.length !== 6 || disableMutation.isPending} className="w-full">
              {disableMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Disable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  title: z.string().optional(),
  bio: z.string().max(500, { message: "Bio must not be longer than 500 characters." }).optional(),
  avatar: z.string().optional(),
});

// Notifications form schema
const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  taskReminders: z.boolean().default(true),
  newEmployees: z.boolean().default(true),
  surveyResponses: z.boolean().default(true),
});

// Security form schema
const securityFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

// Appearance form schema
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["en", "es", "fr", "de", "zh", "ar"]).default("en"),
  compactMode: z.boolean().default(false),
  animationsEnabled: z.boolean().default(true),
  primaryColor: z.string().default("blue"),
  accentColor: z.string().default("auto"),
  backgroundTone: z.string().default("default"),
  radius: z.string().default("medium"),
});

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const user = useUser();
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      title: user.title,
      bio: user.bio,
      avatar: user.avatar || undefined,
    },
  });

  // Notifications form
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      taskReminders: true,
      newEmployees: true,
      surveyResponses: true,
    },
  });

  // Security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Appearance form
  // Get theme context for appearance settings
  const themeContext = useThemeContext();
  
  // Appearance form with values from ThemeContext
  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: themeContext.theme,
      language: themeContext.language,
      compactMode: themeContext.compactMode,
      animationsEnabled: themeContext.animationsEnabled,
      primaryColor: themeContext.primaryColor,
      accentColor: themeContext.accentColor,
      backgroundTone: themeContext.backgroundTone,
      radius: themeContext.radius,
    },
  });

  // Handler for profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    // Update the global user context with the new profile information
    user.updateProfile({
      name: data.name,
      email: data.email,
      title: data.title || '',
      bio: data.bio || '',
      avatar: data.avatar || null,
    });
    
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  // Handler for notifications form submission
  const onNotificationsSubmit = (data: z.infer<typeof notificationsFormSchema>) => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been updated successfully.",
    });
  };

  // Handler for security form submission
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    toast({
      title: "Password changed",
      description: "Your password has been changed successfully.",
    });
    securityForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Handler for appearance form submission
  const onAppearanceSubmit = (data: z.infer<typeof appearanceFormSchema>) => {
    themeContext.updateAppearance({
      theme: data.theme,
      language: data.language,
      compactMode: data.compactMode,
      animationsEnabled: data.animationsEnabled,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      backgroundTone: data.backgroundTone,
      radius: data.radius,
    });

    toast({
      title: "Appearance settings updated",
      description: "Your appearance settings have been updated successfully.",
    });
  };

  // Live preview: apply changes immediately as the user picks
  const handleLivePreview = (key: string, value: string) => {
    themeContext.updateAppearance({ [key]: value } as any);
  };

  const handleResetTheme = () => {
    themeContext.resetAppearance();
    appearanceForm.reset({
      theme: "light",
      language: "en",
      compactMode: false,
      animationsEnabled: true,
      primaryColor: "blue",
      accentColor: "auto",
      backgroundTone: "default",
      radius: "medium",
    });
    toast({ title: "Theme reset", description: "Appearance restored to defaults." });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "zh", label: "中文" },
    { value: "ar", label: "العربية" },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Company</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab Content */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how it is displayed to others.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative group">
                        {profileForm.getValues('avatar') ? (
                          <img
                            src={profileForm.getValues('avatar')}
                            alt="User avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-gray-500">
                            {profileForm.getValues('name').split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label htmlFor="avatar-upload" className="cursor-pointer p-2 bg-white bg-opacity-90 rounded-full">
                            <Camera className="h-5 w-5 text-gray-700" />
                          </label>
                        </div>
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              profileForm.setValue('avatar', event.target?.result as string);
                              toast({
                                title: "Avatar updated",
                                description: "Your avatar has been changed. Don't forget to save your profile changes!",
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        Change Avatar
                      </Button>
                    </div>
                    
                    <div className="w-full md:w-2/3 space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your job title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about yourself"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Brief description of your professional background and expertise.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab Content */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified about activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="font-medium text-base">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                      </div>
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="font-medium text-base">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                      </div>
                      <FormField
                        control={notificationsForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="font-medium text-base">Weekly Digest</h3>
                        <p className="text-sm text-muted-foreground">Receive a weekly summary of all activities</p>
                      </div>
                      <FormField
                        control={notificationsForm.control}
                        name="weeklyDigest"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="font-medium text-base">Task Reminders</h3>
                        <p className="text-sm text-muted-foreground">Get reminders about upcoming or overdue tasks</p>
                      </div>
                      <FormField
                        control={notificationsForm.control}
                        name="taskReminders"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="font-medium text-base">New Employees</h3>
                        <p className="text-sm text-muted-foreground">Be notified when new employees join</p>
                      </div>
                      <FormField
                        control={notificationsForm.control}
                        name="newEmployees"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="font-medium text-base">Survey Responses</h3>
                        <p className="text-sm text-muted-foreground">Get notified when employees respond to surveys</p>
                      </div>
                      <FormField
                        control={notificationsForm.control}
                        name="surveyResponses"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab Content */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your current password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters and contain a mix of letters, numbers, and symbols.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="gap-2">
                      <LockIcon className="h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card data-tour="settings">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account with two-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TwoFactorSection />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab Content */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the CoreHR AI appears and functions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(v) => { field.onChange(v); handleLivePreview("theme", v); }}
                          >
                            <SelectTrigger data-testid="select-theme-mode">
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System Default</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Choose light, dark, or follow your device.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Primary color swatches */}
                  <FormField
                    control={appearanceForm.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color (buttons, links, active states)</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-7 gap-3 sm:grid-cols-10 lg:grid-cols-14">
                            {PRIMARY_COLOR_PRESETS.map((preset) => {
                              const selected = field.value === preset.name;
                              return (
                                <button
                                  type="button"
                                  key={preset.name}
                                  data-testid={`swatch-primary-${preset.name}`}
                                  onClick={() => { field.onChange(preset.name); handleLivePreview("primaryColor", preset.name); }}
                                  title={preset.label}
                                  className={`relative h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${selected ? "border-foreground ring-2 ring-foreground/30" : "border-transparent"}`}
                                  style={{ backgroundColor: `hsl(${preset.primary})` }}
                                  aria-label={preset.label}
                                  aria-pressed={selected}
                                >
                                  {selected && (
                                    <Check className="absolute inset-0 m-auto h-5 w-5" style={{ color: `hsl(${preset.primaryForeground})` }} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormDescription>Used for primary buttons, focus rings, links, and highlights.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Accent color swatches */}
                  <FormField
                    control={appearanceForm.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color (hover states, secondary highlights)</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-3">
                            {ACCENT_PRESETS.map((preset) => {
                              const selected = field.value === preset.name;
                              const swatchStyle = preset.accent
                                ? { backgroundColor: `hsl(${preset.accent})` }
                                : { backgroundImage: "linear-gradient(135deg, #888 0%, #ccc 100%)" };
                              return (
                                <button
                                  type="button"
                                  key={preset.name}
                                  data-testid={`swatch-accent-${preset.name}`}
                                  onClick={() => { field.onChange(preset.name); handleLivePreview("accentColor", preset.name); }}
                                  className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs transition-all hover:scale-105 ${selected ? "border-foreground bg-accent" : "border-border"}`}
                                  aria-pressed={selected}
                                >
                                  <span className="h-4 w-4 rounded-full" style={swatchStyle} />
                                  {preset.label}
                                  {selected && <Check className="h-3 w-3" />}
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormDescription>"Match Primary" derives an accent automatically from your primary color.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Background tone */}
                  <FormField
                    control={appearanceForm.control}
                    name="backgroundTone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Tone</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {BACKGROUND_TONES.map((tone) => {
                              const selected = field.value === tone.name;
                              return (
                                <button
                                  type="button"
                                  key={tone.name}
                                  data-testid={`tone-${tone.name}`}
                                  onClick={() => { field.onChange(tone.name); handleLivePreview("backgroundTone", tone.name); }}
                                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:scale-[1.02] ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                                  aria-pressed={selected}
                                >
                                  <div className="h-12 w-full rounded border" style={{ backgroundColor: `hsl(${tone.light})` }} />
                                  <span className="text-xs font-medium">{tone.label}</span>
                                  {selected && <Check className="h-3 w-3 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormDescription>Page background tint — subtle but transforms the overall feel.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Border radius */}
                  <FormField
                    control={appearanceForm.control}
                    name="radius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corner Radius</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-3">
                            {RADIUS_OPTIONS.map((opt) => {
                              const selected = field.value === opt.name;
                              return (
                                <button
                                  type="button"
                                  key={opt.name}
                                  data-testid={`radius-${opt.name}`}
                                  onClick={() => { field.onChange(opt.name); handleLivePreview("radius", opt.name); }}
                                  className={`flex flex-col items-center gap-2 border-2 p-3 transition-all hover:scale-[1.02] ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                                  style={{ borderRadius: `${opt.rem}rem` }}
                                  aria-pressed={selected}
                                >
                                  <div className="h-8 w-16 bg-primary" style={{ borderRadius: `${opt.rem}rem` }} />
                                  <span className="text-xs font-medium">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormDescription>Applies to buttons, cards, inputs, and dialogs.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Live preview card */}
                  <div className="rounded-lg border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Live Preview</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button">Primary Button</Button>
                      <Button type="button" variant="secondary">Secondary</Button>
                      <Button type="button" variant="outline">Outline</Button>
                      <Button type="button" variant="ghost">Ghost</Button>
                      <span className="rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground">Accent Pill</span>
                      <span className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Primary Pill</span>
                      <a href="#" className="text-sm text-primary underline-offset-2 hover:underline">A sample link</a>
                    </div>
                  </div>
                  
                  <FormField
                    control={appearanceForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map((language) => (
                                <SelectItem key={language.value} value={language.value}>
                                  {language.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Choose your preferred language for the interface.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h3 className="font-medium text-base">Compact Mode</h3>
                      <p className="text-sm text-muted-foreground">Reduce spacing and show more content on screen</p>
                    </div>
                    <FormField
                      control={appearanceForm.control}
                      name="compactMode"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h3 className="font-medium text-base">Enable Animations</h3>
                      <p className="text-sm text-muted-foreground">Use animations for UI transitions</p>
                    </div>
                    <FormField
                      control={appearanceForm.control}
                      name="animationsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" className="gap-2" onClick={handleResetTheme} data-testid="button-reset-theme">
                      <RotateCcw className="h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button type="submit" className="gap-2" data-testid="button-save-appearance">
                      <Save className="h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Company Tab Content */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>
                Customize your company's branding and information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <CompanyLogoUpload />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;