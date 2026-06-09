import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, MessageSquare, MapPin, Phone, Calendar, Filter, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

import { format } from 'date-fns';
import { Employee } from '@shared/schema';
import { sendEmail as sendEmailApi, type EmailRequest } from '@/lib/api';

interface Department {
  id: number;
  name: string;
  headCount: number;
  budget: number | null;
  engagementScore: number | null;
}

export interface SendEmailDialogData {
  open: boolean;
  employee: Employee | null;
}

const EmployeeDirectory: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [emailDialog, setEmailDialog] = useState<SendEmailDialogData>({
    open: false,
    employee: null
  });
  const [messageDialog, setMessageDialog] = useState<SendEmailDialogData>({
    open: false,
    employee: null
  });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [messageText, setMessageText] = useState('');

  // Fetch employees
  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    placeholderData: [],
  });

  // Fetch departments
  const { data: departments = [], isLoading: isDepartmentsLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    placeholderData: [],
  });

  // Extract unique positions from employees
  const positions = React.useMemo(() => {
    const positionSet = new Set<string>();
    employees.forEach(employee => {
      if (employee.position) {
        positionSet.add(employee.position);
      }
    });
    return Array.from(positionSet);
  }, [employees]);

  useEffect(() => {
    let result = [...employees];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        employee => 
          employee.fullName.toLowerCase().includes(query) || 
          employee.email.toLowerCase().includes(query) ||
          (employee.position && employee.position.toLowerCase().includes(query)) ||
          (employee.department && employee.department.toLowerCase().includes(query))
      );
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      result = result.filter(employee => employee.department === departmentFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(employee => employee.status === statusFilter);
    }
    
    // Apply position filter
    if (positionFilter !== 'all') {
      result = result.filter(employee => employee.position === positionFilter);
    }
    
    setFilteredEmployees(result);
  }, [employees, searchQuery, departmentFilter, statusFilter, positionFilter]);

  const handleEmailEmployee = (employee: Employee) => {
    setEmailDialog({
      open: true,
      employee
    });
    setEmailSubject('');
    setEmailBody('');
  };

  const handleMessageEmployee = (employee: Employee) => {
    setMessageDialog({
      open: true,
      employee
    });
    setMessageText('');
  };

  const sendEmail = async () => {
    if (!emailDialog.employee) return;
    
    try {
      // Call our email API function
      const emailData: EmailRequest = {
        to: emailDialog.employee.email,
        subject: emailSubject,
        html: emailBody,
      };
      
      const result = await sendEmailApi(emailData);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to send email');
      }
      
      toast({
        title: "Email sent",
        description: `Email has been sent to ${emailDialog.employee.fullName}`,
      });
      
      setEmailDialog({ open: false, employee: null });
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "There was an error sending the email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!messageDialog.employee) return;
    
    try {
      // For this prototype, we'll simulate sending a message
      // In a real application, this would connect to a messaging or chat service
      
      // Simulate a processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Message sent",
        description: `Message has been sent to ${messageDialog.employee.fullName}`,
      });
      
      setMessageDialog({ open: false, employee: null });
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "There was an error sending the message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isEmployeesLoading || isDepartmentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Loading employee information...</CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>View and contact your team members</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <div className="mb-2">
                    <label className="text-xs font-medium block mb-1">Department</label>
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-2">
                    <label className="text-xs font-medium block mb-1">Status</label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="onLeave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-2">
                    <label className="text-xs font-medium block mb-1">Position</label>
                    <Select
                      value={positionFilter}
                      onValueChange={setPositionFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Positions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        {positions.map(position => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search employees..."
                className="w-[320px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 px-6">
        {filteredEmployees.length > 0 ? (
          <div className="flex justify-center overflow-x-auto py-4" style={{ gap: "16px" }}>
            {filteredEmployees.map((employee) => (
              <div 
                key={employee.id} 
                style={{ 
                  width: "270px",
                  flex: "0 0 270px"
                }}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="text-center mb-3 pb-3 border-b border-gray-100">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarFallback className="bg-blue-500 text-white text-lg">
                        {employee.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold text-gray-900">{employee.fullName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{employee.position || 'No position'}</p>
                    {employee.status && (
                      <div className="mt-2">
                        {employee.status === 'active' && 
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                        }
                        {employee.status === 'onLeave' && 
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">On Leave</Badge>
                        }
                        {employee.status === 'terminated' && 
                          <Badge variant="destructive">Terminated</Badge>
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-3 mb-4 text-sm">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700">{employee.department || 'No department'}</span>
                    </div>
                    {employee.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
                        <span className="text-gray-700">{employee.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700">Hired: {formatDate(employee.hireDate)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      className="h-9 text-xs w-full flex items-center justify-center"
                      onClick={() => handleEmailEmployee(employee)}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      <span>Email</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-9 text-xs w-full flex items-center justify-center"
                      onClick={() => handleMessageEmployee(employee)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>Message</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No employees found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('all');
                setStatusFilter('all');
                setPositionFilter('all');
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </CardContent>

      {/* Email Dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => !open && setEmailDialog({ ...emailDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {emailDialog.employee?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="recipient">
                Recipient
              </label>
              <Input
                id="recipient"
                className="mt-1"
                value={emailDialog.employee?.email || ''}
                disabled
              />
            </div>
            
            <div>
              <label className="text-sm font-medium" htmlFor="subject">
                Subject
              </label>
              <Input
                id="subject"
                className="mt-1"
                placeholder="Enter email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium" htmlFor="body">
                Message
              </label>
              <textarea
                id="body"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                placeholder="Write your message here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-end gap-2 sm:gap-0">
            <Button
              variant="secondary"
              onClick={() => setEmailDialog({ open: false, employee: null })}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={sendEmail}
              disabled={!emailSubject.trim() || !emailBody.trim()}
            >
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialog.open} onOpenChange={(open) => !open && setMessageDialog({ ...messageDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a direct message to {messageDialog.employee?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-400 text-white">
                  {messageDialog.employee?.fullName.split(' ').map(name => name[0]).join('') || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{messageDialog.employee?.fullName}</p>
                <p className="text-sm text-gray-500">{messageDialog.employee?.position}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-end gap-2 sm:gap-0">
            <Button
              variant="secondary"
              onClick={() => setMessageDialog({ open: false, employee: null })}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EmployeeDirectory;
