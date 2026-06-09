import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Types from the server
interface LearningPathResource {
  title: string;
  url?: string;
  description: string;
  type: 'video' | 'article' | 'book' | 'tool' | 'course' | 'other';
}

interface LearningPathMilestone {
  title: string;
  description: string;
  completionCriteria: string;
}

interface LearningPathModule {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'workshop' | 'certification' | 'project' | 'mentorship' | 'reading' | 'assessment';
  duration: string;
  priority: 'essential' | 'recommended' | 'optional';
  resources: LearningPathResource[];
  skills: string[];
  milestones: LearningPathMilestone[];
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedCompletionTime: string;
  requiredSkills: string[];
  suggestedSkills: string[];
  modules: LearningPathModule[];
  assessmentMethod: string;
  nextSteps: string[];
}

export default function LearningPathGenerator() {
  const [role, setRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [department, setDepartment] = useState('none');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const generatePathMutation = useMutation({
    mutationFn: async (formData: { 
      role: string; 
      currentSkills: string[]; 
      department: string; 
      experienceLevel: string;
    }) => {
      const response = await fetch('/api/learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate learning path');
      }
      
      return await response.json() as LearningPath;
    },
    onSuccess: (data) => {
      setLearningPath(data);
      setActiveModuleId(data.modules[0]?.id || null);
      toast({
        title: 'Learning path generated',
        description: `Personalized learning path for ${role} role created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate learning path. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      toast({
        title: 'Missing information',
        description: 'Please specify a target role to generate a learning path.',
        variant: 'destructive',
      });
      return;
    }

    // Parse skills from comma-separated string
    const skillsArray = currentSkills
      ? currentSkills.split(',').map(skill => skill.trim()).filter(Boolean)
      : [];

    // Make sure we pass empty string if the user selected "Any department"
    const deptValue = department === 'none' ? '' : department;

    generatePathMutation.mutate({
      role,
      currentSkills: skillsArray,
      department: deptValue,
      experienceLevel,
    });
  };

  const getModulePriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'recommended':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'optional':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'article':
        return '📄';
      case 'book':
        return '📚';
      case 'tool':
        return '🛠️';
      case 'course':
        return '🎓';
      default:
        return '📌';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Learning Paths</CardTitle>
          <CardDescription>Generate personalized learning paths based on role and experience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Target Role <span className="text-red-500">*</span></Label>
                <Input
                  id="role"
                  placeholder="e.g. Frontend Developer, Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any department</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Customer Support">Customer Support</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentSkills">Current Skills (comma-separated)</Label>
                <Textarea
                  id="currentSkills"
                  placeholder="e.g. JavaScript, React, CSS"
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="leader">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              setRole('');
              setCurrentSkills('');
              setDepartment('none');
              setExperienceLevel('mid');
              setLearningPath(null);
            }}
            disabled={generatePathMutation.isPending}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={generatePathMutation.isPending}
          >
            {generatePathMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : 'Generate Learning Path'}
          </Button>
        </CardFooter>
      </Card>

      {learningPath && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{learningPath.title}</CardTitle>
                <CardDescription className="mt-1 mb-2">{learningPath.description}</CardDescription>
              </div>
              <Badge className="ml-2">{learningPath.estimatedCompletionTime}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {learningPath.requiredSkills.map((skill, i) => (
                <Badge key={i} variant="outline" className="bg-blue-50">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="modules" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="skills">Required Skills</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="modules" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                  <div className="lg:col-span-1 border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Learning Modules</h3>
                      <p className="text-sm text-muted-foreground">
                        {learningPath.modules.length} modules in this path
                      </p>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="p-4 space-y-2">
                        {learningPath.modules.map((module) => (
                          <div
                            key={module.id}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              activeModuleId === module.id ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setActiveModuleId(module.id)}
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{module.title}</h4>
                              <Badge className={getModulePriorityColor(module.priority)}>
                                {module.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.type} • {module.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="lg:col-span-2 border rounded-md">
                    {activeModuleId && (
                      <ScrollArea className="h-[400px]">
                        {learningPath.modules.find(m => m.id === activeModuleId) && (
                          <div className="p-6">
                            <div className="space-y-4">
                              {(() => {
                                const activeModule = learningPath.modules.find(m => m.id === activeModuleId);
                                if (!activeModule) return null;
                                
                                return (
                                  <>
                                    <div>
                                      <h3 className="text-xl font-bold">{activeModule.title}</h3>
                                      <div className="flex items-center mt-1 space-x-2">
                                        <Badge>{activeModule.type}</Badge>
                                        <span className="text-sm text-muted-foreground">{activeModule.duration}</span>
                                      </div>
                                      <p className="mt-2">{activeModule.description}</p>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div>
                                      <h4 className="font-semibold mb-2">Skills you'll develop</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {activeModule.skills.map((skill, i) => (
                                          <Badge key={i} variant="outline">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div>
                                      <h4 className="font-semibold mb-3">Learning Resources</h4>
                                      <div className="space-y-4">
                                        {activeModule.resources.map((resource, i) => (
                                          <div key={i} className="bg-muted/50 p-4 rounded-md border border-muted">
                                            <div className="flex items-start">
                                              <span className="mr-3 text-xl flex-shrink-0" aria-hidden="true">
                                                {getResourceTypeIcon(resource.type)}
                                              </span>
                                              <div className="flex-1">
                                                <h5 className="font-medium text-lg mb-1">{resource.title}</h5>
                                                <Badge className="mb-2" variant="outline">
                                                  {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                                                </Badge>
                                                <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                                                {resource.url ? (
                                                  <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      // Extract domain from URL for search fallback
                                                      let domain = "";
                                                      try {
                                                        // Make sure URL is a string
                                                        if (resource.url && typeof resource.url === 'string') {
                                                          const url = new URL(resource.url);
                                                          domain = url.hostname;
                                                        }
                                                      } catch (error) {
                                                        // If URL is invalid, try to extract domain name from the title
                                                        const platforms = ['LinkedIn Learning', 'Coursera', 'Udemy', 'edX', 'Pluralsight', 'O\'Reilly'];
                                                        const foundPlatform = platforms.find(p => resource.title.includes(p));
                                                        domain = foundPlatform ? foundPlatform.toLowerCase().replace(/\s/g, '') + '.com' : 'google.com';
                                                      }
                                                      
                                                      // Try to open URL, if it fails, do a search for the course
                                                      const newWindow = resource.url && typeof resource.url === 'string' ? 
                                                        window.open(resource.url, '_blank') : null;
                                                      
                                                      // If the window was blocked or URL is invalid, redirect to a search
                                                      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                                        const searchTerm = encodeURIComponent(`${resource.title} course ${domain}`);
                                                        window.open(`https://www.google.com/search?q=${searchTerm}`, '_blank');
                                                      }
                                                    }}
                                                  >
                                                    Access Course
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      const searchTerm = encodeURIComponent(`${resource.title} course`);
                                                      window.open(`https://www.google.com/search?q=${searchTerm}`, '_blank');
                                                    }}
                                                  >
                                                    Find Course
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        <div className="text-center mt-4">
                                          <p className="text-sm text-muted-foreground">
                                            These are specific, real-world courses and learning materials for your development.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div>
                                      <h4 className="font-semibold mb-2">Milestones</h4>
                                      <Accordion type="single" collapsible className="w-full">
                                        {activeModule.milestones.map((milestone, i) => (
                                          <AccordionItem key={i} value={`milestone-${i}`}>
                                            <AccordionTrigger className="text-left">
                                              {milestone.title}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                              <p className="mb-2">{milestone.description}</p>
                                              <div className="bg-muted p-3 rounded-md mt-2">
                                                <h6 className="text-sm font-medium">Completion Criteria:</h6>
                                                <p className="text-sm">{milestone.completionCriteria}</p>
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        ))}
                                      </Accordion>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="skills">
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {learningPath.requiredSkills.map((skill, i) => (
                        <Badge key={i} className="bg-red-100 text-red-800 hover:bg-red-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Suggested Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {learningPath.suggestedSkills.map((skill, i) => (
                        <Badge key={i} className="bg-green-100 text-green-800 hover:bg-green-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="assessment">
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Assessment Method</h3>
                    <p>{typeof learningPath.assessmentMethod === 'string' 
                       ? learningPath.assessmentMethod 
                       : JSON.stringify(learningPath.assessmentMethod)}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Next Steps After Completion</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {Array.isArray(learningPath.nextSteps) 
                        ? learningPath.nextSteps.map((step, i) => (
                            <li key={i}>{typeof step === 'string' ? step : JSON.stringify(step)}</li>
                          ))
                        : <li>No next steps available</li>
                      }
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}