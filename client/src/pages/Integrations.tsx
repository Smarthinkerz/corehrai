import usePageTitle from "@/hooks/usePageTitle";
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Check, 
  ExternalLink, 
  Link2, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2, 
  XCircle,
  MessageSquare,
  Mail,
  Video,
  FileText,
  Calendar,
  ListChecks,
  Github,
  FileCode,
  Cloud,
  BarChart,
  CreditCard,
  BarChart2,
  Users,
  Building
} from "lucide-react";

// Integration interface
interface Integration {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: string;
  category: string;
}

// Integration form schema
const integrationFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  apiKey: z.string().min(1, { message: "API Key is required." }),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal("")),
});

// Sample integration data
const integrationData = [
  {
    id: 1,
    name: "Microsoft 365",
    description: "Connect to Microsoft 365 for email, calendar and contacts sync.",
    icon: <Mail className="h-8 w-8 text-blue-500" />,
    status: "active",
    category: "communication",
  },
  {
    id: 2,
    name: "Slack",
    description: "Send notifications and updates to your Slack channels.",
    icon: <MessageSquare className="h-8 w-8 text-indigo-500" />,
    status: "active",
    category: "communication",
  },
  {
    id: 3,
    name: "Gmail",
    description: "Connect your Gmail account for email sending and tracking.",
    icon: <Mail className="h-8 w-8 text-red-500" />,
    status: "inactive",
    category: "communication",
  },
  {
    id: 4,
    name: "Zoom",
    description: "Schedule and manage Zoom meetings for interviews and training.",
    icon: <Video className="h-8 w-8 text-blue-500" />,
    status: "active",
    category: "communication",
  },
  {
    id: 5,
    name: "Jira",
    description: "Connect to Jira for project and task management.",
    icon: <ListChecks className="h-8 w-8 text-blue-600" />,
    status: "inactive",
    category: "project",
  },
  {
    id: 6,
    name: "Asana",
    description: "Integrate with Asana for task and project management.",
    icon: <ListChecks className="h-8 w-8 text-orange-500" />,
    status: "inactive",
    category: "project",
  },
  {
    id: 7,
    name: "GitHub",
    description: "Integrate with GitHub for code repository access.",
    icon: <Github className="h-8 w-8 text-black" />,
    status: "inactive",
    category: "development",
  },
  {
    id: 8,
    name: "Notion",
    description: "Connect to Notion for document management and knowledge base.",
    icon: <FileText className="h-8 w-8 text-black" />,
    status: "active",
    category: "documentation",
  },
  {
    id: 9,
    name: "Salesforce",
    description: "Integrate with Salesforce for CRM data.",
    icon: <BarChart className="h-8 w-8 text-blue-600" />,
    status: "inactive",
    category: "crm",
  },
  {
    id: 10,
    name: "Google Calendar",
    description: "Sync schedules with Google Calendar for events and reminders.",
    icon: <Calendar className="h-8 w-8 text-green-500" />,
    status: "active",
    category: "productivity",
  },
  {
    id: 11,
    name: "QuickBooks",
    description: "Connect to QuickBooks for payroll and accounting.",
    icon: <CreditCard className="h-8 w-8 text-green-600" />,
    status: "inactive",
    category: "finance",
  },
  {
    id: 12,
    name: "Zoho",
    description: "Integrate with Zoho for CRM and project management.",
    icon: <BarChart2 className="h-8 w-8 text-red-500" />,
    status: "inactive",
    category: "crm",
  },
  {
    id: 13,
    name: "BambooHR",
    description: "Connect to BambooHR for employee data syncing.",
    icon: <Users className="h-8 w-8 text-green-500" />,
    status: "active",
    category: "hr",
  },
  {
    id: 14,
    name: "Workday",
    description: "Integrate with Workday for HR and finance data.",
    icon: <Building className="h-8 w-8 text-blue-500" />,
    status: "inactive",
    category: "hr",
  },
];

