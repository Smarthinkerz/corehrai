import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { EngagementSurvey, SurveyQuestion } from '../../types/engagement';
import { v4 as uuidv4 } from 'uuid';

// Types
type QuestionType = 'text' | 'rating' | 'multiple_choice' | 'single_choice';

// Props interface
interface SurveyFormProps {
  onSurveyCreated: () => void;
  editSurvey?: EngagementSurvey;
}

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'closed']),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const SurveyForm = ({ onSurveyCreated, editSurvey }: SurveyFormProps) => {
  // Parse questions from editSurvey if available
  const initialQuestions = React.useMemo(() => {
    if (!editSurvey) return [];
    
    try {
      if (typeof editSurvey.questions === 'string') {
        return JSON.parse(editSurvey.questions);
      }
      return editSurvey.questions as unknown as SurveyQuestion[];
    } catch (e) {
      return [];
    }
  }, [editSurvey]);
  
  // State for questions
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialQuestions);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'text' as QuestionType,
    required: true,
    options: ['']
  });
  
  // Form setup for the main survey details
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editSurvey?.title || '',
      description: editSurvey?.description || '',
      status: (editSurvey?.status as any) || 'draft',
      startDate: editSurvey ? new Date(editSurvey.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: editSurvey 
        ? new Date(editSurvey.endDate).toISOString().split('T')[0] 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  });
  
  // Function to add a new question
  const addQuestion = () => {
    if (!newQuestion.text) {
      toast({
        title: "Question text is required",
        variant: "destructive"
      });
      return;
    }
    
    // For multiple choice questions, ensure we have at least one option
    if ((newQuestion.type === 'multiple_choice' || newQuestion.type === 'single_choice') 
        && (!newQuestion.options || newQuestion.options.length === 0 || !newQuestion.options[0])) {
      toast({
        title: "Choice questions require at least one option",
        variant: "destructive"
      });
      return;
    }
    
    // Add question to the list
    setQuestions([...questions, {
      id: uuidv4(),
      text: newQuestion.text,
      type: newQuestion.type,
      required: newQuestion.required,
      options: (newQuestion.type === 'multiple_choice' || newQuestion.type === 'single_choice') 
        ? newQuestion.options.filter(opt => opt.trim() !== '') 
        : undefined
    }]);
    
    // Reset the new question form
    setNewQuestion({
      text: '',
      type: 'text',
      required: true,
      options: ['']
    });
  };
  
  // Function to remove a question
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };
  
  // Function to handle option changes
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    
    // If this is the last option and it's not empty, add a new empty option
    if (index === newOptions.length - 1 && value.trim() !== '') {
      newOptions.push('');
    }
    
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  // Function to remove an option
  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 1) return;
    
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (questions.length === 0) {
      toast({
        title: "At least one question is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const surveyData = {
        ...data,
        questions: JSON.stringify(questions),
        createdBy: 1 // Default to admin user for now
      };
      
      if (editSurvey) {
        // Update existing survey
        await apiRequest(
          'PATCH',
          `/api/surveys/${editSurvey.id}`,
          surveyData
        );
        
        toast({
          title: "Survey Updated",
          description: "The survey has been updated successfully."
        });
      } else {
        // Create new survey
        await apiRequest(
          'POST',
          '/api/surveys',
          surveyData
        );
        
        toast({
          title: "Survey Created",
          description: "The survey has been created successfully."
        });
      }
      
      // Call the callback function
      onSurveyCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the survey. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">
          {editSurvey ? 'Edit Survey' : 'Create New Survey'}
        </h2>
        <p className="text-neutral-500 mt-1">
          {editSurvey 
            ? 'Update the details and questions for this survey.' 
            : 'Set up a new survey to gather feedback from employees.'}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Survey Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="E.g., Employee Satisfaction Survey" 
                    {...field} 
                    onClick={(e) => e.stopPropagation()} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Provide details about the survey's purpose..." 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Survey Questions</h3>
            
            {questions.length > 0 ? (
              <div className="space-y-4 mb-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-md p-4 relative">
                    <div className="absolute top-2 right-2">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L6 18" />
                          <path d="M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                    <div className="pr-10">
                      <p className="font-medium text-neutral-900">
                        {index + 1}. {question.text} 
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-neutral-500 text-sm mt-1">
                        Type: {question.type.replace('_', ' ')}
                      </p>
                      {(question.type === 'multiple_choice' || question.type === 'single_choice') && 
                      question.options && (
                        <div className="mt-2">
                          <p className="text-sm text-neutral-500">Options:</p>
                          <ul className="list-disc list-inside text-sm">
                            {question.options.map((option, i) => (
                              <li key={i}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center border rounded-md p-6 mb-6">
                <p className="text-neutral-500">No questions added yet. Add your first question below.</p>
              </div>
            )}
            
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-3">Add New Question</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newQuestion.text}
                    onChange={(e) => {
                      e.stopPropagation();
                      setNewQuestion(prev => ({...prev, text: e.target.value}));
                    }}
                    placeholder="Enter your question here..."
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Question Type
                  </label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value: QuestionType) => 
                      setNewQuestion(prev => ({...prev, type: value}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Response</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(newQuestion.type === 'multiple_choice' || newQuestion.type === 'single_choice') && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Options <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleOptionChange(index, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Option ${index + 1}`}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(index)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6L6 18" />
                                <path d="M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={newQuestion.required}
                    onCheckedChange={(checked) => 
                      setNewQuestion(prev => ({...prev, required: checked}))
                    }
                  />
                  <label htmlFor="required" className="text-sm text-neutral-700">
                    Required question
                  </label>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addQuestion}
                >
                  Add Question
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" className="min-w-[120px]">
              {editSurvey ? 'Update Survey' : 'Create Survey'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};