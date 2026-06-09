import { useState, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { postApiJson, putApiJson, deleteApiJson } from '@/lib/api';

interface HrTask {
  id: number;
  taskName: string;
  description: string;
  dueDate: string | Date;
  assignedTo: number;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
}

const getPriorityBadge = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge variant="default" className="bg-warning-500">Medium</Badge>;
    case 'low':
      return <Badge variant="default" className="bg-info">Low</Badge>;
    default:
      return <Badge variant="default" className="bg-neutral-500">Unknown</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <Badge variant="outline" className="bg-success-100 text-success-800 border-0">Completed</Badge>;
    case 'in-progress':
    case 'in progress':
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-0">In Progress</Badge>;
    case 'pending':
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-0">Pending</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="bg-success-100 text-success-800 border-0">Scheduled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const TasksSection = () => {
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<HrTask | null>(null);
  const [editedTask, setEditedTask] = useState<Partial<HrTask>>({});
  const [newTask, setNewTask] = useState({
    taskName: '',
    description: '',
    dueDate: '',
    assignedTo: 1,
    priority: 'medium',
    status: 'pending',
    category: 'general'
  });
  
  const queryClient = useQueryClient();
  
  const { data: tasks, isLoading, error } = useQuery<HrTask[]>({
    queryKey: ['/api/tasks'],
  });
  
  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: (taskData: Omit<HrTask, 'id' | 'createdAt'>) => {
      return postApiJson<HrTask>('/api/tasks', taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: number; task: Partial<HrTask> }) => {
      return putApiJson<HrTask>(`/api/tasks/${data.id}`, data.task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  });
  
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => {
      return deleteApiJson(`/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  });

  // Format due date relative to today
  const formatDueDate = (dateValue: string | Date) => {
    const dueDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff < 0) {
      return { text: 'Overdue', className: 'text-error-500 font-medium' };
    } else if (dayDiff === 0) {
      return { text: 'Today', className: 'text-warning-500 font-medium' };
    } else if (dayDiff === 1) {
      return { text: 'Tomorrow', className: 'text-neutral-900' };
    } else {
      return { text: `${dayDiff} days left`, className: 'text-neutral-500' };
    }
  };

  return (
    <>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900">Upcoming Tasks</h3>
              <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center">
                    <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Create a new task to be assigned to team members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="taskName" className="text-sm font-medium">Task Name</label>
                      <input 
                        id="taskName" 
                        className="px-3 py-2 border border-neutral-300 rounded-md" 
                        value={newTask.taskName}
                        onChange={(e) => setNewTask({...newTask, taskName: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <textarea 
                        id="description" 
                        className="px-3 py-2 border border-neutral-300 rounded-md" 
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
                        <input 
                          id="dueDate" 
                          type="date" 
                          className="px-3 py-2 border border-neutral-300 rounded-md"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</label>
                        <Select 
                          value={newTask.assignedTo.toString()}
                          onValueChange={(value) => setNewTask({...newTask, assignedTo: parseInt(value)})}
                        >
                          <SelectTrigger id="assignedTo">
                            <SelectValue placeholder="Select person" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">HR Manager</SelectItem>
                            <SelectItem value="2">AI Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                        <Select 
                          value={newTask.priority}
                          onValueChange={(value) => setNewTask({...newTask, priority: value})}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="status" className="text-sm font-medium">Status</label>
                        <Select 
                          value={newTask.status}
                          onValueChange={(value) => setNewTask({...newTask, status: value})}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="category" className="text-sm font-medium">Category</label>
                      <Select 
                        value={newTask.category}
                        onValueChange={(value) => setNewTask({...newTask, category: value})}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="recruitment">Recruitment</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="engagement">Employee Engagement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setAddTaskDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => {
                        // Create a copy with the date properly converted to an ISO string
                        const taskDataWithProperDate = {
                          ...newTask,
                          dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : new Date().toISOString()
                        };
                        createTaskMutation.mutate(taskDataWithProperDate);
                        setAddTaskDialogOpen(false);
                        // Reset form
                        setNewTask({
                          taskName: '',
                          description: '',
                          dueDate: '',
                          assignedTo: 1,
                          priority: 'medium',
                          status: 'pending',
                          category: 'general'
                        });
                      }}
                      disabled={createTaskMutation.isPending || !newTask.taskName || !newTask.dueDate}
                    >
                      {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {isLoading ? (
                    // Loading skeleton
                    Array(3).fill(0).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="ml-3">
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Skeleton className="h-4 w-8 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : tasks && tasks.length > 0 ? (
                    tasks.map((task) => {
                      const dueDate = formatDueDate(task.dueDate);
                      return (
                        <tr key={task.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">{task.taskName}</div>
                            <div className="text-sm text-neutral-500">{task.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                {task.assignedTo === 1 ? (
                                  <img className="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                                    <span className="text-xs font-medium text-white">AI</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-neutral-900">
                                  {task.assignedTo === 1 ? "Admin User" : "AI Assistant"}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  {task.assignedTo === 1 ? "HR Manager" : "Automated"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className={`text-sm ${dueDate.className}`}>
                              {dueDate.text}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPriorityBadge(task.priority)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(task.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                              <button 
                                type="button" 
                                className="text-primary-600 hover:text-primary-900"
                                onClick={() => {
                                  setCurrentTask(task);
                                  // Make sure date is properly formatted
                                  const formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
                                  setEditedTask({
                                    taskName: task.taskName,
                                    description: task.description,
                                    dueDate: formattedDate,
                                    assignedTo: task.assignedTo,
                                    priority: task.priority, 
                                    status: task.status,
                                    category: task.category || 'general' // Provide default if missing
                                  });
                                  setEditTaskDialogOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                type="button" 
                                className="text-error-600 hover:text-error-900"
                                onClick={() => {
                                  setCurrentTask(task);
                                  setConfirmDeleteDialogOpen(true);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Default display if no tasks or error
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                        {error ? "Error loading tasks" : "No tasks found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details of the selected task.
            </DialogDescription>
          </DialogHeader>
          {currentTask && (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-taskName" className="text-sm font-medium">Task Name</label>
                <input 
                  id="edit-taskName" 
                  className="px-3 py-2 border border-neutral-300 rounded-md" 
                  defaultValue={currentTask.taskName}
                  onChange={(e) => setEditedTask({...editedTask, taskName: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <textarea 
                  id="edit-description" 
                  className="px-3 py-2 border border-neutral-300 rounded-md" 
                  rows={3}
                  defaultValue={currentTask.description}
                  onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-dueDate" className="text-sm font-medium">Due Date</label>
                  <input 
                    id="edit-dueDate" 
                    type="date" 
                    className="px-3 py-2 border border-neutral-300 rounded-md"
                    defaultValue={new Date(currentTask.dueDate).toISOString().split('T')[0]}
                    onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-assignedTo" className="text-sm font-medium">Assigned To</label>
                  <Select 
                    defaultValue={currentTask.assignedTo.toString()} 
                    onValueChange={(value) => setEditedTask({...editedTask, assignedTo: parseInt(value)})}
                  >
                    <SelectTrigger id="edit-assignedTo">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">HR Manager</SelectItem>
                      <SelectItem value="2">AI Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-priority" className="text-sm font-medium">Priority</label>
                  <Select 
                    defaultValue={currentTask.priority}
                    onValueChange={(value) => setEditedTask({...editedTask, priority: value})}
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-status" className="text-sm font-medium">Status</label>
                  <Select 
                    defaultValue={currentTask.status}
                    onValueChange={(value) => setEditedTask({...editedTask, status: value})}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-category" className="text-sm font-medium">Category</label>
                <Select 
                  defaultValue={currentTask.category}
                  onValueChange={(value) => setEditedTask({...editedTask, category: value})}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="engagement">Employee Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditTaskDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (currentTask) {
                  // Create a copy of the edited task data
                  const taskToUpdate = {...editedTask};
                  
                  // Convert date string to a proper ISO string for the server
                  if (taskToUpdate.dueDate) {
                    try {
                      // Create a Date object from the string
                      const dateObj = new Date(taskToUpdate.dueDate);
                      if (!isNaN(dateObj.getTime())) {
                        // Replace the string date with the ISO string
                        taskToUpdate.dueDate = dateObj.toISOString();
                      }
                    } catch (e) {
                      // If there's an error, set today's date as fallback
                      taskToUpdate.dueDate = new Date().toISOString();
                    }
                  } else {
                    // Set default date if none provided
                    taskToUpdate.dueDate = new Date().toISOString();
                  }
                  
                  // Make sure category is set
                  if (!taskToUpdate.category) {
                    taskToUpdate.category = 'general';
                  }
                  
                  updateTaskMutation.mutate({ 
                    id: currentTask.id, 
                    task: taskToUpdate 
                  });
                  setEditTaskDialogOpen(false);
                }
              }}
              disabled={updateTaskMutation.isPending || !currentTask}
            >
              {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentTask && (
            <div className="py-4">
              <p className="font-medium">{currentTask.taskName}</p>
              <p className="text-sm text-neutral-500 mt-1">{currentTask.description}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (currentTask) {
                  deleteTaskMutation.mutate(currentTask.id);
                  setConfirmDeleteDialogOpen(false);
                }
              }}
              disabled={deleteTaskMutation.isPending || !currentTask}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TasksSection;
