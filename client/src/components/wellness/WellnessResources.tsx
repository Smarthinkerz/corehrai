import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Video, Link as LinkIcon, BookOpen, Download } from "lucide-react";

// Resource types for the wellness resources
interface WellnessResource {
  id: number;
  title: string;
  description: string;
  type: "article" | "video" | "guide" | "template" | "external";
  url: string;
  category: string;
  tags: string[];
  publishedDate: string;
  author?: string;
  duration?: string;
  imageUrl?: string;
}

// Sample resources for the wellness section
const sampleResources: WellnessResource[] = [
  // Mental Health Resources
  {
    id: 1,
    title: "Understanding Workplace Stress",
    description: "Learn about common workplace stressors and effective coping strategies.",
    type: "article",
    url: "https://www.apa.org/topics/healthy-workplaces/workplace-stress",
    category: "mental",
    tags: ["stress", "mental-health", "coping-strategies"],
    publishedDate: "2025-03-15",
    author: "Dr. Sarah Johnson",
    imageUrl: "https://placehold.co/600x200/9333ea/ffffff?text=Workplace+Stress"
  },
  {
    id: 2,
    title: "Mindfulness Meditation Basics",
    description: "Introduction to mindfulness meditation with guided exercises for beginners.",
    type: "video",
    url: "https://www.youtube.com/watch?v=U9YKY7fdwyg",
    category: "mental",
    tags: ["meditation", "mindfulness", "stress-reduction"],
    publishedDate: "2024-12-05",
    duration: "15 min",
    imageUrl: "https://placehold.co/600x200/9333ea/ffffff?text=Mindfulness+Meditation"
  },
  {
    id: 3,
    title: "External Resources for Mental Health Support",
    description: "A curated list of external mental health resources, hotlines, and support services.",
    type: "external",
    url: "https://www.nimh.nih.gov/health/find-help",
    category: "mental",
    tags: ["mental-health", "support", "resources"],
    publishedDate: "2025-03-20",
    imageUrl: "https://placehold.co/600x200/9333ea/ffffff?text=Mental+Health+Resources"
  },
  {
    id: 4,
    title: "Managing Anxiety in the Workplace",
    description: "Practical strategies to recognize and manage anxiety symptoms during work hours.",
    type: "guide",
    url: "https://adaa.org/understanding-anxiety",
    category: "mental",
    tags: ["anxiety", "workplace", "mental-health"],
    publishedDate: "2025-01-18",
    author: "Anxiety and Depression Association",
    imageUrl: "https://placehold.co/600x200/9333ea/ffffff?text=Managing+Anxiety"
  },

  // Physical Health Resources
  {
    id: 5,
    title: "5-Minute Desk Stretches",
    description: "Quick stretches you can do at your desk to reduce tension and improve circulation.",
    type: "video",
    url: "https://www.youtube.com/watch?v=wUEl8KrMz14",
    category: "physical",
    tags: ["stretching", "office-ergonomics", "physical-health"],
    publishedDate: "2025-02-20",
    duration: "8 min",
    imageUrl: "https://placehold.co/600x200/22c55e/ffffff?text=Desk+Stretches"
  },
  {
    id: 6,
    title: "Healthy Meal Prep Templates",
    description: "Weekly meal planning templates with nutritionist-approved recipes and shopping lists.",
    type: "template",
    url: "https://www.myplate.gov/eat-healthy/healthy-eating-budget/meal-planning",
    category: "physical",
    tags: ["nutrition", "meal-planning", "healthy-eating"],
    publishedDate: "2025-03-01",
    imageUrl: "https://placehold.co/600x200/22c55e/ffffff?text=Meal+Prep+Templates"
  },
  {
    id: 7,
    title: "Sleep Optimization Guide",
    description: "Science-backed strategies to improve sleep quality and establish healthy sleep routines.",
    type: "guide",
    url: "https://www.sleepfoundation.org/sleep-hygiene",
    category: "physical",
    tags: ["sleep", "health", "productivity"],
    publishedDate: "2025-01-25",
    author: "Dr. Michael Torres",
    imageUrl: "https://placehold.co/600x200/22c55e/ffffff?text=Sleep+Optimization"
  },
  {
    id: 8,
    title: "Ergonomic Workspace Setup",
    description: "How to set up your workspace to prevent pain and injury during long hours at your desk.",
    type: "article",
    url: "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/office-ergonomics/art-20046169",
    category: "physical",
    tags: ["ergonomics", "posture", "office-health"],
    publishedDate: "2025-02-05",
    author: "Mayo Clinic Staff",
    imageUrl: "https://placehold.co/600x200/22c55e/ffffff?text=Ergonomic+Workspace"
  },

  // Financial Wellness Resources
  {
    id: 9,
    title: "Financial Wellness Guide",
    description: "A comprehensive guide to managing personal finances and planning for the future.",
    type: "guide",
    url: "https://www.consumerfinance.gov/consumer-tools/financial-well-being/",
    category: "financial",
    tags: ["budgeting", "retirement", "financial-planning"],
    publishedDate: "2025-01-10",
    author: "Mark Williams, CFP",
    imageUrl: "https://placehold.co/600x200/3b82f6/ffffff?text=Financial+Wellness+Guide"
  },
  {
    id: 10,
    title: "Retirement Planning Essentials",
    description: "Key strategies for planning your retirement at any career stage.",
    type: "article",
    url: "https://www.investor.gov/introduction-investing",
    category: "financial",
    tags: ["retirement", "investing", "future-planning"],
    publishedDate: "2025-01-30",
    author: "Investor.gov",
    imageUrl: "https://placehold.co/600x200/3b82f6/ffffff?text=Retirement+Planning"
  },
  {
    id: 11,
    title: "Budget Template & Calculator",
    description: "Customizable template to track expenses, savings and create a realistic monthly budget.",
    type: "template",
    url: "https://www.nerdwallet.com/article/finance/budget-worksheet",
    category: "financial",
    tags: ["budgeting", "expenses", "planning"],
    publishedDate: "2025-02-15",
    imageUrl: "https://placehold.co/600x200/3b82f6/ffffff?text=Budget+Calculator"
  },
  {
    id: 12,
    title: "Emergency Fund Planning",
    description: "How to build and maintain an emergency fund to provide financial security.",
    type: "guide",
    url: "https://www.ramseysolutions.com/budgeting/starter-emergency-fund",
    category: "financial",
    tags: ["emergency-fund", "savings", "financial-security"],
    publishedDate: "2025-03-10",
    author: "Ramsey Solutions",
    imageUrl: "https://placehold.co/600x200/3b82f6/ffffff?text=Emergency+Fund"
  },

  // Social Wellness Resources
  {
    id: 13,
    title: "Building Strong Work Relationships",
    description: "Strategies for fostering positive connections with colleagues in remote and in-person environments.",
    type: "article",
    url: "https://hbr.org/2019/01/how-to-build-trust-with-colleagues-youve-never-met-in-person",
    category: "social",
    tags: ["teamwork", "communication", "relationship-building"],
    publishedDate: "2025-02-12",
    author: "Dr. Rebecca Chen",
    imageUrl: "https://placehold.co/600x200/fb923c/ffffff?text=Work+Relationships"
  },
  {
    id: 14,
    title: "Effective Communication Techniques",
    description: "Research-backed methods to improve communication skills in professional settings.",
    type: "guide",
    url: "https://www.mindtools.com/pages/article/newCS_99.htm",
    category: "social",
    tags: ["communication", "listening", "professional-development"],
    publishedDate: "2025-01-22",
    author: "MindTools",
    imageUrl: "https://placehold.co/600x200/fb923c/ffffff?text=Communication+Techniques"
  },
  {
    id: 15,
    title: "Networking Strategies for Introverts",
    description: "How to build a professional network when social interactions are challenging.",
    type: "article",
    url: "https://www.themuse.com/advice/an-introverts-guide-to-networking",
    category: "social",
    tags: ["networking", "introversion", "career-growth"],
    publishedDate: "2025-02-28",
    author: "The Muse",
    imageUrl: "https://placehold.co/600x200/fb923c/ffffff?text=Networking+for+Introverts"
  },
  {
    id: 16,
    title: "Work-Life Balance Assessment",
    description: "Interactive tool to evaluate and improve your work-life balance for better social well-being.",
    type: "template",
    url: "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/work-life-balance/art-20048134",
    category: "social",
    tags: ["work-life-balance", "boundaries", "self-care"],
    publishedDate: "2025-03-15",
    imageUrl: "https://placehold.co/600x200/fb923c/ffffff?text=Work-Life+Balance"
  }
];

