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
    stats jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Row Level Security (RLS) for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Corrected RLS Policy creation: Drop if exists, then create
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- 2. Certifications Table
-- Stores details about available IT certifications.
CREATE TABLE IF NOT EXISTS public.certifications (
    id text PRIMARY KEY, -- e.g., 'google-cloud-digital-leader'
    title text NOT NULL,
    provider text NOT NULL,
    category text NOT NULL,
    difficulty text NOT NULL,
    duration text NOT NULL,
    rating numeric NOT NULL,
    total_reviews integer NOT NULL,
    description text NOT NULL,
    skills text[],
    prerequisites text[],
    image_url text,
    external_url text NOT NULL,
    is_free boolean NOT NULL,
    certification_type text NOT NULL,
    career_impact integer,
    completion_count integer DEFAULT 0 NOT NULL,
    tags text[],
    last_updated timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for certifications table
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certifications are viewable by everyone." ON public.certifications;
CREATE POLICY "Certifications are viewable by everyone." ON public.certifications
  FOR SELECT USING (true);

-- 3. User Progress Table
-- Tracks individual user's progress on certifications.
CREATE TABLE IF NOT EXISTS public.user_progress (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    certification_id text REFERENCES public.certifications(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'planned' NOT NULL, -- e.g., 'planned', 'in_progress', 'completed', 'paused'
    progress_percentage integer DEFAULT 0 NOT NULL,
    time_spent_minutes integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    UNIQUE (user_id, certification_id) -- Ensures a user has only one progress entry per certification
);

-- RLS for user_progress table
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress." ON public.user_progress;
CREATE POLICY "Users can view their own progress." ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress." ON public.user_progress;
CREATE POLICY "Users can insert their own progress." ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress." ON public.user_progress;
CREATE POLICY "Users can update their own progress." ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. User Achievements Table
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

-- 5. Quiz Questions Table
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

-- 6. Quiz Attempts Table
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

-- 7. Certification Reviews Table
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
ALTER PUBLICATION supabase_realtime ADD TABLE certifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE certification_reviews;

-- 8. Admin role support and Categories table for content management
-- Add is_admin flag to profiles for role-based access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false NOT NULL;

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

-- Helper condition: current user is admin
-- Used inline in policies below via EXISTS

-- Admin policies for categories
DROP POLICY IF EXISTS "Admins can insert categories." ON public.categories;
CREATE POLICY "Admins can insert categories." ON public.categories
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins can update categories." ON public.categories;
CREATE POLICY "Admins can update categories." ON public.categories
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins can delete categories." ON public.categories;
CREATE POLICY "Admins can delete categories." ON public.categories
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Admin policies for certifications (insert/update/delete)
DROP POLICY IF EXISTS "Admins can insert certifications." ON public.certifications;
CREATE POLICY "Admins can insert certifications." ON public.certifications
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins can update certifications." ON public.certifications;
CREATE POLICY "Admins can update certifications." ON public.certifications
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins can delete certifications." ON public.certifications;
CREATE POLICY "Admins can delete certifications." ON public.certifications
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

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
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins can insert logs." ON public.app_logs;
CREATE POLICY "Admins can insert logs." ON public.app_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE app_logs;