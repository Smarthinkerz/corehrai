import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { OnboardingTask } from '@shared/schema';

interface EmployeeOnboarding {
  employeeId: number;
  name: string;
  position: string;
  department: string;
  startDate: string;
  progress: number;
  tasks: OnboardingTask[];
}

const OnboardingChecklist = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const { data: allTasks, isLoading: isTasksLoading, refetch: refetchTasks } = useQuery<any[]>({
    queryKey: ['/api/tasks'],
    refetchOnWindowFocus: false,
  });

  const { data: employeesData } = useQuery<any[]>({
    queryKey: ['/api/employees'],
  });
  
  const createTask = useMutation({
    mutationFn: async (taskData: any) => {
      const enhancedTaskData = {
        ...taskData,
        category: "onboarding",
        dueDate: new Date(taskData.dueDate),
      };
      return await apiRequest('POST', '/api/tasks', enhancedTaskData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      refetchTasks();
      const existingTasks = queryClient.getQueryData<any[]>(['/api/tasks']) || [];
      queryClient.setQueryData(['/api/tasks'], [...existingTasks, data]);
    }
  });

  const activeOnboardings: EmployeeOnboarding[] = (employeesData || [])
    .filter((emp: any) => emp.status === 'onboarding' || emp.status === 'active')
    .slice(0, 10)
    .map((emp: any) => {
      const empTasks = (allTasks || []).filter((t: any) => t.assignedTo === emp.id && t.category === 'onboarding');
      const completedCount = empTasks.filter((t: any) => t.status === 'completed').length;
      const progress = empTasks.length > 0 ? Math.round((completedCount / empTasks.length) * 100) : 0;
      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position || emp.jobTitle || 'Employee',
        department: emp.department || 'General',
        startDate: emp.hireDate || emp.startDate || new Date().toISOString(),
        progress,
        tasks: [],
      };
    });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-success text-white">Completed</Badge>;
      case 'in-progress':
      case 'in progress':
        return <Badge className="bg-primary-500">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Additional state for editing
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState('');
  
  const updateTask = useMutation({
    mutationFn: async (taskData: any) => {
      const updatedTask = await apiRequest('PATCH', `/api/tasks/${taskData.id}`, taskData);
      return updatedTask as any;
    },
    onSuccess: (updatedTask: any) => {
      if (updatedTask && updatedTask.id) {
        const existingTasks = queryClient.getQueryData<any[]>(['/api/tasks']) || [];
        const updatedTasks = existingTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        );
        queryClient.setQueryData(['/api/tasks'], updatedTasks);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setTimeout(() => { refetchTasks(); }, 100);
    }
  });
  
  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest('DELETE', `/api/tasks/${taskId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      refetchTasks();
    }
  });
  
  const handleTaskToggle = async (taskId: number, checked: boolean) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: checked ? 'completed' : 'pending'
      });
      toast({
        title: checked ? "Task Completed" : "Task Reopened",
        description: `Task has been marked as ${checked ? 'completed' : 'pending'}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the task status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskName(task.taskName);
    setEditTaskDescription(task.description);
    // Format date for HTML date input (YYYY-MM-DD)
    const dueDate = new Date(task.dueDate);
    setEditTaskDueDate(dueDate.toISOString().split('T')[0]);
    setEditTaskStatus(task.status);
    setEditTaskDialogOpen(true);
  };
  
  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(taskId);
        toast({
          title: "Task Deleted",
          description: "The task has been permanently removed."
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the task. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const filteredTasks = allTasks?.filter((task: any) => {
    if (task.category === 'onboarding') {
      return true;
    }
    return activeOnboardings.some(emp => emp.employeeId === task.assignedTo);
  }) || [];
  
  const displayedOnboardings = activeOnboardings.map(employee => {
    const employeeTasks = filteredTasks.filter((task: any) => task.assignedTo === employee.employeeId);
    return {
      ...employee,
      tasks: employeeTasks,
    };
  });

  const selectedOnboarding = selectedEmployee 
    ? displayedOnboardings.find(e => e.employeeId === selectedEmployee) 
    : displayedOnboardings[0];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        {displayedOnboardings.map(employee => (
          <Button
            key={employee.employeeId}
            variant={selectedOnboarding?.employeeId === employee.employeeId ? "default" : "outline"}
            onClick={() => setSelectedEmployee(employee.employeeId)}
            className={`flex-1 min-w-[180px] h-auto py-3 transition-all ${
              selectedOnboarding?.employeeId === employee.employeeId 
              ? "border-primary shadow-md" 
              : "hover:border-primary/50"
            }`}
          >
            <div className="text-left w-full">
              <div className="font-medium">{employee.name}</div>
              <div className="text-xs opacity-80 mt-1">{employee.position}</div>
              <div className="mt-2 w-full">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>Progress</span>
                  <span>{employee.progress}%</span>
                </div>
                <Progress 
                  value={employee.progress} 
                  className={`h-1.5 w-full ${
                    selectedOnboarding?.employeeId === employee.employeeId 
                    ? "bg-primary-100" 
                    : "bg-gray-100"
                  }`} 
                />
              </div>
            </div>
          </Button>
        ))}
      </div>

      {selectedOnboarding && (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h3 className="text-lg font-medium">{selectedOnboarding.name}</h3>
              <p className="text-sm text-neutral-500">
                {selectedOnboarding.position} • {selectedOnboarding.department} • Started {formatDate(selectedOnboarding.startDate)}
              </p>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <div className="mr-4">
                <span className="text-sm font-medium">{selectedOnboarding.progress}% Complete</span>
                <Progress value={selectedOnboarding.progress} className="w-32 h-2 mt-1" />
              </div>
              <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
                <Button size="sm" onClick={() => setNewTaskDialogOpen(true)}>
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Task
                </Button>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Onboarding Task</DialogTitle>
                    <DialogDescription>
                      Create a new task for {selectedOnboarding.name}'s onboarding process.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-neutral-700">Task Name</label>
                      <input 
                        type="text" 
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter task name"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-neutral-700">Description</label>
                      <textarea 
                        className="flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter task description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-neutral-700">Due Date</label>
                      <input 
                        type="date" 
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={() => {
                          // Validate inputs
                          if (!newTaskName || !newTaskDescription || !newTaskDueDate) {
                            toast({
                              title: "Missing Information",
                              description: "Please fill out all fields to create a new task.",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          // Create the task data - ensure valid employeeId exists
                          const taskData = {
                            taskName: newTaskName,
                            description: newTaskDescription,
                            dueDate: newTaskDueDate,
                            assignedTo: selectedOnboarding.employeeId || 2, // Default to employee ID 2 if none selected
                            priority: "medium",
                            status: "pending",
                            category: "onboarding"
                          };
                          
                          // Submit the task creation request
                          createTask.mutate(taskData, {
                            onSuccess: (newTask) => {
                              // Show success message
                              toast({
                                title: "Task Added",
                                description: `New task "${newTaskName}" has been added to ${selectedOnboarding.name}'s onboarding.`
                              });
                              
                              // Force immediate refetch to ensure task appears
                              queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                              setTimeout(() => {
                                refetchTasks();
                              }, 100);
                              
                              // Clear inputs and close dialog
                              setNewTaskName('');
                              setNewTaskDescription('');
                              setNewTaskDueDate('');
                              setNewTaskDialogOpen(false);
                            },
                            onError: (error) => {
                              toast({
                                title: "Error",
                                description: "Failed to create the task. Please try again.",
                                variant: "destructive"
                              });
                            }
                          });
                        }}
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4">
            {selectedOnboarding.tasks.map(task => (
              <div key={task.id} className="p-4 bg-white border rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div className="flex items-start mb-3 md:mb-0">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`font-medium text-base block mb-1 ${task.status === 'completed' ? 'line-through text-neutral-400' : ''}`}
                      >
                        {task.taskName}
                      </label>
                      <p className="text-sm text-neutral-500">{task.description}</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs mr-3 text-neutral-500">Due: {formatDate(task.dueDate)}</span>
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-start md:justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 py-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium" 
                      onClick={() => handleEditTask(task)}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
                        <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 py-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-600 font-medium" 
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
                        <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3.5 5C3.22386 5 3 5.22386 3 5.5C3 5.77614 3.22386 6 3.5 6H4V12C4 12.5523 4.44772 13 5 13H10C10.5523 13 11 12.5523 11 12V6H11.5C11.7761 6 12 5.77614 12 5.5C12 5.22386 11.7761 5 11.5 5H3.5ZM5 6H10V12H5V6Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details for this task.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="py-4 space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-neutral-700">Task Name</label>
                <input 
                  type="text" 
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter task name"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-neutral-700">Description</label>
                <textarea 
                  className="flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter task description"
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-neutral-700">Due Date</label>
                <input 
                  type="date" 
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editTaskDueDate}
                  onChange={(e) => setEditTaskDueDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-neutral-700">Status</label>
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editTaskStatus}
                  onChange={(e) => setEditTaskStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setEditTaskDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => {
                    // Validate inputs
                    if (!editTaskName || !editTaskDescription || !editTaskDueDate) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill out all fields to update the task.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // Create the updated task data
                    const updatedTaskData = {
                      id: editingTask.id,
                      taskName: editTaskName,
                      description: editTaskDescription,
                      dueDate: editTaskDueDate,
                      status: editTaskStatus,
                      // Keep other fields the same but ensure valid employee
                      assignedTo: editingTask.assignedTo === 1 ? 2 : editingTask.assignedTo, // Fix invalid assignments
                      priority: editingTask.priority,
                      category: editingTask.category
                    };
                    
                    // Submit the update request
                    updateTask.mutate(updatedTaskData, {
                      onSuccess: (updatedTask: any) => {
                        toast({
                          title: "Task Updated",
                          description: "The task has been successfully updated."
                        });
                        
                        // Check if we have a valid task object with an id
                        if (updatedTask && updatedTask.id) {
                          // Immediately update the task in the local cache
                          const existingTasks = queryClient.getQueryData<any[]>(['/api/tasks']) || [];
                          const updatedTasks = existingTasks.map(task => 
                            task.id === updatedTask.id ? updatedTask : task
                          );
                          queryClient.setQueryData(['/api/tasks'], updatedTasks);
                        } else {
                        }
                        
                        // Also invalidate for a fresh fetch
                        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                        
                        // Ensure the updated task is displayed immediately
                        setTimeout(() => {
                          refetchTasks();
                        }, 100);
                        
                        // Close dialog
                        setEditTaskDialogOpen(false);
                      },
                      onError: (error) => {
                        toast({
                          title: "Error",
                          description: "Failed to update the task. Please try again.",
                          variant: "destructive"
                        });
                      }
                    });
                  }}
                >
                  Update Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingChecklist;