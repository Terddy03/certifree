import React, { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// 🔄 DATABASE INTEGRATION POINT
// Current: Using mock data from imported files
// Replace with: Custom hooks for user data
// Example: const { user, loading } = useAuth();
// Hook location: /hooks/useAuth.ts

const Dashboard = () => {
  const { user, profile, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] text-gray-300">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const userProfile = profile;

  return (
    <div className="min-h-screen bg-[#000814] text-gray-100">
      <Header />
      
      <main className="container mx-auto px-6 py-12 md:py-16">
        {/* Welcome Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 text-center sm:text-left">
            <Avatar className="h-24 w-24 border-4 border-[#003566] shadow-lg">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.fullName || 'User'} />
              <AvatarFallback className="bg-[#003566] text-[#ffd60a] text-3xl font-bold">{(userProfile.fullName || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight">
                Welcome back, <span className="text-[#ffd60a]">{(userProfile.fullName || 'User').split(' ')[0]}</span>!
              </h1>
              <p className="text-lg text-gray-400">
                Ready to continue your learning journey?
              </p>
            </div>
          </div>
        </div>

        {/* Certifications Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] p-6 hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardContent className="flex items-center gap-5 p-0">
              <div className="w-16 h-16 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                <Trophy className="h-8 w-8 text-[#ffc300]" />
              </div>
              <div>
                <p className="text-base text-gray-400 font-medium">Certifications Completed</p>
                <p className="text-4xl font-extrabold text-[#ffd60a] mt-1">
                  {userProfile.totalCertificationsCompleted || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for more dashboard cards */}
          <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] p-6 hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardContent className="flex items-center gap-5 p-0">
              <div className="w-16 h-16 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-[#ffc300]" />
              </div>
              <div>
                <p className="text-base text-gray-400 font-medium">Certifications In Progress</p>
                <p className="text-4xl font-extrabold text-[#ffd60a] mt-1">
                  0 
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] p-6 hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardContent className="flex items-center gap-5 p-0">
              <div className="w-16 h-16 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-[#ffc300]" />
              </div>
              <div>
                <p className="text-base text-gray-400 font-medium">Wishlist Items</p>
                <p className="text-4xl font-extrabold text-[#ffd60a] mt-1">
                  0 
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action: Browse all certifications */}
        <div className="text-center py-16 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
          <BookOpen className="h-16 w-16 text-[#003566] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">Explore All Free Certifications</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Dive into our extensive library and find the perfect certification to propel your career forward!
          </p>
          <Button asChild className="bg-[#ffc300] text-[#001d3d] font-bold px-8 py-3 rounded-full shadow-md hover:bg-[#ffd60a] transition-colors duration-200 text-lg">
            <Link to="/certifications">
              Browse Certifications <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;