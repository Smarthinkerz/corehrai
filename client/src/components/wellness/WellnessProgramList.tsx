import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WellnessProgramDialog } from "./WellnessProgramDialog";
import { CalendarDays, Users, MapPin, Tag, X, CheckCircle, Calendar, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define a type for our program
interface WellnessProgram {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  enrollmentCap?: number;
  location: string;
  status: string;
  organizer: string;
  contactEmail: string;
  imageUrl?: string;
  materials?: string[];
  tags?: string[];
}

// Sample wellness programs
const samplePrograms: WellnessProgram[] = [
  {
    id: 1,
    title: "Mindfulness Meditation Workshop",
    description: "Learn mindfulness techniques to reduce stress and improve focus in this 4-week guided program.",
    category: "mental",
    startDate: "2025-04-15T09:00:00.000Z",
    endDate: "2025-05-13T17:00:00.000Z",
    enrollmentCap: 30,
    location: "online",
    status: "upcoming",
    organizer: "Emma Thompson",
    contactEmail: "emma.t@company.com",
    imageUrl: "https://replit.com/cdn-cgi/image/width=600,height=400,quality=80,format=auto/https://storage.googleapis.com/replit/images/1619655276320_57c547d98c79758186c591e947592251.jpeg",
    tags: ["stress-management", "meditation", "mental-health"]
  },
  {
    id: 2,
    title: "Posture & Ergonomics Training",
    description: "A hands-on workshop to assess and improve your workspace ergonomics and posture for better health.",
    category: "physical",
    startDate: "2025-04-20T14:00:00.000Z",
    endDate: "2025-04-20T16:00:00.000Z",
    location: "office",
    status: "upcoming",
    organizer: "Daniel Rivera",
    contactEmail: "d.rivera@company.com",
    imageUrl: "https://replit.com/cdn-cgi/image/width=600,height=400,quality=80,format=auto/https://storage.googleapis.com/replit/images/1655882511687_42caa7bc7ccd7d33fd19e447ef3a0240.jpeg",
    tags: ["ergonomics", "physical-health", "office-wellness"]
  },
  {
    id: 3,
    title: "Financial Wellness Seminar",
    description: "Learn strategies for budgeting, investing, and planning for your financial future.",
    category: "financial",
    startDate: "2025-05-05T11:00:00.000Z",
    endDate: "2025-05-05T13:00:00.000Z",
    location: "hybrid",
    status: "upcoming",
    organizer: "Melissa Chen",
    contactEmail: "melissa.c@company.com",
    imageUrl: "https://replit.com/cdn-cgi/image/width=600,height=400,quality=80,format=auto/https://storage.googleapis.com/replit/images/1671159843940_1e188fa7f21fc0a33dd9e0a2a05f6082.jpeg",
    tags: ["financial-planning", "budgeting", "retirement"]
  },
  {
    id: 4,
    title: "Team Building Nature Retreat",
    description: "A day of outdoor activities and team building exercises to strengthen relationships and recharge.",
    category: "social",
    startDate: "2025-05-15T09:00:00.000Z",
    endDate: "2025-05-15T17:00:00.000Z",
    enrollmentCap: 50,
    location: "external",
    status: "upcoming",
    organizer: "James Wilson",
    contactEmail: "james.w@company.com",
    imageUrl: "https://replit.com/cdn-cgi/image/width=600,height=400,quality=80,format=auto/https://storage.googleapis.com/replit/images/1617049566472_6555d6f80b86d8c10e1dcb93f6a7b950.jpeg",
    tags: ["team-building", "outdoors", "social", "retreat"]
  },
  {
    id: 5,
    title: "Nutritional Food Planning",
    description: "Learn about nutrition basics and meal planning for a healthier lifestyle.",
    category: "physical",
    startDate: "2025-04-28T12:00:00.000Z",
    endDate: "2025-04-28T13:30:00.000Z",
    location: "online",
    status: "upcoming",
    organizer: "Sarah Johnson",
    contactEmail: "sarah.j@company.com",
    imageUrl: "https://replit.com/cdn-cgi/image/width=600,height=400,quality=80,format=auto/https://storage.googleapis.com/replit/images/1620055498822_e0175cb507b6620ce8ea695e711ee924.jpeg",
    tags: ["nutrition", "health", "meal-planning"]
  }
];

// Schema for enrollment form validation
const enrollmentSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  dietaryRestrictions: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

// Type for enrollment form
type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

export function WellnessProgramList() {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<WellnessProgram | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<WellnessProgram | null>(null);
  const { toast } = useToast();
  
  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number) => {
      const res = await apiRequest("DELETE", `/api/wellness-programs/${programId}`);
      // Check if response is empty or not JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1 && res.status !== 204) {
        return res.json();
      }
      return { success: true }; // Return a simple object for empty responses
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wellness-programs'] });
      toast({
        title: "Program deleted",
        description: "The wellness program has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem deleting the program. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Fetch wellness programs from the API, temporarily using sample data
  const { data: apiPrograms = [], isLoading } = useQuery<WellnessProgram[]>({
    queryKey: ['/api/wellness-programs'],
    // Default queryFn calls our API
    staleTime: 0,
  });
  
  // Combine API data with sample data, ensuring unique IDs
  const programs: WellnessProgram[] = apiPrograms.length > 0 
    ? [...apiPrograms, ...samplePrograms
        .filter(sample => !apiPrograms.some(api => api.title === sample.title))
        .map(sample => ({
          ...sample,
          id: 1000 + sample.id // Ensure IDs don't conflict with API data
        }))]
    : samplePrograms;
  
  // Create form for enrollment
  const enrollForm = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      name: "",
      email: "",
      dietaryRestrictions: "",
      agreeToTerms: false
    }
  });

  // Filter programs based on the selected category or show all
  const filteredPrograms = filter === "all" 
    ? programs 
    : programs.filter((program: WellnessProgram) => program.category === filter);

  // Function to get the appropriate badge color based on program status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 hover:bg-green-600";
      case "upcoming": return "bg-blue-500 hover:bg-blue-600";
      case "completed": return "bg-gray-500 hover:bg-gray-600";
      case "cancelled": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Function to get the appropriate icon and color for program category
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "mental":
        return { color: "text-indigo-500", label: "Mental Wellness", cssClass: "category-mental" };
      case "physical":
        return { color: "text-green-500", label: "Physical Health", cssClass: "category-physical" };
      case "financial":
        return { color: "text-blue-500", label: "Financial Wellness", cssClass: "category-financial" };
      case "social":
        return { color: "text-orange-500", label: "Social Wellbeing", cssClass: "category-social" };
      default:
        return { color: "text-gray-500", label: "Other", cssClass: "category-other" };
    }
  };

  if (isLoading) {
    return <div>Loading wellness programs...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold mb-4">Wellness Programs</h2>
      <div className="flex justify-between items-center">
        <Tabs value={filter} onValueChange={setFilter} className="w-full max-w-lg">
          <TabsList>
            <TabsTrigger value="all">All Programs</TabsTrigger>
            <TabsTrigger value="mental">Mental</TabsTrigger>
            <TabsTrigger value="physical">Physical</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setOpenCreateDialog(true)}>Add Program</Button>
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No wellness programs found. Create a new program to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program: WellnessProgram) => (
            <Card key={program.id} className="overflow-hidden flex flex-col h-full">
              {(
                <div className={`w-full h-32 relative flex items-center justify-center ${
                    program.category === "mental" ? "bg-gradient-to-r from-purple-700 to-purple-500" : 
                    program.category === "physical" ? "bg-gradient-to-r from-green-700 to-green-500" :
                    program.category === "financial" ? "bg-gradient-to-r from-blue-700 to-blue-500" :
                    "bg-gradient-to-r from-orange-700 to-orange-500"
                  }`}>
                  <span className="text-white text-xl font-semibold px-4 text-center">
                    {program.title}
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{program.title}</CardTitle>
                    <div className={`font-medium flex items-center h-10 ${getCategoryInfo(program.category).color} ${getCategoryInfo(program.category).cssClass}`}>
                      <span>
                        {getCategoryInfo(program.category).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(program.status)}>
                      {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedProgram(program);
                            setOpenEditDialog(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setProgramToDelete(program);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 flex-grow">
                <p className="mb-4 text-lg">{program.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-base">
                      {formatDate(new Date(program.startDate))}
                      {program.startDate !== program.endDate && 
                        ` - ${formatDate(new Date(program.endDate))}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="capitalize text-base">{program.location}</span>
                  </div>
                  
                  {program.enrollmentCap && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-base">Capacity: {program.enrollmentCap}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex-col items-start pt-0">
                {program.tags && program.tags.length > 0 && (
                  <div className="flex items-start gap-1 flex-wrap mt-2">
                    <Tag className="h-3.5 w-3.5 text-gray-500 mt-0.5 mr-0.5" />
                    {program.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs px-2 py-0 h-6">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="w-full flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="text-lg"
                    onClick={() => {
                      setSelectedProgram(program);
                      setViewDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="default" 
                    className="text-lg"
                    onClick={() => {
                      setSelectedProgram(program);
                      setEnrollDialogOpen(true);
                    }}
                  >
                    Enroll
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create new program dialog */}
      <WellnessProgramDialog 
        open={openCreateDialog} 
        onOpenChange={setOpenCreateDialog} 
      />
      
      {/* Edit program dialog */}
      {selectedProgram && (
        <WellnessProgramDialog 
          open={openEditDialog} 
          onOpenChange={setOpenEditDialog}
          programToEdit={selectedProgram}
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the{" "}
              <span className="font-semibold">{programToDelete?.title}</span> program and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (programToDelete) {
                  deleteProgramMutation.mutate(programToDelete.id);
                  setProgramToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* View Details Dialog */}
      {selectedProgram && (
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedProgram.title}</DialogTitle>
              <div className={`font-medium flex items-center h-10 ${getCategoryInfo(selectedProgram.category).color} ${getCategoryInfo(selectedProgram.category).cssClass}`}>
                <span>
                  {getCategoryInfo(selectedProgram.category).label}
                </span>
              </div>
            </DialogHeader>
            
            <div className={`rounded-md overflow-hidden my-2 h-32 relative flex items-center justify-center ${
                selectedProgram.category === "mental" ? "bg-gradient-to-r from-purple-700 to-purple-500" : 
                selectedProgram.category === "physical" ? "bg-gradient-to-r from-green-700 to-green-500" :
                selectedProgram.category === "financial" ? "bg-gradient-to-r from-blue-700 to-blue-500" :
                "bg-gradient-to-r from-orange-700 to-orange-500"
              }`}>
              <span className="text-white text-xl font-semibold px-4 text-center">
                {selectedProgram.title}
              </span>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg">{selectedProgram.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-base">Date & Time</span>
                  </div>
                  <p className="text-base text-muted-foreground pl-6">
                    {formatDate(new Date(selectedProgram.startDate))}
                    {selectedProgram.startDate !== selectedProgram.endDate && 
                      ` - ${formatDate(new Date(selectedProgram.endDate))}`}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-base">Location</span>
                  </div>
                  <p className="text-base text-muted-foreground pl-6 capitalize">
                    {selectedProgram.location}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-base">Capacity</span>
                  </div>
                  <p className="text-base text-muted-foreground pl-6">
                    {selectedProgram.enrollmentCap || "Unlimited"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-base">Status</span>
                  </div>
                  <p className="text-base text-muted-foreground pl-6 capitalize">
                    {selectedProgram.status}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-semibold text-base">Organizer</div>
                <div className="flex flex-col text-muted-foreground">
                  <span className="text-base">{selectedProgram.organizer}</span>
                  <span className="text-base">{selectedProgram.contactEmail}</span>
                </div>
              </div>
              
              {selectedProgram.tags && selectedProgram.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-base">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProgram.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-base">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="text-lg">
                  Close
                </Button>
              </DialogClose>
              
              <Button 
                onClick={() => {
                  setViewDetailsOpen(false);
                  // Wait for the view details dialog to close before opening the enroll dialog
                  setTimeout(() => {
                    setEnrollDialogOpen(true);
                  }, 300);
                }}
                className="text-lg"
              >
                Enroll Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Enrollment Dialog */}
      {selectedProgram && (
        <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Enroll in Program</DialogTitle>
              <DialogDescription className="text-base">
                Please fill out this form to enroll in <span className="font-medium">{selectedProgram.title}</span>
              </DialogDescription>
            </DialogHeader>
            
            <Form {...enrollForm}>
              <form onSubmit={enrollForm.handleSubmit((data) => {
                // This would normally send data to your API
                toast({
                  title: "Enrollment successful!",
                  description: `You have enrolled in ${selectedProgram.title}`,
                });
                
                // Close dialog and reset form
                setEnrollDialogOpen(false);
                enrollForm.reset();
              })} 
              className="space-y-4"
              >
                <FormField
                  control={enrollForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={enrollForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={enrollForm.control}
                  name="dietaryRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Dietary Restrictions (if applicable)</FormLabel>
                      <FormControl>
                        <Input placeholder="Vegetarian, gluten-free, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={enrollForm.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel style={{ fontSize: "20px" }}>
                          I agree to the terms and conditions
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="text-lg">Submit Enrollment</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}