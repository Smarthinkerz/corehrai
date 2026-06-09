import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Globe, Send, Trash2, Languages } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Announcement } from '@shared/schema';

const LANGUAGES = [
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Chinese', label: 'Chinese (Mandarin)' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Polish', label: 'Polish' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Vietnamese', label: 'Vietnamese' },
];

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'policy', label: 'Policy Update' },
  { value: 'event', label: 'Company Event' },
  { value: 'benefit', label: 'Benefits' },
  { value: 'safety', label: 'Safety & Compliance' },
  { value: 'recognition', label: 'Recognition' },
];

const AnnouncementManager = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [viewingTranslation, setViewingTranslation] = useState<{ id: number; language: string } | null>(null);
  const { toast } = useToast();

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; priority: string }) => {
      const res = await apiRequest('POST', '/api/announcements', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setCategory('general');
      setPriority('normal');
      toast({ title: 'Announcement created', description: 'Your announcement has been created successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create announcement.', variant: 'destructive' });
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/announcements/${id}/publish`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: 'Published', description: 'Announcement has been published.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/announcements/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: 'Deleted', description: 'Announcement has been deleted.' });
    }
  });

  const translateMutation = useMutation({
    mutationFn: async ({ id, targetLanguage }: { id: number; targetLanguage: string }) => {
      setTranslatingId(id);
      const res = await apiRequest('POST', `/api/announcements/${id}/translate`, { targetLanguage });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setTranslatingId(null);
      setSelectedLanguage('');
      toast({ title: 'Translated', description: `Announcement translated to ${variables.targetLanguage}.` });
    },
    onError: () => {
      setTranslatingId(null);
      toast({ title: 'Error', description: 'Translation failed. Please try again.', variant: 'destructive' });
    }
  });

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({ title, content, category, priority });
  };

  const getTranslations = (announcement: Announcement): Record<string, { title: string; content: string; translatedAt: string }> => {
    return (announcement.translations as Record<string, any>) || {};
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'destructive';
      case 'urgent': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Multilingual Announcements</h2>
          <p className="text-sm text-neutral-500 mt-1">Create and translate employee communications across languages</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your announcement content..."
                className="min-h-[120px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending || !title.trim() || !content.trim()}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : 'Create Announcement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-600">No announcements yet</h3>
            <p className="text-sm text-neutral-400 mt-1">Create your first announcement to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const translations = getTranslations(announcement);
            const translationLanguages = Object.keys(translations);

            return (
              <Card key={announcement.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <Badge variant={priorityColor(announcement.priority)}>{announcement.priority}</Badge>
                        <Badge variant="outline">{announcement.category}</Badge>
                        {announcement.isPublished && (
                          <Badge variant="default" className="bg-green-600">Published</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">
                        Created {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!announcement.isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => publishMutation.mutate(announcement.id)}
                          disabled={publishMutation.isPending}
                        >
                          <Send className="h-3 w-3 mr-1" />Publish
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap mb-4">{announcement.content}</p>

                  {translationLanguages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-neutral-500 mb-2">Available Translations:</p>
                      <div className="flex flex-wrap gap-2">
                        {translationLanguages.map(lang => (
                          <Button
                            key={lang}
                            size="sm"
                            variant={viewingTranslation?.id === announcement.id && viewingTranslation?.language === lang ? "default" : "outline"}
                            onClick={() => {
                              if (viewingTranslation?.id === announcement.id && viewingTranslation?.language === lang) {
                                setViewingTranslation(null);
                              } else {
                                setViewingTranslation({ id: announcement.id, language: lang });
                              }
                            }}
                          >
                            <Languages className="h-3 w-3 mr-1" />{lang}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingTranslation?.id === announcement.id && translations[viewingTranslation.language] && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-blue-800">
                          {viewingTranslation.language} Translation
                        </h4>
                        <span className="text-xs text-blue-500">
                          Translated {new Date(translations[viewingTranslation.language].translatedAt).toLocaleString()}
                        </span>
                      </div>
                      <h5 className="font-medium text-blue-900 mb-1">{translations[viewingTranslation.language].title}</h5>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{translations[viewingTranslation.language].content}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select language..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.filter(l => !translationLanguages.includes(l.value)).map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedLanguage) {
                          translateMutation.mutate({ id: announcement.id, targetLanguage: selectedLanguage });
                        }
                      }}
                      disabled={!selectedLanguage || translatingId === announcement.id}
                    >
                      {translatingId === announcement.id ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Translating...</>
                      ) : (
                        <><Globe className="h-3 w-3 mr-1" />Translate</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
