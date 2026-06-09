import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define the schema for the form
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.enum(["mental", "physical", "financial", "social"]),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  enrollmentCap: z.string().optional(),
  location: z.enum(["online", "office", "hybrid", "external"]),
  organizer: z.string().min(3, { message: "Organizer name is required" }),
  contactEmail: z.string().email({ message: "Invalid email address" }),
  imageUrl: z.string().url({ message: "Must be a valid URL" }).optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WellnessProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programToEdit?: any; // Used for edit functionality
}

export function WellnessProgramDialog({ open, onOpenChange, programToEdit }: WellnessProgramDialogProps) {
  const { toast } = useToast();
  const isEditing = !!programToEdit;

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: programToEdit?.title || "",
      description: programToEdit?.description || "",
      category: programToEdit?.category || "mental",
      startDate: programToEdit?.startDate ? new Date(programToEdit.startDate) : new Date(),
      endDate: programToEdit?.endDate ? new Date(programToEdit.endDate) : new Date(),
      enrollmentCap: programToEdit?.enrollmentCap?.toString() || "",
      location: programToEdit?.location || "online",
      organizer: programToEdit?.organizer || "",
      contactEmail: programToEdit?.contactEmail || "contact@example.com",
      imageUrl: programToEdit?.imageUrl || "",
      tags: programToEdit?.tags ? programToEdit.tags.join(", ") : "",
    },
  });

  // Mutation for creating a new wellness program
  const createProgramMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await apiRequest("POST", "/api/wellness-programs", formData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the wellness programs query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['/api/wellness-programs'] });
    },
  });

  // Mutation for updating an existing wellness program
  const updateProgramMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Use PATCH endpoint since we now have both PUT and PATCH options
      const res = await apiRequest("PATCH", `/api/wellness-programs/${programToEdit.id}`, formData);
      // Check if response is empty (likely a 204 No Content)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1 && res.status !== 204) {
        return res.json();
      }
      return { success: true }; // Return a simple object for empty responses
    },
    onSuccess: () => {
      // Invalidate the wellness programs query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['/api/wellness-programs'] });
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      // Process the form data to match your API expectations
      const formattedData = {
        ...data,
        enrollmentCap: data.enrollmentCap ? parseInt(data.enrollmentCap) : undefined,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
        status: isEditing ? programToEdit.status : "upcoming", // Keep status for edited programs
      };
      
      if (isEditing) {
        // Update existing program
        const response = await updateProgramMutation.mutateAsync(formattedData);
        // Force a refetch of the data to ensure we have the latest
        await queryClient.invalidateQueries({ queryKey: ['/api/wellness-programs'] });
        const refreshResult = await queryClient.refetchQueries({ queryKey: ['/api/wellness-programs'] });
      } else {
        // Create new program
        const response = await createProgramMutation.mutateAsync(formattedData);
      }
      
      toast({
        title: isEditing ? "Program updated" : "Program created",
        description: `${data.title} has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset the form
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving the program. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Wellness Program" : "Create New Wellness Program"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your wellness program."
              : "Create a new wellness program for employees to join."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Program Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter program title" {...field} />
                    </FormControl>
                    <FormDescription>Give your program a descriptive title.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what participants will learn or experience"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Provide details about the program activities and benefits.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mental">Mental Wellness</SelectItem>
                        <SelectItem value="physical">Physical Health</SelectItem>
                        <SelectItem value="financial">Financial Wellness</SelectItem>
                        <SelectItem value="social">Social Wellbeing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>What area of wellness does this program address?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Where will this program take place?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Enrollment Cap */}
              <FormField
                control={form.control}
                name="enrollmentCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Cap (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Unlimited" {...field} />
                    </FormControl>
                    <FormDescription>Maximum number of participants allowed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organizer */}
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer</FormLabel>
                    <FormControl>
                      <Input placeholder="Program organizer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Email */}
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image URL */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>URL for a cover image to display with your program.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="mindfulness, stress-relief, etc." {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated tags to categorize your program.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Program" : "Create Program"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}