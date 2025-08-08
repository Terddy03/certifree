import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Clock, Users, ExternalLink, BookOpen, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Certification } from "@/lib/mock-data/certifications";
import { componentDebug } from "@/lib/debugger";
import { useAuth } from "@/hooks/useAuth";
import { isTaking, startTaking, stopTaking } from "@/lib/progress";
import { useToast } from "@/components/ui/use-toast";

const CertificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debug = componentDebug('CertificationDetail');
  const { profile } = useAuth();
  const { toast } = useToast();
  const [taking, setTaking] = useState(false);
  const [takersCount, setTakersCount] = useState(0);

  useEffect(() => {
    const fetchCertification = async () => {
      if (!id) {
        setError("Certification ID is missing.");
        setLoading(false);
        return;
      }
      debug.log(`Fetching certification with ID: ${id}`);
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          debug.error("Error fetching certification details", { error: error.message });
          setError(error.message);
        } else if (data) {
          // Transform data from snake_case to camelCase (similar to useCertifications)
          const transformedData: Certification = {
            id: data.id,
            title: data.title,
            provider: data.provider,
            category: data.category,
            difficulty: data.difficulty,
            duration: data.duration,
            rating: data.rating || 0,
            totalReviews: data.total_reviews || 0,
            description: data.description,
            skills: data.skills || [],
            prerequisites: data.prerequisites || [],
            imageUrl: data.image_url || '/api/placeholder/400/240',
            externalUrl: data.external_url || '#',
            isFree: data.is_free || true,
            certificationType: data.certification_type || 'Course',
            careerImpact: data.career_impact || 5,
            completionCount: data.completion_count || 0,
            tags: data.tags || [],
            lastUpdated: data.last_updated || new Date().toISOString().split('T')[0]
          };
          debug.log("Certification fetched successfully", { id, data: transformedData });
          setCertification(transformedData);
        } else {
          setError("Certification not found.");
        }
      } catch (err: any) {
        debug.error("Unhandled error fetching certification", { error: err.message, stack: err.stack });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertification();
  }, [id]);

  // Load taking state and count
  useEffect(() => {
    (async () => {
      if (!id) return;
      const { count } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('certification_id', id)
        .eq('status', 'in_progress');
      setTakersCount(count || 0);
      if (profile?.id) {
        const { data } = await isTaking(profile.id, id);
        setTaking(!!data);
      }
    })();
  }, [id, profile?.id]);

  const onToggleTaking = async () => {
    if (!profile?.id) return toast({ title: 'Please sign in to track progress.' });
    const next = !taking;
    setTaking(next);
    setTakersCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const { error } = next ? await startTaking(profile.id, id!) : await stopTaking(profile.id, id!);
    if (error) {
      setTaking(!next);
      setTakersCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast({ title: 'Could not update', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] text-gray-300">
        <p>Loading certification details...</p>
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

  if (!certification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#000814] text-gray-300 p-4">
        <BookOpen className="h-16 w-16 text-[#003566] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Certification Not Found</h2>
        <p className="text-center text-gray-400 mb-4">The certification you are looking for does not exist or may have been removed.</p>
        <Button asChild className="bg-[#ffc300] text-[#001d3d] font-bold px-6 py-2 rounded-full shadow-md hover:bg-[#ffd60a] transition-colors duration-200">
          <Link to="/certifications">Browse All Certifications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000814] text-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-12 md:py-16">
        <div className="mb-8">
          <Button variant="link" className="pl-0 text-gray-300 hover:text[#ffd60a] transition-colors duration-200" asChild>
            <Link to="/certifications">&larr; Back to Certifications</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566]">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6 mb-8">
                  {certification.imageUrl?.toLowerCase().endsWith('.pdf') ? (
                    <a href={certification.imageUrl} target="_blank" rel="noopener noreferrer" className="w-32 h-20 flex items-center justify-center rounded-lg flex-shrink-0 shadow-md bg-[#003566] text-xs text-gray-200">View PDF</a>
                  ) : (
                    <img 
                      src={certification.imageUrl} 
                      alt={certification.title}
                      className="w-32 h-20 object-cover rounded-lg flex-shrink-0 shadow-md"
                    />
                  )}
                  <div className="text-center sm:text-left">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight">{certification.title}</h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-gray-400">
                      <Badge className="bg[#003566] text-gray-200 text-xs font-semibold px-3 py-1 rounded-full">
                        {certification.provider}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-base text-gray-300 mb-4 leading-relaxed">{certification.description}</p>
                <div className="flex items-center gap-3 mb-6">
                  <Button variant="outline" onClick={onToggleTaking} className={`${taking ? 'border-green-600 text-green-400' : 'border-[#003566] text-gray-300'} bg-[#001d3d] hover:bg-[#003566]`}>
                    {taking ? "I'm taking this" : "I am taking this cert"}
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span>{takersCount.toLocaleString()}</span>
                  </div>
                </div>
                
                <Separator className="my-8 bg-[#003566]" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base text-gray-300">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>Estimated Time: <span className="font-semibold">{certification.duration}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm bg-[#003566] text-gray-200 border-[#001d3d] font-medium">
                      Type: {certification.certificationType}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-8 bg-[#003566]" />

                <h2 className="text-2xl font-bold text-white mb-5">Skills You'll Gain</h2>
                <div className="flex flex-wrap gap-3 mb-6">
                  {(certification.skills || []).map((skill) => (
                    <Badge key={skill} className="bg-[#003566] text-gray-200 text-sm font-medium px-4 py-1.5 rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {certification.prerequisites && certification.prerequisites.length > 0 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-5">Prerequisites</h2>
                    <ul className="list-disc list-inside text-gray-400 space-y-2 mb-6 pl-5">
                      {(certification.prerequisites || []).map((prereq, index) => (
                        <li key={index}>{prereq}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button asChild className="flex-1 bg-[#ffc300] text-[#001d3d] font-bold py-3 px-6 rounded-full shadow-md hover:bg-[#ffd60a] transition-colors duration-200 text-lg">
                    <a href={certification.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                      Start Certification on {certification.provider}
                      <ExternalLink className="ml-3 h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="outline" onClick={onToggleTaking} className={`${taking ? 'border-green-600 text-green-400' : 'border-[#003566] text-gray-300'} bg-[#001d3d] hover:bg-[#003566]`}> 
                    {taking ? "I'm taking this" : "I am taking this cert"}
                  </Button>
                  <Button variant="outline" className="border-[#003566] text-gray-300 bg-[#001d3d] hover:bg-[#003566]" onClick={async () => {
                    if (!profile?.id) return toast({ title: 'Please sign in to mark completed.' });
                    // Mark as completed by upserting a completed row
                    const { error } = await supabase.from('user_progress').upsert({ user_id: profile.id, certification_id: certification.id, status: 'completed', completed_at: new Date().toISOString() }, { onConflict: 'user_id,certification_id' });
                    if (error) toast({ title: 'Could not mark completed', description: error.message, variant: 'destructive' });
                    else toast({ title: 'Marked as completed' });
                  }}>Mark Completed</Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section (placeholder for now) */}
            <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566]">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-bold text-white">User Reviews</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-gray-400">No reviews yet. Be the first to review this certification!</p>
                {/* Future: Display actual reviews from the database here */}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Related Info (placeholder for now) */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566]">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-bold text-white">Related Certifications</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-gray-400">Coming soon: Dynamically suggested related certifications.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CertificationDetail; 