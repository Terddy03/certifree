import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, Edit, Trash, ChevronDown, CheckCircle, FileText, Download, Plus, Clock, ListChecks } from 'lucide-react';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  getCourse,
  listCertiFreeModulesByCourse,
  createCertiFreeModule,
  updateCertiFreeModule,
  deleteCertiFreeModule,
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  createCertiFreeQuiz,
  listCertiFreeQuizzesByModule,
  listCertiFreeQuizzesByCourse,
  updateCertiFreeQuiz,
  deleteCertiFreeQuiz,
  createCertiFreeQuizQuestion,
  listCertiFreeQuizQuestionsByQuiz,
  updateCertiFreeQuizQuestion,
  deleteCertiFreeQuizQuestion,
  createCertiFreeQuizAttempt,
  listUserCertiFreeQuizAttempts,
  enrollUserInCourse,
  getCertiFreeEnrollment,
  updateCertiFreeEnrollmentProgress,
  createCertiFreeCertificate,
  uploadCertiFreeCertificate,
  listUserCertiFreeCertificates,
  getCertiFreeCertificatePublicUrl,
  updateCourse,
} from "@/lib/certifree-api";
import { CertiFreeCourse, CertiFreeModule, CertiFreeLesson, CertiFreeEnrollment, CertiFreeCertificate, CertiFreeQuiz, CertiFreeQuizQuestion, CertiFreeQuizAttempt } from "@/lib/types/certifree";
import { supabase } from "@/lib/supabase";

