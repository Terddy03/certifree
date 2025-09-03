import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ChevronRight, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ReviewCard } from "@/components/ReviewCard"; // This import path remains as before
import { useAuth } from "@/hooks/useAuth";
import {
  isTaking,
  startTaking,
  stopTaking,
  UserProgressRow,
} from "@/lib/progress";
import {
  getCertification,
  checkFavoriteStatus,
  addFavorite,
  removeFavorite,
} from "@/lib/certifree-api"; // Corrected import
import { Certification } from "@/lib/types/certifree"; // Corrected import path for Certification

export default function CertificationDetail() { // Changed function name to match file
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [certification, setCertification] = useState<Certification | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTakingStatus, setUserTakingStatus] = useState<boolean | null>(
    null
  );
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5); // Default rating
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchCertification = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await getCertification(id); // Corrected function call

        if (error) {
          throw error;
        }

        if (data) {
          setCertification(data as Certification); // Cast directly to Certification
        } else {
          setError("Certification not found");
        }
      } catch (err: any) {
        console.error("Error fetching certification:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertification();
  }, [id]);

  useEffect(() => {
    const checkUserTakingStatus = async () => {
      if (user && certification) {
        const { data, error } = await isTaking(user.id, certification.id);
        if (error) {
          console.error("Error checking user taking status:", error.message);
          setUserTakingStatus(false);
        } else {
          setUserTakingStatus(data);
        }
      }
    };
    checkUserTakingStatus();
  }, [user, certification]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (user && certification) {
        const { data, error } = await checkFavoriteStatus(user.id, certification.id);
        if (error) {
          console.error("Error checking favorite status:", error.message);
          setIsFavorite(false);
        } else {
          setIsFavorite(data);
        }
      }
    };
    checkFavorite();
  }, [user, certification]);

  const handleToggleFavorite = async () => {
    if (!user || !certification) {
      toast.error("Please log in to manage favorites.");
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const { error } = await removeFavorite(user.id, certification.id);
        if (error) throw error;
        setIsFavorite(false);
        toast.success(`"${certification.title}" removed from favorites.`);
      } else {
        const { error } = await addFavorite(user.id, certification.id);
        if (error) throw error;
        setIsFavorite(true);
        toast.success(`"${certification.title}" added to favorites!`);
      }
    } catch (err: any) {
      console.error("Error toggling favorite status:", err.message);
      toast.error(`Failed to update favorite status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaking = async () => {
    if (!user || !certification) {
      toast.error("Please log in to track your progress.");
      return;
    }

    setLoading(true);
    try {
      if (userTakingStatus) {
        // Currently taking, so stop
        const { error } = await stopTaking(user.id, certification.id);
        if (error) throw error;
        setUserTakingStatus(false);
        toast.success(
          `You are no longer taking "${certification.title}".`
        );
      } else {
        // Not taking, so start
        const { error } = await startTaking(user.id, certification.id);
        if (error) throw error;
        setUserTakingStatus(true);
        toast.success(`You are now taking "${certification.title}"!`);
      }
    } catch (err: any) {
      console.error("Error toggling taking status:", err.message);
      toast.error(`Failed to update progress: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !certification) {
      toast.error("Please log in to submit a review.");
      return;
    }
    if (!reviewContent.trim()) {
      toast.error("Review content cannot be empty.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const { data, error } = await supabase.from("reviews").insert({
        user_id: user.id,
        certification_id: certification.id,
        rating: reviewRating,
        content: reviewContent.trim(),
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setReviewContent("");
      // Optionally, re-fetch reviews or update UI
    } catch (err: any) {
      console.error("Error submitting review:", err.message);
      toast.error(`Failed to submit review: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading certification...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">Error: {error}</div>
    );
  }

  if (!certification) {
    return (
      <div className="container mx-auto p-4">Certification not found.</div>
    );
  }

  const breadcrumbs = [
    { name: "Certifications", href: "/certifications" },
    { name: certification.title, href: `/certifications/${certification.id}` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-6">
        <div className="container mx-auto px-4">
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.name} className="flex items-center">
                  <Link
                    to={crumb.href}
                    className="hover:underline flex items-center"
                  >
                    {crumb.name}
                  </Link>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold mb-2 leading-tight">
                {certification.title}
              </h1>
              <p className="text-xl font-light opacity-90 mb-4">
                {certification.provider} - {certification.category}
              </p>
              <div className="flex items-center space-x-4 mb-4">
                <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                  {certification.difficulty}
                </span>
                <span className="text-lg">⭐ {certification.rating}</span>
                <span className="text-lg">({certification.total_reviews} Reviews)</span>
                <span className="text-lg">{certification.duration}</span>
              </div>
              <p className="text-lg leading-relaxed max-w-2xl">
                {certification.description}
              </p>
            </div>
            <div className="mt-6 md:mt-0 md:ml-8 flex flex-col space-y-4">
              {certification.image_url && (
                <img
                  src={certification.image_url}
                  alt={certification.title}
                  className="rounded-lg shadow-lg w-full max-w-xs md:max-w-none"
                />
              )}
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-lg font-semibold"
                onClick={handleToggleTaking}
                disabled={loading}
              >
                {userTakingStatus ? "Stop Taking" : "Start Taking"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-white border-white hover:bg-white hover:text-blue-600 py-2 px-4 rounded-lg text-lg font-semibold flex items-center justify-center"
                asChild
              >
                <a href={certification.external_url} target="_blank" rel="noopener noreferrer">
                  Go to Certification <ExternalLink className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button
                variant="outline"
                className={`w-full py-2 px-4 rounded-lg text-lg font-semibold flex items-center justify-center ${isFavorite ? 'bg-yellow-500 text-blue-900 hover:bg-yellow-600' : 'text-white border-white hover:bg-white hover:text-blue-600'}`}
                onClick={handleToggleFavorite}
                disabled={loading}
              >
                {isFavorite ? ( <><Heart className="w-5 h-5 mr-2 fill-current" /> Favorited</> ) : ( <><Heart className="w-5 h-5 mr-2" /> Add to Favorites</> )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-12">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">About This Certification</h2>
            <p className="text-gray-700 leading-relaxed">
              {certification.description}
            </p>
            <Separator className="my-6" />
            <h3 className="text-xl font-semibold mb-3">Key Details</h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>Provider: {certification.provider}</li>
              <li>Category: {certification.category}</li>
              <li>Difficulty: {certification.difficulty}</li>
              <li>Duration: {certification.duration}</li>
              <li>Type: {certification.certification_type}</li>
              <li>Cost: {certification.is_free ? "Free" : "Paid"}</li>
              <li>Impact: {certification.career_impact}/10</li>
            </ul>
          </TabsContent>
          <TabsContent value="skills" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Skills You'll Gain</h2>
            {certification.skills && certification.skills.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700">
                {certification.skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No specific skills listed.</p>
            )}
          </TabsContent>
          <TabsContent value="prerequisites" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
            {certification.prerequisites &&
            certification.prerequisites.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700">
                {certification.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No prerequisites listed.</p>
            )}
          </TabsContent>
          <TabsContent value="roadmap" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Learning Roadmap</h2>
            <p className="text-gray-600">
              The roadmap for this certification can be found on its external page. Click "Go to Certification" to learn more.
            </p>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Reviews ({certification.total_reviews})</h2>
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold mb-3">Leave a Review</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Rating: {reviewRating}
                </label>
                <Slider
                  defaultValue={[reviewRating]}
                  max={5}
                  step={1}
                  min={1}
                  onValueChange={(val) => setReviewRating(val[0])}
                  className="w-full"
                />
              </div>
              <Textarea
                placeholder="Share your experience and thoughts about this certification..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={4}
                className="mb-3"
              />
              <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
            {/* Placeholder for displaying reviews */}
            <div className="space-y-4">
              {/* This is where you would map and render actual review data */}
              <ReviewCard
                userName="Alice Johnson"
                rating={5}
                date="2023-10-26"
                content="Absolutely fantastic course! Very comprehensive and well-structured. Highly recommend it for anyone looking to break into the field."
              />
              <ReviewCard
                userName="Bob Smith"
                rating={4}
                date="2023-09-15"
                content="Good content, but some parts were a bit challenging. The instructor was very knowledgeable."
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}