// Categories for filtering
const categories = [
  { value: "all", label: "All Integrations" },
  { value: "hr", label: "HR Systems" },
  { value: "communication", label: "Communication" },
  { value: "project", label: "Project Management" },
  { value: "finance", label: "Finance & Payroll" },
  { value: "crm", label: "CRM & Sales" },
  { value: "productivity", label: "Productivity" },
  { value: "documentation", label: "Documentation" },
  { value: "development", label: "Development" },
];

const Integrations = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Integration form
  const form = useForm<z.infer<typeof integrationFormSchema>>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      name: "",
      apiKey: "",
      apiSecret: "",
      webhookUrl: "",
    },
  });

  // Filter integrations based on search query and category
  const filteredIntegrations = integrationData.filter((integration) => {
    const matchesSearch = 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle new integration form submission
  const onSubmit = (data: z.infer<typeof integrationFormSchema>) => {
    toast({
      title: "Integration Added",
      description: `${data.name} has been successfully connected.`,
    });
    setShowAddDialog(false);
    form.reset();
  };

  // Handle toggling integration status
  const toggleIntegrationStatus = (id: number, currentStatus: string) => {
    const integrationName = integrationData.find(i => i.id === id)?.name;
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    toast({
      title: `Integration ${newStatus === "active" ? "Enabled" : "Disabled"}`,
      description: `${integrationName} has been ${newStatus === "active" ? "enabled" : "disabled"}.`,
    });
  };

  // Open configuration dialog for an integration
  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConfigDialog(true);
    
    // Pre-populate form with selected integration data
    form.reset({
      name: integration.name,
      apiKey: "•••••••••••••••••••••••••••", // Masked API key
      apiSecret: "•••••••••••••••••••••••••••", // Masked API secret
      webhookUrl: "https://api.hragent.com/webhooks/receive",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect the CoreHR AI with your favorite tools and services.
          </p>
        </div>
        
        <Button onClick={() => setShowAddDialog(true)} className="mt-4 md:mt-0 gap-2">
          <Plus className="h-4 w-4" />
          Add New Integration
        </Button>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              className="cursor-pointer hover:bg-muted"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {integration.icon}
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={integration.status === "active" ? "default" : "outline"}>
                  {integration.status === "active" ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Not Connected
                    </span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            
            <CardFooter className="pt-2 flex flex-col items-stretch gap-2">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center">
                  <Switch
                    checked={integration.status === "active"}
                    onCheckedChange={() => toggleIntegrationStatus(integration.id, integration.status)}
                  />
                  <span className="ml-2 text-sm">
                    {integration.status === "active" ? "Enabled" : "Disabled"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-2"
                    onClick={() => openConfigDialog(integration)}
                  >
                    Configure
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {filteredIntegrations.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">No integrations found. Try adjusting your search or filter.</p>
            <Button variant="outline" className="mt-4" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>
      
      {/* Add New Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Integration</DialogTitle>
            <DialogDescription>
              Connect a new service or tool to enhance your CoreHR AI functionality.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Integration Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Slack, Zoom, Jira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter API key" {...field} />
                    </FormControl>
                    <FormDescription>
                      You can find this in your service's developer settings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="apiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter API secret" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL that will receive events from this integration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Connect Integration</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Configure Integration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        {selectedIntegration && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedIntegration.icon}
                <span>Configure {selectedIntegration.name}</span>
              </DialogTitle>
              <DialogDescription>
                Manage connection settings for this integration.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        <a href="#" className="text-blue-500 hover:underline flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Regenerate API Key
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="apiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Permissions</h4>
                  <div className="space-y-2">
                    {["Read employee data", "Send notifications", "View calendars", "Create events"].map((permission, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{permission}</span>
                        <Switch defaultChecked={index < 2} />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-3 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => setShowConfigDialog(false)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Integration
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowConfigDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => {
                      toast({
                        title: "Settings Saved",
                        description: `${selectedIntegration.name} configuration has been updated.`,
                      });
                      setShowConfigDialog(false);
                    }}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Integrations;