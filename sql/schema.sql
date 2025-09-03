-- Enable UUID-OSSP extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
-- Stores user profile information, linked to Supabase Auth users.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    bio text,
    subscription_tier text DEFAULT 'free' NOT NULL,
    learning_streak integer DEFAULT 0 NOT NULL,
    total_certifications_completed integer DEFAULT 0 NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    stats jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    is_super_admin boolean DEFAULT false NOT NULL
);

-- Row Level Security (RLS) for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Corrected RLS Policy creation: Drop if exists, then create
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
-- Restrict profile visibility: user can see self; super admin can see all
CREATE POLICY "Profiles: self or super admin can view." ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
  );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Super admins can update any profile (including role flags)
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
CREATE POLICY "Super admins can update any profile." ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
  );

-- Function to handle new user sign-ups (create a profile entry)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user function after a new auth.users entry
-- CREATE TRIGGER IF NOT EXISTS is not supported for triggers without a name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Renaming and re-purposing 'certifications' table to 'certifree_courses'
ALTER TABLE public.certifications RENAME TO certifree_courses;

-- 1. CertiFree Courses Table (formerly certifications)
-- Stores details about available CertiFree courses.
CREATE TABLE IF NOT EXISTS public.certifree_courses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Additional fields from original certifications table, adjusted:
    provider text DEFAULT 'CertiFree' NOT NULL,
    category text DEFAULT 'IT Certifications' NOT NULL,
    difficulty text DEFAULT 'Beginner' NOT NULL,
    duration text DEFAULT 'Flexible' NOT NULL,
    rating numeric DEFAULT 0.0 NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    skills text[],
    prerequisites text[],
    image_url text,
    external_url text,
    is_free boolean DEFAULT true NOT NULL,
    certification_type text DEFAULT 'Course' NOT NULL,
    career_impact integer,
    completion_count integer DEFAULT 0 NOT NULL,
    tags text[]
);

-- RLS for certifree_courses table
ALTER TABLE public.certifree_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certifree courses are viewable by everyone." ON public.certifree_courses;
CREATE POLICY "Certifree courses are viewable by everyone." ON public.certifree_courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage certifree courses." ON public.certifree_courses;
CREATE POLICY "Admins can manage certifree courses." ON public.certifree_courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

-- 2. CertiFree Modules Table
-- Stores modules within a CertiFree course.
CREATE TABLE IF NOT EXISTS public.certifree_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id uuid REFERENCES public.certifree_courses(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (course_id, "order")
);

-- RLS for certifree_modules table
ALTER TABLE public.certifree_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certifree modules are viewable by enrolled users and admins." ON public.certifree_modules;
CREATE POLICY "Certifree modules are viewable by enrolled users and admins." ON public.certifree_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.certifree_enrollments ce WHERE ce.user_id = auth.uid() AND ce.course_id = certifree_modules.course_id)
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

DROP POLICY IF EXISTS "Admins can manage certifree modules." ON public.certifree_modules;
CREATE POLICY "Admins can manage certifree modules." ON public.certifree_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

-- 3. CertiFree Lessons Table
-- Stores lesson content within a CertiFree module.
CREATE TABLE IF NOT EXISTS public.certifree_lessons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id uuid REFERENCES public.certifree_modules(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    content text,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (module_id, "order")
);

-- RLS for certifree_lessons table
ALTER TABLE public.certifree_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certifree lessons are viewable by enrolled users and admins." ON public.certifree_lessons;
CREATE POLICY "Certifree lessons are viewable by enrolled users and admins." ON public.certifree_lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.certifree_modules cm JOIN public.certifree_enrollments ce ON cm.course_id = ce.course_id WHERE cm.id = certifree_lessons.module_id AND ce.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

DROP POLICY IF EXISTS "Admins can manage certifree lessons." ON public.certifree_lessons;
CREATE POLICY "Admins can manage certifree lessons." ON public.certifree_lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

-- 4. CertiFree Quizzes Table
-- Stores quizzes associated with modules or a final course quiz.
CREATE TABLE IF NOT EXISTS public.certifree_quizzes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    module_id uuid REFERENCES public.certifree_modules(id) ON DELETE CASCADE,
    course_id uuid REFERENCES public.certifree_courses(id) ON DELETE CASCADE,
    "order" integer,
    pass_percentage integer NOT NULL,
    type text NOT NULL, -- 'module_quiz' or 'final_quiz'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_quiz_per_module_or_course UNIQUE (module_id, course_id, type),
    CONSTRAINT check_quiz_type_associations CHECK (
        (type = 'module_quiz' AND module_id IS NOT NULL AND course_id IS NULL) OR
        (type = 'final_quiz' AND course_id IS NOT NULL AND module_id IS NULL)
    )
);

