import { supabase } from "@/lib/supabase";

export type UserProgressRow = {
  id: string;
  user_id: string;
  course_id: string; // Changed from certification_id
  status: string; // planned | in_progress | completed | paused
  enrolled_at: string | null; // Changed from started_at
  progress_percentage: number; // Added
};

export async function isTaking(userId: string, courseId: string) { // Changed certificationId to courseId
  const { data, error } = await supabase
    .from("course_enrollments") // Changed from user_progress
    .select("id, status")
    .eq("user_id", userId)
    .eq("course_id", courseId) // Changed certificationId to courseId
    .limit(1);
  if (error) return { data: false, error };
  return { data: (data as Pick<UserProgressRow, 'id' | 'status'>[] || []).some((r) => r.status === "in_progress"), error: null };
}

export async function startTaking(userId: string, courseId: string) { // Changed certificationId to courseId
  // Upsert a row with status in_progress
  const { data, error } = await supabase
    .from("course_enrollments") // Changed from user_progress
    .upsert(
      { user_id: userId, course_id: courseId, status: "in_progress", enrolled_at: new Date().toISOString(), progress_percentage: 0 }, // Removed completed_at, changed certification_id to course_id, started_at to enrolled_at, added progress_percentage
      { onConflict: "user_id,course_id" } // Changed certification_id to course_id
    );
  return { data, error };
}

export async function stopTaking(userId: string, courseId: string) { // Changed certificationId to courseId
  // Either delete row or set status back to planned; choose delete for simplicity
  const { data, error } = await supabase
    .from("course_enrollments") // Changed from user_progress
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId); // Changed certificationId to courseId
  return { data, error };
}

export async function countTakersFor(courseIds: string[]) { // Changed certificationIds to courseIds
  if (courseIds.length === 0) return {} as Record<string, number>;
  const { data, error } = await supabase
    .from("course_enrollments") // Changed from user_progress
    .select("course_id") // Changed certification_id to course_id
    .eq("status", "in_progress")
    .in("course_id", courseIds); // Changed certificationIds to courseIds
  if (error) return {} as Record<string, number>;

  const counts: Record<string, number> = {};
  (data as { course_id: string }[] || []).forEach((row) => { // Changed certification_id to course_id
    counts[row.course_id] = (counts[row.course_id] || 0) + 1; // Changed certification_id to course_id
  });
  return counts;
} 