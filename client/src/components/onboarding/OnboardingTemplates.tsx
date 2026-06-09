import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OnboardingTask {
  taskName: string;
  description: string;
  dueDay: number; // Days from start date
  assignedTo?: number;
  priority: string;
  category: string;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  department: string;
  description: string;
  duration: number; // in days
  tasks: OnboardingTask[];
}

// Template data structured by department
const defaultTemplates: Record<string, OnboardingTemplate[]> = {
  "General": [
    {
      id: "new-hire-general",
      name: "New Hire Onboarding",
      department: "General",
      description: "Standard onboarding process for all new employees regardless of role.",
      duration: 14,
      tasks: [
        {
          taskName: "Send Welcome Email",
          description: "Prepare and send a welcome email to the new employee with first-day instructions and important information.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Prepare HR Documentation",
          description: "Prepare tax forms, employment contracts, and other necessary paperwork for the new hire.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "IT Setup Checklist",
          description: "Ensure all necessary hardware and software access is set up before the employee's first day.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Team Introduction",
          description: "Schedule and conduct introductions with immediate team members and relevant colleagues.",
          dueDay: 2,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "First-Week Agenda",
          description: "Create a detailed agenda for the employee's first week with scheduled meetings, training sessions, and tasks.",
          dueDay: 1,
          priority: "medium",
          category: "onboarding"
        }
      ]
    },
    {
      id: "remote-employee",
      name: "Remote Employee Onboarding",
      department: "General",
      description: "Specialized onboarding process for remote employees focusing on virtual integration and remote work tools.",
      duration: 14,
      tasks: [
        {
          taskName: "Virtual Meet & Greets",
          description: "Schedule virtual meetings with key team members and stakeholders.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Home Office Setup Checklist",
          description: "Provide guidance and resources for setting up an effective home office environment.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Remote Tools Training - Communication",
          description: "Training on virtual communication tools like Zoom, Slack, and Microsoft Teams.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Remote Tools Training - Collaboration",
          description: "Training on collaboration tools like Notion, Asana, and Google Workspace.",
          dueDay: 4,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Remote Work Guidelines",
          description: "Review company policies and best practices for remote work.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        }
      ]
    },
    {
      id: "executive-onboarding",
      name: "Executive Onboarding",
      department: "General",
      description: "Comprehensive onboarding process for executive-level employees with focus on strategic integration.",
      duration: 30,
      tasks: [
        {
          taskName: "Strategic Briefings",
          description: "In-depth briefings on company strategy, vision, and long-term objectives.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Stakeholder Meetings",
          description: "Schedule meetings with key internal and external stakeholders.",
          dueDay: 5,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Business Performance Review",
          description: "Comprehensive review of current business performance and key metrics.",
          dueDay: 7,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Leadership Team Integration",
          description: "Formal introduction and integration with the executive leadership team.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Strategic Planning Session",
          description: "Participation in strategic planning and goal-setting for the next quarter/year.",
          dueDay: 14,
          priority: "medium",
          category: "onboarding"
        }
      ]
    },
    {
      id: "intern-onboarding",
      name: "Intern Onboarding",
      department: "General",
      description: "Streamlined onboarding process for interns with focus on learning and development.",
      duration: 7,
      tasks: [
        {
          taskName: "Short-term Training Program",
          description: "Focused training program covering essential skills and knowledge for the internship.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Mentorship Assignment",
          description: "Assign a dedicated mentor to guide the intern throughout their internship.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Project Outline",
          description: "Provide a clear outline of projects and tasks the intern will be working on.",
          dueDay: 3,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Learning Objectives Definition",
          description: "Define specific learning objectives and development goals for the internship period.",
          dueDay: 4,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Feedback Structure Setup",
          description: "Establish a regular feedback mechanism to support the intern's growth.",
          dueDay: 5,
          priority: "low",
          category: "onboarding"
        }
      ]
    }
  ],
  "Engineering": [
    {
      id: "eng-standard",
      name: "Engineering Onboarding - Technical",
      department: "Engineering",
      description: "Role-specific onboarding for software engineers focusing on technical setup and codebase orientation.",
      duration: 14,
      tasks: [
        {
          taskName: "Developer Environment Setup",
          description: "Set up local development environment with required tools, IDEs, and access to repositories.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Codebase Walkthrough",
          description: "Schedule session with senior engineer for comprehensive codebase walkthrough.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Architecture Overview",
          description: "Review system architecture documentation and diagrams.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Code Review Process Training",
          description: "Learn the team's code review process and standards.",
          dueDay: 4,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "First Bug Fix Assignment",
          description: "Assign a simple bug fix to understand workflow.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        }
      ]
    },
    {
      id: "eng-senior",
      name: "Engineering Onboarding - Senior Level",
      department: "Engineering",
      description: "Accelerated onboarding process for senior engineers focusing on architecture, system design, and team leadership.",
      duration: 14,
      tasks: [
        {
          taskName: "System Architecture Deep Dive",
          description: "Comprehensive review of the full system architecture with the CTO or Lead Architect.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Team Leadership Introduction",
          description: "Meeting with team leads to discuss expectations and responsibilities.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Technical Roadmap Review",
          description: "Review technical roadmap and planning documents.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Current Project Assessment",
          description: "Assess current projects and provide feedback.",
          dueDay: 7,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "Design": [
    {
      id: "design-ui",
      name: "UI/UX Designer Onboarding",
      department: "Design",
      description: "Comprehensive onboarding for UI/UX designers focusing on design systems, workflows, and collaboration.",
      duration: 14,
      tasks: [
        {
          taskName: "Design Tools Setup",
          description: "Set up design tools (Figma, Adobe CC, etc.) and access to design repositories.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Design System Review",
          description: "Review the company's design system, components, and guidelines.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "User Research Introduction",
          description: "Introduction to user research methodologies and past studies.",
          dueDay: 4,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Design-Engineering Collaboration",
          description: "Learn about the design to development handoff process.",
          dueDay: 6,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "First Design Assignment",
          description: "Work on a small design task to apply learning.",
          dueDay: 8,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "Product": [
    {
      id: "product-manager",
      name: "Product Manager Onboarding",
      department: "Product",
      description: "Comprehensive onboarding for product managers focusing on product strategy, user needs, and cross-functional collaboration.",
      duration: 21,
      tasks: [
        {
          taskName: "Product Overview",
          description: "Complete overview of all products and the product roadmap.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "User Personas Review",
          description: "Review user personas and customer journey maps.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Competitive Analysis Introduction",
          description: "Review existing competitive analysis and market positioning.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Agile Process Training",
          description: "Training on the company's agile development process.",
          dueDay: 7,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Stakeholder Introduction",
          description: "Introduction meetings with key stakeholders across departments.",
          dueDay: 9,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "Marketing": [
    {
      id: "marketing-specialist",
      name: "Marketing Specialist Onboarding",
      department: "Marketing",
      description: "Comprehensive onboarding for marketing specialists focusing on brand guidelines, campaigns, and analytics.",
      duration: 14,
      tasks: [
        {
          taskName: "Brand Guidelines Review",
          description: "Review company brand guidelines, voice, and messaging.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Marketing Tools Access",
          description: "Set up access to marketing tools, analytics platforms, and social media accounts.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Current Campaigns Overview",
          description: "Review current and past marketing campaigns and their performance.",
          dueDay: 4,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Content Calendar Review",
          description: "Review the content calendar and content creation process.",
          dueDay: 6,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Analytics Training",
          description: "Training on marketing analytics and reporting tools.",
          dueDay: 8,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "Sales": [
    {
      id: "sales-rep",
      name: "Sales Representative Onboarding",
      department: "Sales",
      description: "Role-specific onboarding for sales representatives focusing on product knowledge, CRM, and sales processes.",
      duration: 14,
      tasks: [
        {
          taskName: "Product Training",
          description: "Comprehensive training on all products and services.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "CRM Training",
          description: "Detailed training on the CRM system and sales tools.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Product Pitch Deck Review",
          description: "Review and practice using the company's product pitch decks and sales materials.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Sales Process Overview",
          description: "Learn the complete sales process from lead generation to closing deals.",
          dueDay: 4,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Shadow Sales Calls",
          description: "Shadow experienced sales representatives on customer calls.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "Customer Support": [
    {
      id: "customer-support",
      name: "Customer Support Specialist Onboarding",
      department: "Customer Support",
      description: "Role-specific onboarding for support specialists focusing on tools, response protocols, and customer service.",
      duration: 14,
      tasks: [
        {
          taskName: "Support Tools Training",
          description: "Training on customer support tools, helpdesk systems, and ticketing platforms.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Response Protocols Review",
          description: "Learn the established protocols for different types of customer inquiries and issues.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Product Knowledge Training",
          description: "Comprehensive training on all products and services to effectively support customers.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Common Issues Workshop",
          description: "Workshop covering the most common customer issues and their resolutions.",
          dueDay: 4,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Shadow Support Sessions",
          description: "Shadow experienced support specialists on customer interactions.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "HR": [
    {
      id: "hr-specialist",
      name: "HR Specialist Onboarding",
      department: "HR",
      description: "Comprehensive onboarding for HR specialists focusing on company policies, recruitment processes, and employee relations.",
      duration: 14,
      tasks: [
        {
          taskName: "HR Policies Review",
          description: "Review of all company HR policies and procedures.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "HRIS Training",
          description: "Training on the HR Information System.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Recruitment Process Overview",
          description: "Overview of the recruitment and hiring process.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Employee Relations Training",
          description: "Training on handling employee relations and conflicts.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Benefits Administration Review",
          description: "Review of employee benefits administration.",
          dueDay: 7,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ],
  "Finance": [
    {
      id: "finance-analyst",
      name: "Financial Analyst Onboarding",
      department: "Finance",
      description: "Comprehensive onboarding for financial analysts focusing on financial systems, reporting, and analysis.",
      duration: 14,
      tasks: [
        {
          taskName: "Financial Systems Access",
          description: "Set up access to financial systems and tools.",
          dueDay: 1,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Financial Policies Review",
          description: "Review of company financial policies and procedures.",
          dueDay: 2,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Reporting Process Overview",
          description: "Overview of financial reporting processes and timelines.",
          dueDay: 3,
          priority: "high",
          category: "onboarding"
        },
        {
          taskName: "Budgeting Process Training",
          description: "Training on the company's budgeting process.",
          dueDay: 5,
          priority: "medium",
          category: "onboarding"
        },
        {
          taskName: "Financial Analysis Tools",
          description: "Training on financial analysis tools and methods.",
          dueDay: 7,
          priority: "medium",
          category: "onboarding"
        }
      ]
    }
  ]
};

const OnboardingTemplates = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Engineering');
  const [templates, setTemplates] = useState<Record<string, OnboardingTemplate[]>>(defaultTemplates);
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<OnboardingTemplate | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<OnboardingTemplate>>({
    name: '',
    department: 'Engineering',
    description: '',
    duration: 14,
    tasks: []
  });
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<OnboardingTask>>({
    taskName: '',
    description: '',
    dueDay: 1,
    priority: 'medium',
    category: 'onboarding'
  });

  const queryClient = useQueryClient();

  // Function to view template details
  const viewTemplateDetails = (template: OnboardingTemplate) => {
    setCurrentTemplate(template);
    setShowTemplateDetails(true);
  };

  // Function to close template details
  const closeTemplateDetails = () => {
    setShowTemplateDetails(false);
    setCurrentTemplate(null);
  };

  // Function to import templates from JSON
  const handleImportTemplates = () => {
    try {
      const importedData = JSON.parse(importJson);
      
      // Validate the imported data format
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid template format. Expected a JSON object.');
      }

      // Create a new templates object merging the existing with imported
      const updatedTemplates = { ...templates };
      
      Object.entries(importedData).forEach(([dept, deptTemplates]) => {
        if (!Array.isArray(deptTemplates)) {
          throw new Error(`Templates for department "${dept}" must be an array.`);
        }
        
        if (!updatedTemplates[dept]) {
          updatedTemplates[dept] = [];
        }
        
        // Add each template with validation
        (deptTemplates as OnboardingTemplate[]).forEach(template => {
          if (!template.name || !template.description || !template.tasks || !Array.isArray(template.tasks)) {
            throw new Error(`Invalid template format: ${JSON.stringify(template)}`);
          }
          
          // Generate a unique ID if not present
          if (!template.id) {
            template.id = `${dept.toLowerCase()}-${Date.now()}`;
          }
          
          updatedTemplates[dept].push(template);
        });
      });
      
      // Update state with new templates
      setTemplates(updatedTemplates);
      
      toast({
        title: "Templates Imported",
        description: "Your templates have been successfully imported."
      });
      
      setImportDialogOpen(false);
      setImportJson('');
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON format.",
        variant: "destructive"
      });
    }
  };

  // Function to add a new task to template being created
  const addTaskToNewTemplate = () => {
    if (!newTask.taskName || !newTask.description) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields for the task.",
        variant: "destructive"
      });
      return;
    }

    setNewTemplate({
      ...newTemplate,
      tasks: [...(newTemplate.tasks || []), newTask as OnboardingTask]
    });

    setNewTask({
      taskName: '',
      description: '',
      dueDay: 1,
      priority: 'medium',
      category: 'onboarding'
    });

    setNewTaskDialogOpen(false);
  };

  // Function to create or update a template
  const createNewTemplate = () => {
    if (!newTemplate.name || !newTemplate.description || !newTemplate.department || (newTemplate.tasks || []).length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields and add at least one task.",
        variant: "destructive"
      });
      return;
    }

    const updatedTemplates = { ...templates };
    const dept = newTemplate.department as string;
    
    if (!updatedTemplates[dept]) {
      updatedTemplates[dept] = [];
    }
    
    if (isEditMode) {
      // Update existing template
      const templateIndex = updatedTemplates[dept].findIndex(t => t.id === newTemplate.id);
      
      if (templateIndex !== -1) {
        updatedTemplates[dept][templateIndex] = newTemplate as OnboardingTemplate;
        
        toast({
          title: "Template Updated",
          description: `The template "${newTemplate.name}" has been updated.`
        });
      } else {
        // Handle case where template was moved to a different department
        // Remove it from its original department if it exists
        Object.entries(updatedTemplates).forEach(([department, templates]) => {
          if (department !== dept) {
            updatedTemplates[department] = templates.filter(t => t.id !== newTemplate.id);
          }
        });
        
        // Add to new department
        updatedTemplates[dept].push(newTemplate as OnboardingTemplate);
        
        toast({
          title: "Template Updated",
          description: `The template "${newTemplate.name}" has been moved to the ${dept} department.`
        });
      }
    } else {
      // Create new template
      const newTemplateWithId: OnboardingTemplate = {
        ...newTemplate as OnboardingTemplate,
        id: `${dept.toLowerCase()}-${Date.now()}`
      };
      
      updatedTemplates[dept].push(newTemplateWithId);
      
      toast({
        title: "Template Created",
        description: "Your new onboarding template has been created."
      });
    }
    
    setTemplates(updatedTemplates);
    setCreateDialogOpen(false);
    setIsEditMode(false);
    setNewTemplate({
      name: '',
      department: 'Engineering',
      description: '',
      duration: 14,
      tasks: []
    });
  };

  // Function to apply a template to a new onboarding
  const applyTemplate = (template: OnboardingTemplate) => {
    // Open the "New Onboarding" dialog in the parent component
    document.getElementById("new-onboarding-trigger")?.click();
    
    // Store the selected template in local storage for reference
    localStorage.setItem("selected_template", JSON.stringify(template));
    
    toast({
      title: "Template Selected",
      description: `The ${template.name} template is ready to apply. Please select an employee from the dropdown or add a new one.`
    });
  };

  // Function to export templates as JSON
  const exportTemplates = (department?: string) => {
    // If a department is specified, only export templates for that department
    const dataToExport = department ? { [department]: templates[department] } : templates;
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = department 
      ? `onboarding-templates-${department.toLowerCase()}.json` 
      : 'onboarding-templates-all.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Templates Exported",
      description: department 
        ? `${department} department templates have been exported as JSON.`
        : "All templates have been exported as JSON."
    });
  };

  // Function to delete a task from new template
  const deleteTaskFromNewTemplate = (index: number) => {
    const updatedTasks = [...(newTemplate.tasks || [])];
    updatedTasks.splice(index, 1);
    
    setNewTemplate({
      ...newTemplate,
      tasks: updatedTasks
    });
  };
  
  // Function to edit an existing template
  const editTemplate = (template: OnboardingTemplate) => {
    setIsEditMode(true);
    setNewTemplate({...template});
    setCreateDialogOpen(true);
  };
  
  // Function to delete a template
  const deleteTemplate = (template: OnboardingTemplate) => {
    const updatedTemplates = {...templates};
    const department = template.department;
    
    updatedTemplates[department] = updatedTemplates[department].filter(t => t.id !== template.id);
    setTemplates(updatedTemplates);
    
    toast({
      title: "Template Deleted",
      description: `The template "${template.name}" has been deleted.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Onboarding Templates</h2>
          <p className="text-neutral-500">Pre-defined onboarding plans for different roles and departments.</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="inline-flex items-center"
            onClick={() => setImportDialogOpen(true)}
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            Import Templates
          </Button>
          <Button 
            variant="outline" 
            className="inline-flex items-center"
            onClick={() => exportTemplates()}
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All
          </Button>
          <Button 
            className="inline-flex items-center"
            onClick={() => setCreateDialogOpen(true)}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Template
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="Engineering" 
        value={selectedDepartment} 
        onValueChange={setSelectedDepartment}
        className="w-full"
      >
        <TabsList className="bg-white rounded-lg border mb-6 p-1 gap-1 flex-wrap">
          {Object.keys(templates).map(dept => (
            <TabsTrigger 
              key={dept} 
              value={dept}
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2"
            >
              {dept}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(templates).map(([dept, deptTemplates]) => (
          <TabsContent key={dept} value={dept} className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{dept} Templates</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportTemplates(dept)}
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Department
                </Button>
              </div>
            </div>
            
            {deptTemplates.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-neutral-500">No templates found for {dept}.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      setNewTemplate({
                        ...newTemplate,
                        department: dept
                      });
                      setCreateDialogOpen(true);
                    }}
                  >
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {deptTemplates.map(template => (
                  <Card key={template.id} className="overflow-hidden border-t-4 border-t-primary flex flex-col h-[400px]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold truncate">{template.name}</CardTitle>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant="secondary" className="rounded-md px-2 py-1 text-xs font-normal">
                          {template.tasks.length} tasks
                        </Badge>
                        <Badge variant="outline" className="rounded-md px-2 py-1 text-xs font-normal">
                          {template.duration} days
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-grow overflow-y-scroll custom-scrollbar">
                      <div className="flex flex-col">
                        <p className="text-sm text-neutral-600">{template.description}</p>
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-neutral-900 mb-2">Key tasks:</h4>
                          <ul className="text-sm text-neutral-600 space-y-1 list-disc pl-5">
                            {template.tasks.map((task, idx) => (
                              <li key={idx}>{task.taskName}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 pb-4 mt-auto">
                      <div className="space-y-2 w-full">
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewTemplateDetails(template)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => editTemplate(template)}
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteTemplate(template)}
                          >
                            Delete
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => applyTemplate(template)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Template Details Dialog */}
      <Dialog 
        open={showTemplateDetails} 
        onOpenChange={setShowTemplateDetails}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-scroll custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{currentTemplate?.name}</DialogTitle>
            <DialogDescription>
              {currentTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="rounded-md px-2 py-1">
                {currentTemplate?.department}
              </Badge>
              <Badge variant="outline" className="rounded-md px-2 py-1">
                {currentTemplate?.duration} days
              </Badge>
              <Badge variant="outline" className="rounded-md px-2 py-1">
                {currentTemplate?.tasks.length} tasks
              </Badge>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Onboarding Tasks</h3>
              <div className="border rounded-lg overflow-y-scroll max-h-[300px] custom-scrollbar">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Due (Day)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {currentTemplate?.tasks.map((task, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-neutral-900">{task.taskName}</div>
                          <div className="text-sm text-neutral-500">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">Day {task.dueDay}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`
                            ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}
                          `}>
                            {task.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeTemplateDetails}>Close</Button>
            <Button onClick={() => {
              applyTemplate(currentTemplate as OnboardingTemplate);
              closeTemplateDetails();
            }}>Apply Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Templates Dialog */}
      <Dialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Templates</DialogTitle>
            <DialogDescription>
              Paste your JSON template data below. The format should match the exported template structure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="import-json">Template JSON</Label>
              <Textarea 
                id="import-json"
                placeholder='{"Department": [{"name": "Template Name", "description": "Description", "tasks": [...]}]}'
                className="h-[200px] font-mono text-sm"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleImportTemplates}
                disabled={!importJson.trim()}
              >
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Template Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setIsEditMode(false);
            setNewTemplate({
              name: '',
              department: 'Engineering',
              description: '',
              duration: 14,
              tasks: []
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the details of this onboarding template.' 
                : 'Create a new onboarding template for your team.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="template-name">Template Name</Label>
              <Input 
                id="template-name"
                placeholder="Engineering Onboarding - Standard"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="template-department">Department</Label>
              <select
                id="template-department"
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newTemplate.department}
                onChange={(e) => setNewTemplate({...newTemplate, department: e.target.value})}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Customer Support">Customer Support</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="template-description">Description</Label>
              <Textarea 
                id="template-description"
                placeholder="Describe the purpose and scope of this onboarding template"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="template-duration">Duration (days)</Label>
              <Input 
                id="template-duration"
                type="number"
                min="1"
                value={newTemplate.duration}
                onChange={(e) => setNewTemplate({...newTemplate, duration: parseInt(e.target.value) || 14})}
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center mb-2">
                <Label>Tasks</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewTaskDialogOpen(true)}
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Task
                </Button>
              </div>
              
              {(newTemplate.tasks || []).length === 0 ? (
                <div className="text-center py-8 border rounded-md border-dashed">
                  <p className="text-neutral-500">No tasks added yet. Click "Add Task" to get started.</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-y-scroll max-h-[200px] custom-scrollbar">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Due (Day)</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {(newTemplate.tasks || []).map((task, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            <div className="text-sm font-medium text-neutral-900">{task.taskName}</div>
                            <div className="text-sm text-neutral-500 max-w-xs">{task.description}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">Day {task.dueDay}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Badge className={`
                              ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-green-100 text-green-800'}
                            `}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => deleteTaskFromNewTemplate(idx)}
                            >
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={createNewTemplate}
                disabled={(newTemplate.tasks || []).length === 0 || !newTemplate.name || !newTemplate.description}
              >
                {isEditMode ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog 
        open={newTaskDialogOpen} 
        onOpenChange={setNewTaskDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Add a new task to the onboarding template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="task-name">Task Name</Label>
              <Input 
                id="task-name"
                placeholder="Development Environment Setup"
                value={newTask.taskName}
                onChange={(e) => setNewTask({...newTask, taskName: e.target.value})}
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="task-description">Description</Label>
              <Textarea 
                id="task-description"
                placeholder="Describe what needs to be done in this task"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="task-due-day">Due Day</Label>
              <Input 
                id="task-due-day"
                type="number"
                min="1"
                max={newTemplate.duration || 30}
                value={newTask.dueDay}
                onChange={(e) => setNewTask({...newTask, dueDay: parseInt(e.target.value) || 1})}
              />
              <p className="text-xs text-neutral-500">Day of the onboarding when this task is due</p>
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={addTaskToNewTemplate}
                disabled={!newTask.taskName || !newTask.description}
              >
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingTemplates;