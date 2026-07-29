"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import WizardHeader from "../../create/includes/wizard-header";
import StepBasicInfo from "../../create/includes/step-basic-info";
import StepMaterials from "../../create/includes/step-materials";
import StepSubjectsFaqs from "../../create/includes/step-subjects-faqs";
import StepAssignments from "../../create/includes/step-assignments";
import StepReview from "../../create/includes/step-review";
import EditWizardFooter from "./includes/edit-wizard-footer";
import type { CourseWizardStep } from "../../create/includes/wizard-header";
import { useGetCourseQuery, useUpdateCourseMutation, type Course } from "@/redux/api/coursesApi";
import {
  useGetCourseSubjectsQuery,
  useCreateCourseSubjectMutation,
  useUpdateCourseSubjectMutation,
  useDeleteCourseSubjectMutation,
} from "@/redux/api/courseSubjectsApi";
import {
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} from "@/redux/api/contentApi";
import {
  useGetCourseMaterialsQuery,
  useCreateCourseMaterialMutation,
  useUpdateCourseMaterialMutation,
  useDeleteCourseMaterialMutation,
  type CourseMaterial,
  type MaterialKind,
} from "@/redux/api/courseMaterialsApi";
import {
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useAddExamQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  usePublishExamMutation,
  useLazyGetExamQuestionsQuery,
  type ExamQuestion,
} from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";
import ErrorState from "@/components/error-state";
import type { BasicInfo, CourseFiles, MaterialDraft, QuizQuestion, SubjectDraft, FaqDraft } from "../../create/includes/types";

const optionLetters = ["A", "B", "C", "D"] as const;
const isPersisted = (id: string) => /^\d+$/.test(id);

const emptyFiles: CourseFiles = { thumbnail: null, coverImage: null, syllabusPdf: null };

function toBasicInfo(course: Course): BasicInfo {
  return {
    name: course.title,
    shortDescription: course.short_description,
    fullDescription: course.full_description,
    whyNeeded: course.why_needed,
    category: String(course.category),
    level: course.level,
    price: course.price,
    oldPrice: course.old_price,
    discount: course.discount,
    isFree: course.is_free,
    duration: course.duration,
    batchStartDate: course.batch_start_date ?? "",
    classStartDate: course.class_start_date ?? "",
    totalClasses: String(course.total_classes),
    totalQuizzes: String(course.total_quizzes),
    totalAssignments: String(course.total_assignments),
    inactivityReminderDays: course.inactivity_reminder_days
      ? String(course.inactivity_reminder_days)
      : "0",
    telegramGroupLink: course.telegram_group_link || "",
    telegramGroupChatId: course.telegram_group_chat_id,
    telegramGroupTitle: course.telegram_group_title || "",
    telegramGroupConnectCode: course.telegram_group_connect_code || "",
    telegramGroupConnectedAt: course.telegram_group_connected_at,
    promoVideoUrl: course.promo_video_url,
    syllabusDriveLink: course.syllabus_drive_link,
    teacherIds: course.teachers.map(String),
  };
}

function toMaterialDrafts(
  materials: CourseMaterial[],
  questionsByExam: Map<number, ExamQuestion[]>
): MaterialDraft[] {
  return materials.map((m): MaterialDraft => {
    if (m.kind === "video") {
      return { id: String(m.id), kind: "video", title: m.title, videoUrl: m.video_url };
    }
    if (m.kind === "pdf") {
      return { id: String(m.id), kind: "pdf", title: m.title, file: null, driveLink: m.drive_link || "" };
    }
    const questions = (m.quiz != null ? questionsByExam.get(m.quiz) : undefined) ?? [];
    return {
      id: String(m.id),
      kind: "mcq",
      title: m.title,
      quizId: m.quiz ?? undefined,
      questions: questions.map(
        (q): QuizQuestion => ({
          id: String(q.id),
          question: q.question_text,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correctIndex: (["A", "B", "C", "D"] as const).indexOf(q.correct_option),
        })
      ),
    };
  });
}