-- RLS for certifree_quizzes table
ALTER TABLE public.certifree_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certifree quizzes are viewable by enrolled users and admins." ON public.certifree_quizzes;
CREATE POLICY "Certifree quizzes are viewable by enrolled users and admins." ON public.certifree_quizzes
  FOR SELECT USING (
    (module_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.certifree_modules cm JOIN public.certifree_enrollments ce ON cm.course_id = ce.course_id WHERE cm.id = certifree_quizzes.module_id AND ce.user_id = auth.uid()))
    OR (course_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.certifree_enrollments ce WHERE ce.course_id = certifree_quizzes.course_id AND ce.user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

DROP POLICY IF EXISTS "Admins can manage certifree quizzes." ON public.certifree_quizzes;
CREATE POLICY "Admins can manage certifree quizzes." ON public.certifree_quizzes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

-- 5. CertiFree Quiz Questions Table
-- Stores individual quiz questions.
CREATE TABLE IF NOT EXISTS public.certifree_quiz_questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id uuid REFERENCES public.certifree_quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text text NOT NULL,
    question_type text NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
    options text[],
    correct_answer text NOT NULL,
    explanation text,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (quiz_id, "order")
);

-- RLS for certifree_quiz_questions table
ALTER TABLE public.certifree_quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certifree quiz questions are viewable by enrolled users and admins." ON public.certifree_quiz_questions;
CREATE POLICY "Certifree quiz questions are viewable by enrolled users and admins." ON public.certifree_quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.certifree_quizzes cq JOIN public.certifree_enrollments ce ON cq.course_id = ce.course_id WHERE cq.id = certifree_quiz_questions.quiz_id AND ce.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.certifree_quizzes cq JOIN public.certifree_modules cm ON cq.module_id = cm.id JOIN public.certifree_enrollments ce ON cm.course_id = ce.course_id WHERE cq.id = certifree_quiz_questions.quiz_id AND ce.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

DROP POLICY IF EXISTS "Admins can manage certifree quiz questions." ON public.certifree_quiz_questions;
CREATE POLICY "Admins can manage certifree quiz questions." ON public.certifree_quiz_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

-- 6. CertiFree Quiz Attempts Table
-- Records a user's attempt at a quiz.
CREATE TABLE IF NOT EXISTS public.certifree_quiz_attempts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id uuid REFERENCES public.certifree_quizzes(id) ON DELETE CASCADE NOT NULL,
    score_percentage integer NOT NULL,
    passed boolean NOT NULL,
    attempt_number integer NOT NULL,
    answers jsonb, -- Stores a mapping of question_id to user_answer
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for certifree_quiz_attempts table
ALTER TABLE public.certifree_quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own quiz attempts." ON public.certifree_quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts." ON public.certifree_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quiz attempts." ON public.certifree_quiz_attempts;
CREATE POLICY "Users can insert their own quiz attempts." ON public.certifree_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all quiz attempts (for auditing/reporting)
DROP POLICY IF EXISTS "Admins can view all quiz attempts." ON public.certifree_quiz_attempts;
CREATE POLICY "Admins can view all quiz attempts." ON public.certifree_quiz_attempts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

-- 7. CertiFree Enrollments Table (formerly user_progress)
-- Tracks individual user's progress on CertiFree courses.
CREATE TABLE IF NOT EXISTS public.certifree_enrollments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id uuid REFERENCES public.certifree_courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    progress integer DEFAULT 0 NOT NULL, -- e.g., 0-100 percentage of course completion
    progress_array integer[] DEFAULT '{}'::integer[] NOT NULL, -- Stores an array of completed lesson orders
    completed_modules_count integer DEFAULT 0 NOT NULL,
    passed_quizzes uuid[] DEFAULT '{}'::uuid[] NOT NULL, -- Stores an array of quiz IDs that the user has passed
    UNIQUE (user_id, course_id) -- Ensures a user has only one enrollment entry per course
);

-- RLS for certifree_enrollments table
ALTER TABLE public.certifree_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own enrollments." ON public.certifree_enrollments;
CREATE POLICY "Users can view their own enrollments." ON public.certifree_enrollments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own enrollments." ON public.certifree_enrollments;
CREATE POLICY "Users can insert their own enrollments." ON public.certifree_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own enrollments." ON public.certifree_enrollments;
CREATE POLICY "Users can update their own enrollments." ON public.certifree_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all enrollments (for auditing/reporting)
DROP POLICY IF EXISTS "Admins can view all enrollments." ON public.certifree_enrollments;
CREATE POLICY "Admins can view all enrollments." ON public.certifree_enrollments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

-- 8. CertiFree Certificates Table
-- Stores records of generated certificates for completed courses.
CREATE TABLE IF NOT EXISTS public.certifree_certificates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id uuid REFERENCES public.certifree_courses(id) ON DELETE CASCADE NOT NULL,
    storage_path text NOT NULL, -- Path to the generated certificate file in Supabase Storage
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    public_url text UNIQUE, -- Publicly accessible URL for the certificate
    UNIQUE (user_id, course_id) -- Ensures a user gets only one certificate per course
);

-- RLS for certifree_certificates table
ALTER TABLE public.certifree_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Certificates are viewable by owner or publicly if URL exists." ON public.certifree_certificates;
CREATE POLICY "Certificates are viewable by owner or publicly if URL exists." ON public.certifree_certificates
  FOR SELECT USING (
    auth.uid() = user_id OR public_url IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can insert their own certificates." ON public.certifree_certificates;
CREATE POLICY "Users can insert their own certificates." ON public.certifree_certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can manage certificates (for re-generation, revocation, etc.)
DROP POLICY IF EXISTS "Admins can manage certificates." ON public.certifree_certificates;
CREATE POLICY "Admins can manage certificates." ON public.certifree_certificates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true))
  );

