
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    database: 'success' | 'error' | 'pending';
    edgeFunction: 'success' | 'error' | 'pending';
    auth: 'success' | 'error' | 'pending';
    details: string[];
  }>({
    database: 'pending',
    edgeFunction: 'pending',
    auth: 'pending',
    details: []
  });

  const runConnectionTests = async () => {
    setTesting(true);
    const details: string[] = [];
    
    // Test 1: Database connection
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        setResults(prev => ({ ...prev, database: 'error' }));
        details.push(`Database Error: ${error.message}`);
      } else {
        setResults(prev => ({ ...prev, database: 'success' }));
        details.push('Database connection: OK');
      }
    } catch (err: any) {
      setResults(prev => ({ ...prev, database: 'error' }));
      details.push(`Database Exception: ${err.message}`);
    }

    // Test 2: Auth session
    try {
      console.log('Testing auth session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setResults(prev => ({ ...prev, auth: 'error' }));
        details.push(`Auth Error: ${error.message}`);
      } else if (!session) {
        setResults(prev => ({ ...prev, auth: 'error' }));
        details.push('Auth Error: No active session');
      } else {
        setResults(prev => ({ ...prev, auth: 'success' }));
        details.push(`Auth session: OK (${session.user.email})`);
      }
    } catch (err: any) {
      setResults(prev => ({ ...prev, auth: 'error' }));
      details.push(`Auth Exception: ${err.message}`);
    }

    // Test 3: Edge Function connection (simple test)
    try {
      console.log('Testing edge function connectivity...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Test with minimal payload to see if function is reachable
        const response = await supabase.functions.invoke('create-team-account', {
          body: { test: true },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // We expect an error here (missing fields), but if we get one, it means the function is reachable
        if (response.error && response.error.message?.includes('Missing required fields')) {
          setResults(prev => ({ ...prev, edgeFunction: 'success' }));
          details.push('Edge Function: Reachable (validation working)');
        } else if (response.error) {
          setResults(prev => ({ ...prev, edgeFunction: 'error' }));
          details.push(`Edge Function Error: ${response.error.message}`);
        } else {
          setResults(prev => ({ ...prev, edgeFunction: 'success' }));
          details.push('Edge Function: Reachable');
        }
      } else {
        setResults(prev => ({ ...prev, edgeFunction: 'error' }));
        details.push('Edge Function: Cannot test without auth session');
      }
    } catch (err: any) {
      setResults(prev => ({ ...prev, edgeFunction: 'error' }));
      details.push(`Edge Function Exception: ${err.message}`);
    }

    setResults(prev => ({ ...prev, details }));
    setTesting(false);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connection Diagnostics
          <Button 
            onClick={runConnectionTests} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {getStatusIcon(results.database)}
            <span>Database Connection</span>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(results.auth)}
            <span>Authentication Session</span>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(results.edgeFunction)}
            <span>Edge Function Connectivity</span>
          </div>
        </div>
        
        {results.details.length > 0 && (
          <Alert className="mt-4">
            <AlertDescription>
              <div className="space-y-1">
                {results.details.map((detail, index) => (
                  <div key={index} className="text-sm font-mono">
                    {detail}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
