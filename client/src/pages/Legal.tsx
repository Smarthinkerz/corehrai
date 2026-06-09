import usePageTitle from "@/hooks/usePageTitle";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Shield, Lock } from "lucide-react";

export default function Legal() {
  usePageTitle("/legal");
  const [activeTab, setActiveTab] = useState("terms");

  const { data: terms, isLoading: termsLoading } = useQuery<any>({
    queryKey: ["/api/legal/terms"],
  });

  const { data: privacy, isLoading: privacyLoading } = useQuery<any>({
    queryKey: ["/api/legal/privacy"],
  });

  const { data: dpa, isLoading: dpaLoading } = useQuery<any>({
    queryKey: ["/api/legal/dpa"],
  });

  const renderMarkdown = (content: string) => {
    if (!content) return null;
    const lines = content.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-200">{line.slice(4)}</h3>;
      if (line.startsWith("- **")) {
        const parts = line.slice(2).split("**");
        return <li key={i} className="ml-6 mb-1 text-gray-600 dark:text-gray-300"><strong>{parts[1]}</strong>{parts[2]}</li>;
      }
      if (line.startsWith("- ")) return <li key={i} className="ml-6 mb-1 text-gray-600 dark:text-gray-300">{line.slice(2)}</li>;
      if (line.startsWith("**")) {
        const text = line.replace(/\*\*/g, "");
        return <p key={i} className="font-semibold text-gray-700 dark:text-gray-200 mt-2">{text}</p>;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto" role="main" aria-label="Legal Documents">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Terms of Service, Privacy Policy, and Data Processing Agreement</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-3 w-full">
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms of Service</span>
            <span className="sm:hidden">Terms</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy Policy</span>
            <span className="sm:hidden">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="dpa" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Data Processing</span>
            <span className="sm:hidden">DPA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms of Service
              </CardTitle>
              {terms && <p className="text-sm text-gray-500">Last updated: {terms.lastUpdated}</p>}
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              {termsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                renderMarkdown(terms?.content || "")
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Policy
              </CardTitle>
              {privacy && <p className="text-sm text-gray-500">Last updated: {privacy.lastUpdated}</p>}
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              {privacyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                renderMarkdown(privacy?.content || "")
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dpa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Processing Agreement
              </CardTitle>
              {dpa && <p className="text-sm text-gray-500">Last updated: {dpa.lastUpdated}</p>}
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              {dpaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                renderMarkdown(dpa?.content || "")
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
