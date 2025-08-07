import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Certification } from '@/lib/mock-data/certifications';
import { componentDebug, startTimer, endTimer } from '@/lib/debugger';

interface CertificationsFilter {
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  selectedProvider: string;
  sortBy: string;
}

// Transform database response from snake_case to camelCase
const transformCertification = (dbCertification: any): Certification => ({
  id: dbCertification.id,
  title: dbCertification.title,
  provider: dbCertification.provider,
  category: dbCertification.category,
  difficulty: dbCertification.difficulty,
  duration: dbCertification.duration,
  rating: dbCertification.rating || 0,
  totalReviews: dbCertification.total_reviews || 0,
  description: dbCertification.description,
  skills: dbCertification.skills || [],
  prerequisites: dbCertification.prerequisites || [],
  imageUrl: dbCertification.image_url || '/api/placeholder/400/240',
  externalUrl: dbCertification.external_url || '#',
  isFree: dbCertification.is_free || true,
  certificationType: dbCertification.certification_type || 'Course',
  careerImpact: dbCertification.career_impact || 5,
  completionCount: dbCertification.completion_count || 0,
  tags: dbCertification.tags || [],
  lastUpdated: dbCertification.last_updated || new Date().toISOString().split('T')[0]
});

export const useCertifications = (filters: CertificationsFilter) => {
  const debug = componentDebug('useCertifications');
  
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true); // Ref to track component mount status

  useEffect(() => {
    isMounted.current = true; // Set to true on effect run

    const timerName = 'useCertifications:fetchCertifications';

    const fetchCertifications = async () => {
      startTimer(timerName);
      debug.log('Starting certifications fetch', { filters });
      
      // Reset error and loading state at the beginning of each fetch
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      try {
        let query = supabase.from('certifications').select('*');

        // Apply filters
        if (filters.searchQuery) {
          query = query.or(
            `title.ilike.%${filters.searchQuery}%`,
            `provider.ilike.%${filters.searchQuery}%`,
            `skills.cs.{${filters.searchQuery}}` // Assuming skills are stored as an array of text
          );
        }
        if (filters.selectedCategory !== "all") {
          query = query.eq('category', filters.selectedCategory);
        }
        if (filters.selectedDifficulty !== "all") {
          query = query.eq('difficulty', filters.selectedDifficulty);
        }
        if (filters.selectedProvider !== "all") {
          query = query.eq('provider', filters.selectedProvider);
        }

        // Apply sorting
        switch (filters.sortBy) {
          case "popular":
            query = query.order('completion_count', { ascending: false });
            break;
          case "rating":
            query = query.order('rating', { ascending: false });
            break;
          case "newest":
            query = query.order('last_updated', { ascending: false });
            break;
          case "duration":
            query = query.order('duration', { ascending: true }); // Assuming duration is sortable numerically
            break;
          default:
            query = query.order('completion_count', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
          debug.error("Error fetching certifications", { error: error.message });
          if (isMounted.current) {
            setError(error.message);
          }
        } else {
          debug.log("Certifications fetched successfully", { count: data?.length });
          // Transform the data from snake_case to camelCase
          const transformedData = data ? data.map(transformCertification) : [];
          if (isMounted.current) {
            setCertifications(transformedData);
          }
        }
      } catch (err: any) {
        debug.error("Unhandled error during certifications fetch", { error: err.message, stack: err.stack });
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        endTimer(timerName);
      }
    };

    fetchCertifications();

    // Cleanup function: Set isMounted to false when component unmounts or effect re-runs
    return () => {
      isMounted.current = false;
      debug.log('useCertifications cleanup: Component unmounted or effect re-ran');
    };
  }, [filters]);

  return { certifications, loading, error };
}; 