-- 9. User Achievements Table
-- Records achievements unlocked by users.
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    icon_name text,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    category text NOT NULL -- e.g., 'learning', 'milestone', 'streak', 'social'
);

-- RLS for user_achievements table
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements." ON public.user_achievements;
CREATE POLICY "Users can view their own achievements." ON public.user_achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own achievements." ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements." ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Quiz Questions Table
-- Stores individual quiz questions for certifications.
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id text PRIMARY KEY, -- e.g., 'q-001'
    certification_id text REFERENCES public.certifications(id) ON DELETE CASCADE NOT NULL,
    question_text text NOT NULL,
    question_type text NOT NULL, -- e.g., 'multiple_choice', 'true_false', 'short_answer'
    options text[] NOT NULL,
    correct_answer text NOT NULL,
    explanation text,
    difficulty_level text NOT NULL, -- e.g., 'easy', 'medium', 'hard'
    points integer NOT NULL,
    module text
);

-- RLS for quiz_questions table
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quiz questions are viewable by everyone." ON public.quiz_questions;
CREATE POLICY "Quiz questions are viewable by everyone." ON public.quiz_questions
  FOR SELECT USING (true);

-- 11. Quiz Attempts Table
-- Records a user's attempt at a quiz.
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    certification_id text REFERENCES public.certifications(id) ON DELETE CASCADE NOT NULL,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL,
    score_percentage integer NOT NULL,
    time_taken_minutes integer,
    answers jsonb NOT NULL, -- Stores a mapping of question_id to user_answer
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);

-- RLS for quiz_attempts table
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quiz attempts." ON public.quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts." ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quiz attempts." ON public.quiz_attempts;
CREATE POLICY "Users can insert their own quiz attempts." ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Certification Reviews Table
-- Stores user reviews for certifications.
CREATE TABLE IF NOT EXISTS public.certification_reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    certification_id text REFERENCES public.certifications(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL, -- 1-5 stars
    title text NOT NULL,
    review_text text,
    would_recommend boolean,
    difficulty_rating integer, -- 1-5 scale
    time_to_complete_hours integer,
    helpful_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tags text[]
);

-- RLS for certification_reviews table
ALTER TABLE public.certification_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.certification_reviews;
CREATE POLICY "Reviews are viewable by everyone." ON public.certification_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.certification_reviews;
CREATE POLICY "Users can insert their own reviews." ON public.certification_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews." ON public.certification_reviews;
CREATE POLICY "Users can update their own reviews." ON public.certification_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Set up Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE certifree_certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE certification_reviews;

-- 8. Admin role support and Categories table for content management
-- Admin and Super Admin flags already defined in profiles above

-- Categories table to manage certification categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text UNIQUE NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
CREATE POLICY "Categories are viewable by everyone." ON public.categories
  FOR SELECT USING (true);

-- Admin or Super Admin policies for categories
DROP POLICY IF EXISTS "Admins can insert categories." ON public.categories;
CREATE POLICY "Admins or Super Admins can insert categories." ON public.categories
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

DROP POLICY IF EXISTS "Admins can update categories." ON public.categories;
CREATE POLICY "Admins or Super Admins can update categories." ON public.categories
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

DROP POLICY IF EXISTS "Admins can delete categories." ON public.categories;
CREATE POLICY "Admins or Super Admins can delete categories." ON public.categories
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

-- Admin policies for certifications (insert/update/delete)
DROP POLICY IF EXISTS "Admins can insert certifications." ON public.certifications;
CREATE POLICY "Admins or Super Admins can insert certifications." ON public.certifications
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

DROP POLICY IF EXISTS "Admins can update certifications." ON public.certifications;
CREATE POLICY "Admins or Super Admins can update certifications." ON public.certifications
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

DROP POLICY IF EXISTS "Admins can delete certifications." ON public.certifications;
CREATE POLICY "Admins or Super Admins can delete certifications." ON public.certifications
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

-- 9. User Favorites Table
-- Stores which certifications a user has favorited
CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    certification_id text REFERENCES public.certifications(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, certification_id)
);

-- RLS for user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites." ON public.user_favorites;
CREATE POLICY "Users can view their own favorites." ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites." ON public.user_favorites;
CREATE POLICY "Users can add their own favorites." ON public.user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites." ON public.user_favorites;
CREATE POLICY "Users can delete their own favorites." ON public.user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 10. App Logs Table
CREATE TABLE IF NOT EXISTS public.app_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details text
);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Logs are viewable by admins only." ON public.app_logs;
CREATE POLICY "Logs are viewable by admins only." ON public.app_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

DROP POLICY IF EXISTS "Admins can insert logs." ON public.app_logs;
CREATE POLICY "Admins can insert logs." ON public.app_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)));

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE app_logs;