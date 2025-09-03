import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  listCertifications, // Corrected function name
  createCertification, // Corrected function name
} from "@/lib/certifree-api";
import { Certification } from "@/lib/types/certifree"; // Corrected type name
import { CertificationInput } from "@/lib/certifree-api"; // Corrected import path

export default function Courses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = profile?.isAdmin;

  const [courses, setCourses] = useState<Certification[]>([]); // Corrected type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    title: "",
    description: "",
    provider: "",
    category: "",
    difficulty: "",
    duration: "",
    external_url: "",
    image_url: "",
    skills: [],
    prerequisites: [],
    tags: [],
  });

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await listCertifications(); // Corrected function name
      console.log("listCertifications result:", { data, error }); // Add this line
      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch courses.");
      toast({
        title: "Error",
        description: err.message || "Failed to fetch courses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async () => {
    if (!profile?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a course.",
        variant: "destructive",
      });
      return;
    }

    if (!newCourseForm.title.trim() || !newCourseForm.provider.trim()) {
      toast({
        title: "Missing Fields",
        description: "Title and Provider are required.",
        variant: "destructive",
      });
      return;
    }

    const { external_url, ...restOfNewCourseForm } = newCourseForm;
    const courseData: Omit<CertificationInput, 'id'> = {
      ...restOfNewCourseForm,
      externalUrl: external_url, // Map external_url to externalUrl as required by CertificationInput
      isFree: false, // Assuming a default value; add a field to the form if user input is needed
      certificationType: "course", // Assuming a default value; add a field to the form if user input is needed
      completion_count: 0, // Ensure completion_count is always sent
    };

    console.log("Sending courseData:", courseData); // Add this line for debugging

    const { data, error } = await createCertification(courseData, profile.id); // Corrected function name and added admin_id
    if (error) {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      toast({
        title: "Course Added!",
        description: `'${data.title}' has been added.`,
      });
      setIsAddingCourse(false);
      setNewCourseForm({
        title: "",
        description: "",
        provider: "",
        category: "",
        difficulty: "",
        duration: "",
        external_url: "",
        image_url: "",
        skills: [],
        prerequisites: [],
        tags: [],
      });
      fetchCourses();
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [sortBy, setSortBy] = useState("title");

  console.log("Raw Courses Data:", courses); // Add this line to inspect fetched data

  const filteredCourses = courses.filter((course: Certification) => { // Corrected type
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "All" || course.difficulty === selectedDifficulty;
    const matchesProvider =
      selectedProvider === "All" || course.provider === selectedProvider;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesProvider;
  }).sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "provider") return a.provider.localeCompare(b.provider);
    if (sortBy === "difficulty") {
      const difficultyOrder: { [key: string]: number } = {
        Beginner: 1,
        Intermediate: 2,
        Advanced: 3,
      };
      return (
        (difficultyOrder[a.difficulty] || 0) -
        (difficultyOrder[b.difficulty] || 0)
      );
    }
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0); // Assuming rating exists and is a number
    return 0;
  });

  const allCategories = ["All", ...new Set(courses.map((c) => c.category))];
  const allDifficulties = ["All", ...new Set(courses.map((c) => c.difficulty))];
  const allProviders = ["All", ...new Set(courses.map((c) => c.provider))];

  console.log("Filtered Courses Data:", filteredCourses); // Inspect filtered data here

  return (
    <div className="min-h-screen flex flex-col bg-[#000814] text-gray-100">
      {/* Header */}
      <header className="bg-[#001d3d] shadow-md py-4 px-6 flex justify-between items-center border-b border-[#003566]">
        <h1 className="text-3xl font-bold text-white">Certifications</h1>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <Button
              className="bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a]"
              onClick={() => setIsAddingCourse(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Certification
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8 bg-[#001d3d] p-6 rounded-xl shadow-xl border border-[#003566]">
          <h2 className="text-2xl font-bold text-white mb-4">
            Search & Filter Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by title, description, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#000814] border-[#003566] text-white placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div>
              <Label htmlFor="category-filter" className="sr-only">
                Category
              </Label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="difficulty-filter" className="sr-only">
                Difficulty
              </Label>
              <select
                id="difficulty-filter"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                {allDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="provider-filter" className="sr-only">
                Provider
              </Label>
              <select
                id="provider-filter"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                {allProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <Label htmlFor="sort-by" className="text-gray-300">
              Sort by:
            </Label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
            >
              <option value="title">Title</option>
              <option value="provider">Provider</option>
              <option value="difficulty">Difficulty</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        {loading && (
          <p className="text-center text-gray-400">Loading certifications...</p>
        )}
        {error && (
          <p className="text-center text-red-500">Error: {error}</p>
        )}
        {!loading && !error && filteredCourses.length === 0 && (
          <p className="text-center text-gray-400">No certifications found matching your criteria.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!loading && !error &&
            filteredCourses.map((course: Certification) => ( // Corrected type
              <Card
                key={course.id}
                className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] hover:shadow-2xl transition-shadow duration-300 flex flex-col"
              >
                <CardHeader className="relative p-0">
                  <img
                    src={course.image_url || `https://via.placeholder.com/400x200?text=${course.title}`}
                    alt={course.title}
                    className="rounded-t-xl h-48 w-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-[#ffd60a] text-[#001d3d] text-xs font-bold px-3 py-1 rounded-full">
                    {course.provider}
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <CardTitle className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {course.description || "No description provided."}
                  </CardDescription>
                  <div className="flex items-center text-gray-400 text-sm mb-2">
                    <span className="mr-1">⭐</span>{" "}
                    {(course.rating || 0).toFixed(1)} (
                    {course.total_reviews || 0} reviews)
                  </div>
                  <div className="flex items-center text-gray-400 text-sm mb-4">
                    <span className="mr-1">⏳</span> {course.duration || "N/A"}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.skills && course.skills.length > 0 ? (
                      course.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-[#003566] text-[#ffd60a] text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="bg-[#003566] text-gray-400 text-xs px-2 py-1 rounded-full">
                        No skills listed
                      </span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <Button
                      onClick={() => navigate(`/certifications/${course.id}`)}
                      className="w-full bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>

      {/* Add New Course Dialog */}
      <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Certification</DialogTitle>
            <DialogDescription>
              Fill in the details for the new certification course.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-gray-300">
                Title
              </Label>
              <Input
                id="title"
                value={newCourseForm.title}
                onChange={(e) =>
                  setNewCourseForm({ ...newCourseForm, title: e.target.value })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={newCourseForm.description}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    description: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right text-gray-300">
                Provider
              </Label>
              <Input
                id="provider"
                value={newCourseForm.provider}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    provider: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-gray-300">
                Category
              </Label>
              <Input
                id="category"
                value={newCourseForm.category}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    category: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right text-gray-300">
                Difficulty
              </Label>
              <Input
                id="difficulty"
                value={newCourseForm.difficulty}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    difficulty: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right text-gray-300">
                Duration
              </Label>
              <Input
                id="duration"
                value={newCourseForm.duration}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    duration: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="external_url" className="text-right text-gray-300">
                External URL
              </Label>
              <Input
                id="external_url"
                value={newCourseForm.external_url}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    external_url: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right text-gray-300">
                Image URL
              </Label>
              <Input
                id="image_url"
                value={newCourseForm.image_url}
                onChange={(e) =>
                  setNewCourseForm({
                    ...newCourseForm,
                    image_url: e.target.value,
                  })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skills" className="text-right text-gray-300">
                Skills (comma-separated)
              </Label>
              <Input
                id="skills"
                value={newCourseForm.skills.join(", ")}
                onChange={(e) =>
                  setNewCourseForm({ ...newCourseForm, skills: e.target.value.split(',').map(s => s.trim()) })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prerequisites" className="text-right text-gray-300">
                Prerequisites (comma-separated)
              </Label>
              <Input
                id="prerequisites"
                value={newCourseForm.prerequisites.join(", ")}
                onChange={(e) =>
                  setNewCourseForm({ ...newCourseForm, prerequisites: e.target.value.split(',').map(s => s.trim()) })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right text-gray-300">
                Tags (comma-separated)
              </Label>
              <Input
                id="tags"
                value={newCourseForm.tags.join(", ")}
                onChange={(e) =>
                  setNewCourseForm({ ...newCourseForm, tags: e.target.value.split(',').map(s => s.trim()) })
                }
                className="col-span-3 bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#003566] text-white hover:bg-[#003566] mr-2"
              onClick={() => setIsAddingCourse(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]"
              onClick={handleCreateCourse}
            >
              Add Certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}