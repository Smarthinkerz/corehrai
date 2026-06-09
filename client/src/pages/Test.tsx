import usePageTitle from "@/hooks/usePageTitle";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Test = () => {
  const [apiHealth, setApiHealth] = useState('Unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkApiHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setApiHealth(data.status);
    } catch (err) {
      setApiHealth('Failed');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">System Test</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div>
              <span className="font-medium">API Health Status: </span>
              <span className={`${apiHealth === 'ok' ? 'text-green-500' : 'text-red-500'} font-bold`}>
                {apiHealth}
              </span>
            </div>
            
            {error && (
              <div className="text-red-500 mt-2">
                Error: {error}
              </div>
            )}
            
            <Button 
              onClick={checkApiHealth} 
              disabled={loading}
              className="mt-2"
            >
              {loading ? 'Checking...' : 'Check API Health'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Server Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><span className="font-medium">Server Port:</span> 5000</li>
              <li><span className="font-medium">API Endpoint:</span> /api/health</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>OpenAI API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              Test if the OpenAI integration is working by sending a simple chat message.
            </p>
            <Button 
              onClick={async () => {
                try {
                  setLoading(true);
                  const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message: 'Hello! Please provide a one-sentence response for testing.'
                    }),
                  });
                  const data = await response.json();
                  alert('OpenAI API Test: ' + (data.choices?.[0]?.message?.content || 'Success! See console for details'));
                } catch (err) {
                  alert('OpenAI test failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Test OpenAI API
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Test;