import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, FileText, BookOpen, HelpCircle, Video, Mail, Phone, MessageSquare, 
  ArrowLeft, Users, Clock, Calendar, CheckSquare, Briefcase, GraduationCap, 
  BarChart, Layers, Settings, FileCheck, UserPlus, List, Workflow
} from "lucide-react";

// Define the guide content type
interface GuideContent {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const HelpDocumentation: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuide, setActiveGuide] = useState<GuideContent | null>(null);

  // Monitor URL hash changes to open/close the dialog
  useEffect(() => {
    const hashChangeHandler = () => {
      if (window.location.hash === '#help') {
        setOpen(true);
      }
    };

    // Check on mount
    hashChangeHandler();

    // Listen for hash changes
    window.addEventListener('hashchange', hashChangeHandler);

    return () => {
      window.removeEventListener('hashchange', hashChangeHandler);
    };
  }, []);

  // Clear hash when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && window.location.hash === '#help') {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    // Reset active guide when closing dialog
    if (!isOpen) {
      setActiveGuide(null);
    }
  };
  
  // Our detailed guides
  const guides: GuideContent[] = [
    {
      title: "Getting Started Guide",
      icon: <FileText />,
      description: "Learn the basics of navigating and using the platform.",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Getting Started with the HR Platform</h2>
          <p className="mb-4">Welcome to our AI-powered HR management platform! This guide will help you understand the basics of navigating and using the system effectively.</p>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Dashboard Overview</h3>
            <p>The dashboard is your central command center for all HR activities. Here's what you'll find:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>AI Insights:</strong> Intelligent analysis of workforce trends with actionable recommendations</li>
              <li><strong>Recruitment Overview:</strong> Real-time pipeline visibility with candidate status tracking</li>
              <li><strong>Activity Feed:</strong> Chronological timeline of HR actions and system updates</li>
              <li><strong>Employee Directory:</strong> Quick access to staff profiles with filtering capabilities</li>
              <li><strong>Task Tracker:</strong> Prioritized view of pending HR actions with due dates</li>
              <li><strong>Department Metrics:</strong> Key performance indicators organized by department</li>
            </ul>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex items-start">
              <div className="text-blue-500 mr-3 mt-1">
                <BarChart className="h-5 w-5" />
              </div>
              <div className="text-base">
                <strong>Pro Tip:</strong> Most dashboard cards can be expanded for more details by clicking the "Click for details" text. You can also export data from most sections using the download icon in the card header.
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Navigation</h3>
            <p>The main navigation is located in the sidebar on the left side of the screen:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3 flex items-start">
                <Users className="h-5 w-5 mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Dashboard</h4>
                  <p className="text-base text-muted-foreground">Overview of all HR activities and key metrics</p>
                </div>
              </div>
              <div className="border rounded p-3 flex items-start">
                <Briefcase className="h-5 w-5 mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Recruitment</h4>
                  <p className="text-base text-muted-foreground">Manage job postings, applicants, and interviews</p>
                </div>
              </div>
              <div className="border rounded p-3 flex items-start">
                <UserPlus className="h-5 w-5 mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Onboarding</h4>
                  <p className="text-base text-muted-foreground">Set up new hires with tasks and orientation materials</p>
                </div>
              </div>
              <div className="border rounded p-3 flex items-start">
                <Layers className="h-5 w-5 mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Management</h4>
                  <p className="text-base text-muted-foreground">Employee directory and department organization</p>
                </div>
              </div>
              <div className="border rounded p-3 flex items-start">
                <FileCheck className="h-5 w-5 mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Compliance</h4>
                  <p className="text-base text-muted-foreground">Document management and regulatory requirements</p>
                </div>
              </div>
              <div className="border rounded p-3 flex items-start">
                <Settings className="h-5 w-5 mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Settings</h4>
                  <p className="text-base text-muted-foreground">Configure your account and platform preferences</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">User Profile & Settings</h3>
            <p>Click on your profile picture in the top right corner to access:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>User Profile:</strong> Update your personal information and preferences</li>
              <li><strong>Notifications:</strong> Configure how and when you receive alerts</li>
              <li><strong>Security:</strong> Change password and two-factor authentication settings</li>
              <li><strong>Theme:</strong> Customize the look and feel of your interface</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">AI Assistant</h3>
            <p>The AI Assistant is available in the bottom right corner of your screen at all times. Use it to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Get quick answers to platform-related questions</li>
              <li>Generate reports and summaries of employee data</li>
              <li>Draft communications and documentation</li>
              <li>Receive personalized recommendations for HR initiatives</li>
            </ul>
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex items-start">
              <div className="text-blue-500 mr-3 mt-1">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="text-base">
                <strong>Example prompts:</strong>
                <ul className="list-disc pl-5 mt-2">
                  <li>"Summarize recent hiring activity in Engineering"</li>
                  <li>"Draft an onboarding email for John, new Marketing Manager"</li>
                  <li>"What's the average time-to-hire this quarter?"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Employee Management",
      icon: <FileText />,
      description: "Managing employee records, profiles, and data.",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Employee Management</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Employee Directory</h3>
            <p>The Employee Directory is the central database for all employee information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Details:</strong> Contact information, emergency contacts, identification</li>
              <li><strong>Employment Information:</strong> Department, position, manager, hire date</li>
              <li><strong>Performance Data:</strong> Reviews, skills, achievements, goals</li>
              <li><strong>Documents:</strong> Contracts, certifications, training records</li>
            </ul>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-4">
              <h4 className="font-medium mb-2">Key Directory Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Search className="h-5 w-5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">Advanced Search</p>
                    <p className="text-sm text-muted-foreground">Filter by any employee attribute or qualification</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">Org Chart View</p>
                    <p className="text-sm text-muted-foreground">Visual reporting structure and team organization</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">Direct Messaging</p>
                    <p className="text-sm text-muted-foreground">Communicate with any employee from their profile</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">Export Reports</p>
                    <p className="text-sm text-muted-foreground">Generate custom reports in multiple formats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Adding & Editing Employees</h3>
            <p>To add a new employee:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Navigate to <strong>Management → Employee Directory</strong></li>
              <li>Click <strong>Add Employee</strong> in the top right corner</li>
              <li>Complete all required fields (marked with *)</li>
              <li>Assign the employee to a department and manager</li>
              <li>Set appropriate system access permissions</li>
              <li>Click <strong>Save</strong> to create the employee record</li>
            </ol>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex items-start">
              <div className="text-blue-500 mr-3 mt-1">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="text-base">
                <strong>Pro Tip:</strong> When editing existing employee information, all changes are automatically logged in the audit trail for compliance purposes. Access the change history from the "History" tab on any employee profile.
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Department Management</h3>
            <p>Organize your workforce by departments and teams:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Create Departments:</strong> Establish organizational units with budgets and goals</li>
              <li><strong>Assign Leadership:</strong> Designate department heads and team managers</li>
              <li><strong>Set Metrics:</strong> Define KPIs for tracking department performance</li>
              <li><strong>Resource Planning:</strong> Manage headcount allocation and growth plans</li>
            </ul>
            
            <p className="mt-4">To manage departments:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to <strong>Management {'->'} Departments</strong></li>
              <li>View all departments or create a new one</li>
              <li>Click on any department to see details and members</li>
              <li>Use the <strong>Edit</strong> button to modify department settings</li>
            </ol>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Talent Management</h3>
            <p>Track and develop employee skills and performance:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <CheckSquare className="h-4 w-4 mr-2 text-green-500" />
                  Performance Reviews
                </h4>
                <p className="text-sm">Schedule and conduct regular evaluations with customizable review templates. Track goals and improvement over time.</p>
                <p className="text-xs text-blue-600 mt-2">Management {"->"} Performance</p>
              </div>
              <div className="border rounded-md p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <GraduationCap className="h-4 w-4 mr-2 text-green-500" />
                  Skills & Training
                </h4>
                <p className="text-sm">Log employee skills, certifications, and training history. Identify skill gaps and recommend development opportunities.</p>
                <p className="text-xs text-blue-600 mt-2">Management {"->"} Development</p>
              </div>
              <div className="border rounded-md p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  Time Off Management
                </h4>
                <p className="text-sm">Track vacation, sick days, and other leaves. Approve requests and manage team coverage.</p>
                <p className="text-xs text-blue-600 mt-2">Management {"->"} Time Off</p>
              </div>
              <div className="border rounded-md p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <BarChart className="h-4 w-4 mr-2 text-green-500" />
                  Succession Planning
                </h4>
                <p className="text-sm">Identify high-potential employees and create career paths for critical roles. Ensure business continuity.</p>
                <p className="text-xs text-blue-600 mt-2">Management {"->"} Succession</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Recruitment Process",
      icon: <FileText />,
      description: "Post jobs, review candidates, and manage interviews.",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Recruitment Process Guide</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Job Postings Management</h3>
            <p>Create and manage job openings across your organization:</p>
            
            <div className="border rounded-md p-5 space-y-4">
              <h4 className="font-medium">Creating a New Job Posting</h4>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Navigate to <strong>Recruitment {"->"} Job Postings</strong></li>
                <li>Click <strong>Create New Job</strong> button</li>
                <li>Fill in all required fields:</li>
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li><strong>Title & Department:</strong> Position name and team assignment</li>
                  <li><strong>Description:</strong> Responsibilities, requirements, and benefits</li>
                  <li><strong>Employment Type:</strong> Full-time, part-time, contract, etc.</li>
                  <li><strong>Location:</strong> Office location or remote specifications</li>
                  <li><strong>Salary Range:</strong> Compensation details (optional)</li>
                </ul>
                <li>Set the application deadline and posting status</li>
                <li>Click <strong>Publish</strong> to make the job visible to candidates</li>
              </ol>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h5 className="font-medium mb-2 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                  AI Job Description Assistant
                </h5>
                <p className="text-sm">Use the AI button in the description field to:</p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li>Generate professionally written job descriptions</li>
                  <li>Analyze descriptions for inclusive language</li>
                  <li>Optimize for search visibility and candidate attraction</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Candidate Management</h3>
            <p>Track applicants throughout the hiring process:</p>
            
            <div className="overflow-hidden rounded-lg border">
              <div className="bg-slate-50 py-3 px-4 font-medium border-b">Recruitment Pipeline</div>
              <div className="grid grid-cols-5 divide-x text-center font-medium border-b">
                <div className="p-3 bg-blue-50 text-blue-700">Applied</div>
                <div className="p-3">Screening</div>
                <div className="p-3">Interview</div>
                <div className="p-3">Assessment</div>
                <div className="p-3">Decision</div>
              </div>
              <div className="p-4 space-y-3">
                <p><strong>Key Features:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Candidate Profiles:</strong> View applications, resumes, and contact information</li>
                  <li><strong>Stage Movement:</strong> Drag and drop candidates between pipeline stages</li>
                  <li><strong>AI Scoring:</strong> Automated resume analysis and skill matching</li>
                  <li><strong>Collaborative Notes:</strong> Team feedback and evaluation tracking</li>
                  <li><strong>Email Integration:</strong> Send templated communications directly from the platform</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="mb-3">To manage candidates:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Go to <strong>Recruitment {"->"} Candidates</strong></li>
                <li>Filter by job posting, status, or search by name</li>
                <li>Click on any candidate to view their complete profile</li>
                <li>Add notes, schedule interviews, or update their status</li>
                <li>Use the candidate comparison tool for final selection decisions</li>
              </ol>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Interview Scheduling & Feedback</h3>
            <p>Coordinate interviews and collect evaluation data:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Schedule Interviews</h4>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>From a candidate profile, click <strong>Schedule Interview</strong></li>
                  <li>Select interview type (phone, video, in-person)</li>
                  <li>Choose interviewers from your team</li>
                  <li>Set date, time, and duration</li>
                  <li>Add custom interview questions and evaluation criteria</li>
                  <li>Send automatic calendar invites to all participants</li>
                </ol>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Collect Feedback</h4>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Interviewers receive feedback forms after each interview</li>
                  <li>Rate candidates on predefined criteria</li>
                  <li>Provide qualitative comments on strengths/weaknesses</li>
                  <li>Submit hiring recommendations</li>
                  <li>View aggregated feedback in the candidate profile</li>
                  <li>Compare feedback across multiple candidates</li>
                </ol>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-4 flex items-start">
              <div className="text-blue-500 mr-3 mt-1">
                <Video className="h-5 w-5" />
              </div>
              <div className="text-base">
                <strong>Video Interview Integration:</strong> The platform integrates with Zoom, Microsoft Teams, and Google Meet for seamless video interviews. Recordings can be saved and attached to candidate profiles for hiring team members who couldn't attend live.
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Offer Management</h3>
            <p>Create, send, and track job offers:</p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to <strong>Recruitment {"->"} Offers</strong> or select from a candidate profile</li>
              <li>Use built-in templates or create custom offer letters</li>
              <li>Specify compensation, benefits, and start date</li>
              <li>Route for internal approvals (HR, Finance, Department Head)</li>
              <li>Send secure digital offers for electronic signature</li>
              <li>Track offer status (Sent, Viewed, Accepted, Declined, Negotiating)</li>
              <li>Manage offer revisions during negotiation</li>
            </ol>
            
            <div className="bg-green-50 p-4 rounded-md border border-green-200 mt-4">
              <h4 className="text-green-800 font-medium mb-1 flex items-center">
                <CheckSquare className="h-4 w-4 mr-2" />
                When an offer is accepted
              </h4>
              <p className="text-sm text-green-700">Once a candidate accepts an offer, you can automatically:</p>
              <ul className="list-disc pl-5 text-sm text-green-700 mt-1 space-y-1">
                <li>Convert them to an employee in the system</li>
                <li>Trigger the onboarding workflow</li>
                <li>Send welcome communications</li>
                <li>Notify relevant department members</li>
                <li>Schedule first-day orientation</li>
              </ul>
              <p className="text-sm text-green-700 mt-2">Go to <strong>Recruitment {"->"} Settings</strong> to configure these automated transitions.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Onboarding Workflows",
      icon: <FileText />,
      description: "Create and manage onboarding tasks and processes.",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Onboarding Workflows</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Onboarding Process Overview</h3>
            <p>The platform streamlines employee onboarding through automated workflows and task management:</p>
            
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-slate-50 p-3 border-b font-medium">Onboarding Timeline</div>
              <div className="grid grid-cols-4 divide-x text-center text-sm">
                <div className="p-4 space-y-2">
                  <div className="font-medium">Pre-boarding</div>
                  <div className="text-xs text-muted-foreground">Before first day</div>
                  <div className="bg-blue-100 rounded-full px-2 py-1 text-xs text-blue-800 inline-block">Paperwork</div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-medium">First Day</div>
                  <div className="text-xs text-muted-foreground">Day 1</div>
                  <div className="bg-green-100 rounded-full px-2 py-1 text-xs text-green-800 inline-block">Orientation</div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-medium">First Week</div>
                  <div className="text-xs text-muted-foreground">Days 2-5</div>
                  <div className="bg-indigo-100 rounded-full px-2 py-1 text-xs text-indigo-800 inline-block">Training</div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-medium">First Month</div>
                  <div className="text-xs text-muted-foreground">Days 6-30</div>
                  <div className="bg-amber-100 rounded-full px-2 py-1 text-xs text-amber-800 inline-block">Integration</div>
                </div>
              </div>
            </div>
            
            <p className="mt-4">Each phase contains specific tasks and milestones that can be customized for different roles, departments, and work arrangements (in-office, remote, hybrid).</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Creating Onboarding Templates</h3>
            <p>Templates allow you to standardize onboarding for different roles and departments:</p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>Navigate to <strong>Onboarding {"->"} Templates</strong></li>
              <li>Click <strong>Create Template</strong></li>
              <li>Provide a template name (e.g., "Engineering New Hire", "Remote Sales Rep")</li>
              <li>Select applicable departments or make it organization-wide</li>
              <li>Add tasks for each onboarding phase:</li>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Task name and description</li>
                <li>Responsible party (HR, Manager, IT, new hire)</li>
                <li>Due date (absolute or relative to start date)</li>
                <li>Priority level</li>
                <li>Required resources or documentation</li>
              </ul>
              <li>Configure automatic notifications and reminders</li>
              <li>Save and activate the template</li>
            </ol>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-4">
              <h4 className="font-medium mb-2">Template Categories</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border text-sm">
                  <span className="font-medium">New Hire Onboarding</span>
                  <p className="text-xs text-muted-foreground mt-1">Standard process for all new employees</p>
                </div>
                <div className="bg-white p-3 rounded border text-sm">
                  <span className="font-medium">Role-Specific Onboarding</span>
                  <p className="text-xs text-muted-foreground mt-1">Customized by job function or title</p>
                </div>
                <div className="bg-white p-3 rounded border text-sm">
                  <span className="font-medium">Remote Employee Onboarding</span>
                  <p className="text-xs text-muted-foreground mt-1">Special process for virtual team members</p>
                </div>
                <div className="bg-white p-3 rounded border text-sm">
                  <span className="font-medium">Executive Onboarding</span>
                  <p className="text-xs text-muted-foreground mt-1">Enhanced process for leadership roles</p>
                </div>
                <div className="bg-white p-3 rounded border text-sm">
                  <span className="font-medium">Intern Onboarding</span>
                  <p className="text-xs text-muted-foreground mt-1">Temporary positions with educational focus</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Creating an Onboarding Plan</h3>
            <p>When a new hire is confirmed, create their personalized onboarding plan:</p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to <strong>Onboarding {"->"} New Plan</strong></li>
              <li>Select the employee from the new hires list</li>
              <li>Choose an appropriate template as your starting point</li>
              <li>Customize the plan as needed for this specific employee</li>
              <li>Assign task owners and due dates</li>
              <li>Enable preboarding portal access if needed</li>
              <li>Review and activate the plan</li>
            </ol>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex items-start mt-2">
              <div className="text-blue-500 mr-3 mt-1">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="text-base">
                <strong>Pro Tip:</strong> You can link onboarding plans to equipment provisioning, system access requests, and resource allocation. These will automatically generate IT tickets and approval workflows in connected systems.
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Preboarding Portal</h3>
            <p>Allow new hires to complete paperwork and prepare before their first day:</p>
            
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-3">Portal Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <FileCheck className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Document Completion</p>
                    <p className="text-xs text-muted-foreground">Tax forms, legal agreements, emergency contacts</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Team Introduction</p>
                    <p className="text-xs text-muted-foreground">Virtual meet-and-greet with team members</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">First-Day Schedule</p>
                    <p className="text-xs text-muted-foreground">Detailed agenda and location information</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <List className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Preparation Checklist</p>
                    <p className="text-xs text-muted-foreground">What to bring and how to prepare</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm">
                <p>To enable the portal for a new hire:</p>
                <ol className="list-decimal pl-6 mt-1 space-y-1">
                  <li>Go to their onboarding plan</li>
                  <li>Click <strong>Enable Preboarding</strong></li>
                  <li>Select which documents and resources to include</li>
                  <li>Set a deadline for completion</li>
                  <li>System will automatically email secure login details</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Monitoring & Reporting</h3>
            <p>Track onboarding progress and measure effectiveness:</p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Progress Dashboard:</strong> Visual overview of all active onboarding plans</li>
              <li><strong>Task Completion Tracking:</strong> Real-time status of all onboarding activities</li>
              <li><strong>Bottleneck Identification:</strong> Highlight delayed tasks and responsible parties</li>
              <li><strong>Feedback Collection:</strong> Automated surveys at key onboarding milestones</li>
              <li><strong>Time-to-Productivity Metrics:</strong> Track how quickly new hires become fully functional</li>
              <li><strong>Template Effectiveness:</strong> Compare outcomes across different onboarding approaches</li>
            </ul>
            
            <p className="mt-3">Access these features in <strong>Onboarding {"->"} Analytics</strong> to continuously improve your onboarding process.</p>
          </div>
        </div>
      )
    }
  ];

  // If we're viewing a specific guide, render that content
  if (activeGuide) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 h-8 w-8 p-0" 
              onClick={() => setActiveGuide(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <DialogTitle className="text-xl">{activeGuide.title}</DialogTitle>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-3 max-h-[calc(85vh-120px)] scrollbar-thin scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 scrollbar-track-gray-100">
            {activeGuide.content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Main help dialog view
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Help & Documentation</DialogTitle>
          <DialogDescription>
            Find answers, guides, and resources to help you use the platform effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4 mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for help topics..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="guides" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>User Guides</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>Video Tutorials</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Support</span>
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto pr-3 flex-1 max-h-[calc(85vh-180px)] scrollbar-thin scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 scrollbar-track-gray-100">
            <TabsContent value="guides" className="mt-0">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-medium">User Guides</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => window.location.hash = '#help'}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Help Center
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {guides.map((guide, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="h-auto min-h-[100px] p-4 flex flex-col items-start justify-start bg-white hover:bg-neutral-50"
                    onClick={() => setActiveGuide(guide)}
                  >
                    <div className="flex items-center w-full mb-2">
                      <div className="bg-primary/10 p-2 rounded-full text-primary mr-2 shrink-0">
                        {guide.icon}
                      </div>
                      <h3 className="font-medium text-sm">{guide.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground text-left line-clamp-2">{guide.description}</p>
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Popular Topics</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Setting up departments and teams</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">To set up departments and teams:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Navigate to Management section from the sidebar</li>
                        <li>Click on "Departments" tab</li>
                        <li>Use "Add Department" button to create new departments</li>
                        <li>For each department, you can add team members from the employee directory</li>
                        <li>Assign managers and team leads via the department settings</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Creating onboarding templates</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Onboarding templates streamline the new hire process:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Go to the Onboarding section</li>
                        <li>Select "Templates" from the tab menu</li>
                        <li>Click "Create Template" button</li>
                        <li>Name your template (e.g., "Engineering New Hire")</li>
                        <li>Add tasks, documents, and training material requirements</li>
                        <li>Assign responsible parties for each task</li>
                        <li>Set timeframes (before start, first day, first week, etc.)</li>
                        <li>Templates can be duplicated and modified for different roles</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Managing compliance documents</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Keep compliance documentation organized and up-to-date:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Navigate to the Compliance section</li>
                        <li>Use the "Document Management" tab</li>
                        <li>Upload compliance documents with proper categorization</li>
                        <li>Set expiration dates and renewal reminders</li>
                        <li>Assign verification responsibilities to specific HR personnel</li>
                        <li>Monitor the compliance calendar for upcoming deadlines</li>
                        <li>Generate compliance reports for auditing purposes</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Using AI features effectively</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">The AI Assistant can help with many HR tasks:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Click the AI Assistant button in the lower right corner</li>
                        <li>Ask natural language questions about your HR data</li>
                        <li>Request summaries of employee metrics and engagement</li>
                        <li>Get suggestions for improving recruitment workflows</li>
                        <li>Generate templates for communications and documentation</li>
                        <li>Analyze sentiment in survey responses</li>
                        <li>Get recommendations for employee development opportunities</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
            
            <TabsContent value="faq" className="mt-0">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-medium">Frequently Asked Questions</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => window.location.hash = '#help'}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Help Center
                </Button>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>
                    <p>You can reset your password by clicking on the "Forgot Password" link on the login page. You will receive an email with instructions to create a new password. If you're already logged in, you can change your password in the Settings section under the "Security" tab.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-2">
                  <AccordionTrigger>Can I export reports and data?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes, most reports and data views have an export option. Look for the "Export" or download icon in the top right of data tables and reports. You can typically export to CSV, Excel, and PDF formats depending on the data type.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-3">
                  <AccordionTrigger>How do I add a new employee to the system?</AccordionTrigger>
                  <AccordionContent>
                    <p>To add a new employee:</p>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Go to the Management section</li>
                      <li>Click on "Employee Directory"</li>
                      <li>Click the "Add Employee" button</li>
                      <li>Fill in the required information</li>
                      <li>Select their department and position</li>
                      <li>Submit the form to create their profile</li>
                      <li>You can then set up their onboarding process from the Onboarding section</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-4">
                  <AccordionTrigger>What integrations are available?</AccordionTrigger>
                  <AccordionContent>
                    <p>The platform integrates with many popular business tools, including:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Google Workspace for calendar and email</li>
                      <li>Microsoft 365 for document management</li>
                      <li>Slack for communications</li>
                      <li>Zoom for video meetings</li>
                      <li>Payroll systems (ADP, Gusto, etc.)</li>
                      <li>Applicant Tracking Systems</li>
                      <li>Learning Management Systems</li>
                    </ul>
                    <p className="mt-2">Visit the Integrations section to connect these services to your account.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-5">
                  <AccordionTrigger>How do I set up notifications?</AccordionTrigger>
                  <AccordionContent>
                    <p>Notification preferences can be customized in the Settings section under "Notifications". You can choose which events trigger notifications and how you receive them (email, in-app, or both).</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-6">
                  <AccordionTrigger>Can I customize the onboarding process?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes, the onboarding process is fully customizable. You can create different templates for different roles, departments, or locations. Each template can have its own set of tasks, documentation requirements, and timeframes.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="videos" className="mt-0">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-medium">Video Tutorials</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => window.location.hash = '#help'}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Help Center
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { 
                    title: "Dashboard Overview", 
                    duration: "4:18", 
                    videoId: "N6BghzuFLIg", // HR Dashboard demo
                    description: "A walkthrough of the main dashboard features and how to interpret key metrics." 
                  },
                  { 
                    title: "Employee Onboarding", 
                    duration: "5:24", 
                    videoId: "DZA9VUxn2Y0", // Onboarding process demo
                    description: "Step-by-step guide to creating and managing effective onboarding processes." 
                  },
                  { 
                    title: "Recruitment Workflow", 
                    duration: "6:12", 
                    videoId: "hB4Lj_-Ee98", // Recruitment workflow
                    description: "Learn how to post jobs, screen candidates, and manage the hiring pipeline." 
                  },
                  { 
                    title: "Employee Analytics", 
                    duration: "3:45", 
                    videoId: "IctMA-ePAW0", // Data analytics
                    description: "Generate insights from employee data to make informed HR decisions." 
                  }
                ].map((video, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="aspect-video bg-gray-100 relative">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${video.videoId}?rel=0`} 
                        title={video.title}
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="absolute inset-0"
                      ></iframe>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm">{video.title}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{video.duration}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                      <a 
                        href={`https://www.youtube.com/watch?v=${video.videoId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-auto ml-auto text-sm text-primary hover:underline"
                      >
                        Watch in new window
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="support" className="mt-0">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-medium">Support</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => window.location.hash = '#help'}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Help Center
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Contact Support</h3>
                  <p className="text-muted-foreground mb-4">Our support team is available to help you with any questions or issues.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Email Support</h4>
                        <p className="text-sm text-muted-foreground mb-2">Send us a detailed email about your issue</p>
                        <p className="text-sm font-medium">support@hr-platform.com</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Phone Support</h4>
                        <p className="text-sm text-muted-foreground mb-2">Available Monday-Friday, 9am-5pm EST</p>
                        <p className="text-sm font-medium">+1 (800) 555-1234</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Live Chat</h4>
                        <p className="text-sm text-muted-foreground mb-2">Chat with a support representative</p>
                        <Button size="sm" variant="outline" className="mt-1">Start Chat</Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-start space-x-3">
                      <Video className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Schedule a Demo</h4>
                        <p className="text-sm text-muted-foreground mb-2">Get a personalized walkthrough</p>
                        <Button size="sm" variant="outline" className="mt-1">Book Time</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Feedback</h3>
                  <p className="text-muted-foreground mb-4">We're constantly improving our platform based on your feedback.</p>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Submit Feedback or Feature Request</h4>
                    <textarea 
                      className="w-full border rounded-md h-24 p-2 text-sm mb-3"
                      placeholder="Tell us what you think or suggest a new feature..."
                    ></textarea>
                    <div className="flex justify-end">
                      <Button size="sm">Submit Feedback</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDocumentation;