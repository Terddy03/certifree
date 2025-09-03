import { supabase } from "@/lib/supabase";

export interface CertiFreeCertificate {
  id: string;
  userId: string;
  courseId: string;
  certificateUrl: string;
  generatedAt: string;
  uniqueCode: string;
}

export async function enrollInCourse(userId: string, courseId: string) {
  return supabase.from('course_enrollments').insert({
    user_id: userId,
    course_id: courseId,
  });
}

export async function getEnrollment(userId: string, courseId: string) {
  return supabase.from('course_enrollments').select('*').eq('user_id', userId).eq('course_id', courseId).single();
}

export async function updateEnrollmentProgress(enrollmentId: string, progressPercentage: number) {
  return supabase.from('course_enrollments').update({ progress_percentage: progressPercentage, last_activity_at: new Date().toISOString() }).eq('id', enrollmentId);
}

export async function markLessonComplete(enrollmentId: string, lessonId: string) {
  return supabase.from('lesson_progress').insert({
    enrollment_id: enrollmentId,
    lesson_id: lessonId,
    is_completed: true,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'enrollment_id,lesson_id' }).update({ is_completed: true, completed_at: new Date().toISOString() });
}

export async function getLessonProgress(enrollmentId: string, lessonId: string) {
  return supabase.from('lesson_progress').select('*').eq('enrollment_id', enrollmentId).eq('lesson_id', lessonId).single();
}

export async function listUserEnrollments(userId: string) {
  return supabase.from('course_enrollments').select('*, courses(*)').eq('user_id', userId);
}

export async function listUserCertificates(userId: string) {
  return supabase.from('certificates').select('*').eq('user_id', userId);
}

export async function createCertificate(userId: string, courseId: string, certificateUrl: string) {
  return supabase.from('certificates').insert({
    user_id: userId,
    course_id: courseId,
    certificate_url: certificateUrl,
  });
} 