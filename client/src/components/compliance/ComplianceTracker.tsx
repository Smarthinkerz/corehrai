import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ComplianceRecord {
  id: number;
  documentName: string;
  documentType: string;
  status: string;
  expiryDate: string;
  risk: 'high' | 'medium' | 'low';
}

const ComplianceTracker = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  
  const { data: complianceRecords, isLoading, error } = useQuery<ComplianceRecord[]>({
    queryKey: ['/api/compliance'],
  });

  // Sample compliance data (this would be replaced by actual data from the API)
  const sampleComplianceData: ComplianceRecord[] = [
    {
      id: 1,
      documentName: 'GDPR Data Protection',
      documentType: 'policy',
      status: 'compliant',
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      risk: 'low'
    },
    {
      id: 2,
      documentName: 'Harassment Training',
      documentType: 'training',
      status: 'at-risk',
      expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      risk: 'medium'
    },
    {
      id: 3,
      documentName: 'Information Security',
      documentType: 'certification',
      status: 'non-compliant',
      expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      risk: 'high'
    },
    {
      id: 4,
      documentName: 'Code of Conduct',
      documentType: 'policy',
      status: 'compliant',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      risk: 'low'
    },
    {
      id: 5,
      documentName: 'Workplace Safety',
      documentType: 'training',
      status: 'compliant',
      expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      risk: 'low'
    },
    {
      id: 6,
      documentName: 'ISO 27001',
      documentType: 'certification',
      status: 'at-risk',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      risk: 'medium'
    }
  ];

  // Use API data if available, otherwise fallback to sample data
  const displayedRecords = complianceRecords || sampleComplianceData;
  
  // Filter records based on selected category
  const filteredRecords = selectedCategory === 'all' 
    ? displayedRecords 
    : displayedRecords.filter(record => record.documentType === selectedCategory);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return <Badge className="bg-success text-white">Compliant</Badge>;
      case 'at-risk':
        return <Badge className="bg-warning-500">At Risk</Badge>;
      case 'non-compliant':
        return <Badge className="bg-error">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return <div className="w-2 h-2 bg-error rounded-full"></div>;
      case 'medium':
        return <div className="w-2 h-2 bg-warning-500 rounded-full"></div>;
      case 'low':
        return <div className="w-2 h-2 bg-success rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>;
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          All
        </Button>
        <Button 
          variant={selectedCategory === 'policy' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('policy')}
          size="sm"
        >
          Policies
        </Button>
        <Button 
          variant={selectedCategory === 'training' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('training')}
          size="sm"
        >
          Training
        </Button>
        <Button 
          variant={selectedCategory === 'certification' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('certification')}
          size="sm"
        >
          Certifications
        </Button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 border-b">
          <div className="text-center">
            <div className="text-lg font-bold text-success">
              {displayedRecords.filter(r => r.status === 'compliant').length}
            </div>
            <div className="text-xs text-neutral-500">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning-500">
              {displayedRecords.filter(r => r.status === 'at-risk').length}
            </div>
            <div className="text-xs text-neutral-500">At Risk</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-error">
              {displayedRecords.filter(r => r.status === 'non-compliant').length}
            </div>
            <div className="text-xs text-neutral-500">Non-Compliant</div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading compliance records...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-error">
                  Error loading compliance records. Please try again.
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
                  No compliance records found for the selected category.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.documentName}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="capitalize">{record.documentType}</TableCell>
                  <TableCell>{formatDate(record.expiryDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRiskBadge(record.risk)}
                      <span className="capitalize">{record.risk}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" className="mr-2">
          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Report
        </Button>
        <Button 
          size="sm" 
          onClick={async () => {
            try {
              const response = await fetch('/api/compliance/check', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
              }
              
              const result = await response.json();
              
              // Force refresh of compliance data by invalidating the query
              // This will trigger a refetch of the data from the server
              queryClient.invalidateQueries({ queryKey: ['/api/compliance'] });
              
              // Show success toast
              toast({
                title: "Compliance Check Complete",
                description: `${result.recordsChecked} records checked. ${result.recordsUpdated} records updated.`,
                variant: "default"
              });
            } catch (error) {
              // Show error toast
              toast({
                title: "Compliance Check Failed",
                description: "There was an error running the compliance check. Please try again.",
                variant: "destructive"
              });
            }
          }}
        >
          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Run Compliance Check
        </Button>
      </div>
    </div>
  );
};

export default ComplianceTracker;