const CourseDetailLogic = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = !!profile?.isAdmin;

  const [course, setCourse] = useState<CertiFreeCourse | null>(null);
  const [modules, setModules] = useState<CertiFreeModule[]>([]);
  const [lessons, setLessons] = useState<CertiFreeLesson[]>([]);
  const [quizzes, setQuizzes] = useState<CertiFreeQuiz[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<CertiFreeQuizQuestion[]>([]);
  const [enrollment, setEnrollment] = useState<CertiFreeEnrollment | null>(null);
  const [certificate, setCertificate] = useState<CertiFreeCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    content: '',
    order: 0,
    moduleId: '',
  });

  const [editingLesson, setEditingLesson] = useState<CertiFreeLesson | null>(null);
  const [editingLessonForm, setEditingLessonForm] = useState({
    title: '',
    content: '',
    order: 0,
    moduleId: '',
  });
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleForm, setNewModuleForm] = useState({
    title: '',
    description: '',
    order: 0,
  });

  const [editingModule, setEditingModule] = useState<CertiFreeModule | null>(null);
  const [editingModuleForm, setEditingModuleForm] = useState({
    title: '',
    description: '',
    order: 0,
  });
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [newQuizForm, setNewQuizForm] = useState({
    title: '',
    description: '',
    pass_percentage: 80,
    type: 'module_quiz' as 'module_quiz' | 'final_quiz',
    moduleId: '',
  });

  const [editingQuiz, setEditingQuiz] = useState<CertiFreeQuiz | null>(null);
  const [editingQuizForm, setEditingQuizForm] = useState({
    title: '',
    description: '',
    pass_percentage: 80,
    type: 'module_quiz' as 'module_quiz' | 'final_quiz',
  });

  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [currentQuizForQuestion, setCurrentQuizForQuestion] = useState<CertiFreeQuiz | null>(null);
  const [newQuestionForm, setNewQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    order: 0,
  });

  const [editingQuestion, setEditingQuestion] = useState<CertiFreeQuizQuestion | null>(null);
  const [editingQuestionForm, setEditingQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    order: 0,
  });
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [currentQuizAttempt, setCurrentQuizAttempt] = useState<CertiFreeQuizAttempt | null>(null);
  const [showQuizResultsModal, setShowQuizResultsModal] = useState(false);

  const fetchCourseData = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: courseData, error: courseError } = await getCourse(courseId);
      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await listCertiFreeModulesByCourse(courseId);
      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      const allLessons: CertiFreeLesson[] = [];
      for (const module of modulesData || []) {
        const { data: lessonsData, error: lessonsError } = await listLessons(module.id);
        if (lessonsError) throw lessonsError;
        allLessons.push(...(lessonsData || []));
      }
      setLessons(allLessons.sort((a, b) => a.order - b.order));

      const { data: quizzesData, error: quizzesError } = await listCertiFreeQuizzesByCourse(courseId);
      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      const allQuizQuestions: CertiFreeQuizQuestion[] = [];
      for (const quiz of quizzesData || []) {
        const { data: questionsData, error: questionsError } = await listCertiFreeQuizQuestionsByQuiz(quiz.id);
        if (questionsError) throw questionsError;
        allQuizQuestions.push(...(questionsData || []));
      }
      setQuizQuestions(allQuizQuestions.sort((a, b) => a.order - b.order));

      if (user?.id) {
        const { data: enrollmentData, error: enrollmentError } = await getCertiFreeEnrollment(user.id, courseId);
        if (enrollmentError && enrollmentError.message !== 'No rows found') throw enrollmentError;
        setEnrollment(enrollmentData);

        const { data: certificatesData, error: certificatesError } = await listUserCertiFreeCertificates(user.id);
        if (certificatesError) throw certificatesError;
        const currentCourseCertificate = certificatesData?.find(cert => cert.course_id === courseId);
        setCertificate(currentCourseCertificate || null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load course details.");
      toast({ title: "Error", description: err.message || "Failed to load course details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId, user?.id]);

  const calculateOverallProgress = () => {
    if (!enrollment || modules.length === 0) return 0;

    let completedLessonsCount = 0;
    let totalLessonsCount = 0;
    let passedModuleQuizzesCount = 0;

    modules.forEach(module => {
      const moduleLessons = lessons.filter(lesson => lesson.module_id === module.id);
      totalLessonsCount += moduleLessons.length;
      completedLessonsCount += moduleLessons.filter(lesson =>
        (enrollment.progress_array || []).includes(lesson.order) // Assuming lesson.order is unique across the course
      ).length;

      const moduleQuiz = quizzes.find(q => q.module_id === module.id);
      if (moduleQuiz && (enrollment.passed_quizzes || []).includes(moduleQuiz.id)) {
        passedModuleQuizzesCount++;
      }
    });

    const totalModules = modules.length;
    const totalQuizzes = quizzes.length; // Includes module quizzes and final quiz

    // Weight modules/lessons higher than quizzes, but ensure quizzes are required for 100%
    const lessonProgressWeight = 0.7;
    const quizProgressWeight = 0.3;

    const lessonProgress = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) : 0;
    const moduleQuizProgress = totalModules > 0 ? (passedModuleQuizzesCount / totalModules) : 0;
    
    // For overall progress, let's consider lessons and module quizzes.
    // The final quiz completion will gate the certificate directly.
    let overallProgress = (lessonProgress * 0.7 + moduleQuizProgress * 0.3) * 100; // Example weighting

    // Ensure progress doesn't exceed 99% until final quiz is passed
    const finalQuiz = quizzes.find(q => q.type === 'final_quiz');
    const hasPassedFinalQuiz = finalQuiz && (enrollment.passed_quizzes || []).includes(finalQuiz.id);

    if (overallProgress === 100 && !hasPassedFinalQuiz) {
      overallProgress = 99;
    }

    return Math.round(overallProgress);
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleLessons = lessons.filter(lesson => lesson.module_id === moduleId);
    if (moduleLessons.length === 0) return 0;
    const completedModuleLessons = moduleLessons.filter(lesson =>
      (enrollment?.progress_array || []).includes(lesson.order)
    ).length;
    return Math.round((completedModuleLessons / moduleLessons.length) * 100);
  };

  const isModuleCompleted = (moduleId: string) => {
    const moduleLessons = lessons.filter(lesson => lesson.module_id === moduleId);
    const moduleQuiz = quizzes.find(q => q.module_id === moduleId);

    const allLessonsCompleted = moduleLessons.every(lesson =>
      (enrollment?.progress_array || []).includes(lesson.order)
    );
    const quizPassed = moduleQuiz ? (enrollment?.passed_quizzes || []).includes(moduleQuiz.id) : true; // If no quiz, consider it passed

    return allLessonsCompleted && quizPassed;
  };

  const isModuleLocked = (moduleOrder: number) => {
    if (!enrollment || moduleOrder === 1) return false; // First module is never locked
    
    const previousModule = modules.find(m => m.order === moduleOrder - 1);
    if (!previousModule) return false; // Should not happen if orders are sequential

    return !isModuleCompleted(previousModule.id);
  };

  const isFinalQuizLocked = () => {
    const allModulesCompleted = modules.every(module => isModuleCompleted(module.id));
    return !allModulesCompleted;
  };

  const handleEnroll = async () => {
    if (!user?.id || !courseId) return;
    const { data, error } = await enrollUserInCourse(user.id, courseId);
    if (error) {
      toast({ title: "Enrollment failed", description: error.message, variant: "destructive" });
    } else if (data) {
      setEnrollment(data);
      toast({ title: "Enrolled!", description: "You are now enrolled in this course." });
    }
  };

  const handleMarkLessonComplete = async (lessonOrder: number, isChecked: boolean) => {
    if (!user?.id || !enrollment) return;

    const currentCompletedLessons = new Set(enrollment.progress_array || []);
    if (isChecked) {
      currentCompletedLessons.add(lessonOrder);
    } else {
      currentCompletedLessons.delete(lessonOrder);
    }

    const newProgressArray = Array.from(currentCompletedLessons).sort((a, b) => a - b);

    // Recalculate completed modules count
    let newCompletedModulesCount = 0;
    modules.forEach(module => {
      const moduleLessons = lessons.filter(lesson => lesson.module_id === module.id);
      const allModuleLessonsCompleted = moduleLessons.every(lesson => newProgressArray.includes(lesson.order));
      const moduleQuiz = quizzes.find(q => q.module_id === module.id);
      const moduleQuizPassed = moduleQuiz ? (enrollment.passed_quizzes || []).includes(moduleQuiz.id) : true;

      if (allModuleLessonsCompleted && moduleQuizPassed) {
        newCompletedModulesCount++;
      }
    });

    const overallProgressPercentage = calculateOverallProgress(); // Re-calculate overall progress based on new state

    const { data, error } = await updateCertiFreeEnrollmentProgress(
      enrollment.id,
      overallProgressPercentage,
      newProgressArray,
      newCompletedModulesCount,
      enrollment.passed_quizzes || [],
      overallProgressPercentage === 100 && (quizzes.find(q => q.type === 'final_quiz') ? (enrollment.passed_quizzes || []).includes(quizzes.find(q => q.type === 'final_quiz')!.id) : true) ? new Date().toISOString() : null
    );
    if (error) {
      toast({ title: "Progress update failed", description: error.message, variant: "destructive" });
    } else if (data) {
      setEnrollment(data);
      toast({ title: "Progress Updated", description: `You are ${data.progress}% complete.` });
      // No longer automatically trigger certificate here, as final quiz is required.
    }
  };

  const handleStartQuiz = (quiz: CertiFreeQuiz) => {
    setCurrentQuiz(quiz);
    const questions = quizQuestions.filter(q => q.quiz_id === quiz.id).sort((a, b) => a.order - b.order);
    setCurrentQuizQuestions(questions);
    setUserAnswers({});
    setShowQuizResultsModal(false);
    setCurrentQuizAttempt(null);
    setIsQuizModalOpen(true);
  };

  const handleSubmitQuiz = async () => {
    if (!user?.id || !currentQuiz || !enrollment) return;

    setIsSubmittingQuiz(true);
    let correctAnswersCount = 0;

    currentQuizQuestions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        if (userAnswer === q.correct_answer) {
          correctAnswersCount++;
        }
      } else if (q.question_type === 'short_answer') {
        // For short answer, a simple case-insensitive match for now
        if (userAnswer?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
          correctAnswersCount++;
        }
      }
    });

    const scorePercentage = (correctAnswersCount / currentQuizQuestions.length) * 100;
    const passed = scorePercentage >= currentQuiz.pass_percentage;

    const { data: attemptData, error: attemptError } = await createCertiFreeQuizAttempt({
      user_id: user.id,
      quiz_id: currentQuiz.id,
      score_percentage: scorePercentage,
      passed: passed,
      attempt_number: (enrollment.passed_quizzes || []).filter(qId => qId === currentQuiz.id).length + 1, // Simple attempt numbering
      answers: userAnswers,
    });

    if (attemptError) {
      toast({ title: "Quiz Submission Failed", description: attemptError.message, variant: "destructive" });
      setIsSubmittingQuiz(false);
      return;
    }

    setLastQuizAttempt(attemptData);

    // Update enrollment with passed quiz
    const newPassedQuizzes = new Set(enrollment.passed_quizzes || []);
    if (passed) {
      newPassedQuizzes.add(currentQuiz.id);
    }

    let newCompletedModulesCount = 0;
    modules.forEach(module => {
      const moduleLessons = lessons.filter(lesson => lesson.module_id === module.id);
      const allModuleLessonsCompleted = moduleLessons.every(lesson => (enrollment.progress_array || []).includes(lesson.order));
      const moduleQuiz = quizzes.find(q => q.module_id === module.id);
      const moduleQuizPassed = moduleQuiz ? newPassedQuizzes.has(moduleQuiz.id) : true;

      if (allModuleLessonsCompleted && moduleQuizPassed) {
        newCompletedModulesCount++;
      }
    });

    const overallProgressPercentage = calculateOverallProgress(); // Re-calculate overall progress

    const { data: updatedEnrollment, error: updateError } = await updateCertiFreeEnrollmentProgress(
      enrollment.id,
      overallProgressPercentage,
      enrollment.progress_array || [],
      newCompletedModulesCount,
      Array.from(newPassedQuizzes),
      overallProgressPercentage === 100 && (quizzes.find(q => q.type === 'final_quiz') ? newPassedQuizzes.has(quizzes.find(q => q.type === 'final_quiz')!.id) : true) ? new Date().toISOString() : null
    );

    if (updateError) {
      toast({ title: "Enrollment Update Failed", description: updateError.message, variant: "destructive" });
    } else if (updatedEnrollment) {
      setEnrollment(updatedEnrollment);
      toast({ title: "Quiz Submitted!", description: passed ? "Congratulations, you passed!" : "You did not pass. Please try again." });
    }

    setShowQuizResultsModal(true);
    setIsSubmittingQuiz(false);
  };

  const handleGenerateCertificate = async () => {
    if (!user?.id || !courseId || !enrollment) {
      toast({ title: "Cannot Generate Certificate", description: "Enrollment data missing.", variant: "destructive" });
      return;
    }

    const allModulesCompleted = modules.every(module => isModuleCompleted(module.id));
    const finalQuiz = quizzes.find(q => q.type === 'final_quiz');
    const hasPassedFinalQuiz = finalQuiz ? (enrollment.passed_quizzes || []).includes(finalQuiz.id) : true; // If no final quiz, consider it passed

    if (!allModulesCompleted || !hasPassedFinalQuiz) {
      toast({ title: "Cannot Generate Certificate", description: "You must complete all modules and pass the final quiz to generate a certificate.", variant: "destructive" });
      return;
    }

    toast({ title: "Generating Certificate", description: "Please wait while your certificate is being prepared..." });

    const dummyPdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Contents 4 0 R/Parent 2 0 R>>endobj 4 0 obj<</Length 110>>stream\nBT\n/F1 24 Tf\n100 700 Td\n(CertiFree Certificate of Completion)\nET\nBT\n/F1 12 Tf\n100 650 Td\n(This certifies that ${profile?.full_name || user.email} has successfully completed the course:)\nET\nBT\n/F1 18 Tf\n100 600 Td\n(${course?.title})\nET\nendstream\nendobj\nxref\n0 5\n0000000000 00000 n\n0000000010 00000 n\n0000000053 00000 n\n0000000139 00000 n\n0000000300 00000 n\ntrailer<</Size 5/Root 1 0 R>>startxref\n395\n%%EOF`;
    const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
    const dummyFile = new File([blob], `certificate-${courseId}-${user.id}.pdf`, { type: 'application/pdf' });

    const { url, error: uploadError } = await uploadCertiFreeCertificate(dummyFile, user.id, courseId);

    if (uploadError) {
      toast({ title: "Certificate Upload Failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    if (url) {
      const { data, error } = await createCertiFreeCertificate(user.id, courseId, url);
      if (error) {
        toast({ title: "Certificate Record Failed", description: error.message, variant: "destructive" });
      } else if (data) {
        setCertificate(data);
        toast({ title: "Certificate Generated!", description: "Your certificate is now available." });
      }
    }
  };

  const handleDownloadCertificate = () => {
    if (certificate?.storage_path) {
      window.open(certificate.storage_path, '_blank');
    }
  };

  // Module Management Handlers (Admin Only)
  const handleAddModule = async () => {
    if (!isAdmin || !courseId) return;
    if (!newModuleForm.title.trim()) {
      toast({ title: "Title Required", description: "Module title cannot be empty.", variant: "destructive" });
      return;
    }

    const { data, error } = await createCertiFreeModule({
      course_id: courseId,
      title: newModuleForm.title,
      description: newModuleForm.description,
      order: newModuleForm.order || modules.length + 1,
    });
    if (error) {
      toast({ title: "Failed to add module", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Module Added!", description: `'${data.title}' has been added.` });
      setIsAddingModule(false);
      setNewModuleForm({ title: '', description: '', order: 0 });
      fetchCourseData();
    }
  };

  const handleOpenEditModule = (module: CertiFreeModule) => {
    setEditingModule(module);
    setEditingModuleForm({ title: module.title, description: module.description || '', order: module.order });
  };

  const handleSaveEditModule = async () => {
    if (!isAdmin || !editingModule) return;
    if (!editingModuleForm.title.trim()) {
      toast({ title: "Title Required", description: "Module title cannot be empty.", variant: "destructive" });
      return;
    }

    const { data, error } = await updateCertiFreeModule(editingModule.id, {
      title: editingModuleForm.title,
      description: editingModuleForm.description,
      order: editingModuleForm.order,
    });
    if (error) {
      toast({ title: "Failed to update module", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Module Updated!", description: `'${data.title}' has been updated.` });
      setEditingModule(null);
      setEditingModuleForm({ title: '', description: '', order: 0 });
      fetchCourseData();
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete module "${moduleTitle}"? This will also delete all associated lessons and quizzes.`)) return;

    setDeletingModuleId(moduleId);
    const { error } = await deleteCertiFreeModule(moduleId);
    if (error) {
      toast({ title: "Failed to delete module", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Module Deleted!", description: `'${moduleTitle}' has been removed.` });
      fetchCourseData();
    }
    setDeletingModuleId(null);
  };

  // Lesson Management Handlers (Admin Only)
  const handleAddLesson = async () => {
    if (!isAdmin || !newLessonForm.moduleId || !courseId) return;
    if (!newLessonForm.title.trim()) {
      toast({ title: "Title Required", description: "Lesson title cannot be empty.", variant: "destructive" });
      return;
    }

    const { data, error } = await createLesson({
      module_id: newLessonForm.moduleId,
      title: newLessonForm.title,
      content: newLessonForm.content,
      order: newLessonForm.order || lessons.filter(l => l.module_id === newLessonForm.moduleId).length + 1,
    });
    if (error) {
      toast({ title: "Failed to add lesson", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Lesson Added!", description: `'${data.title}' has been added.` });
      setIsAddingLesson(false);
      setNewLessonForm({ title: '', content: '', order: 0, moduleId: '', });
      fetchCourseData();
    }
  };

  const handleOpenEditLesson = (lesson: CertiFreeLesson) => {
    setEditingLesson(lesson);
    setEditingLessonForm({ title: lesson.title, content: lesson.content || '', order: lesson.order, moduleId: lesson.module_id });
  };

  const handleSaveEditLesson = async () => {
    if (!isAdmin || !editingLesson) return;
    if (!editingLessonForm.title.trim()) {
      toast({ title: "Title Required", description: "Lesson title cannot be empty.", variant: "destructive" });
      return;
    }

    const { data, error } = await updateLesson(editingLesson.id, {
      title: editingLessonForm.title,
      content: editingLessonForm.content,
      order: editingLessonForm.order,
      module_id: editingLessonForm.moduleId,
    });
    if (error) {
      toast({ title: "Failed to update lesson", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Lesson Updated!", description: `'${data.title}' has been updated.` });
      setEditingLesson(null);
      setEditingLessonForm({ title: '', content: '', order: 0, moduleId: '', });
      fetchCourseData();
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete lesson "${lessonTitle}"?`)) return;

    setDeletingLessonId(lessonId);
    const { error } = await deleteLesson(lessonId);
    if (error) {
      toast({ title: "Failed to delete lesson", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lesson Deleted!", description: `'${lessonTitle}' has been removed.` });
      fetchCourseData();
    }
    setDeletingLessonId(null);
  };

  // Quiz Management Handlers (Admin Only)
  const handleAddQuiz = async () => {
    if (!isAdmin || (!newQuizForm.moduleId && newQuizForm.type === 'module_quiz') || (!courseId && newQuizForm.type === 'final_quiz')) return;
    if (!newQuizForm.title.trim()) {
      toast({ title: "Title Required", description: "Quiz title cannot be empty.", variant: "destructive" });
      return;
    }

    const quizPayload = {
      title: newQuizForm.title,
      description: newQuizForm.description,
      pass_percentage: newQuizForm.pass_percentage,
      type: newQuizForm.type,
      ...(newQuizForm.type === 'module_quiz' && { module_id: newQuizForm.moduleId }),
      ...(newQuizForm.type === 'final_quiz' && { course_id: courseId }),
    };

    const { data, error } = await createCertiFreeQuiz(quizPayload as Omit<CertiFreeQuiz, 'id' | 'created_at' | 'updated_at'>);
    if (error) {
      toast({ title: "Failed to add quiz", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Quiz Added!", description: `'${data.title}' has been added.` });
      setIsAddingQuiz(false);
      setNewQuizForm({ title: '', description: '', pass_percentage: 80, type: 'module_quiz', moduleId: '', });
      fetchCourseData();
    }
  };

  const handleOpenEditQuiz = (quiz: CertiFreeQuiz) => {
    setEditingQuiz(quiz);
    setEditingQuizForm({ title: quiz.title, description: quiz.description || '', pass_percentage: quiz.pass_percentage, type: quiz.type });
  };

  const handleSaveEditQuiz = async () => {
    if (!isAdmin || !editingQuiz) return;
    if (!editingQuizForm.title.trim()) {
      toast({ title: "Title Required", description: "Quiz title cannot be empty.", variant: "destructive" });
      return;
    }

    const { data, error } = await updateCertiFreeQuiz(editingQuiz.id, editingQuizForm);
    if (error) {
      toast({ title: "Failed to update quiz", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Quiz Updated!", description: `'${data.title}' has been updated.` });
      setEditingQuiz(null);
      setEditingQuizForm({ title: '', description: '', pass_percentage: 80, type: 'module_quiz' });
      fetchCourseData();
    }
  };

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete quiz "${quizTitle}"? This will also delete all associated questions and attempts.`)) return;

    setDeletingQuizId(quizId);
    const { error } = await deleteCertiFreeQuiz(quizId);
    if (error) {
      toast({ title: "Failed to delete quiz", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quiz Deleted!", description: `'${quizTitle}' has been removed.` });
      fetchCourseData();
    }
    setDeletingQuizId(null);
  };

  // Quiz Question Management Handlers (Admin Only)
  const handleAddQuestion = async () => {
    if (!isAdmin || !currentQuizForQuestion) return;
    if (!newQuestionForm.question_text.trim()) {
      toast({ title: "Question Required", description: "Question text cannot be empty.", variant: "destructive" });
      return;
    }
    if (newQuestionForm.question_type !== 'short_answer' && !newQuestionForm.correct_answer.trim()) {
      toast({ title: "Correct Answer Required", description: "Please provide the correct answer.", variant: "destructive" });
      return;
    }

    const { data, error } = await createCertiFreeQuizQuestion({
      quiz_id: currentQuizForQuestion.id,
      question_text: newQuestionForm.question_text,
      question_type: newQuestionForm.question_type,
      options: newQuestionForm.question_type === 'multiple_choice' ? newQuestionForm.options.filter(opt => opt.trim() !== '') : null,
      correct_answer: newQuestionForm.correct_answer,
      explanation: newQuestionForm.explanation,
      order: newQuestionForm.order || quizQuestions.filter(q => q.quiz_id === currentQuizForQuestion.id).length + 1,
    });
    if (error) {
      toast({ title: "Failed to add question", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Question Added!", description: `Question ${data.order} has been added.` });
      setIsAddingQuestion(false);
      setNewQuestionForm({ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', explanation: '', order: 0 });
      fetchCourseData();
    }
  };

  const handleOpenEditQuestion = (question: CertiFreeQuizQuestion) => {
    setEditingQuestion(question);
    setEditingQuestionForm({ ...question, options: question.options || ['', '', '', ''] });
  };

  const handleSaveEditQuestion = async () => {
    if (!isAdmin || !editingQuestion) return;
    if (!editingQuestionForm.question_text.trim()) {
      toast({ title: "Question Required", description: "Question text cannot be empty.", variant: "destructive" });
      return;
    }
    if (editingQuestionForm.question_type !== 'short_answer' && !editingQuestionForm.correct_answer.trim()) {
      toast({ title: "Correct Answer Required", description: "Please provide the correct answer.", variant: "destructive" });
      return;
    }

    const { data, error } = await updateCertiFreeQuizQuestion(editingQuestion.id, {
      question_text: editingQuestionForm.question_text,
      question_type: editingQuestionForm.question_type,
      options: editingQuestionForm.question_type === 'multiple_choice' ? editingQuestionForm.options.filter(opt => opt.trim() !== '') : null,
      correct_answer: editingQuestionForm.correct_answer,
      explanation: editingQuestionForm.explanation,
      order: editingQuestionForm.order,
    });
    if (error) {
      toast({ title: "Failed to update question", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Question Updated!", description: `Question ${data.order} has been updated.` });
      setEditingQuestion(null);
      setEditingQuestionForm({ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', explanation: '', order: 0 });
      fetchCourseData();
    }
  };

  const handleDeleteQuestion = async (questionId: string, questionText: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete question "${questionText.substring(0, 50)}..."?`)) return;

    setDeletingQuestionId(questionId);
    const { error } = await deleteCertiFreeQuizQuestion(questionId);
    if (error) {
      toast({ title: "Failed to delete question", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Question Deleted!", description: `Question has been removed.` });
      fetchCourseData();
    }
    setDeletingQuestionId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] text-gray-300">
        <p>Loading course...</p>
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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] text-gray-300">
        <p>Course not found.</p>
      </div>
    );
  }

  const currentProgress = calculateOverallProgress();

  const [activeContent, setActiveContent] = useState<"overview" | string>("overview");

  // State for editing course description
  const [isEditingCourseDescription, setIsEditingCourseDescription] = useState(false);
  const [editedCourseDescription, setEditedCourseDescription] = useState(course.description || '');

  // State for editing lesson content in the main view
  const [editingLessonContentId, setEditingLessonContentId] = useState<string | null>(null);
  const [editedLessonContent, setEditedLessonContent] = useState('');

  const handleSaveCourseDescription = async () => {
    if (!courseId || !isAdmin) return;
    try {
      const { data, error } = await updateCourse(courseId, { description: editedCourseDescription });
      if (error) throw error;
      setCourse(prev => prev ? { ...prev, description: data.description } : null);
      toast({ title: "Course Description Updated!" });
      setIsEditingCourseDescription(false);
    } catch (err: any) {
      toast({ title: "Failed to update course description", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveLessonContent = async (lessonId: string) => {
    if (!isAdmin) return;
    try {
      const { data, error } = await updateLesson(lessonId, { content: editedLessonContent });
      if (error) throw error;
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, content: data.content } : l));
      toast({ title: "Lesson Content Updated!" });
      setEditingLessonContentId(null);
      setEditedLessonContent('');
    } catch (err: any) {
      toast({ title: "Failed to update lesson content", description: err.message, variant: "destructive" });
    } finally {
      fetchCourseData();
    }
  };

  return (
    <div className="min-h-screen bg-[#000814] text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-[#001d3d] border-r border-[#003566] p-6 overflow-y-auto flex flex-col">
          <div className="mb-6">
            <Button variant="link" className="text-gray-300 hover:text-[#ffd60a] p-0 mb-4" onClick={() => navigate('/certifications')}>&larr; Back to Certifications</Button>
            <h2 className="text-xl font-bold text-white mb-4 line-clamp-2">{course.title}</h2>
            <Progress value={currentProgress} className="w-full mb-2 bg-[#003566] [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-value]:bg-[#ffd60a]" />
            <p className="text-sm text-gray-400">{currentProgress}% COMPLETE</p>
          </div>
          <Separator className="bg-[#003566] mb-6" />
          <nav className="flex-1">
            <ul>
              <li className="mb-2">
                <Button variant="ghost" className={`w-full justify-start text-left ${activeContent === 'overview' ? 'bg-[#003566] text-[#ffd60a]' : 'text-gray-300 hover:bg-[#003566]'}`}
                  onClick={() => setActiveContent('overview')}>
                  <BookOpen className="h-5 w-5 mr-2" /> About This Course
                </Button>
              </li>
              {modules.sort((a, b) => a.order - b.order).map(module => (
                <li key={module.id} className="mb-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={module.id}>
                      <AccordionTrigger className={`flex items-center justify-between w-full text-left font-semibold text-white hover:no-underline ${isModuleLocked(module.order) ? 'text-gray-500 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center">
                          {isModuleCompleted(module.id) && <CheckCircle className="h-5 w-5 mr-2 text-[#ffd60a]" />}
                          Module {module.order}: {module.title}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}> {/* Prevent accordion toggle */}
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => handleOpenEditModule(module)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500" onClick={() => handleDeleteModule(module.id, module.title)} disabled={deletingModuleId === module.id}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-0">
                        <ul className="space-y-1 pl-4 border-l border-[#003566]">
                          {lessons.filter(lesson => lesson.module_id === module.id).sort((a, b) => a.order - b.order).map(lesson => (
                            <li key={lesson.id}>
                              <Button variant="ghost" className={`w-full justify-start text-left ${activeContent === lesson.id ? 'bg-[#003566] text-[#ffd60a]' : 'text-gray-300 hover:bg-[#003566]'} ${isModuleLocked(module.order) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !isModuleLocked(module.order) && setActiveContent(lesson.id)} disabled={isModuleLocked(module.order)}>
                                {enrollment && (
                                  <Checkbox
                                    checked={(enrollment.progress_array || []).includes(lesson.order)}
                                    onCheckedChange={(checked) => handleMarkLessonComplete(lesson.order, !!checked)}
                                    className="mr-2 data-[state=checked]:bg-[#ffd60a] data-[state=checked]:text-[#001d3d] border-[#003566]"
                                    id={`lesson-sidebar-${lesson.id}`}
                                    disabled={isModuleLocked(module.order)}
                                  />
                                )}
                                Lesson {lesson.order}: {lesson.title}
                              </Button>
                            </li>
                          ))}
                          {/* Module Quiz Button */}
                          {quizzes.find(q => q.module_id === module.id) && (
                            <li className="mt-2">
                              <Button variant="ghost" className={`w-full justify-start text-left ${activeContent === quizzes.find(q => q.module_id === module.id)?.id ? 'bg-[#003566] text-[#ffd60a]' : 'text-gray-300 hover:bg-[#003566]'} ${isModuleLocked(module.order) || getModuleProgress(module.id) < 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !isModuleLocked(module.order) && getModuleProgress(module.id) === 100 && setActiveContent(quizzes.find(q => q.module_id === module.id)!.id)} disabled={isModuleLocked(module.order) || getModuleProgress(module.id) < 100}>
                                {enrollment && quizzes.find(q => q.module_id === module.id) && (enrollment.passed_quizzes || []).includes(quizzes.find(q => q.module_id === module.id)!.id) && (
                                  <CheckCircle className="h-5 w-5 mr-2 text-[#ffd60a]" />
                                )}
                                <ListChecks className="h-5 w-5 mr-2" /> Module Quiz
                              </Button>
                              {isAdmin && (
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => handleOpenEditQuiz(quizzes.find(q => q.module_id === module.id)!)}>
                                    <Edit className="h-4 w-4" /> Edit Quiz
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteQuiz(quizzes.find(q => q.module_id === module.id)!.id, quizzes.find(q => q.module_id === module.id)!.title)} disabled={deletingQuizId === quizzes.find(q => q.module_id === module.id)!.id}>
                                    <Trash className="h-4 w-4" /> Delete Quiz
                                  </Button>
                                </div>
                              )}
                            </li>
                          )}
                          {isAdmin && (
                            <li className="mt-2">
                              <Button className="w-full bg-[#003566] text-[#ffd60a] hover:bg-[#003566]/80" onClick={() => {
                                setNewLessonForm(prev => ({ ...prev, moduleId: module.id }));
                                setIsAddingLesson(true);
                              }}>
                                <Plus className="h-4 w-4 mr-1" /> Add Lesson
                              </Button>
                            </li>
                          )}
                          {isAdmin && !quizzes.find(q => q.module_id === module.id) && (
                            <li className="mt-2">
                              <Button className="w-full bg-[#003566] text-[#ffd60a] hover:bg-[#003566]/80" onClick={() => {
                                setNewQuizForm(prev => ({ ...prev, moduleId: module.id, type: 'module_quiz' }));
                                setIsAddingQuiz(true);
                              }}>
                                <Plus className="h-4 w-4 mr-1" /> Add Module Quiz
                              </Button>
                            </li>
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </li>
              ))}

              {/* Final Quiz Section */}
              {quizzes.find(q => q.type === 'final_quiz') && (
                <li className="mb-4">
                  <Button variant="ghost" className={`w-full justify-start text-left ${activeContent === quizzes.find(q => q.type === 'final_quiz')?.id ? 'bg-[#003566] text-[#ffd60a]' : 'text-gray-300 hover:bg-[#003566]'} ${isFinalQuizLocked() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isFinalQuizLocked() && setActiveContent(quizzes.find(q => q.type === 'final_quiz')!.id)} disabled={isFinalQuizLocked()}>
                    {enrollment && quizzes.find(q => q.type === 'final_quiz') && (enrollment.passed_quizzes || []).includes(quizzes.find(q => q.type === 'final_quiz')!.id) && (
                      <CheckCircle className="h-5 w-5 mr-2 text-[#ffd60a]" />
                    )}
                    <ListChecks className="h-5 w-5 mr-2" /> Final Quiz
                  </Button>
                  {isAdmin && (
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => handleOpenEditQuiz(quizzes.find(q => q.type === 'final_quiz')!)}>
                        <Edit className="h-4 w-4" /> Edit Quiz
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteQuiz(quizzes.find(q => q.type === 'final_quiz')!.id, quizzes.find(q => q.type === 'final_quiz')!.title)} disabled={deletingQuizId === quizzes.find(q => q.type === 'final_quiz')!.id}>
                        <Trash className="h-4 w-4" /> Delete Quiz
                      </Button>
                    </div>
                  )}
                </li>
              )}
              {isAdmin && !quizzes.find(q => q.type === 'final_quiz') && (
                <li>
                  <Button className="w-full bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a] mt-2" onClick={() => {
                    setNewQuizForm(prev => ({ ...prev, type: 'final_quiz', moduleId: '' }));
                    setIsAddingQuiz(true);
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Final Quiz
                  </Button>
                </li>
              )}
            </ul>
          </nav>
          {isAdmin && (
            <Button className="bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a] mt-6" onClick={() => setIsAddingModule(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add New Module
            </Button>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeContent === 'overview' && (
            <Card className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                {isAdmin && (enrollment || true) && (
                  <div className="flex justify-end mb-4">
                    {!isEditingCourseDescription ? (
                      <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => setIsEditingCourseDescription(true)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit Description
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-[#003566] text-white hover:bg-[#003566]" onClick={() => {
                          setIsEditingCourseDescription(false);
                          setEditedCourseDescription(course.description || ''); // Revert changes
                        }}>Cancel</Button>
                        <Button size="sm" className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleSaveCourseDescription}>Save</Button>
                      </div>
                    )}
                  </div>
                )}
                {!isEditingCourseDescription ? (
                  <p className="text-gray-300 text-lg leading-relaxed">{course.description || "No description provided for this course. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."}</p>
                ) : (
                  <Textarea
                    value={editedCourseDescription}
                    onChange={(e) => setEditedCourseDescription(e.target.value)}
                    className="bg-[#000814] border-[#003566] text-white min-h-[150px]"
                  />
                )}

                {/* Placeholder for other course details, e.g., Estimated Time, Type */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-5 w-5" />
                    <span>Estimated Time: {course.duration || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <BookOpen className="h-5 w-5" />
                    <span>Type: CertiFree</span>
                  </div>
                </div>

                {!user ? (
                  <Alert className="bg-[#001d3d] border-[#003566] text-gray-300 mt-8">
                    <FileText className="h-4 w-4" />
                    <AlertTitle className="text-white">Sign in to enroll!</AlertTitle>
                    <AlertDescription>
                      You need to be signed in to enroll in this course and track your progress.
                      <Button onClick={() => navigate('/auth')} className="ml-4 bg-[#ffc300] text-[#001d3d] hover:bg-[#ffd60a]">Sign In</Button>
                    </AlertDescription>
                  </Alert>
                ) : !enrollment ? (
                  <div className="flex justify-center mt-8">
                    <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleEnroll}>
                      Enroll in Course
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 p-6 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Your Progress</h2>
                    <Progress value={currentProgress} className="w-full mb-4 bg-[#003566] [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-value]:bg-[#ffd60a]" />
                    <p className="text-right text-base font-semibold text-gray-300 mb-4">{currentProgress}% Complete</p>

                    {currentProgress === 100 && certificate && (
                      <Alert className="bg-[#003566] border-[#ffd60a] text-gray-300">
                        <CheckCircle className="h-4 w-4 text-[#ffd60a]" />
                        <AlertTitle className="text-white">Certificate Available!</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                          Your completion certificate has been generated.
                          <Button variant="link" className="text-[#ffd60a] hover:text-[#ffc300]" onClick={handleDownloadCertificate}>
                            <Download className="h-4 w-4 mr-2" /> Download Certificate
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                     {currentProgress === 100 && !certificate && (
                      <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a] w-full mb-4" onClick={handleGenerateCertificate} disabled={isFinalQuizLocked() || !modules.every(m => isModuleCompleted(m.id))}>
                        Generate Certificate
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {modules.sort((a, b) => a.order - b.order).map(module => (
            lessons.filter(lesson => lesson.module_id === module.id).map(lesson => activeContent === lesson.id && (
              <Card key={lesson.id} className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex justify-between items-center">
                    Lesson {lesson.order}: {lesson.title}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => handleOpenEditLesson(lesson)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit Details
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteLesson(lesson.id, lesson.title)} disabled={deletingLessonId === lesson.id}>
                          <Trash className="h-4 w-4 mr-1" /> Delete Lesson
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAdmin && (enrollment || true) && (
                    <div className="flex justify-end mb-4">
                      {editingLessonContentId !== lesson.id ? (
                        <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => {
                          setEditingLessonContentId(lesson.id);
                          setEditedLessonContent(lesson.content || '');
                        }}>
                          <Edit className="h-4 w-4 mr-1" /> Edit Content
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-[#003566] text-white hover:bg-[#003566]" onClick={() => {
                            setEditingLessonContentId(null);
                            setEditedLessonContent(''); // Revert changes
                          }}>Cancel</Button>
                          <Button size="sm" className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={() => handleSaveLessonContent(lesson.id)}>Save</Button>
                        </div>
                      )}
                    </div>
                  )}
                  {editingLessonContentId !== lesson.id ? (
                    <div className="prose prose-invert max-w-none text-gray-300">
                      <p>{lesson.content || "No content provided for this lesson. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}</p>
                    </div>
                  ) : (
                    <Textarea
                      value={editedLessonContent}
                      onChange={(e) => setEditedLessonContent(e.target.value)}
                      className="bg-[#000814] border-[#003566] text-white min-h-[200px]"
                    />
                  )}
                </CardContent>
              </Card>
            ))
          ))}

          {/* Quiz Content Area */}
          {quizzes.map(quiz => activeContent === quiz.id && (
            <Card key={quiz.id} className="bg-[#001d3d] text-white rounded-xl shadow-xl border border-[#003566] mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex justify-between items-center">
                  {quiz.title}
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => handleOpenEditQuiz(quiz)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit Quiz Details
                      </Button>
                      <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => { setCurrentQuizForQuestion(quiz); setIsAddingQuestion(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Question
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <p className="text-gray-400">{quiz.description || "No description provided."}</p>
                <p className="text-gray-400 text-sm">Pass percentage: {quiz.pass_percentage}%</p>
              </CardHeader>
              <CardContent>
                {!enrollment ? (
                  <p className="text-gray-400">Enroll in the course to take this quiz.</p>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={() => handleStartQuiz(quiz)}
                      className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]"
                      disabled={ (quiz.type === 'module_quiz' && getModuleProgress(quiz.module_id!) < 100) || (quiz.type === 'final_quiz' && isFinalQuizLocked())}
                    >
                      Start Quiz
                    </Button>
                    {isAdmin && quizQuestions.filter(q => q.quiz_id === quiz.id).length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Questions:</h3>
                        <Accordion type="single" collapsible className="w-full">
                          {quizQuestions.filter(q => q.quiz_id === quiz.id).sort((a,b) => a.order - b.order).map(question => (
                            <AccordionItem key={question.id} value={question.id}>
                              <AccordionTrigger className="text-left text-gray-300 hover:text-[#ffd60a] hover:no-underline">
                                Q{question.order}: {question.question_text}
                              </AccordionTrigger>
                              <AccordionContent className="text-gray-400 pl-4">
                                <p className="mb-2"><strong>Type:</strong> {question.question_type}</p>
                                {question.options && question.options.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Options:</strong>
                                    <ul className="list-disc list-inside">
                                      {question.options.map((option, idx) => <li key={idx}>{option}</li>)}
                                    </ul>
                                  </div>
                                )}
                                <p className="mb-2"><strong>Correct Answer:</strong> {question.correct_answer}</p>
                                {question.explanation && <p className="mb-2"><strong>Explanation:</strong> {question.explanation}</p>}
                                <div className="flex gap-2 mt-2">
                                  <Button variant="outline" size="sm" className="text-gray-200 border-[#3b82f6] hover:bg-[#003566]" onClick={() => handleOpenEditQuestion(question)}>
                                    <Edit className="h-4 w-4" /> Edit Question
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(question.id, question.question_text)} disabled={deletingQuestionId === question.id}>
                                    <Trash className="h-4 w-4" /> Delete Question
                                  </Button>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!course && !loading && !error && (
            <div className="text-center py-20 bg-[#001d3d] rounded-xl border border-[#003566] shadow-xl text-gray-300">
              <BookOpen className="h-16 w-16 text-[#003566] mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">No course selected or found.</h3>
              <p className="text-base text-gray-400 max-w-md mx-auto">
                Please select a course from the CertiFree Certifications page.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Add Module Dialog */}
      <Dialog open={isAddingModule} onOpenChange={setIsAddingModule}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Module</DialogTitle>
            <DialogDescription>Enter the details for the new module.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-module-title" className="text-gray-300">Module Title</Label>
              <Input
                id="new-module-title"
                value={newModuleForm.title}
                onChange={(e) => setNewModuleForm({ ...newModuleForm, title: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-module-description" className="text-gray-300">Description</Label>
              <Textarea
                id="new-module-description"
                value={newModuleForm.description}
                onChange={(e) => setNewModuleForm({ ...newModuleForm, description: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-module-order" className="text-gray-300">Order</Label>
              <Input
                id="new-module-order"
                type="number"
                value={newModuleForm.order}
                onChange={(e) => setNewModuleForm({ ...newModuleForm, order: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setIsAddingModule(false)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleAddModule}>Add Module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Module</DialogTitle>
            <DialogDescription>Update the module details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-module-title" className="text-gray-300">Module Title</Label>
              <Input
                id="edit-module-title"
                value={editingModuleForm.title}
                onChange={(e) => setEditingModuleForm({ ...editingModuleForm, title: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-module-description" className="text-gray-300">Description</Label>
              <Textarea
                id="edit-module-description"
                value={editingModuleForm.description}
                onChange={(e) => setEditingModuleForm({ ...editingModuleForm, description: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-module-order" className="text-gray-300">Order</Label>
              <Input
                id="edit-module-order"
                type="number"
                value={editingModuleForm.order}
                onChange={(e) => setEditingModuleForm({ ...editingModuleForm, order: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleSaveEditModule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={isAddingLesson} onOpenChange={setIsAddingLesson}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Lesson</DialogTitle>
            <DialogDescription>Enter the details for the new lesson.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-lesson-module-id" className="text-gray-300">Module</Label>
              <select
                id="new-lesson-module-id"
                value={newLessonForm.moduleId}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, moduleId: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                <option value="">Select a Module</option>
                {modules.sort((a,b) => a.order - b.order).map(module => (
                  <option key={module.id} value={module.id}>{module.order}: {module.title}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-lesson-title" className="text-gray-300">Lesson Title</Label>
              <Input
                id="new-lesson-title"
                value={newLessonForm.title}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-lesson-content" className="text-gray-300">Content</Label>
              <Textarea
                id="new-lesson-content"
                value={newLessonForm.content}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, content: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-lesson-order" className="text-gray-300">Order</Label>
              <Input
                id="new-lesson-order"
                type="number"
                value={newLessonForm.order}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, order: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setIsAddingLesson(false)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleAddLesson}>Add Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Lesson</DialogTitle>
            <DialogDescription>Update the lesson details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-lesson-module-id" className="text-gray-300">Module</Label>
              <select
                id="edit-lesson-module-id"
                value={editingLessonForm.moduleId}
                onChange={(e) => setEditingLessonForm({ ...editingLessonForm, moduleId: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                <option value="">Select a Module</option>
                {modules.sort((a,b) => a.order - b.order).map(module => (
                  <option key={module.id} value={module.id}>{module.order}: {module.title}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lesson-title" className="text-gray-300">Lesson Title</Label>
              <Input
                id="edit-lesson-title"
                value={editingLessonForm.title}
                onChange={(e) => setEditingLessonForm({ ...editingLessonForm, title: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lesson-content" className="text-gray-300">Content</Label>
              <Textarea
                id="edit-lesson-content"
                value={editingLessonForm.content}
                onChange={(e) => setEditingLessonForm({ ...editingLessonForm, content: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lesson-order" className="text-gray-300">Order</Label>
              <Input
                id="edit-lesson-order"
                type="number"
                value={editingLessonForm.order}
                onChange={(e) => setEditingLessonForm({ ...editingLessonForm, order: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setEditingLesson(null)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleSaveEditLesson}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Quiz Dialog */}
      <Dialog open={isAddingQuiz} onOpenChange={setIsAddingQuiz}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Quiz</DialogTitle>
            <DialogDescription>Enter the details for the new quiz.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-quiz-title" className="text-gray-300">Quiz Title</Label>
              <Input
                id="new-quiz-title"
                value={newQuizForm.title}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, title: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-quiz-description" className="text-gray-300">Description</Label>
              <Textarea
                id="new-quiz-description"
                value={newQuizForm.description}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, description: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-quiz-pass-percentage" className="text-gray-300">Pass Percentage</Label>
              <Input
                id="new-quiz-pass-percentage"
                type="number"
                value={newQuizForm.pass_percentage}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, pass_percentage: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-quiz-type" className="text-gray-300">Quiz Type</Label>
              <select
                id="new-quiz-type"
                value={newQuizForm.type}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, type: e.target.value as 'module_quiz' | 'final_quiz' })}
                className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                <option value="module_quiz">Module Quiz</option>
                <option value="final_quiz">Final Quiz</option>
              </select>
            </div>
            {newQuizForm.type === 'module_quiz' && (
              <div className="grid gap-2">
                <Label htmlFor="new-quiz-module-id" className="text-gray-300">Associated Module</Label>
                <select
                  id="new-quiz-module-id"
                  value={newQuizForm.moduleId}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, moduleId: e.target.value })}
                  className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
                >
                  <option value="">Select a Module (Optional)</option>
                  {modules.sort((a,b) => a.order - b.order).map(module => (
                    <option key={module.id} value={module.id}>{module.order}: {module.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setIsAddingQuiz(false)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleAddQuiz}>Add Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Dialog */}
      <Dialog open={!!editingQuiz} onOpenChange={(open) => !open && setEditingQuiz(null)}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Quiz</DialogTitle>
            <DialogDescription>Update the quiz details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-quiz-title" className="text-gray-300">Quiz Title</Label>
              <Input
                id="edit-quiz-title"
                value={editingQuizForm.title}
                onChange={(e) => setEditingQuizForm({ ...editingQuizForm, title: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-quiz-description" className="text-gray-300">Description</Label>
              <Textarea
                id="edit-quiz-description"
                value={editingQuizForm.description}
                onChange={(e) => setEditingQuizForm({ ...editingQuizForm, description: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-quiz-pass-percentage" className="text-gray-300">Pass Percentage</Label>
              <Input
                id="edit-quiz-pass-percentage"
                type="number"
                value={editingQuizForm.pass_percentage}
                onChange={(e) => setEditingQuizForm({ ...editingQuizForm, pass_percentage: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-quiz-type" className="text-gray-300">Quiz Type</Label>
              <select
                id="edit-quiz-type"
                value={editingQuizForm.type}
                onChange={(e) => setEditingQuizForm({ ...editingQuizForm, type: e.target.value as 'module_quiz' | 'final_quiz' })}
                className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                <option value="module_quiz">Module Quiz</option>
                <option value="final_quiz">Final Quiz</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setEditingQuiz(null)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleSaveEditQuiz}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Quiz Question Dialog */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Question to {currentQuizForQuestion?.title}</DialogTitle>
            <DialogDescription>Enter the details for the new question.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-question-text" className="text-gray-300">Question Text</Label>
              <Textarea
                id="new-question-text"
                value={newQuestionForm.question_text}
                onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_text: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-question-type" className="text-gray-300">Question Type</Label>
              <select
                id="new-question-type"
                value={newQuestionForm.question_type}
                onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_type: e.target.value as 'multiple_choice' | 'true_false' | 'short_answer' })}
                className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
            {newQuestionForm.question_type === 'multiple_choice' && (
              <div className="grid gap-2">
                <Label className="text-gray-300">Options</Label>
                {newQuestionForm.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuestionForm.options];
                      newOptions[index] = e.target.value;
                      setNewQuestionForm({ ...newQuestionForm, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="bg-[#000814] border-[#003566] text-white mb-2"
                  />
                ))}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="new-question-correct-answer" className="text-gray-300">Correct Answer</Label>
              <Input
                id="new-question-correct-answer"
                value={newQuestionForm.correct_answer}
                onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correct_answer: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-question-explanation" className="text-gray-300">Explanation (Optional)</Label>
              <Textarea
                id="new-question-explanation"
                value={newQuestionForm.explanation}
                onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-question-order" className="text-gray-300">Order</Label>
              <Input
                id="new-question-order"
                type="number"
                value={newQuestionForm.order}
                onChange={(e) => setNewQuestionForm({ ...newQuestionForm, order: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setIsAddingQuestion(false)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleAddQuestion}>Add Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Question</DialogTitle>
            <DialogDescription>Update the question details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-question-text" className="text-gray-300">Question Text</Label>
              <Textarea
                id="edit-question-text"
                value={editingQuestionForm.question_text}
                onChange={(e) => setEditingQuestionForm({ ...editingQuestionForm, question_text: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-question-type" className="text-gray-300">Question Type</Label>
              <select
                id="edit-question-type"
                value={editingQuestionForm.question_type}
                onChange={(e) => setEditingQuestionForm({ ...editingQuestionForm, question_type: e.target.value as 'multiple_choice' | 'true_false' | 'short_answer' })}
                className="bg-[#000814] border-[#003566] text-white p-2 rounded-md"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
            {editingQuestionForm.question_type === 'multiple_choice' && (
              <div className="grid gap-2">
                <Label className="text-gray-300">Options</Label>
                {editingQuestionForm.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editingQuestionForm.options];
                      newOptions[index] = e.target.value;
                      setEditingQuestionForm({ ...editingQuestionForm, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="bg-[#000814] border-[#003566] text-white mb-2"
                  />
                ))}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-question-correct-answer" className="text-gray-300">Correct Answer</Label>
              <Input
                id="edit-question-correct-answer"
                value={editingQuestionForm.correct_answer}
                onChange={(e) => setEditingQuestionForm({ ...editingQuestionForm, correct_answer: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-question-explanation" className="text-gray-300">Explanation (Optional)</Label>
              <Textarea
                id="edit-question-explanation"
                value={editingQuestionForm.explanation}
                onChange={(e) => setEditingQuestionForm({ ...editingQuestionForm, explanation: e.target.value })}
                className="bg-[#000814] border-[#003566] text-white min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-question-order" className="text-gray-300">Order</Label>
              <Input
                id="edit-question-order"
                type="number"
                value={editingQuestionForm.order}
                onChange={(e) => setEditingQuestionForm({ ...editingQuestionForm, order: parseInt(e.target.value) || 0 })}
                className="bg-[#000814] border-[#003566] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#003566] text-white hover:bg-[#003566] mr-2" onClick={() => setEditingQuestion(null)}>Cancel</Button>
            <Button className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" onClick={handleSaveEditQuestion}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{currentQuiz?.title}</DialogTitle>
            <DialogDescription>{currentQuiz?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {currentQuizQuestions.length === 0 ? (
              <p>No questions available for this quiz.</p>
            ) : (
              currentQuizQuestions.map((question, index) => (
                <div key={question.id} className="p-4 bg-[#000814] rounded-lg border border-[#003566]">
                  <p className="font-semibold text-white mb-3">Q{index + 1}: {question.question_text}</p>
                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center">
                          <input
                            type="radio"
                            id={`question-${question.id}-option-${optIndex}`}
                            name={`question-${question.id}`}
                            value={option}
                            checked={userAnswers[question.id] === option}
                            onChange={(e) => setUserAnswers({ ...userAnswers, [question.id]: e.target.value })}
                            className="mr-2 text-[#ffd60a] focus:ring-[#ffd60a] bg-[#001d3d] border-[#003566]"
                          />
                          <label htmlFor={`question-${question.id}-option-${optIndex}`} className="text-gray-300 cursor-pointer">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {question.question_type === 'true_false' && (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`question-${question.id}-true`}
                          name={`question-${question.id}`}
                          value="True"
                          checked={userAnswers[question.id] === 'True'}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [question.id]: e.target.value })}
                          className="mr-2 text-[#ffd60a] focus:ring-[#ffd60a] bg-[#001d3d] border-[#003566]"
                        />
                        <label htmlFor={`question-${question.id}-true`} className="text-gray-300 cursor-pointer">True</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`question-${question.id}-false`}
                          name={`question-${question.id}`}
                          value="False"
                          checked={userAnswers[question.id] === 'False'}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [question.id]: e.target.value })}
                          className="mr-2 text-[#ffd60a] focus:ring-[#ffd60a] bg-[#001d3d] border-[#003566]"
                        />
                        <label htmlFor={`question-${question.id}-false`} className="text-gray-300 cursor-pointer">False</label>
                      </div>
                    </div>
                  )}
                  {question.question_type === 'short_answer' && (
                    <Input
                      type="text"
                      value={userAnswers[question.id] || ''}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [question.id]: e.target.value })}
                      className="bg-[#000814] border-[#003566] text-white mt-2"
                      placeholder="Your answer"
                    />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQuizModalOpen(false)} variant="outline" className="border-[#003566] text-white hover:bg-[#003566]">Cancel</Button>
            <Button onClick={handleSubmitQuiz} className="bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]" disabled={isSubmittingQuiz || currentQuizQuestions.length === 0}>
              {isSubmittingQuiz ? "Submitting..." : "Submit Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Results Modal */}
      <Dialog open={showQuizResultsModal} onOpenChange={setShowQuizResultsModal}>
        <DialogContent className="bg-[#001d3d] border-[#003566] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Quiz Results: {currentQuiz?.title}</DialogTitle>
            <DialogDescription>
              Your score: {lastQuizAttempt?.score_percentage}% - {lastQuizAttempt?.passed ? 'Passed!' : 'Failed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {lastQuizAttempt?.passed ? (
              <Alert className="bg-[#003566] border-[#ffd60a] text-gray-300">
                <CheckCircle className="h-4 w-4 text-[#ffd60a]" />
                <AlertTitle className="text-white">Congratulations!</AlertTitle>
                <AlertDescription>
                  You have successfully passed this quiz.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="bg-[#001d3d] border-red-500 text-red-300">
                <AlertTitle className="text-red-400">Keep Trying!</AlertTitle>
                <AlertDescription>
                  You did not pass this quiz. You can try again.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => {
                setShowQuizResultsModal(false);
                setIsQuizModalOpen(false);
                fetchCourseData(); // Refresh data to update progress/locks
              }}
              className="w-full bg-[#ffc300] text-[#001d3d] font-bold hover:bg-[#ffd60a]"
            >
              Got It!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CourseDetailLogic; 