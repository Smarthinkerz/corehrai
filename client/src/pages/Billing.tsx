import usePageTitle from "@/hooks/usePageTitle";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Check, Crown, Building2, Zap, CreditCard, ExternalLink, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Billing() {
  usePageTitle("/billing");
  const { toast } = useToast();
  const { user } = useAuth();
  const [annualBilling, setAnnualBilling] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ plan: string; cycle: string } | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>(((user as any)?.phone) || "");

  const { data: plans, isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ["/api/billing/plans"],
  });

  const { data: currentBilling, isLoading: billingLoading } = useQuery<any>({
    queryKey: ["/api/billing/current"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ plan, cycle, phone }: { plan: string; cycle: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/billing/checkout", { plan, cycle, phone });
      if (!res.ok) {
        const data = await res.json();
        const err: any = new Error(data.error || "Failed to start checkout");
        err.requiresPhone = data.requiresPhone;
        throw err;
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl && formRef.current) {
        // Submits as application/x-www-form-urlencoded (default for POST forms)
        // Smarthinkerz responds with 303 → Tap hosted checkout
        formRef.current.action = data.checkoutUrl;
        const fields = data.fields;
        Object.keys(fields).forEach(key => {
          const input = formRef.current!.querySelector(`input[name="${key}"]`) as HTMLInputElement;
          if (input) {
            input.value = fields[key] || "";
          }
        });
        formRef.current.submit();
      }
    },
    onError: (error: any) => {
      if (error?.requiresPhone) {
        setPhoneDialogOpen(true);
        return;
      }
      toast({ title: "Checkout Error", description: error.message, variant: "destructive" });
    },
  });

  const downgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest("POST", "/api/billing/upgrade", { plan });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change plan");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/current"] });
      toast({ title: "Plan Updated", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePlanAction = (planId: string) => {
    if (planId === "free") {
      downgradeMutation.mutate("free");
      return;
    }
    const cycle = annualBilling ? "yearly" : "monthly";
    setPendingPlan({ plan: planId, cycle });
    const existingPhone = ((user as any)?.phone as string | undefined) || phoneInput;
    if (!existingPhone || existingPhone.trim().length < 6) {
      setPhoneDialogOpen(true);
      return;
    }
    checkoutMutation.mutate({ plan: planId, cycle, phone: existingPhone });
  };

  const submitWithPhone = () => {
    const phone = phoneInput.trim();
    if (!/^\+\d{6,}/.test(phone)) {
      toast({
        title: "Invalid phone",
        description: "Please include country code, e.g. +96899887766",
        variant: "destructive",
      });
      return;
    }
    setPhoneDialogOpen(false);
    if (pendingPlan) {
      checkoutMutation.mutate({ ...pendingPlan, phone });
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free": return <Building2 className="h-6 w-6" />;
      case "pro": return <Zap className="h-6 w-6" />;
      case "enterprise": return <Crown className="h-6 w-6" />;
      default: return <Building2 className="h-6 w-6" />;
    }
  };

  const isPending = checkoutMutation.isPending || downgradeMutation.isPending;

  if (plansLoading || billingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" role="main" aria-label="Billing & Subscription">
      <form
        ref={formRef}
        method="POST"
        encType="application/x-www-form-urlencoded"
        target="_self"
        className="hidden"
      >
        <input type="hidden" name="plan" />
        <input type="hidden" name="cycle" />
        <input type="hidden" name="name" />
        <input type="hidden" name="email" />
        <input type="hidden" name="phone" />
      </form>

      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phone number required</DialogTitle>
            <DialogDescription>
              Tap Payments needs a phone number with country code to process your subscription.
              Example: <code>+96899887766</code>
            </DialogDescription>
          </DialogHeader>
          <Input
            type="tel"
            placeholder="+96899887766"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitWithPhone} disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription plan and payments</p>
      </div>

      {currentBilling && (
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <CardDescription>Your active subscription</CardDescription>
                </div>
              </div>
              <Badge variant={currentBilling.status === "active" ? "default" : "destructive"} className="text-sm">
                {currentBilling.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold capitalize text-blue-700 dark:text-blue-400">{currentBilling.plan}</span>
              <span className="text-sm text-gray-500">
                {currentBilling.limits?.maxUsers === -1 ? "Unlimited" : currentBilling.limits?.maxUsers} users,{" "}
                {currentBilling.limits?.maxEmployees === -1 ? "Unlimited" : currentBilling.limits?.maxEmployees} employees
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-3 mb-8">
        <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!annualBilling ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={annualBilling}
          onCheckedChange={setAnnualBilling}
          aria-label="Toggle annual billing"
        />
        <Label htmlFor="billing-toggle" className={`text-sm font-medium ${annualBilling ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
          Annual
        </Label>
        {annualBilling && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Save up to 17%
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan: any) => {
          const isCurrent = currentBilling?.plan === plan.id;
          const displayPrice = annualBilling && plan.annualPrice
            ? Math.round(plan.annualPrice / 12)
            : plan.price;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.highlighted ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 shadow-lg" : ""} ${isCurrent ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 text-xs font-semibold">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 p-3 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${displayPrice}</span>
                  <span className="text-gray-500">/month</span>
                  {annualBilling && plan.annualPrice ? (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      ${plan.annualPrice}/year (save {Math.round((1 - plan.annualPrice / (plan.price * 12)) * 100)}%)
                    </p>
                  ) : plan.annualPrice ? (
                    <p className="text-sm text-gray-400 mt-1">
                      or ${plan.annualPrice}/year
                    </p>
                  ) : null}
                </div>
                <ul className="text-left space-y-2.5 text-sm">
                  {plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : plan.highlighted ? "default" : "outline"}
                  disabled={isCurrent || isPending}
                  onClick={() => handlePlanAction(plan.id)}
                >
                  {isCurrent ? (
                    "Current Plan"
                  ) : isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : plan.price === 0 ? (
                    "Downgrade to Free"
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
                {!isCurrent && plan.price > 0 && (
                  <p className="text-xs text-center text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Secure payment via Tap Payments
                  </p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Separator className="my-8" />

      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          All payments are processed securely through Tap Payments
        </p>
        <p>
          Need help with billing? Contact us at{" "}
          <a href="mailto:billing@hragent.com" className="text-blue-600 hover:underline">billing@hragent.com</a>
        </p>
      </div>
    </div>
  );
}
