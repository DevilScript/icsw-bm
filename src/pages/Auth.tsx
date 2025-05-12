
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { Loader2 } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState<boolean>(false);
  const { signIn, signUp, signInWithDiscord, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
    
    // Check if there's a tab parameter in the URL
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'register') {
      setActiveTab('register');
    }
  }, [user, navigate, location]);

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      navigate("/");
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.username);
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
      });
      setActiveTab("login");
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Discord login with popup
  const handleDiscordLogin = async () => {
    setIsDiscordLoading(true);
    try {
      await signInWithDiscord();
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsDiscordLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-glass-dark">
      <Card className="w-full max-w-md border border-pink-300/20 bg-glass-dark/60 backdrop-blur-md shadow-lg shadow-pink-500/10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-white">Welcome</CardTitle>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-glass-dark/40 backdrop-blur-sm border border-pink-300/20 mb-6">
            <TabsTrigger value="login" className="data-[state=active]:bg-pink-500/80 data-[state=active]:text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-pink-500/80 data-[state=active]:text-white">
              Register
            </TabsTrigger>
          </TabsList>
          
          <CardContent>
            <TabsContent value="login" className="mt-0 space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email" 
                            {...field} 
                            className="bg-glass-dark/40 border-glass-light/20 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            {...field} 
                            className="bg-glass-dark/40 border-glass-light/20 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-pink-500 hover:bg-pink-600 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  
                  <div className="text-center mt-2">
                    <p className="text-sm text-glass-light">
                      No account yet? <span 
                        className="text-pink-400 hover:text-pink-300 cursor-pointer underline"
                        onClick={() => setActiveTab("register")}
                      >
                        Register
                      </span>
                    </p>
                  </div>
                </form>
              </Form>
              
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-glass-light/20"></div>
                </div>
                <div className="relative px-4 text-sm bg-glass-dark text-glass-light">Or</div>
              </div>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full border-indigo-600 bg-indigo-500/20 hover:bg-indigo-500/40 hover:scale-105 text-white rounded-md py-2 transition-all shadow-md shadow-indigo-500/20"
                onClick={handleDiscordLogin}
                disabled={isDiscordLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  {isDiscordLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#5865F2">
                      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"></path>
                    </svg>
                  )}
                  <span>Sign in with Discord</span>
                </div>
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0 space-y-4">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            className="bg-glass-dark/40 border-glass-light/20 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email" 
                            {...field} 
                            className="bg-glass-dark/40 border-glass-light/20 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            {...field} 
                            className="bg-glass-dark/40 border-glass-light/20 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your password" 
                            {...field} 
                            className="bg-glass-dark/40 border-glass-light/20 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-pink-500 hover:bg-pink-600 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                  
                  <div className="text-center mt-2">
                    <p className="text-sm text-glass-light">
                      Already have an account? <span 
                        className="text-pink-400 hover:text-pink-300 cursor-pointer underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Login
                      </span>
                    </p>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex justify-center pt-2 pb-4">
          <p className="text-xs text-glass-light">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
