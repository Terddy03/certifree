import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  BookOpen,
  Heart,
  ExternalLink,
  Grid3X3,
  List,
  SlidersHorizontal,
  Trash,
  Pencil,
  Plus
} from "lucide-react";
import { type Certification } from "@/lib/mock-data/certifications";
import { Link, useNavigate } from "react-router-dom";
import { useCertifications } from "@/hooks/useCertifications";
import { supabase } from "@/lib/supabase";
import { componentDebug } from "@/lib/debugger";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { deleteCertification, listCategories, updateCertification as updateCertificationAdmin, createCertification as createCertificationAdmin, CertificationInput } from "@/lib/admin";
import { addFavorite, removeFavorite, isFavorited } from "@/lib/favorites";
import { isTaking, startTaking, stopTaking, countTakersFor } from "@/lib/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadCertificationAsset } from "@/lib/storage";

interface Category {
  name: string;
  count: number;
}

interface Provider {
  name: string;
  count: number;
}

const Certifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // Remove difficulty filtering per request
  const [selectedDifficulty] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const debug = componentDebug('Certifications');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = !!profile?.isAdmin;
  const { toast } = useToast();

  const requireAuth = (action: () => void) => {
    if (!profile?.id) {
      toast({ title: "Please sign in", description: "Create an account to view details.", });
      navigate('/auth');
      return;
    }
    action();
  };

  // Debounce search input (ignore <2 chars)
  useEffect(() => {
    const t = setTimeout(() => {
      const q = (searchQuery || "").trim();
      setDebouncedSearch(q.length >= 2 ? q : "");
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { certifications: filteredCertifications, loading, error } = useCertifications(useMemo(() => ({
    searchQuery: debouncedSearch,
    selectedCategory,
    selectedDifficulty,
    selectedProvider,
    sortBy,
  }), [debouncedSearch, selectedCategory, selectedDifficulty, selectedProvider, sortBy]));

  const [certs, setCerts] = useState<Certification[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({});
  const [takingIds, setTakingIds] = useState<Record<string, boolean>>({});
  const [takersCount, setTakersCount] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);

  const [editForm, setEditForm] = useState<Partial<CertificationInput>>({
    title: "",
    provider: "",
    category: "",
    difficulty: "Beginner",
    duration: "",
    description: "",
    externalUrl: "",
    certificationType: "Course",
    imageUrl: "",
    type: "public", // Added for edit form
    courseId: "", // Added for edit form
  });

  const openEdit = (c: Certification) => {
    setEditing(c);
    setEditForm({
      title: c.title,
      provider: c.provider,
      category: c.category,
      difficulty: c.difficulty,
      duration: c.duration,
      description: c.description,
      externalUrl: c.externalUrl,
      certificationType: c.certificationType,
      imageUrl: c.imageUrl || "",
      type: c.type, // Populate type
      courseId: c.course_id || "", // Populate courseId
    });
  };

  const saveEdit = async () => {
    if (!editing) return;

    // Validate Course ID format if CertiFree type and ID is provided (not null)
    if (editForm.type === 'certifree' && editForm.courseId) {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(editForm.courseId)) {
        toast({ title: "Invalid Course ID", description: "Course ID must be a valid UUID format (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx) or left empty.", variant: "destructive" });
        return; // Prevent form submission
      }
    }

    const { error } = await updateCertificationAdmin(editing.id, {
      ...editForm,
      type: editForm.type as "public" | "certifree", // Ensure correct type
      certificationType: editForm.type === 'certifree' ? 'CertiFree' : (editForm.certificationType as "Course" | "Exam" | "Project" | "Bootcamp" | "Public"), // Set based on type
      courseId: editForm.type === 'certifree' ? (editForm.courseId || null) : undefined, // Only send courseId if certifree, convert empty string to null
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setCerts(prev => prev.map(c => c.id === editing.id ? { ...c, ...editForm } as Certification : c));
      toast({ title: "Certification updated" });
      setEditing(null);
    }
  };

  // Add Certification form
  const [addForm, setAddForm] = useState<Partial<CertificationInput>>({
    id: "",
    title: "",
    provider: "",
    category: "",
    difficulty: "Beginner",
    duration: "",
    description: "",
    externalUrl: "",
    certificationType: "Course",
    imageUrl: "",
    type: "public", // Default to public
    courseId: "", // Initialize courseId
  });

  const saveAdd = async () => {
    if (!addForm.title || !addForm.provider || !addForm.category) { // Removed addForm.id from validation
      toast({ title: "Missing fields", description: "Title, Provider, Category are required.", variant: "destructive" });
      return;
    }

    // Generate ID (slug) from title
    const generatedId = addForm.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
    if (!generatedId) {
        toast({ title: "Invalid Title", description: "Could not generate a valid ID from the title. Please provide a more descriptive title.", variant: "destructive" });
        return;
    }

    const newCertification: CertificationInput = {
      id: generatedId, // Use generated ID
      title: addForm.title,
      provider: addForm.provider,
      category: addForm.category,
      difficulty: addForm.difficulty || "Beginner",
      duration: addForm.duration || "",
      description: addForm.description || "",
      externalUrl: addForm.externalUrl || "#",
      imageUrl: addForm.imageUrl || "",
      isFree: true,
      certificationType: addForm.type === 'certifree' ? 'CertiFree' : (addForm.certificationType || 'Course'),
      tags: addForm.tags || [],
      type: addForm.type || 'public',
      courseId: addForm.type === 'certifree' ? (addForm.courseId || null) : undefined, // Only send courseId if certifree, convert empty string to null
    };

    // Validate Course ID format if CertiFree type and ID is provided (not null)
    if (newCertification.type === 'certifree' && newCertification.courseId) {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(newCertification.courseId)) {
        toast({ title: "Invalid Course ID", description: "Course ID must be a valid UUID format (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx) or left empty.", variant: "destructive" });
        return; // Prevent form submission
      }
    }
    
    const { error } = await createCertificationAdmin(newCertification);
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
    } else {
      const newCert: Certification = {
        id: generatedId, // Use generated ID for UI update
        title: addForm.title,
        provider: addForm.provider,
        category: addForm.category,
        difficulty: addForm.difficulty as any,
        duration: addForm.duration,
        rating: 0,
        totalReviews: 0,
        description: addForm.description,
        skills: [],
        prerequisites: [],
        imageUrl: addForm.imageUrl,
        externalUrl: addForm.externalUrl,
        isFree: true,
        certificationType: addForm.certificationType as any,
        careerImpact: 0,
        completionCount: 0,
        tags: [],
        lastUpdated: new Date().toISOString(),
        // Default new certifications to CertiFree if created via admin UI for now
        type: addForm.type, // Use the type from the form
        course_id: addForm.courseId, // Ensure course_id is passed
      };
      setCerts(prev => [newCert, ...prev]);
      setAdding(false);
      setAddForm({ id: "", title: "", provider: "", category: "", difficulty: "Beginner", duration: "", description: "", externalUrl: "", certificationType: "Course", imageUrl: "", type: "public", courseId: "" });
      toast({ title: "Certification created" });
    }
  };

  useEffect(() => {
    setCerts(filteredCertifications);
    debug.log('Filtered certifications received', { count: filteredCertifications.length, certifications: filteredCertifications });
    // Preload favorite states for visible certs
    (async () => {
      const entries = await Promise.all(filteredCertifications.map(async (c) => {
        if (!profile?.id) return [c.id, false] as const;
        const { data } = await isFavorited(profile.id, c.id);
        return [c.id, !!data] as const;
      }));
      const map: Record<string, boolean> = {};
      entries.forEach(([id, fav]) => (map[id] = fav));
      setFavoriteIds(map);
      // Preload taking states
      const takingEntries = await Promise.all(filteredCertifications.map(async (c) => {
        if (!profile?.id) return [c.id, false] as const;
        const { data } = await isTaking(profile.id, c.id);
        return [c.id, !!data] as const;
      }));
      const takingMap: Record<string, boolean> = {};
      takingEntries.forEach(([id, t]) => (takingMap[id] = t));
      setTakingIds(takingMap);
      // Load takers count
      const counts = await countTakersFor(filteredCertifications.map(c => c.id));
      setTakersCount(counts);
    })();
  }, [filteredCertifications, profile?.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      debug.log('Fetching categories');
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { data, error } = await listCategories();
        if (error) {
          debug.error('Error fetching categories', { error: error.message });
          setCategoriesError(error.message);
        } else {
          const formatted: Category[] = (data || []).map((c: any) => ({ name: c.name, count: 0 }));
          setCategories(formatted);
          debug.log('Categories fetched', { count: formatted.length });
        }
      } catch (err: any) {
        debug.error('Unhandled error fetching categories', { error: err.message, stack: err.stack });
        setCategoriesError(err.message);
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchProviders = async () => {
      debug.log('Fetching providers');
      setProvidersLoading(true);
      setProvidersError(null);
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select('provider');

        if (error) {
          debug.error('Error fetching providers', { error: error.message });
          setProvidersError(error.message);
        } else {
          // Extract unique providers and count occurrences
          const providerCounts: { [key: string]: number } = {};
          data.forEach(cert => {
            providerCounts[cert.provider] = (providerCounts[cert.provider] || 0) + 1;
          });
          const uniqueProviders: Provider[] = Object.keys(providerCounts).map(name => ({
            name,
            count: providerCounts[name],
          }));
          setProviders(uniqueProviders);
          debug.log('Providers fetched', { count: uniqueProviders.length });
        }
      } catch (err: any) {
        debug.error('Unhandled error fetching providers', { error: err.message, stack: err.stack });
        setProvidersError(err.message);
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchCategories();
    fetchProviders();
  }, []);

  useEffect(() => {
    // Notify when new certifications are added (realtime)
    const channel = supabase
      .channel('certifications-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'certifications' }, (payload) => {
        const title = (payload.new as any)?.title || 'New certification';
        toast({ title: 'New certification added', description: title });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!isAdmin) return;
    if (!confirm(`Delete certification "${title}"?`)) return;
    try {
      setDeletingId(id);
      const { error } = await deleteCertification(id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      } else {
        setCerts(prev => prev.filter(c => c.id !== id));
        toast({ title: "Certification deleted" });
      }
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFavorite = async (cert: Certification) => {
    if (!profile?.id) return void toast({ title: "Please sign in to favorite." });
    const isFav = !!favoriteIds[cert.id];
    setFavoriteIds(prev => ({ ...prev, [cert.id]: !isFav }));
    const { error } = isFav ? await removeFavorite(profile.id, cert.id) : await addFavorite(profile.id, cert.id);
    if (error) {
      // revert on error
      setFavoriteIds(prev => ({ ...prev, [cert.id]: isFav }));
      toast({ title: "Could not update favorites", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleTaking = async (cert: Certification) => {
    if (!profile?.id) return void toast({ title: "Please sign in to track progress." });
    const taking = !!takingIds[cert.id];
    setTakingIds(prev => ({ ...prev, [cert.id]: !taking }));
    // optimistic update of count
    setTakersCount(prev => ({ ...prev, [cert.id]: Math.max(0, (prev[cert.id] || 0) + (taking ? -1 : 1)) }));
    const { error } = taking ? await stopTaking(profile.id, cert.id) : await startTaking(profile.id, cert.id);
    if (error) {
      setTakingIds(prev => ({ ...prev, [cert.id]: taking }));
      setTakersCount(prev => ({ ...prev, [cert.id]: Math.max(0, (prev[cert.id] || 0) + (taking ? 1 : -1)) }));
      toast({ title: "Could not update status", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] text-gray-300">
        <p>Loading certifications...</p>
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

  const MAX_UPLOAD_MB = 1;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "application/pdf"];

  // const CategoryPills = () => (
  //   <div className="flex flex-wrap gap-2">
  //     <Button
  //       variant={selectedCategory === "all" ? "default" : "outline"}
  //       className={selectedCategory === "all" ? "bg-[#ffc300] text-[#001d3d]" : "text-gray-300 border-[#003566]"}
  //       onClick={() => setSelectedCategory("all")}
  //     >
  //       All
  //     </Button>
  //     {categories.map(cat => (
  //       <Button
  //         key={cat.name}
  //         variant={selectedCategory === cat.name ? "default" : "outline"}
  //         className={selectedCategory === cat.name ? "bg-[#ffc300] text-[#001d3d]" : "text-gray-300 border-[#003566]"}
  //         onClick={() => setSelectedCategory(cat.name)}
  //       >
  //         {cat.name}
  //       </Button>
  //     ))}
  //     {isAdmin && (
  //       <Button variant="ghost" className="text-gray-300 hover:text-[#ffd60a]" onClick={() => navigate('/settings')}>Manage</Button>
  //     )}
  //   </div>
  // );

  const CertificationCard = ({ certification, isAdmin, openEdit, handleDelete, deletingId, favoriteIds, handleToggleFavorite, takersCount, requireAuth }: {
    certification: Certification;
    isAdmin: boolean;
    openEdit: (cert: Certification) => void;
    handleDelete: (id: string, title: string) => Promise<void>;
    deletingId: string | null;
    favoriteIds: Record<string, boolean>;
    handleToggleFavorite: (cert: Certification) => Promise<void>;
    takersCount: Record<string, number>;
    requireAuth: (action: () => void) => void;
  }) => (
    <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] hover:scale-[1.01] transition-transform duration-200 ease-out group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Admin controls and favorite */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]"
                  onClick={() => openEdit(certification)}
                  title="Edit certification"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="hover:bg-red-700"
                  onClick={() => handleDelete(certification.id, certification.title)}
                  disabled={deletingId === certification.id}
                  title="Delete certification"
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" className={`hover:bg-[#003566] px-2 ${favoriteIds[certification.id] ? 'text-red-500' : 'text-gray-300'}`} onClick={() => handleToggleFavorite(certification)} aria-label="Toggle favorite">
              <Heart className={`h-4 w-4 mr-1 ${favoriteIds[certification.id] ? 'fill-red-500' : ''}`} />
              <span className="text-xs">{favoriteIds[certification.id] ? 'Favorited' : 'Add to favorite'}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-24 h-16 rounded-lg shadow-sm overflow-hidden bg-[#003566] flex items-center justify-center flex-shrink-0">
              {certification.imageUrl ? (
                <img src={certification.imageUrl} alt={certification.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-xs text-gray-200">{certification.provider}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base leading-tight text-white group-hover:text-[#ffd60a] transition-colors">
                <button onClick={() => requireAuth(() => {
                  // Correct navigation for CertiFree vs Public certifications
                  if (certification.type === 'certifree' && certification.course_id) {
                    navigate(`/courses/${certification.course_id}`);
                  } else {
                    navigate(`/certifications/${certification.id}`);
                  }
                })} className="text-left w-full hover:underline">
                  {certification.title}
                </button>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-300">
                <div className="h-6 px-2 rounded bg-[#003566] flex items-center justify-center text-[10px] text-gray-200 flex-none">{certification.provider}</div>
                <p className="text-gray-400 line-clamp-2 min-w-0 flex-1">{certification.description}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-xs text-gray-400 opacity-90">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{certification.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{(takersCount[certification.id] || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {(certification.skills || []).slice(0, 2).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px] bg-[#003566] text-gray-200 border-[#001d3d] font-medium">
              {skill}
            </Badge>
          ))}
          {(certification.skills || []).length > 2 && (
            <Badge variant="outline" className="text-[10px] bg-[#003566] text-gray-200 border-[#001d3d] font-medium">
              +{(certification.skills || []).length - 2} more
            </Badge>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button className="flex-1 bg-[#ffc300] text-[#001d3d] font-semibold hover:bg-[#ffd60a] transition-colors duration-200" onClick={() => requireAuth(() => {
            // Correct navigation for CertiFree vs Public certifications
            if (certification.type === 'certifree' && certification.course_id) {
              navigate(`/courses/${certification.course_id}`);
            } else {
              navigate(`/certifications/${certification.id}`);
            }
          })}>
            View Details
          </Button>
          <Button variant="outline" size="icon" asChild className="bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]">
            <a href={profile?.id ? certification.externalUrl : '/auth'} target={profile?.id ? "_blank" : "_self"} rel="noopener noreferrer">
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CertificationListItem = ({ certification, isAdmin, openEdit, handleDelete, deletingId, favoriteIds, handleToggleFavorite, takersCount, requireAuth }: {
    certification: Certification;
    isAdmin: boolean;
    openEdit: (cert: Certification) => void;
    handleDelete: (id: string, title: string) => Promise<void>;
    deletingId: string | null;
    favoriteIds: Record<string, boolean>;
    handleToggleFavorite: (cert: Certification) => Promise<void>;
    takersCount: Record<string, number>;
    requireAuth: (action: () => void) => void;
  }) => (
    <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] hover:scale-[1.01] transition-transform duration-300 ease-out">
      <CardContent className="p-6">
        <div className="flex gap-6 items-center">
          <div className="w-24 h-16 rounded-lg flex-shrink-0 overflow-hidden shadow-sm bg-[#003566] flex items-center justify-center text-sm text-gray-200">
            {certification.imageUrl ? (
              <img src={certification.imageUrl} alt={certification.title} className="w-full h-full object-cover" />
            ) : (
              <span>{certification.provider}</span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white hover:text-[#ffd60a] transition-colors duration-200">
                  <button onClick={() => requireAuth(() => {
                    // Correct navigation for CertiFree vs Public certifications
                    if (certification.type === 'certifree' && certification.course_id) {
                      navigate(`/courses/${certification.course_id}`);
                    } else {
                      navigate(`/certifications/${certification.id}`);
                    }
                  })} className="text-left w-full hover:underline">
                    {certification.title}
                  </button>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-300">
                  <div className="h-6 px-2 rounded bg-[#003566] flex items-center justify-center text-[10px] text-gray-200 flex-none">{certification.provider}</div>
                  <p className="text-gray-400 line-clamp-2 min-w-0 flex-1">{certification.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]"
                      onClick={() => openEdit(certification)}
                      title="Edit certification"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="hover:bg-red-700"
                      onClick={() => handleDelete(certification.id, certification.title)}
                      disabled={deletingId === certification.id}
                      title="Delete certification"
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" className={`hover:bg-[#003566] px-2 ${favoriteIds[certification.id] ? 'text-red-500' : 'text-gray-300'}`} onClick={() => handleToggleFavorite(certification)}>
                  <Heart className={`h-4 w-4 mr-1 ${favoriteIds[certification.id] ? 'fill-red-500' : ''}`} />
                  <span className="text-xs">{favoriteIds[certification.id] ? 'Favorited' : 'Add to favorite'}</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-6 text-xs text-gray-400">
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{certification.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{(takersCount[certification.id] || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-[#ffc300] text-[#001d3d] font-semibold hover:bg-[#ffd60a] transition-colors duration-200" onClick={() => requireAuth(() => {
                  // Correct navigation for CertiFree vs Public certifications
                  if (certification.type === 'certifree' && certification.course_id) {
                    navigate(`/courses/${certification.course_id}`);
                  } else {
                    navigate(`/certifications/${certification.id}`);
                  }
                })}>
                  View Details
                </Button>
                <Button variant="outline" size="icon" asChild className="bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]">
                  <a href={profile?.id ? certification.externalUrl : '/auth'} target={profile?.id ? "_blank" : "_self"} rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Separate CertiFree and Public Certifications
  const certiFreeCerts = certs.filter(cert => cert.type === 'certifree');
  const publicCerts = certs.filter(cert => cert.type === 'public');

  return (
    <div className="min-h-screen bg-[#000814] text-gray-100">
      <Header />

      <main className="container mx-auto px-6 py-12 md:py-16">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Discover Your Next <span className="text-[#ffd60a]">Free Certification.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Explore a vast library of high-quality IT and business certifications, meticulously curated to help you elevate your skills and career.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search certifications, providers, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 h-12 bg-[#001d3d] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
            />
          </div>
        </div>

        {/* Categories Row */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Categories</h3>
            {isAdmin && (
              <Button size="sm" className="bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a]" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Certification
              </Button>
            )}
          </div>
          {/* <CategoryPills /> */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px] bg-[#001d3d] border-[#003566] text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-[#001d3d] border-[#003566] text-white">
              <SelectItem value="all" className="hover:bg-[#003566] hover:text-[#ffd60a]">All</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name} className="hover:bg-[#003566] hover:text-[#ffd60a]">
                  {cat.name}
                </SelectItem>
              ))}
              {isAdmin && (
                <Button variant="ghost" className="text-gray-300 hover:text-[#ffd60a] w-full text-left justify-start" onClick={() => navigate('/settings')}>Manage Categories</Button>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* CertiFree Certifications Section */}
        {certiFreeCerts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">CertiFree Certifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {certiFreeCerts.map((certification) => (
                viewMode === "grid" ? (
                  <CertificationCard
                    key={certification.id}
                    certification={certification}
                    isAdmin={isAdmin}
                    openEdit={openEdit}
                    handleDelete={handleDelete}
                    deletingId={deletingId}
                    favoriteIds={favoriteIds}
                    handleToggleFavorite={handleToggleFavorite}
                    takersCount={takersCount}
                    requireAuth={requireAuth}
                  />
                ) : (
                  <CertificationListItem
                    key={certification.id}
                    certification={certification}
                    isAdmin={isAdmin}
                    openEdit={openEdit}
                    handleDelete={handleDelete}
                    deletingId={deletingId}
                    favoriteIds={favoriteIds}
                    handleToggleFavorite={handleToggleFavorite}
                    takersCount={takersCount}
                    requireAuth={requireAuth}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {/* Public Certifications Section */}
        {publicCerts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Public Certifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publicCerts.map((certification) => (
                viewMode === "grid" ? (
                  <CertificationCard
                    key={certification.id}
                    certification={certification}
                    isAdmin={isAdmin}
                    openEdit={openEdit}
                    handleDelete={handleDelete}
                    deletingId={deletingId}
                    favoriteIds={favoriteIds}
                    handleToggleFavorite={handleToggleFavorite}
                    takersCount={takersCount}
                    requireAuth={requireAuth}
                  />
                ) : (
                  <CertificationListItem
                    key={certification.id}
                    certification={certification}
                    isAdmin={isAdmin}
                    openEdit={openEdit}
                    handleDelete={handleDelete}
                    deletingId={deletingId}
                    favoriteIds={favoriteIds}
                    handleToggleFavorite={handleToggleFavorite}
                    takersCount={takersCount}
                    requireAuth={requireAuth}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {certs.length === 0 && (
          <div className="text-center py-20 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
            <BookOpen className="h-16 w-16 text-[#003566] mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3">No certifications found</h3>
            <p className="text-base text-gray-400 max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}

        {/* Results Header (moved to reflect combined count) */}
        <div className="flex items-center justify-between mb-6 text-gray-300">
          <p className="text-lg">Showing {certs.length} certifications {debouncedSearch && ` for "${debouncedSearch}"`}</p>
          <div className="flex rounded-lg border border-[#003566] bg-[#001d3d]">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`rounded-r-none ${
                viewMode === "grid" ? "bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a]" : "text-gray-300 hover:bg-[#003566] hover:text-[#ffd60a]"
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`rounded-l-none ${
                viewMode === "list" ? "bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a]" : "text-gray-300 hover:bg-[#003566] hover:text-[#ffd60a]"
              }`}
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        
      </main>

      <Footer />

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Certification</DialogTitle>
            <DialogDescription>Update the certification details and save your changes.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Provider</Label>
              <Input value={editForm.provider} onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Category</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                <SelectTrigger className="bg-[#000814] border-[#003566] text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-[#001d3d] border-[#003566] text-white">
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name} className="hover:bg-[#003566] hover:text-[#ffd60a]">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select value={editForm.type} onValueChange={(v: "public" | "certifree") => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger className="bg-[#000814] border-[#003566] text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-[#001d3d] border-[#003566] text-white">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="certifree">CertiFree</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.type === 'certifree' && (
              <div>
                <Label className="text-gray-300">Course ID (for CertiFree)</Label>
                <Input value={editForm.courseId} onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })} className="bg-[#000814] border-[#003566] text-white" placeholder="Optional: Link to an existing course" />
              </div>
            )}
            {/* Difficulty removed from UI per request */}
            <div>
              <Label className="text-gray-300">Duration</Label>
              <Input value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-300">External URL</Label>
              <Input value={editForm.externalUrl} onChange={(e) => setEditForm({ ...editForm, externalUrl: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-300">Image (URL or Upload)</Label>
              <Input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="https://example.com/image.png" className="mb-2 bg-[#000814] border-[#003566] text-white" />
              <input type="file" accept="image/png,image/jpeg,application/pdf" className="text-sm" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f || !editing) return;
                if (!ALLOWED_TYPES.includes(f.type)) {
                  toast({ title: 'Invalid file type', description: 'Allowed: JPG, PNG, PDF', variant: 'destructive' });
                  return;
                }
                if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
                  toast({ title: 'File too large', description: `Max ${MAX_UPLOAD_MB}MB`, variant: 'destructive' });
                  return;
                }
                const { url, error } = await uploadCertificationAsset(f, editing.id);
                if (error) toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
                else setEditForm((prev) => ({ ...prev, imageUrl: url || prev.imageUrl }));
              }} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566]" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={saveEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Certification</DialogTitle>
            <DialogDescription>Provide the details below to create a new certification.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Removed ID (slug) field - now auto-generated from Title */}
            <div>
              <Label className="text-gray-300">Title</Label>
              <Input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Provider</Label>
              <Input value={addForm.provider} onChange={(e) => setAddForm({ ...addForm, provider: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Category</Label>
              <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                <SelectTrigger className="bg-[#000814] border-[#003566] text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-[#001d3d] border-[#003566] text-white">
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name} className="hover:bg-[#003566] hover:text-[#ffd60a]">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select value={addForm.type} onValueChange={(v: "public" | "certifree") => setAddForm({ ...addForm, type: v, certificationType: v === 'certifree' ? 'CertiFree' : 'Public' })}>
                <SelectTrigger className="bg-[#000814] border-[#003566] text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-[#001d3d] border-[#003566] text-white">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="certifree">CertiFree</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addForm.type === 'certifree' && (
              <div>
                <Label className="text-gray-300">Course ID (for CertiFree)</Label>
                <Input value={addForm.courseId} onChange={(e) => setAddForm({ ...addForm, courseId: e.target.value })} className="bg-[#000814] border-[#003566] text-white" placeholder="Optional: Link to an existing course" />
              </div>
            )}
            {/* Difficulty removed from UI per request */}
            <div>
              <Label className="text-gray-300">Duration</Label>
              <Input value={addForm.duration} onChange={(e) => setAddForm({ ...addForm, duration: e.target.value })} className="bg-[#000814] border-[#003566] text-white" placeholder="e.g., 20-30 hours" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-300">External URL</Label>
              <Input value={addForm.externalUrl} onChange={(e) => setAddForm({ ...addForm, externalUrl: e.target.value })} className="bg-[#000814] border-[#003566] text-white" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-300">Image (URL or Upload)</Label>
              <Input value={addForm.imageUrl} onChange={(e) => setAddForm({ ...addForm, imageUrl: e.target.value })} className="mb-2 bg-[#000814] border-[#003566] text-white" placeholder="https://example.com/image.png" />
              <input type="file" accept="image/png,image/jpeg,application/pdf" className="text-sm" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f || !addForm.id) { toast({ title: 'Provide an ID first so we can store the file in a folder' }); return; }
                if (!ALLOWED_TYPES.includes(f.type)) {
                  toast({ title: 'Invalid file type', description: 'Allowed: JPG, PNG, PDF', variant: 'destructive' });
                  return;
                }
                if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
                  toast({ title: 'File too large', description: `Max ${MAX_UPLOAD_MB}MB`, variant: 'destructive' });
                  return;
                }
                const { url, error } = await uploadCertificationAsset(f, addForm.id);
                if (error) toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
                else setAddForm((prev) => ({ ...prev, imageUrl: url || prev.imageUrl }));
              }} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} className="bg-[#000814] border-[#003566] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566]" onClick={() => setAdding(false)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={saveAdd}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Certifications;