import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, getApiJson } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { EngagementSurvey, SurveyQuestion } from '@/types/engagement';
import { toast } from '@/hooks/use-toast';

interface SurveyResponseFormProps {
  survey: EngagementSurvey;
  onResponseComplete: () => void;
}

export const SurveyResponseForm: React.FC<SurveyResponseFormProps> = ({ survey, onResponseComplete }) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse questions if they're stored as a string
  const questions: SurveyQuestion[] = React.useMemo(() => {
    try {
      if (typeof survey.questions === 'string') {
        return JSON.parse(survey.questions);
      }
      return survey.questions as SurveyQuestion[];
    } catch (e) {
      return [];
    }
  }, [survey]);

  // Helper to check if all required questions are answered
  const areRequiredQuestionsAnswered = () => {
    return questions
      .filter(q => q.required)
      .every(q => responses[q.id] !== undefined && responses[q.id] !== '');
  };

  // Update response for a specific question
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Submit all responses
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!areRequiredQuestionsAnswered()) {
      toast({
        title: "Please answer all required questions",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await apiRequest('POST', '/api/survey-responses', {
        surveyId: survey.id,
        employeeId: 2, // Using a valid employee ID from our database
        responses: responses,
        submittedAt: new Date().toISOString()
      });
      
      toast({
        title: "Survey completed",
        description: "Thank you for your feedback!"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/survey-responses'] });
      onResponseComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit survey response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different question types
  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const { id, text, type, required, options } = question;
    
    switch (type) {
      case 'text':
        return (
          <div className="space-y-2 mb-6" key={id}>
            <Label className="font-medium">
              {index + 1}. {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              value={responses[id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleResponseChange(id, e.target.value);
              }}
              placeholder="Your answer here..."
              onClick={(e) => e.stopPropagation()}
              className="w-full"
            />
          </div>
        );
        
      case 'rating':
        return (
          <div className="space-y-2 mb-6" key={id}>
            <Label className="font-medium">
              {index + 1}. {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex space-x-4 mt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex flex-col items-center">
                  <Label
                    htmlFor={`${id}-${rating}`}
                    className={`mb-1 cursor-pointer ${
                      responses[id] === rating ? 'text-primary' : 'text-neutral-400'
                    }`}
                  >
                    {rating}
                  </Label>
                  <input
                    type="radio"
                    id={`${id}-${rating}`}
                    name={id}
                    value={rating}
                    checked={responses[id] === rating}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleResponseChange(id, parseInt(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </div>
              ))}
              <div className="flex flex-col justify-end">
                <span className="text-sm text-neutral-500">(1=Poor, 5=Excellent)</span>
              </div>
            </div>
          </div>
        );
        
      case 'single_choice':
        return (
          <div className="space-y-2 mb-6" key={id}>
            <Label className="font-medium">
              {index + 1}. {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={responses[id] || ''}
              onValueChange={(value) => handleResponseChange(id, value)}
              className="mt-2"
            >
              {options?.map((option) => (
                <div className="flex items-center space-x-2" key={option}>
                  <RadioGroupItem 
                    value={option} 
                    id={`${id}-${option}`} 
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label htmlFor={`${id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      case 'multiple_choice':
        return (
          <div className="space-y-2 mb-6" key={id}>
            <Label className="font-medium">
              {index + 1}. {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2 mt-2">
              {options?.map((option) => {
                const isChecked = responses[id]?.includes(option) || false;
                return (
                  <div className="flex items-center space-x-2" key={option}>
                    <input
                      type="checkbox"
                      id={`${id}-${option}`}
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        const currentSelections = responses[id] || [];
                        const newSelections = e.target.checked
                          ? [...currentSelections, option]
                          : currentSelections.filter((item: string) => item !== option);
                        handleResponseChange(id, newSelections);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded h-4 w-4"
                    />
                    <Label htmlFor={`${id}-${option}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-neutral-500">This survey has no questions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && <p className="text-neutral-500 mt-1">{survey.description}</p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {questions.map((question, index) => renderQuestion(question, index))}
              
              <div className="mt-8 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !areRequiredQuestionsAnswered()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};