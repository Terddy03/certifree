import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

// Assuming a structure for favorite entry and joined course data
interface FavoriteEntry {
  certification_id: string; // Changed from course_id
  certifications: { // This now correctly refers to the 'certifications' table
    id: string;
    title: string;
    provider: string;
    description: string;
    duration: string;
    external_url: string;
  }[];
}

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to load

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);
      if (!user) {
        setError("You must be logged in to view favorites.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_favorites")
          .select("certification_id, certifications!fk_user_favorites_certification(id, title, provider, description, duration, external_url)") // Corrected to use explicit foreign key
          .eq("user_id", user.id);

        if (error) throw error;
        setFavorites(data || []);
      } catch (err: any) {
        console.error("Error fetching favorites:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, authLoading]);

  if (loading) {
    return <div className="text-center text-white mt-8">Loading favorites...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-8">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold text-white mb-6">Favorite Courses</h1>
      {favorites.length === 0 ? (
        <div className="text-white text-lg text-center mt-8">
          <p className="mb-4">You haven't added any courses to your favorites yet.</p>
          <Link to="/certifications" className="text-[#ffd60a] hover:underline flex items-center justify-center">
            Browse All Courses <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((r) => {
            // Access the first element of the certifications array (Supabase join returns an array)
            const certification = r.certifications[0];
            if (!certification) return null; // Handle cases where no certification is found

            return (
              <Card key={r.certification_id} className="bg-gray-800 text-white border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">{certification.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm mb-2">
                    <div className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-xs mr-2 flex-shrink-0">{certification.provider}</div>
                    <p className="text-gray-400 line-clamp-2">{certification.description}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-300 mt-4">
                    <span className="mr-2">⏱️</span>
                    <span>{certification.duration}</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <a href={certification.external_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-5 w-5" /></a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites; 