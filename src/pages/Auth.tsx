import React, { useState } from "react";
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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const debug = componentDebug('Auth');

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
      toast({
        title: "Sign Up Successful",
        description: "Please check your email to confirm your account.",
      });
      // Optionally navigate to a page indicating email verification needed
      // navigate("/verify-email");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-grow items-center justify-center lg:grid lg:grid-cols-2 bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-8">
        <div className="hidden lg:flex flex-col items-center justify-center bg-white p-8 h-full shadow-inner rounded-l-lg">
          <div className="text-7xl font-extrabold text-center mb-10 tracking-tight leading-tight">
            <span className="text-gray-900">Certi</span><span className="text-indigo-600">Free</span>
          </div>
          <blockquote className="text-center text-2xl font-light italic text-gray-700 max-w-lg leading-relaxed">
            "Certifications don’t define you. They reveal what you’re willing to earn."
            <footer className="mt-6 text-xl font-normal text-gray-500">- Terd Imogen Inocentes BSCS</footer>
          </blockquote>
        </div>
        <div className="flex items-center justify-center p-4 lg:p-12">
          <Card className="w-full max-w-lg shadow-2xl rounded-xl border border-gray-200">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-4xl font-extrabold text-gray-900 mb-2">
                {activeTab === "login" ? "Welcome Back" : "Create Your Account"}
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 leading-snug">
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
                              <FormLabel className="text-base font-medium text-gray-700">Email address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="your.email@example.com"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                              <FormLabel className="text-base font-medium text-gray-700">Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <label htmlFor="remember-me" className="text-gray-700">Remember me</label>
                        </div>
                        <Button type="button" variant="link" className="text-base text-indigo-600 hover:text-indigo-800 font-medium p-0 h-auto">
                          Forgot password?
                        </Button>
                      </div>
                      <Button type="submit" className="w-full py-3 px-6 bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        Sign in
                      </Button>
                      <div className="relative flex justify-center text-sm uppercase font-semibold text-gray-500">
                        <span className="bg-white px-2">Or</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full py-3 px-6 border border-gray-300 rounded-lg text-gray-800 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
                              <FormLabel className="text-base font-medium text-gray-700">First Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                              <FormLabel className="text-base font-medium text-gray-700">Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Doe"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                              <FormLabel className="text-base font-medium text-gray-700">Email address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="john.doe@example.com"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                              <FormLabel className="text-base font-medium text-gray-700">Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                              <FormLabel className="text-base font-medium text-gray-700">Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  {...field}
                                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-sm text-red-600" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex items-start space-x-2 text-base mt-4">
                        <input
                          type="checkbox"
                          id="terms"
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-1"
                        />
                        <label htmlFor="terms" className="text-gray-700 leading-snug">
                          I agree to the <Button variant="link" className="inline p-0 h-auto text-indigo-600 hover:text-indigo-800 font-medium">Terms of Service</Button> and <Button variant="link" className="inline p-0 h-auto text-indigo-600 hover:text-indigo-800 font-medium">Privacy Policy</Button>
                        </label>
                      </div>
                      <Button type="submit" className="w-full py-3 px-6 bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        Create account
                      </Button>
                      <div className="relative flex justify-center text-sm uppercase font-semibold text-gray-500">
                        <span className="bg-white px-2">Or</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full py-3 px-6 border border-gray-300 rounded-lg text-gray-800 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
    </div>
  );
};

export default Auth; 