type OriginalMaterial = {
  id: number;
  kind: MaterialKind;
  title: string;
  videoUrl?: string;
  driveLink?: string;
  quizId?: number;
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  const {
    data: course,
    isLoading: isLoadingCourse,
    isError: isCourseError,
    error: courseError,
  } = useGetCourseQuery(courseId, {
    skip: !courseId,
  });
  const { data: subjectsData, isLoading: isLoadingSubjects } = useGetCourseSubjectsQuery(
    { course: courseId },
    { skip: !courseId }
  );
  const { data: faqsData, isLoading: isLoadingFaqs } = useGetFaqsQuery();
  const { data: materialsData, isLoading: isLoadingMaterials } = useGetCourseMaterialsQuery(
    { course: courseId },
    { skip: !courseId }
  );

  const [updateCourse] = useUpdateCourseMutation();
  const [createCourseSubject] = useCreateCourseSubjectMutation();
  const [updateCourseSubject] = useUpdateCourseSubjectMutation();
  const [deleteCourseSubject] = useDeleteCourseSubjectMutation();
  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();
  const [createCourseMaterial] = useCreateCourseMaterialMutation();
  const [updateCourseMaterial] = useUpdateCourseMaterialMutation();
  const [deleteCourseMaterial] = useDeleteCourseMaterialMutation();
  const [createExam] = useCreateExamMutation();
  const [updateExam] = useUpdateExamMutation();
  const [deleteExam] = useDeleteExamMutation();
  const [addExamQuestion] = useAddExamQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [publishExam] = usePublishExamMutation();
  const [fetchExamQuestions] = useLazyGetExamQuestionsQuery();

  const [step, setStep] = useState<CourseWizardStep>(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null);
  const [files, setFiles] = useState<CourseFiles>(emptyFiles);
  const [materials, setMaterials] = useState<MaterialDraft[]>([]);
  const [subjects, setSubjects] = useState<SubjectDraft[]>([]);
  const [faqs, setFaqs] = useState<FaqDraft[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const initializedRef = useRef(false);
  const originalSubjectIdsRef = useRef<number[]>([]);
  const originalFaqIdsRef = useRef<number[]>([]);
  const originalMaterialsRef = useRef<OriginalMaterial[]>([]);
  const originalQuestionIdsRef = useRef<Map<number, number[]>>(new Map());

  const isLoading = isLoadingCourse || isLoadingSubjects || isLoadingFaqs || isLoadingMaterials;

  useEffect(() => {
    if (initializedRef.current || !course || !subjectsData || !faqsData || !materialsData) return;
    initializedRef.current = true;

    setBasicInfo(toBasicInfo(course));

    const courseSubjects = subjectsData.results;
    setSubjects(courseSubjects.map((s) => ({ id: String(s.id), name: s.name, description: s.description })));
    originalSubjectIdsRef.current = courseSubjects.map((s) => s.id);

    const courseFaqs = faqsData.results.filter((f) => f.related_course === courseId);
    setFaqs(courseFaqs.map((f) => ({ id: String(f.id), question: f.question, answer: f.answer })));
    originalFaqIdsRef.current = courseFaqs.map((f) => f.id);

    const materialsList = materialsData.results;
    const mcqMaterials = materialsList.filter((m) => m.kind === "mcq" && m.quiz != null);

    (async () => {
      const questionsByExam = new Map<number, ExamQuestion[]>();
      await Promise.all(
        mcqMaterials.map(async (m) => {
          if (m.quiz == null) return;
          try {
            const questions = await fetchExamQuestions(m.quiz).unwrap();
            questionsByExam.set(m.quiz, questions);
          } catch {
            questionsByExam.set(m.quiz, []);
          }
        })
      );

      setMaterials(toMaterialDrafts(materialsList, questionsByExam));
      originalMaterialsRef.current = materialsList.map((m) => ({
        id: m.id,
        kind: m.kind,
        title: m.title,
        videoUrl: m.video_url || "",
        driveLink: m.drive_link || "",
        quizId: m.quiz ?? undefined,
      }));
      originalQuestionIdsRef.current = new Map(
        mcqMaterials
          .filter((m): m is CourseMaterial & { quiz: number } => m.quiz != null)
          .map((m) => [m.quiz, (questionsByExam.get(m.quiz) ?? []).map((q) => q.id)])
      );
    })();
  }, [course, subjectsData, faqsData, materialsData, courseId, fetchExamQuestions]);

  const handleSave = async () => {
    if (!basicInfo) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const formData = new FormData();
    formData.append("title", basicInfo.name);
    formData.append("category", basicInfo.category);
    formData.append("short_description", basicInfo.shortDescription);
    formData.append("full_description", basicInfo.fullDescription);
    formData.append("why_needed", basicInfo.whyNeeded);
    formData.append("level", basicInfo.level);
    formData.append("price", basicInfo.isFree ? "0" : basicInfo.price || "0");
    if (basicInfo.oldPrice) formData.append("old_price", basicInfo.oldPrice);
    if (basicInfo.discount) formData.append("discount", basicInfo.discount);
    formData.append("is_free", String(basicInfo.isFree));
    formData.append("duration", basicInfo.duration);
    if (basicInfo.batchStartDate) formData.append("batch_start_date", basicInfo.batchStartDate);
    if (basicInfo.classStartDate) formData.append("class_start_date", basicInfo.classStartDate);
    formData.append("total_classes", basicInfo.totalClasses || "0");
    formData.append("total_quizzes", basicInfo.totalQuizzes || "0");
    formData.append("total_assignments", basicInfo.totalAssignments || "0");
    formData.append("inactivity_reminder_days", basicInfo.inactivityReminderDays || "0");
    formData.append("telegram_group_link", basicInfo.telegramGroupLink || "");
    if (basicInfo.promoVideoUrl) formData.append("promo_video_url", basicInfo.promoVideoUrl);
    if (basicInfo.syllabusDriveLink) formData.append("syllabus_drive_link", basicInfo.syllabusDriveLink);
    for (const teacherId of basicInfo.teacherIds) formData.append("teachers", teacherId);
    if (files.thumbnail) formData.append("thumbnail", files.thumbnail);
    if (files.coverImage) formData.append("cover_image", files.coverImage);
    if (files.syllabusPdf) formData.append("syllabus_pdf", files.syllabusPdf);

    try {
      const updatedCourse = await updateCourse({ id: courseId, data: formData }).unwrap();
      setBasicInfo((prev) => prev ? {
        ...prev,
        telegramGroupLink: updatedCourse.telegram_group_link || prev.telegramGroupLink,
        telegramGroupChatId: updatedCourse.telegram_group_chat_id,
        telegramGroupTitle: updatedCourse.telegram_group_title || "",
        telegramGroupConnectCode: updatedCourse.telegram_group_connect_code || "",
        telegramGroupConnectedAt: updatedCourse.telegram_group_connected_at,
      } : prev);
    } catch (err) {
      setSaveError(`কোর্স সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
      setIsSaving(false);
      return;
    }

    const nextSubjects: SubjectDraft[] = [];
    const nextFaqs: FaqDraft[] = [];
    const nextMaterials: MaterialDraft[] = [];
    const nextOriginalMaterials: OriginalMaterial[] = [];
    const nextOriginalQuestionIds = new Map<number, number[]>();

    try {
      // --- Subjects: create / update / delete ---
      const currentSubjectIds = new Set(subjects.filter((s) => isPersisted(s.id)).map((s) => Number(s.id)));
      for (const id of originalSubjectIdsRef.current.filter((id) => !currentSubjectIds.has(id))) {
        await deleteCourseSubject(id).unwrap();
      }
      for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i];
        if (isPersisted(s.id)) {
          await updateCourseSubject({
            id: Number(s.id),
            data: { name: s.name, description: s.description, ordering: i },
          }).unwrap();
          nextSubjects.push(s);
        } else {
          const created = await createCourseSubject({
            course: courseId,
            name: s.name,
            description: s.description,
            ordering: i,
          }).unwrap();
          nextSubjects.push({ id: String(created.id), name: s.name, description: s.description });
        }
      }

      // --- FAQs: create / update / delete ---
      const currentFaqIds = new Set(faqs.filter((f) => isPersisted(f.id)).map((f) => Number(f.id)));
      for (const id of originalFaqIdsRef.current.filter((id) => !currentFaqIds.has(id))) {
        await deleteFaq(id).unwrap();
      }
      for (let i = 0; i < faqs.length; i++) {
        const f = faqs[i];
        if (isPersisted(f.id)) {
          await updateFaq({ id: Number(f.id), data: { question: f.question, answer: f.answer, ordering: i } }).unwrap();
          nextFaqs.push(f);
        } else {
          const created = await createFaq({
            question: f.question,
            answer: f.answer,
            category: "general",
            related_course: courseId,
            related_book: null,
            ordering: i,
            is_active: true,
          }).unwrap();
          nextFaqs.push({ id: String(created.id), question: f.question, answer: f.answer });
        }
      }

      // --- Course materials: create / update / delete ---
      const originalMaterialById = new Map(originalMaterialsRef.current.map((m) => [String(m.id), m]));
      const currentMaterialIds = new Set(materials.filter((m) => isPersisted(m.id)).map((m) => Number(m.id)));

      for (const om of originalMaterialsRef.current) {
        if (currentMaterialIds.has(om.id)) continue;
        await deleteCourseMaterial(om.id).unwrap();
        if (om.kind === "mcq" && om.quizId != null) await deleteExam(om.quizId).unwrap();
      }

      for (let i = 0; i < materials.length; i++) {
        const item = materials[i];
        const originalItem = isPersisted(item.id) ? originalMaterialById.get(item.id) : undefined;

        if (item.kind === "video") {
          const changed =
            !originalItem || originalItem.title !== item.title || (originalItem.videoUrl || "") !== (item.videoUrl || "");
          let materialId: number;
          if (!changed && originalItem) {
            materialId = originalItem.id;
          } else if (originalItem) {
            const updated = await updateCourseMaterial({
              id: originalItem.id,
              data: { title: item.title, video_url: item.videoUrl || "", ordering: i },
            }).unwrap();
            materialId = updated.id;
          } else {
            const created = await createCourseMaterial({
              course: courseId,
              title: item.title,
              kind: "video",
              video_url: item.videoUrl || "",
              ordering: i,
            }).unwrap();
            materialId = created.id;
          }
          nextMaterials.push({ ...item, id: String(materialId) });
          nextOriginalMaterials.push({ id: materialId, kind: "video", title: item.title, videoUrl: item.videoUrl || "" });
        } else if (item.kind === "pdf") {
          const changed =
            !originalItem ||
            originalItem.title !== item.title ||
            item.file ||
            (item.driveLink || "") !== (originalItem.driveLink || "");

          let materialId: number;
          if (!changed && originalItem) {
            materialId = originalItem.id;
          } else if (item.file) {
            const materialForm = new FormData();
            materialForm.append("course", String(courseId));
            materialForm.append("title", item.title);
            materialForm.append("kind", "pdf");
            materialForm.append("ordering", String(i));
            materialForm.append("file", item.file);
            if (originalItem) {
              const updated = await updateCourseMaterial({ id: originalItem.id, data: materialForm }).unwrap();
              materialId = updated.id;
            } else {
              const created = await createCourseMaterial(materialForm).unwrap();
              materialId = created.id;
            }
          } else {
            const data = {
              course: courseId,
              title: item.title,
              kind: "pdf" as const,
              drive_link: item.driveLink || "",
              ordering: i,
            };
            if (originalItem) {
              const updated = await updateCourseMaterial({ id: originalItem.id, data }).unwrap();
              materialId = updated.id;
            } else {
              const created = await createCourseMaterial(data).unwrap();
              materialId = created.id;
            }
          }
          nextMaterials.push({ ...item, id: String(materialId), file: null });
          nextOriginalMaterials.push({ id: materialId, kind: "pdf", title: item.title, driveLink: item.driveLink || "" });
        } else {
          let examId: number;
          if (item.quizId != null) {
            examId = item.quizId;
          } else if (originalItem?.quizId != null) {
            examId = originalItem.quizId;
            if (originalItem.title !== item.title) {
              await updateExam({ id: examId, data: { title: item.title } }).unwrap();
            }
          } else {
            const createdExam = await createExam({
              course: courseId,
              title: item.title,
              duration_minutes: 30,
            }).unwrap();
            examId = createdExam.id;
          }

          const originalQuestionIds =
            originalItem?.quizId != null ? originalQuestionIdsRef.current.get(originalItem.quizId) ?? [] : [];
          const currentQuestionIds = new Set(
            (item.questions ?? []).filter((q) => isPersisted(q.id)).map((q) => Number(q.id))
          );
          for (const qId of originalQuestionIds.filter((id) => !currentQuestionIds.has(id))) {
            await deleteQuestion(qId).unwrap();
          }

          const questions = item.questions ?? [];
          const nextQuestions: QuizQuestion[] = [];
          for (let qIndex = 0; qIndex < questions.length; qIndex++) {
            const q = questions[qIndex];
            if (!q.question.trim()) continue;
            const data = {
              question_text: q.question,
              option_a: q.options[0] ?? "",
              option_b: q.options[1] ?? "",
              option_c: q.options[2] ?? "",
              option_d: q.options[3] ?? "",
              correct_option: optionLetters[q.correctIndex ?? 0],
              explanation: "",
              order: qIndex + 1,
            };
            if (isPersisted(q.id)) {
              await updateQuestion({ id: Number(q.id), data }).unwrap();
              nextQuestions.push(q);
            } else {
              const createdQuestion = await addExamQuestion({ examId, data }).unwrap();
              nextQuestions.push({ ...q, id: String(createdQuestion.id) });
            }
          }
          if (nextQuestions.length > 0) {
            await publishExam(examId).unwrap().catch(() => undefined);
          }

          let materialId: number;
          if (originalItem) {
            materialId = originalItem.id;
            if (originalItem.title !== item.title) {
              await updateCourseMaterial({ id: materialId, data: { title: item.title, ordering: i } }).unwrap();
            }
          } else {
            const createdMaterial = await createCourseMaterial({
              course: courseId,
              title: item.title,
              kind: "mcq",
              quiz: examId,
              ordering: i,
            }).unwrap();
            materialId = createdMaterial.id;
          }

          nextMaterials.push({ ...item, id: String(materialId), questions: nextQuestions });
          nextOriginalMaterials.push({ id: materialId, kind: "mcq", title: item.title, quizId: examId });
          nextOriginalQuestionIds.set(examId, nextQuestions.map((q) => Number(q.id)));
        }
      }
    } catch (err) {
      setSaveError(`ম্যাটেরিয়াল সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
      setIsSaving(false);
      return;
    }

    setSubjects(nextSubjects);
    setFaqs(nextFaqs);
    setMaterials(nextMaterials);
    originalSubjectIdsRef.current = nextSubjects.map((s) => Number(s.id));
    originalFaqIdsRef.current = nextFaqs.map((f) => Number(f.id));
    originalMaterialsRef.current = nextOriginalMaterials;
    originalQuestionIdsRef.current = nextOriginalQuestionIds;

    setFiles(emptyFiles);
    setIsSaving(false);
    setSaveMessage("পরিবর্তন সংরক্ষণ করা হয়েছে।");
  };

  if (isLoading || !basicInfo) {
    return <p className="text-center text-sm text-slate-400">কোর্সের তথ্য লোড হচ্ছে…</p>;
  }

  if (isCourseError || !course) {
    return (
      <ErrorState
        message="কোর্সটি খুঁজে পাওয়া যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।"
        error={isCourseError ? courseError : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader
        step={step}
        title="কোর্স সম্পাদনা করুন"
        subtitle="কোর্সের সব তথ্য, ম্যাটেরিয়াল, সাবজেক্ট ও FAQ সম্পাদনা করুন"
        backHref={`/courses/${courseId}`}
      />

      <EditWizardFooter
        step={step}
        isSaving={isSaving}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as CourseWizardStep) : s))}
        onNext={() => setStep((s) => (s < 5 ? ((s + 1) as CourseWizardStep) : s))}
        onSave={handleSave}
        showSave={false}
      />

      {saveError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-500">{saveError}</p>
        </div>
      )}

      {saveMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-500">{saveMessage}</p>
        </div>
      )}

      {step === 1 && (
        <StepBasicInfo
          value={basicInfo}
          onChange={setBasicInfo}
          files={files}
          onFilesChange={setFiles}
          existingFiles={{
            thumbnail: course.thumbnail,
            coverImage: course.cover_image,
            syllabusPdf: course.syllabus_pdf,
          }}
        />
      )}
      {step === 2 && <StepMaterials materials={materials} onChange={setMaterials} courseId={courseId} />}
      {step === 3 && (
        <StepSubjectsFaqs
          subjects={subjects}
          onSubjectsChange={setSubjects}
          faqs={faqs}
          onFaqsChange={setFaqs}
          teacherIds={basicInfo.teacherIds}
          onTeacherIdsChange={(teacherIds) => setBasicInfo({ ...basicInfo, teacherIds })}
        />
      )}
      {step === 4 && <StepAssignments courseId={courseId} />}
      {step === 5 && (
        <StepReview
          basicInfo={basicInfo}
          files={files}
          materials={materials}
          subjects={subjects}
          faqs={faqs}
          published={false}
        />
      )}

      <EditWizardFooter
        step={step}
        isSaving={isSaving}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as CourseWizardStep) : s))}
        onNext={() => setStep((s) => (s < 5 ? ((s + 1) as CourseWizardStep) : s))}
        onSave={handleSave}
      />
    </div>
  );
}
