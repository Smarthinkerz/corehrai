import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  DownloadIcon, 
  FileIcon, 
  FileTextIcon, 
  FileUpIcon, 
  FilterIcon, 
  PlusIcon, 
  TrashIcon
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { formatFileSize, formatDate } from '@/lib/utils';

interface Document {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  department: string | null;
  employeeId: number | null;
  isPublic: boolean;
  status: string;
  version: string | null;
  uploadedBy: number;
  tags: any;
  createdAt: string;
  updatedAt: string;
}

type FileUploadState = {
  file: File | null;
  title: string;
  description: string;
  category: string;
  department: string;
  isPublic: boolean;
  employeeId: number | null;
  uploadProgress: number;
  error: string | null;
};

export function DocumentManagement() {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    title: '',
    description: '',
    category: '',
    department: '',
    isPublic: true,
    employeeId: null,
    uploadProgress: 0,
    error: null
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch departments for filter dropdown
  interface Department {
    id: number;
    name: string;
  }
  
  const departmentsQuery = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    staleTime: 0, // Force refetch
  });
  
  const departments = departmentsQuery.data || [];
  
  // Force refetch departments on component mount
  useEffect(() => {
    departmentsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create document mutation
  const createDocument = useMutation({
    mutationFn: async (formData: FormData) => {
      // In a real implementation, this would upload the file to a storage service
      // and then create a document record in the database with the file URL
      
      // For now, we'll simulate file upload and just create the document record
      const fileSize = uploadState.file ? uploadState.file.size : 0;
      const fileType = uploadState.file ? uploadState.file.type : '';
      const fileName = uploadState.file ? uploadState.file.name : '';
      
      // Mock file URL - in a real app this would be the URL from the file storage service
      const fileUrl = `/documents/${fileName}`;
      
      const documentData = {
        title: uploadState.title,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        description: uploadState.description,
        category: uploadState.category,
        department: uploadState.department,
        employeeId: uploadState.employeeId,
        isPublic: uploadState.isPublic,
        status: 'active',
        version: '1.0',
        uploadedBy: 1, // In a real app, this would be the current user ID
      };
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadDialogOpen(false);
      resetUploadState();
    },
    onError: (error) => {
      setUploadState(prev => ({
        ...prev,
        error: error.message,
        uploadProgress: 0
      }));
    }
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    }
  });

  const resetUploadState = () => {
    setUploadState({
      file: null,
      title: '',
      description: '',
      category: '',
      department: '',
      isPublic: true,
      employeeId: null,
      uploadProgress: 0,
      error: null
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setUploadState(prev => ({
        ...prev,
        file,
        title: file.name.split('.')[0], // Default title to filename without extension
      }));
    }
  };

  // Handle document download
  const handleDocumentDownload = (doc: Document) => {
    try {
      // Create a link element
      const link = document.createElement('a');
      
      // Set the href to the document's file URL
      // For real implementation, this would point to the actual file on the server
      link.href = doc.fileUrl;
      
      // Set the download attribute to the document's title
      link.download = `${doc.title}.${doc.fileType.split('/')[1]}`;
      
      // Simulate the click to trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // For a real implementation, we would log this activity
    } catch (error) {
      // In a real implementation, we would show an error toast here
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadState.file) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a file to upload'
      }));
      return;
    }

    if (!uploadState.title) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please enter a title for the document'
      }));
      return;
    }

    if (!uploadState.category) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a category for the document'
      }));
      return;
    }

    if (!uploadState.department) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a department for the document'
      }));
      return;
    }
    
    const formData = new FormData();
    formData.append('file', uploadState.file);
    formData.append('title', uploadState.title);
    formData.append('description', uploadState.description);
    formData.append('category', uploadState.category);
    formData.append('department', uploadState.department);
    formData.append('isPublic', uploadState.isPublic.toString());
    
    // Simulating upload progress
    const interval = setInterval(() => {
      setUploadState(prev => {
        if (prev.uploadProgress >= 90) {
          clearInterval(interval);
          return prev;
        }
        return {
          ...prev,
          uploadProgress: prev.uploadProgress + 10
        };
      });
    }, 300);
    
    createDocument.mutate(formData, {
      onSuccess: () => {
        clearInterval(interval);
        setUploadState(prev => ({
          ...prev,
          uploadProgress: 100
        }));
      },
      onError: () => {
        clearInterval(interval);
      }
    });
  };

  // Filter documents based on department, category, and search term
  const filteredDocuments = (documents as Document[]).filter((doc: Document) => {
    const matchesDepartment = departmentFilter === 'all' || doc.department === departmentFilter;
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesDepartment && matchesCategory && matchesSearch;
  });

  // Extract unique categories from documents
  const categories = Array.from(new Set((documents as Document[]).map((doc: Document) => doc.category)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {(departments as Department[]).map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" onClick={() => resetUploadState()}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload files for your organization, department, or specific employees.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadState.title}
                  onChange={(e) => setUploadState(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadState.description}
                  onChange={(e) => setUploadState(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={uploadState.category}
                    onValueChange={(value) => setUploadState(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Policy">Policy</SelectItem>
                      <SelectItem value="Procedure">Procedure</SelectItem>
                      <SelectItem value="Form">Form</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Standards">Standards</SelectItem>
                      <SelectItem value="Reference">Reference</SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={uploadState.department}
                    onValueChange={(value) => setUploadState(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments as Department[]).map((dept: Department) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadState.isPublic}
                  onChange={(e) => setUploadState(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isPublic" className="text-sm font-normal">
                  Make document visible to all employees
                </Label>
              </div>
              
              {uploadState.error && (
                <div className="text-sm text-red-500">{uploadState.error}</div>
              )}
              
              {uploadState.uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${uploadState.uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDocument.isPending || !uploadState.file}
                >
                  {createDocument.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
              {searchTerm || departmentFilter !== 'all' || categoryFilter !== 'all'
                ? "No documents match your current filters. Try changing your search criteria."
                : "You haven't uploaded any documents yet. Click the 'Upload Document' button to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[400px]" style={{ scrollbarColor: 'var(--scrollbar-thumb) var(--scrollbar-track)' }}>
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[40%]">Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc: Document) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(doc.fileSize)} • {doc.fileType.split('/')[1].toUpperCase()}
                          </div>
                          {doc.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.category}</Badge>
                    </TableCell>
                    <TableCell>{doc.department}</TableCell>
                    <TableCell>{formatDate(new Date(doc.createdAt))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Download"
                          onClick={() => handleDocumentDownload(doc)}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Delete"
                          onClick={() => deleteDocument.mutate(doc.id)}
                          disabled={deleteDocument.isPending}
                        >
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <CardFooter className="flex justify-between py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}