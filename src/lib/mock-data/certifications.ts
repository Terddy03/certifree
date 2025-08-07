// 🔄 DATABASE INTEGRATION POINT
// Current: Mock certification data for frontend development
// Replace with: Supabase query - const { data } = await supabase.from('certifications').select('*')
// Table: certifications
// Dependencies: @supabase/supabase-js

export interface Certification {
  id: string;
  title: string;
  provider: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  rating: number;
  totalReviews: number;
  description: string;
  skills: string[];
  prerequisites: string[];
  imageUrl: string;
  externalUrl: string;
  isFree: boolean;
  certificationType: "Course" | "Exam" | "Project" | "Bootcamp";
  careerImpact: number; // 1-10 scale
  completionCount: number;
  tags: string[];
  lastUpdated: string;
}