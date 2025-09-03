
export interface Certification {
  id: string;
  title: string;
  description: string | null;
  admin_id: string | null; // UUID of the admin who created it
  created_at: string;
  updated_at: string;
  provider: string; // Added
  category: string; // Added
  difficulty: string; // Added
  duration: string; // Added
  rating?: number | null; // Added, optional as it might be calculated or absent initially
  total_reviews?: number | null; // Added, optional
  image_url: string | null; // Added
  external_url: string | null; // Added
  skills: string[]; // Added
  prerequisites: string[]; // Added
  tags: string[]; // Added
  is_free: boolean; // Added
  certification_type: string; // Added
  career_impact: number; // Added
  completion_count?: number; // Added
  modules?: CertiFreeModule[]; // New: Array of modules associated with the course
  type?: "public" | "certifree"; // Added to distinguish between public and CertiFree offerings
  course_id?: string | null; // Added for CertiFree type certifications
}

export interface CertiFreeModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CertiFreeLesson {
  id: string;
  module_id: string; // Changed from course_id to module_id
  title: string;
  content: string | null; // Markdown or rich text content
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CertiFreeQuiz {
  id: string;
  title: string;
  description: string | null;
  module_id?: string | null; // Optional, for module-end quizzes
  course_id?: string | null;  // Optional, for final course quiz
  order?: number | null; // To order quizzes within a module or course
  pass_percentage: number;
  type: 'module_quiz' | 'final_quiz'; // New: Type of quiz
  created_at: string;
  updated_at: string;
}

export interface CertiFreeQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | null; // Array of text for multiple choice options
  correct_answer: string;
  explanation: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CertiFreeQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score_percentage: number;
  passed: boolean;
  attempt_number: number;
  answers: Record<string, any> | null; // Store user's answers (e.g., {question_id: selected_option_id})
  submitted_at: string;
}

export interface CertiFreeEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number; // e.g., 0-100 percentage of lessons completed
  progress_array: number[] | null; // Stores an array of completed lesson orders
  completed_modules_count: number; // New: number of modules completed
  passed_quizzes: string[] | null; // New: array of quiz IDs that the user has passed
  certifications?: Certification; // Joined course data
}

export interface CertiFreeCertificate {
  id: string;
  user_id: string;
  course_id: string;
  storage_path: string;
  generated_at: string;
  certifications?: Certification; // Joined course data
} 