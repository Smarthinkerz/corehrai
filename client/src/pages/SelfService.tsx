import usePageTitle from "@/hooks/usePageTitle";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, User, Calendar, FileText, Plus, Check, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { LeaveRequest, Document as DocType } from '@shared/schema';

const LEAVE_TYPES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Day' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'parental', label: 'Parental Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const SelfService = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: '', email: '', department: '' });

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ['/api/self-service/profile'],
  });

  const { data: leaveRequests = [], isLoading: leaveLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/self-service/leave-requests'],
  });

  const { data: allLeaveRequests = [] } = useQuery<(LeaveRequest & { employeeName: string })[]>({
    queryKey: ['/api/self-service/leave-requests/all'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  const { data: documents = [] } = useQuery<DocType[]>({
    queryKey: ['/api/self-service/my-documents'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', '/api/self-service/profile', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/self-service/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setEditingProfile(false);
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/self-service/leave-requests', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/self-service/leave-requests'] });
      setIsLeaveOpen(false);
      setLeaveType('vacation');
      setStartDate('');
      setEndDate('');
      setReason('');
      toast({ title: 'Request submitted', description: 'Your leave request has been sent for approval.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit leave request.', variant: 'destructive' });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/self-service/leave-requests/${id}/review`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/self-service/leave-requests/all'] });
      toast({ title: 'Updated', description: 'Leave request has been reviewed.' });
    },
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/self-service/leave-requests/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/self-service/leave-requests'] });
      toast({ title: 'Cancelled', description: 'Leave request has been cancelled.' });
    },
  });

  const startEditProfile = () => {
    if (profile) {
      setProfileData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        department: profile.department || '',
      });
      setEditingProfile(true);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const pendingReviews = allLeaveRequests.filter(r => r.status === 'pending');

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Self-Service Portal</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your profile, leave requests, and documents</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5"><Calendar className="h-4 w-4" />Leave Requests</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-4 w-4" />Documents</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="review" className="gap-1.5">
              Review Requests
              {pendingReviews.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingReviews.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Profile</CardTitle>
                {!editingProfile && (
                  <Button size="sm" variant="outline" onClick={startEditProfile}>Edit Profile</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Full Name</label>
                    <Input
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(p => ({ ...p, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Email</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Department</label>
                    <Input
                      value={profileData.department}
                      onChange={(e) => setProfileData(p => ({ ...p, department: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateProfileMutation.mutate(profileData)} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-neutral-500">Full Name</p>
                      <p className="text-sm font-medium">{profile?.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Username</p>
                      <p className="text-sm font-medium">{profile?.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Email</p>
                      <p className="text-sm font-medium">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-neutral-500">Department</p>
                      <p className="text-sm font-medium">{profile?.department || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Role</p>
                      <Badge variant="outline" className="capitalize">{profile?.role}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Status</p>
                      <Badge variant={profile?.isActive ? 'default' : 'secondary'}>
                        {profile?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Leave Requests</h3>
            <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Request Leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Leave Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                  <Textarea
                    placeholder="Reason (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={() => createLeaveMutation.mutate({ type: leaveType, startDate, endDate, reason })}
                    disabled={createLeaveMutation.isPending || !startDate || !endDate}
                  >
                    {createLeaveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {leaveLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : leaveRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-neutral-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                <p>No leave requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="capitalize font-medium">{req.type}</TableCell>
                        <TableCell className="text-sm">{new Date(req.startDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{new Date(req.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[req.status] || ''}>{req.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-500 max-w-[200px] truncate">{req.reason || '-'}</TableCell>
                        <TableCell>
                          {req.status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => cancelLeaveMutation.mutate(req.id)}>
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <h3 className="text-lg font-semibold mb-4">My Documents</h3>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-neutral-400">
                <FileText className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                <p>No documents available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-8 w-8 text-blue-500 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{doc.category}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="review" className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Leave Request Reviews</h3>
            {allLeaveRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-neutral-400">
                  No leave requests to review
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLeaveRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.employeeName}</TableCell>
                          <TableCell className="capitalize">{req.type}</TableCell>
                          <TableCell className="text-sm">{new Date(req.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{new Date(req.endDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm text-neutral-500 max-w-[150px] truncate">{req.reason || '-'}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[req.status] || ''}>{req.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {req.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-green-600 hover:text-green-700"
                                  onClick={() => reviewMutation.mutate({ id: req.id, status: 'approved' })}
                                >
                                  <Check className="h-3 w-3 mr-1" />Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-red-600 hover:text-red-700"
                                  onClick={() => reviewMutation.mutate({ id: req.id, status: 'rejected' })}
                                >
                                  <X className="h-3 w-3 mr-1" />Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SelfService;
