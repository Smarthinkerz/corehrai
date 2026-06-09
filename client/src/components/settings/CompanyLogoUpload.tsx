import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const CompanyLogoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current logo
  const { data: logo, isLoading: isLoadingLogo } = useQuery({
    queryKey: ['/api/settings/logo'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/logo');
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Logo updated successfully',
        description: 'Your company logo has been updated',
      });
      // Invalidate the logo query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/settings/logo'] });
      // Reset the file state
      setFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: 'Error updating logo',
        description: `Failed to update logo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or SVG file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 2MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);
    uploadMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Company Logo</CardTitle>
        <CardDescription>
          Upload your company logo to customize the appearance of your HR platform.
          Supported formats: JPG, PNG, SVG. Maximum size: 2MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg p-8 bg-neutral-50">
          {isLoadingLogo ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
              <p className="text-neutral-500">Loading current logo...</p>
            </div>
          ) : previewUrl || logo ? (
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 flex items-center justify-center overflow-hidden mb-4">
                <img 
                  src={previewUrl || logo || ''}
                  alt="Company logo" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-neutral-600 mb-4">
                {previewUrl ? 'Preview of new logo' : 'Current logo'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="h-20 w-20 bg-neutral-200 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-10 w-10 text-neutral-400" />
              </div>
              <p className="text-neutral-500">No logo uploaded yet</p>
            </div>
          )}
          
          <div className="mt-4 w-full max-w-md">
            <label className="block w-full">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                Select Logo
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {previewUrl && (
          <Button 
            variant="ghost"
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
            }}
          >
            Cancel
          </Button>
        )}
        <Button 
          disabled={!file || uploadMutation.isPending} 
          onClick={handleUpload}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Logo'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompanyLogoUpload;