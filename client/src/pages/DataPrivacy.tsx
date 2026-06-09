import usePageTitle from "@/hooks/usePageTitle";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, Shield, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function DataPrivacy() {
  usePageTitle("Data Privacy & GDPR");
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/gdpr/export");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Export complete", description: "Your data has been downloaded." });
    },
    onError: () => {
      toast({ title: "Export failed", description: "Please try again later.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gdpr/delete-request");
      if (!res.ok) throw new Error("Delete request failed");
      return await res.json();
    },
    onSuccess: (data) => {
      setDeleteConfirm(false);
      toast({
        title: "Request submitted",
        description: `Request ${data.requestId} will be processed within 30 days.`,
      });
    },
    onError: () => {
      toast({ title: "Request failed", description: "Please try again later.", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Privacy & GDPR</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal data in compliance with GDPR and data protection regulations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Your Rights</CardTitle>
            </div>
            <CardDescription>Under GDPR, you have the following rights</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm" role="list">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div><strong>Right of Access</strong> - Request a copy of your personal data</div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div><strong>Right to Rectification</strong> - Correct inaccurate data via Self-Service</div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div><strong>Right to Erasure</strong> - Request deletion of your data</div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div><strong>Right to Portability</strong> - Export your data in machine-readable format</div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div><strong>Right to Object</strong> - Object to processing of your data</div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Data We Store</CardTitle>
            </div>
            <CardDescription>Categories of personal data we process</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm" role="list">
              {[
                { label: "Identity", desc: "Name, email, phone number" },
                { label: "Employment", desc: "Department, position, hire date" },
                { label: "Performance", desc: "Reviews, goals, feedback" },
                { label: "Activity", desc: "Login history, audit logs" },
                { label: "Compensation", desc: "Payroll, benefits" },
                { label: "Learning", desc: "Course enrollments, certifications" },
              ].map((item) => (
                <li key={item.label} className="flex items-center justify-between py-1">
                  <span className="font-medium">{item.label}</span>
                  <Badge variant="outline" className="text-xs">{item.desc}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Export Your Data</CardTitle>
          </div>
          <CardDescription>
            Download a complete copy of your personal data in JSON format (Article 15 & 20)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Export typically completes instantly
            </div>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Preparing..." : "Download My Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg text-red-700 dark:text-red-400">Request Data Deletion</CardTitle>
          </div>
          <CardDescription>
            Request permanent deletion of your personal data (Article 17 - Right to Erasure)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Data deletion is irreversible. Some data may be retained for legal obligations (e.g., payroll records for tax compliance). Processing takes up to 30 days.
            </AlertDescription>
          </Alert>

          {!deleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Request Data Deletion
            </Button>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">
                Are you sure? This will submit a formal deletion request.
              </p>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Submitting..." : "Confirm Deletion"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Processing Agreement</CardTitle>
          <CardDescription>Legal basis and retention policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">AES-256</div>
              <div className="text-xs text-muted-foreground mt-1">Encryption at rest</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">TLS 1.3</div>
              <div className="text-xs text-muted-foreground mt-1">Encryption in transit</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">SOC 2</div>
              <div className="text-xs text-muted-foreground mt-1">Compliance standard</div>
            </div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            For questions about data processing, contact our Data Protection Officer at{" "}
            <a href="mailto:dpo@hragent.com" className="text-blue-600 hover:underline">dpo@hragent.com</a>.
            Full privacy policy available on the{" "}
            <a href="/legal" className="text-blue-600 hover:underline">Legal page</a>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
