import usePageTitle from "@/hooks/usePageTitle";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WellnessProgramList } from "@/components/wellness/WellnessProgramList";
import { WellnessMetrics } from "@/components/wellness/WellnessMetrics";
import { WellnessResources } from "@/components/wellness/WellnessResources";
import { useToast } from "@/hooks/use-toast";

export default function Wellness() {
  usePageTitle("/wellness");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("programs");

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wellness Programs</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee wellness initiatives and track engagement.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          <WellnessProgramList />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <WellnessMetrics />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <WellnessResources />
        </TabsContent>
      </Tabs>
    </div>
  );
}