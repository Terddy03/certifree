import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BookOpen, Heart, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { listUserCertiFreeEnrollments, listUserCertiFreeCertificates, getCertiFreeCertificatePublicUrl } from "@/lib/certifree-api";
import { CertiFreeEnrollment, CertiFreeCertificate } from "@/lib/types/certifree";

const Dashboard = () => {
  const { user, profile, loading, error } = useAuth();
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [favorites, setFavorites] = useState(0);
  const [certiFreeEnrollments, setCertiFreeEnrollments] = useState<CertiFreeEnrollment[]>([]);
  const [certiFreeCertificates, setCertiFreeCertificates] = useState<CertiFreeCertificate[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      
      // Fetch existing public certifications progress and favorites
      const [{ count: inProgPublic }, { count: compPublic }, { count: fav }] = await Promise.all([
        supabase.from("user_progress").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "in_progress"),
        supabase.from("user_progress").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "completed"),
        supabase.from("user_favorites").select("user_id", { count: "exact", head: true }).eq("user_id", profile.id),
      ]);

      // Fetch CertiFree enrollments and certificates
      const { data: certiFreeEnrollmentsData, error: enrollmentsError } = await listUserCertiFreeEnrollments(profile.id);
      if (enrollmentsError) console.error("Error fetching CertiFree enrollments:", enrollmentsError.message);
      setCertiFreeEnrollments(certiFreeEnrollmentsData || []);

      const { data: certiFreeCertificatesData, error: certificatesError } = await listUserCertiFreeCertificates(profile.id);
      if (certificatesError) console.error("Error fetching CertiFree certificates:", certificatesError.message);
      setCertiFreeCertificates(certiFreeCertificatesData || []);

      // Calculate combined progress and completed counts
      let totalInProgress = inProgPublic || 0;
      let totalCompleted = compPublic || 0;

      if (certiFreeEnrollmentsData) {
        certiFreeEnrollmentsData.forEach(enrollment => {
          if (enrollment.progress < 100) {
            totalInProgress++;
          } else {
            totalCompleted++;
          }
        });
      }

      setInProgress(totalInProgress);
      setCompleted(totalCompleted);
      setFavorites(fav || 0);
    })();
  }, [profile?.id]);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] p-6 hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardContent className="flex items-center gap-5 p-0">
              <div className="w-16 h-16 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                <Trophy className="h-8 w-8 text-[#ffc300]" />
              </div>
              <div>
                <p className="text-base text-gray-400 font-medium">Completed</p>
                <p className="text-4xl font-extrabold text-[#ffd60a] mt-1">{completed}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] p-6 hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardContent className="flex items-center gap-5 p-0">
              <div className="w-16 h-16 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-[#ffc300]" />
              </div>
              <div>
                <p className="text-base text-gray-400 font-medium">In Progress</p>
                <p className="text-4xl font-extrabold text-[#ffd60a] mt-1">{inProgress}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] p-6 hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardContent className="flex items-center gap-5 p-0">
              <div className="w-16 h-16 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-[#ffc300]" />
              </div>
              <div>
                <p className="text-base text-gray-400 font-medium">Favorites</p>
                <p className="text-4xl font-extrabold text-[#ffd60a] mt-1">{favorites}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CertiFree Courses in Progress */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Your CertiFree Courses</h2>
          {certiFreeEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certiFreeEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566]">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white">{enrollment.certifree_courses?.title || 'Unknown Course'}</CardTitle>
                    <p className="text-sm text-gray-400">Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-300">Progress:</p>
                      <span className="text-sm font-semibold text-[#ffd60a]">{enrollment.progress}%</span>
                    </div>
                    <div className="w-full bg-[#003566] rounded-full h-2.5">
                      <div className="bg-[#ffc300] h-2.5 rounded-full" style={{ width: `${enrollment.progress}%` }}></div>
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full mt-4 bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]"
                      onClick={() => navigate(`/courses/${enrollment.course_id}`)}
                    >
                      Continue Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
              <BookOpen className="h-12 w-12 text-[#003566] mx-auto mb-4" />
              <p className="text-base">You haven't enrolled in any CertiFree courses yet.</p>
              <Button asChild className="mt-4 bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]">
                <Link to="/courses">Browse CertiFree Courses</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Earned CertiFree Certificates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Your Earned Certificates</h2>
          {certiFreeCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certiFreeCertificates.map((cert) => (
                <Card key={cert.id} className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566]">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white">{cert.certifree_courses?.title || 'Unknown Certificate'}</CardTitle>
                    <p className="text-sm text-gray-400">Issued: {new Date(cert.generated_at).toLocaleDateString()}</p>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline"
                      className="w-full mt-2 bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]"
                      onClick={() => window.open(getCertiFreeCertificatePublicUrl(cert.storage_path), '_blank')}
                    >
                      View Certificate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
              <Trophy className="h-12 w-12 text-[#003566] mx-auto mb-4" />
              <p className="text-base">You haven't earned any CertiFree certificates yet.</p>
              <Button asChild className="mt-4 bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]">
                <Link to="/courses">Start a CertiFree Course</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Original CTA - now for public certs if needed or can be removed */}
        <div className="text-center py-16 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
          <BookOpen className="h-16 w-16 text-[#003566] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">Explore All Certifications</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Discover more certifications to propel your career forward!
          </p>
          <Button asChild className="bg-[#ffc300] text-[#001d3d] font-bold px-8 py-3 rounded-full shadow-md hover:bg-[#ffd60a] transition-colors duration-200 text-lg">
            <Link to="/certifications">
              Browse All Certifications <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;