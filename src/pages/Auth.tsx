import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { componentDebug } from "@/lib/debugger";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  terms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.terms === true, {
  message: "You must agree to the Terms and Privacy Policy",
  path: ["terms"],
});

const Auth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const debug = componentDebug('Auth');
  // Resend verification cooldown state
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (values: z.infer<typeof signupSchema>) => {
    debug.log('Attempting signup', { email: values.email, passwordProvided: !!values.password });
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: `${values.firstName} ${values.lastName}`,
          // You can add full_name and avatar_url here if you want to initialize them on signup
          // full_name: "New User", 
          // avatar_url: ""
        }
      }
    });

    if (error) {
      debug.error('Signup failed', { error: error.message, details: error });
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      debug.log('Signup successful', { user: data.user.id });
      // If email confirmations are disabled, Supabase returns a session directly
      if (data.session) {
        toast({
          title: "Account created",
          description: "You are now signed in.",
        });
        navigate("/dashboard");
        return;
      }
      // Fallback when confirmations are enabled
      toast({
        title: "Sign Up Successful",
        description: "Please check your email to confirm your account.",
      });
      // Optionally navigate to a page indicating email verification needed
      // navigate("/verify-email");
    }
  };

  // Handle resend verification email with cooldown
  const handleResendVerification = async () => {
    const email = signupForm.getValues('email');
    if (!email) {
      toast({ title: "Enter your email first", description: "Type your email in the form, then tap Resend.", variant: "destructive" });
      return;
    }
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin + '/dashboard' }
      });
      if (error) throw error;
      toast({ title: "Verification sent", description: `We sent a new link to ${email}.` });
      setResendCooldown(60);
    } catch (err: any) {
      toast({ title: "Could not resend", description: err?.message ?? 'Please try again later.', variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  // Countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  return (
    <div className="min-h-screen bg-[#000814] text-gray-100 flex flex-col">
      <Header />
      <main className="container mx-auto px-6 py-12 md:py-16 relative">
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at top left, #001d3d 0%, transparent 50%), radial-gradient(ellipse at bottom right, #003566 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="hidden lg:flex lg:col-span-6 flex-col items-start justify-center space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              <span className="text-white">Certi</span>
              <span className="text-[#ffd60a]">Free</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-xl">
              Forge your future, <span className="text-[#ffd60a]">certification by certification.</span>
            </p>
            <blockquote className="text-lg text-gray-400 italic max-w-xl">
              "Certifications are not the goal. What you become by achieving them is."
              <footer className="mt-2 text-sm not-italic text-gray-500">— Terd Inocentes</footer>
            </blockquote>
          </div>
          <div className="flex items-center justify-center p-4 lg:p-12 lg:col-span-6">
            <Card className="w-full max-w-lg bg-[#001d3d] border-[#003566] text-white shadow-xl rounded-xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-4xl font-extrabold text-white mb-2">
                {activeTab === "login" ? "Welcome Back" : "Create Your Account"}
                </CardTitle>
                <CardDescription className="text-lg text-gray-300 leading-snug">
                {activeTab === "login" ? "Let's get you back to learning" : "Join CertiFree and start showcasing your skills"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs value={activeTab} onValueChange={(value) => {
                  console.log("Changing tab to:", value);
                  setActiveTab(value);
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sr-only">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="mt-0">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                        <div className="grid gap-3">
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">Email address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="your.email@example.com"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-3">
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="remember-me"
                              className="h-4 w-4 rounded border-[#003566] bg-[#001d3d] focus:ring-[#ffd60a]"
                            />
                            <label htmlFor="remember-me" className="text-gray-300">Remember me</label>
                          </div>
                          <Button type="button" variant="link" className="text-base text-[#ffd60a] hover:text-[#ffc300] font-medium p-0 h-auto">
                            Forgot password?
                          </Button>
                        </div>
                        <Button type="submit" className="w-full py-3 px-6 bg-[#ffc300] text-[#001d3d] font-bold rounded-lg shadow-md hover:bg-[#ffd60a] focus:outline-none focus:ring-2 focus:ring-[#ffd60a] transition-colors">
                          Sign in
                        </Button>
                        <div className="relative flex justify-center text-sm uppercase font-semibold text-gray-400">
                          <span className="bg-[#001d3d] px-2">Or</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full py-3 px-6 border-2 border-[#003566] rounded-lg text-white font-semibold bg-[#001d3d] hover:bg-[#003566] focus:outline-none focus:ring-2 focus:ring-[#ffd60a] transition-colors"
                          onClick={() => setActiveTab("signup")}
                        >
                          Create an account <span className="ml-2 text-lg">&rarr;</span>
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  <TabsContent value="signup" className="mt-0">
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={signupForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={signupForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Doe"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-3">
                          <FormField
                            control={signupForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">Email address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="john.doe@example.com"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-3">
                          <FormField
                            control={signupForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-3">
                          <FormField
                            control={signupForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium text-gray-300">Confirm Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                    className="h-12 text-base px-4 bg-[#000814] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
                                  />
                                </FormControl>
                                <FormMessage className="text-sm text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-start space-x-2 text-base mt-4">
                          <FormField
                            control={signupForm.control}
                            name="terms"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    id="terms"
                                    className="h-4 w-4 rounded border-[#003566] bg-[#001d3d] focus:ring-[#ffd60a] mt-1"
                                    checked={!!field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                  />
                                </FormControl>
                                <div className="flex-1">
                                  <label htmlFor="terms" className="text-gray-300 leading-snug">
                                    I agree to the <Button variant="link" className="inline p-0 h-auto text-[#ffd60a] hover:text-[#ffc300] font-medium">Terms of Service</Button> and <Button variant="link" className="inline p-0 h-auto text-[#ffd60a] hover:text-[#ffc300] font-medium">Privacy Policy</Button>
                                  </label>
                                  <FormMessage className="text-sm text-red-600" />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="w-full py-3 px-6 bg-[#ffc300] text-[#001d3d] font-bold rounded-lg shadow-md hover:bg-[#ffd60a] focus:outline-none focus:ring-2 focus:ring-[#ffd60a] transition-colors">
                          Create account
                        </Button>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Didn't get the email?</span>
                          <Button type="button" variant="link" className="p-0 h-auto text-[#ffd60a] hover:text-[#ffc300] font-medium"
                            onClick={handleResendVerification}
                            disabled={isResending || resendCooldown > 0}
                          >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification'}
                          </Button>
                        </div>
                        <div className="relative flex justify-center text-sm uppercase font-semibold text-gray-400">
                          <span className="bg-[#001d3d] px-2">Or</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full py-3 px-6 border-2 border-[#003566] rounded-lg text-white font-semibold bg-[#001d3d] hover:bg-[#003566] focus:outline-none focus:ring-2 focus:ring-[#ffd60a] transition-colors"
                          onClick={() => setActiveTab("login")}
                        >
                          Sign in instead <span className="ml-2 text-lg">&rarr;</span>
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth; 