
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, Building2, Mail, AlertCircle, CheckCircle, RefreshCw, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { signUp, signIn, signOut, error, clearError, loading, user, profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [setupTimeout, setSetupTimeout] = useState(false);

  // Handle setup timeout
  useEffect(() => {
    if (user && !profile && !error) {
      const timeout = setTimeout(() => {
        setSetupTimeout(true);
      }, 15000); // Extended to 15 seconds for email confirmation

      return () => clearTimeout(timeout);
    } else {
      setSetupTimeout(false);
    }
  }, [user, profile, error]);

  // Handle account setup states
  if (user && !profile && !error && !setupTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-600">
        <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
            <p className="text-gray-600">Please wait while we prepare your dashboard.</p>
            <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle setup timeout or account issues
  if (user && (!profile || setupTimeout) && (error || setupTimeout)) {
    const isEmailUnconfirmed = error?.includes('check your email') || error?.includes('confirmation link');
    const isUnauthorized = error?.includes('not authorized') || error?.includes('contact an administrator');
    const isIncomplete = error?.includes('setup incomplete') || setupTimeout;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-600">
        <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            {isEmailUnconfirmed ? (
              <>
                <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-blue-600">
                  Please Confirm Your Email
                </h2>
                <p className="text-gray-600 mb-4">
                  We've sent a confirmation link to your email address. Please check your email and click the link to complete your registration.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      clearError();
                      refreshProfile();
                    }} 
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    I've Confirmed My Email
                  </Button>
                  <Button 
                    onClick={async () => {
                      await signOut();
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Back to Login
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-700">Email not received?</p>
                  </div>
                  <p className="text-sm text-amber-600">
                    Check your spam folder or contact support if you don't receive the confirmation email within a few minutes.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-amber-600">
                  {isUnauthorized ? 'Account Not Authorized' : 'Account Setup Issue'}
                </h2>
                <p className="text-gray-600 mb-4">
                  {isUnauthorized 
                    ? 'Your account is not authorized to access this system. Please contact an administrator to get invited to the team.'
                    : isIncomplete
                    ? 'Your account setup is incomplete. You may need a proper invitation from an administrator.'
                    : 'There was an issue setting up your account.'
                  }
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      clearError();
                      refreshProfile();
                    }} 
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button 
                    onClick={async () => {
                      await signOut();
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Back to Login
                  </Button>
                </div>
                {isUnauthorized && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-700">Need access?</p>
                    </div>
                    <p className="text-sm text-blue-600">
                      Contact your system administrator to send you an invitation to join the team. 
                      You must be invited by a director to access this system.
                    </p>
                    <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                      <p className="text-xs text-amber-700">
                        <strong>Note:</strong> If you're the first user of this system, make sure you've confirmed your email address first.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Clear errors when switching tabs or changing input
  const handleClearErrors = () => {
    setLocalError('');
    setMessage('');
    clearError();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearErrors();
    
    if (!email || !password || !fullName) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setLocalLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setLocalError('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('weak password')) {
          setLocalError('Password is too weak. Please choose a stronger password.');
        } else {
          setLocalError(error.message);
        }
      } else {
        setMessage('🎉 Account created successfully! Please check your email for a confirmation link to complete your registration.');
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (error: any) {
      setLocalError(error.message || 'An unexpected error occurred');
    }
    
    setLocalLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearErrors();
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    setLocalLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLocalError('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          setLocalError('Please check your email and click the confirmation link before signing in.');
        } else {
          setLocalError(error.message);
        }
      }
    } catch (error: any) {
      setLocalError(error.message || 'An unexpected error occurred');
    }
    
    setLocalLoading(false);
  };

  const displayError = error || localError;
  const isLoading = loading || localLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-6">
          {/* Petrol Station Logo and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
                <Fuel className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">HIPEMART OILS</h1>
            <p className="text-lg text-orange-600 font-semibold">BUKHALIHA ROAD, BUSIA</p>
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Multi-Department POS System
          </CardTitle>
          <p className="text-gray-600 mt-2">Fuel • Supermarket • Restaurant</p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full" onValueChange={handleClearErrors}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleClearErrors();
                    }}
                    placeholder="Enter your email"
                    className="border-2 border-orange-200 focus:border-orange-500"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleClearErrors();
                    }}
                    placeholder="Enter your password"
                    className="border-2 border-orange-200 focus:border-orange-500"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      handleClearErrors();
                    }}
                    placeholder="Enter your full name"
                    className="border-2 border-orange-200 focus:border-orange-500"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleClearErrors();
                    }}
                    placeholder="Enter your email"
                    className="border-2 border-orange-200 focus:border-orange-500"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleClearErrors();
                    }}
                    placeholder="Create a password (min 6 characters)"
                    className="border-2 border-orange-200 focus:border-orange-500"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
              
              <div className="text-xs text-gray-500 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Email confirmation required</span>
                </div>
                <p>After signup, check your email to confirm your account. First user becomes director automatically.</p>
              </div>
            </TabsContent>
          </Tabs>

          {displayError && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-600">{displayError}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="border-green-200 bg-green-50 mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-600">{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        {/* Powered by footer */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Powered by <span className="font-semibold text-orange-600">DATACOLLECTORS LTD</span><br />
          <span className="text-gray-500">0701634653</span>
        </div>
      </Card>
    </div>
  );
};