export function WellnessResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const resources = sampleResources;
  const isLoading = false;

  // Filter resources based on search query and category
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get the right icon for the resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "article": return <FileText className="h-3 w-3" />;
      case "video": return <Video className="h-3 w-3" />;
      case "guide": return <BookOpen className="h-3 w-3" />;
      case "template": return <Download className="h-3 w-3" />;
      case "external": return <LinkIcon className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  // Format the resource type for display
  const formatResourceType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get the appropriate color for the resource type badge
  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case "article": return "bg-blue-100 text-blue-800";
      case "video": return "bg-red-100 text-red-800";
      case "guide": return "bg-green-100 text-green-800";
      case "template": return "bg-indigo-100 text-indigo-800";
      case "external": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div>Loading wellness resources...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resources..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mental">Mental</TabsTrigger>
            <TabsTrigger value="physical">Physical</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No resources found. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="flex flex-col h-full overflow-hidden">
              <div className={`aspect-video w-full overflow-hidden flex items-center justify-center ${getResourceTypeColor(resource.type).replace('text-', 'bg-')}`}>
                <h2 className="text-4xl font-bold text-white px-4 text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]">{resource.title}</h2>
              </div>
              
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    {getResourceIcon(resource.type)}
                    <div>
                      <CardDescription className="text-xs leading-normal">
                        {resource.author && `By ${resource.author}`}
                        {resource.author && resource.publishedDate && " • "}
                        {resource.publishedDate && new Date(resource.publishedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getResourceTypeColor(resource.type)} text-xs py-0 px-2 h-6`}>
                    {formatResourceType(resource.type)}
                    {resource.duration && ` • ${resource.duration}`}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0 px-3 flex-grow">
                <p className="text-sm text-gray-700 leading-normal">{resource.description}</p>
                
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs py-0 px-1 h-5 leading-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0 pb-2 px-3">
                <Button variant="outline" className="w-full h-8 text-sm py-0 leading-normal" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    {resource.type === "external" ? "Visit Resource" : 
                     resource.type === "video" ? "Watch Video" : 
                     resource.type === "template" ? "Download Template" : 
                     "View Resource"}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}