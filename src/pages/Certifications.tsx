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
  SlidersHorizontal
} from "lucide-react";
import { type Certification } from "@/lib/mock-data/certifications";
import { Link } from "react-router-dom";
import { useCertifications } from "@/hooks/useCertifications";
import { supabase } from "@/lib/supabase";
import { componentDebug } from "@/lib/debugger";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
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

  useEffect(() => {
    const fetchCategories = async () => {
      debug.log('Fetching categories');
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select('category');
        
        if (error) {
          debug.error('Error fetching categories', { error: error.message });
          setCategoriesError(error.message);
        } else {
          // Extract unique categories and count occurrences
          const categoryCounts: { [key: string]: number } = {};
          data.forEach(cert => {
            categoryCounts[cert.category] = (categoryCounts[cert.category] || 0) + 1;
          });
          const uniqueCategories: Category[] = Object.keys(categoryCounts).map(name => ({
            name,
            count: categoryCounts[name],
          }));
          setCategories(uniqueCategories);
          debug.log('Categories fetched', { count: uniqueCategories.length });
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

  const memoizedFilters = useMemo(() => ({
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    selectedProvider,
    sortBy,
  }), [searchQuery, selectedCategory, selectedDifficulty, selectedProvider, sortBy]);

  const { certifications: filteredCertifications, loading, error } = useCertifications(memoizedFilters);

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

  const CertificationCard = ({ certification }: { certification: Certification }) => (
    <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] hover:scale-[1.02] transition-transform duration-300 ease-out group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <img
            src={certification.imageUrl}
            alt={certification.title}
            className="w-16 h-10 object-cover rounded-lg mb-3 shadow-sm"
          />
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#ffd60a] hover:bg-[#003566] opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#003566] text-gray-200 text-xs font-semibold px-3 py-1 rounded-full">
              {certification.provider}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                certification.difficulty === "Beginner" ? "text-green-400 border-green-700 bg-green-900/20" :
                certification.difficulty === "Intermediate" ? "text-yellow-400 border-yellow-700 bg-yellow-900/20" :
                "text-red-400 border-red-700 bg-red-900/20"
              }`}
            >
              {certification.difficulty}
            </Badge>
          </div>

          <CardTitle className="text-lg leading-tight text-white group-hover:text-[#ffd60a] transition-colors duration-200">
            <Link to={`/certifications/${certification.id}`}>
              {certification.title}
            </Link>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400 line-clamp-2">
          {certification.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#ffc300] text-[#ffc300]" />
            <span>{certification.rating || 0}</span>
            <span className="text-gray-500">({certification.totalReviews || 0})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{certification.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{(certification.completionCount || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(certification.skills || []).slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs bg-[#003566] text-gray-200 border-[#001d3d] font-medium">
              {skill}
            </Badge>
          ))}
          {(certification.skills || []).length > 3 && (
            <Badge variant="outline" className="text-xs bg-[#003566] text-gray-200 border-[#001d3d] font-medium">
              +{(certification.skills || []).length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button asChild className="flex-1 bg-[#ffc300] text-[#001d3d] font-semibold hover:bg-[#ffd60a] transition-colors duration-200">
            <Link to={`/certifications/${certification.id}`}>
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild className="bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]">
            <a href={certification.externalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CertificationListItem = ({ certification }: { certification: Certification }) => (
    <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] hover:scale-[1.01] transition-transform duration-300 ease-out">
      <CardContent className="p-6">
        <div className="flex gap-6 items-center">
          <img
            src={certification.imageUrl}
            alt={certification.title}
            className="w-24 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
          />

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#003566] text-gray-200 text-xs font-semibold px-3 py-1 rounded-full">
                    {certification.provider}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      certification.difficulty === "Beginner" ? "text-green-400 border-green-700 bg-green-900/20" :
                      certification.difficulty === "Intermediate" ? "text-yellow-400 border-yellow-700 bg-yellow-900/20" :
                      "text-red-400 border-red-700 bg-red-900/20"
                    }`}
                  >
                    {certification.difficulty}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-white hover:text-[#ffd60a] transition-colors duration-200">
                  <Link to={`/certifications/${certification.id}`}>
                    {certification.title}
                  </Link>
                </h3>
              </div>

              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#ffd60a] hover:bg-[#003566]">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-gray-400 line-clamp-2">
              {certification.description}
            </p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#ffc300] text-[#ffc300]" />
                  <span>{certification.rating || 0}</span>
                  <span className="text-gray-500">({certification.totalReviews || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{certification.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{(certification.completionCount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button asChild className="bg-[#ffc300] text-[#001d3d] font-semibold hover:bg-[#ffd60a] transition-colors duration-200">
                  <Link to={`/certifications/${certification.id}`}>
                    View Details
                  </Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]">
                  <a href={certification.externalUrl} target="_blank" rel="noopener noreferrer">
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

        {/* Search and Controls */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search certifications, providers, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 h-12 bg-[#001d3d] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-[#001d3d] text-gray-200 border-[#003566] hover:bg-[#003566] hover:text-[#ffd60a] transition-colors duration-200"
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-[#001d3d] text-gray-200 border-[#003566] hover:bg-[#003566] focus:ring-[#ffc300]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#001d3d] text-gray-200 border-[#003566]">
                  <SelectItem value="popular" className="hover:bg-[#003566] hover:text-[#ffd60a]">Most Popular</SelectItem>
                  <SelectItem value="rating" className="hover:bg-[#003566] hover:text-[#ffd600]">Highest Rated</SelectItem>
                  <SelectItem value="newest" className="hover:bg-[#003566] hover:text-[#ffd600]">Newest</SelectItem>
                  <SelectItem value="duration" className="hover:bg-[#003566] hover:text-[#ffd600]">Shortest Duration</SelectItem>
                </SelectContent>
              </Select>

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
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-6 bg-[#001d3d] border-[#003566] shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-base font-medium mb-3 block text-gray-200">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-[#001d3d] text-gray-200 border-[#003566] hover:bg-[#003566] focus:ring-[#ffc300]">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#001d3d] text-gray-200 border-[#003566]">
                      <SelectItem value="all" className="hover:bg-[#003566] hover:text-[#ffd60a]">All Categories</SelectItem>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled className="text-gray-400">Loading...</SelectItem>
                      ) : categoriesError ? (
                        <SelectItem value="error" disabled className="text-red-400">Error: {categoriesError}</SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.name} value={category.name} className="hover:bg-[#003566] hover:text-[#ffd60a]">
                            {category.name} ({category.count})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-base font-medium mb-3 block text-gray-200">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="bg-[#001d3d] text-gray-200 border-[#003566] hover:bg-[#003566] focus:ring-[#ffc300]">
                      <SelectValue placeholder="Select a difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#001d3d] text-gray-200 border-[#003566]">
                      <SelectItem value="all" className="hover:bg-[#003566] hover:text-[#ffd60a]">All Levels</SelectItem>
                      <SelectItem value="Beginner" className="hover:bg-[#003566] hover:text-[#ffd60a]">Beginner</SelectItem>
                      <SelectItem value="Intermediate" className="hover:bg-[#003566] hover:text-[#ffd60a]">Intermediate</SelectItem>
                      <SelectItem value="Advanced" className="hover:bg-[#003566] hover:text-[#ffd60a]">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-base font-medium mb-3 block text-gray-200">Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="bg-[#001d3d] text-gray-200 border-[#003566] hover:bg-[#003566] focus:ring-[#ffc300]">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#001d3d] text-gray-200 border-[#003566]">
                      <SelectItem value="all" className="hover:bg-[#003566] hover:text-[#ffd60a]">All Providers</SelectItem>
                      {providersLoading ? (
                        <SelectItem value="loading" disabled className="text-gray-400">Loading...</SelectItem>
                      ) : providersError ? (
                        <SelectItem value="error" disabled className="text-red-400">Error: {providersError}</SelectItem>
                      ) : (
                        providers.map((provider) => (
                          <SelectItem key={provider.name} value={provider.name} className="hover:bg-[#003566] hover:text-[#ffd60a]">
                            {provider.name} ({provider.count})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8 text-gray-300">
          <p className="text-lg">
            Showing {filteredCertifications.length} certifications
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Certifications Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCertifications.map((certification) => (
              <CertificationCard key={certification.id} certification={certification} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCertifications.map((certification) => (
              <CertificationListItem key={certification.id} certification={certification} />
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredCertifications.length === 0 && (
          <div className="text-center py-20 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
            <BookOpen className="h-16 w-16 text-[#003566] mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3">No certifications found</h3>
            <p className="text-base text-gray-400 max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Certifications;