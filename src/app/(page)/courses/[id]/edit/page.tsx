"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import WizardHeader from "../../create/includes/wizard-header";
import StepBasicInfo from "../../create/includes/step-basic-info";
import StepModules from "../../create/includes/step-modules";
import StepSubjectsFaqs from "../../create/includes/step-subjects-faqs";
import StepReview from "../../create/includes/step-review";
import EditWizardFooter from "./includes/edit-wizard-footer";
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
  useGetClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useCreateClassVideoMutation,
  useDeleteClassVideoMutation,
  useCreateClassMaterialMutation,
  useDeleteClassMaterialMutation,
  type CourseClass,
} from "@/redux/api/classesApi";
import {
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useAddExamQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  usePublishExamMutation,
} from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";
import { inferMaterialKind } from "@/lib/material-kind";
import type {
  BasicInfo,
  CourseFiles,
  CourseModule,
  ModuleItem,
  QuizQuestion,
  SubjectDraft,
  FaqDraft,
} from "../../create/includes/types";

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
    promoVideoUrl: course.promo_video_url,
    syllabusDriveLink: course.syllabus_drive_link,
  };
}

function toModules(classes: CourseClass[]): CourseModule[] {
  return classes.map((cls) => ({
    id: String(cls.id),
    title: cls.title,
    items: [
      ...cls.videos.map(
        (v): ModuleItem => ({
          id: String(v.id),
          type: "video",
          title: v.title,
          videoUrl: v.video_url,
          videoDuration: v.duration,
        })
      ),
      ...cls.class_materials.map(
        (m): ModuleItem => ({
          id: String(m.id),
          type: "file",
          title: m.title,
          file: null,
        })
      ),
      ...cls.quizzes.map(
        (qz): ModuleItem => ({
          id: String(qz.id),
          type: "quiz",
          title: qz.title,
          questions: qz.questions.map(
            (q): QuizQuestion => ({
              id: String(q.id),
              question: q.question_text,
              options: [q.option_a, q.option_b, q.option_c, q.option_d],
              correctIndex: (["A", "B", "C", "D"] as const).indexOf(q.correct_option),
            })
          ),
        })
      ),
    ],
  }));
}

type OriginalItem = { id: number; type: "video" | "file" | "quiz"; title: string; videoUrl?: string; videoDuration?: string };
type OriginalModule = { id: number; title: string; items: OriginalItem[] };

export default function Page() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  const { data: course, isLoading: isLoadingCourse, isError: isCourseError } = useGetCourseQuery(courseId, {
    skip: !courseId,
  });
  const { data: subjectsData, isLoading: isLoadingSubjects } = useGetCourseSubjectsQuery(
    { course: courseId },
    { skip: !courseId }
  );
  const { data: faqsData, isLoading: isLoadingFaqs } = useGetFaqsQuery();
  const { data: classesData, isLoading: isLoadingClasses } = useGetClassesQuery(
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
  const [createClass] = useCreateClassMutation();
  const [updateClass] = useUpdateClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  const [createClassVideo] = useCreateClassVideoMutation();
  const [deleteClassVideo] = useDeleteClassVideoMutation();
  const [createClassMaterial] = useCreateClassMaterialMutation();
  const [deleteClassMaterial] = useDeleteClassMaterialMutation();
  const [createExam] = useCreateExamMutation();
  const [updateExam] = useUpdateExamMutation();
  const [deleteExam] = useDeleteExamMutation();
  const [addExamQuestion] = useAddExamQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [publishExam] = usePublishExamMutation();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null);
  const [files, setFiles] = useState<CourseFiles>(emptyFiles);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [subjects, setSubjects] = useState<SubjectDraft[]>([]);
  const [faqs, setFaqs] = useState<FaqDraft[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const initializedRef = useRef(false);
  const originalSubjectIdsRef = useRef<number[]>([]);
  const originalFaqIdsRef = useRef<number[]>([]);
  const originalModulesRef = useRef<OriginalModule[]>([]);
  const originalQuestionIdsRef = useRef<Map<number, number[]>>(new Map());

  const isLoading = isLoadingCourse || isLoadingSubjects || isLoadingFaqs || isLoadingClasses;

  useEffect(() => {
    if (initializedRef.current || !course || !subjectsData || !faqsData || !classesData) return;
    initializedRef.current = true;

    setBasicInfo(toBasicInfo(course));

    const courseSubjects = subjectsData.results;
    setSubjects(courseSubjects.map((s) => ({ id: String(s.id), name: s.name })));
    originalSubjectIdsRef.current = courseSubjects.map((s) => s.id);

    const courseFaqs = faqsData.results.filter((f) => f.related_course === courseId);
    setFaqs(courseFaqs.map((f) => ({ id: String(f.id), question: f.question, answer: f.answer })));
    originalFaqIdsRef.current = courseFaqs.map((f) => f.id);

    setModules(toModules(classesData.results));
    originalModulesRef.current = classesData.results.map((cls) => ({
      id: cls.id,
      title: cls.title,
      items: [
        ...cls.videos.map((v): OriginalItem => ({ id: v.id, type: "video", title: v.title, videoUrl: v.video_url, videoDuration: v.duration })),
        ...cls.class_materials.map((m): OriginalItem => ({ id: m.id, type: "file", title: m.title })),
        ...cls.quizzes.map((qz): OriginalItem => ({ id: qz.id, type: "quiz", title: qz.title })),
      ],
    }));
    const questionMap = new Map<number, number[]>();
    for (const cls of classesData.results) {
      for (const qz of cls.quizzes) {
        questionMap.set(qz.id, qz.questions.map((q) => q.id));
      }
    }
    originalQuestionIdsRef.current = questionMap;
  }, [course, subjectsData, faqsData, classesData, courseId]);

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
    if (basicInfo.promoVideoUrl) formData.append("promo_video_url", basicInfo.promoVideoUrl);
    if (basicInfo.syllabusDriveLink) formData.append("syllabus_drive_link", basicInfo.syllabusDriveLink);
    if (files.thumbnail) formData.append("thumbnail", files.thumbnail);
    if (files.coverImage) formData.append("cover_image", files.coverImage);
    if (files.syllabusPdf) formData.append("syllabus_pdf", files.syllabusPdf);

    try {
      await updateCourse({ id: courseId, data: formData }).unwrap();
    } catch (err) {
      setSaveError(`কোর্স সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
      setIsSaving(false);
      return;
    }

    const nextSubjects: SubjectDraft[] = [];
    const nextFaqs: FaqDraft[] = [];
    const nextModules: CourseModule[] = [];

    try {
      // --- Subjects: create / update / delete ---
      const currentSubjectIds = new Set(subjects.filter((s) => isPersisted(s.id)).map((s) => Number(s.id)));
      for (const id of originalSubjectIdsRef.current.filter((id) => !currentSubjectIds.has(id))) {
        await deleteCourseSubject(id).unwrap();
      }
      for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i];
        if (isPersisted(s.id)) {
          await updateCourseSubject({ id: Number(s.id), data: { name: s.name, ordering: i } }).unwrap();
          nextSubjects.push(s);
        } else {
          const created = await createCourseSubject({ course: courseId, name: s.name, ordering: i }).unwrap();
          nextSubjects.push({ id: String(created.id), name: s.name });
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

      // --- Modules (classes) + items: create / update / delete ---
      const originalModuleById = new Map(originalModulesRef.current.map((m) => [m.id, m]));
      const currentModuleIds = new Set(modules.filter((m) => isPersisted(m.id)).map((m) => Number(m.id)));

      for (const mod of originalModulesRef.current) {
        if (currentModuleIds.has(mod.id)) continue;
        for (const item of mod.items) {
          if (item.type === "video") await deleteClassVideo(item.id).unwrap();
          else if (item.type === "file") await deleteClassMaterial(item.id).unwrap();
          else await deleteExam(item.id).unwrap();
        }
        await deleteClass(mod.id).unwrap();
      }

      for (const mod of modules) {
        let backendModuleId: number;
        const originalModule = isPersisted(mod.id) ? originalModuleById.get(Number(mod.id)) : undefined;

        if (originalModule) {
          backendModuleId = originalModule.id;
          if (originalModule.title !== mod.title) {
            await updateClass({ id: backendModuleId, data: { title: mod.title } }).unwrap();
          }
        } else {
          const created = await createClass({ course: courseId, title: mod.title }).unwrap();
          backendModuleId = created.id;
        }

        const originalItemById = new Map((originalModule?.items ?? []).map((i) => [i.id, i]));
        const currentItemIds = new Set(mod.items.filter((i) => isPersisted(i.id)).map((i) => Number(i.id)));
        for (const item of originalModule?.items ?? []) {
          if (currentItemIds.has(item.id)) continue;
          if (item.type === "video") await deleteClassVideo(item.id).unwrap();
          else if (item.type === "file") await deleteClassMaterial(item.id).unwrap();
          else await deleteExam(item.id).unwrap();
        }

        const videoItems = mod.items.filter((i) => i.type === "video");
        const nextItems: ModuleItem[] = [];

        for (const item of mod.items) {
          const originalItem = isPersisted(item.id) ? originalItemById.get(Number(item.id)) : undefined;

          if (item.type === "video") {
            const changed =
              !originalItem ||
              originalItem.title !== item.title ||
              originalItem.videoUrl !== (item.videoUrl || "") ||
              originalItem.videoDuration !== (item.videoDuration || "");
            if (!changed) {
              nextItems.push(item);
              continue;
            }
            if (originalItem) await deleteClassVideo(originalItem.id).unwrap();
            const createdVideo = await createClassVideo({
              course_class: backendModuleId,
              title: item.title,
              video_url: item.videoUrl || "",
              duration: item.videoDuration || "",
              order: videoItems.indexOf(item),
            }).unwrap();
            nextItems.push({ ...item, id: String(createdVideo.id) });
          } else if (item.type === "file") {
            const changed = !originalItem || originalItem.title !== item.title || item.file;
            if (!changed) {
              nextItems.push(item);
              continue;
            }
            const materialForm = new FormData();
            materialForm.append("course_class", String(backendModuleId));
            materialForm.append("title", item.title);
            materialForm.append("kind", inferMaterialKind(item.file));
            materialForm.append("downloadable", "true");
            if (item.file) materialForm.append("file", item.file);
            if (originalItem) await deleteClassMaterial(originalItem.id).unwrap();
            const createdMaterial = await createClassMaterial(materialForm).unwrap();
            nextItems.push({ ...item, id: String(createdMaterial.id), file: null });
          } else {
            let examId: number;
            if (originalItem) {
              examId = originalItem.id;
              if (originalItem.title !== item.title) {
                await updateExam({ id: examId, data: { title: item.title } }).unwrap();
              }
            } else {
              const createdExam = await createExam({
                course: courseId,
                course_class: backendModuleId,
                title: item.title,
                duration_minutes: 30,
              }).unwrap();
              examId = createdExam.id;
            }

            const originalQuestionIds = originalQuestionIdsRef.current.get(Number(item.id)) ?? [];
            const currentQuestionIds = new Set(
              (item.questions ?? []).filter((q) => isPersisted(q.id)).map((q) => Number(q.id))
            );
            for (const qId of originalQuestionIds.filter((id) => !currentQuestionIds.has(id))) {
              await deleteQuestion(qId).unwrap();
            }

            const questions = item.questions ?? [];
            const nextQuestions: QuizQuestion[] = [];
            for (let i = 0; i < questions.length; i++) {
              const q = questions[i];
              if (!q.question.trim()) continue;
              const data = {
                question_text: q.question,
                option_a: q.options[0] ?? "",
                option_b: q.options[1] ?? "",
                option_c: q.options[2] ?? "",
                option_d: q.options[3] ?? "",
                correct_option: optionLetters[q.correctIndex ?? 0],
                explanation: "",
                order: i + 1,
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
            nextItems.push({ ...item, id: String(examId), questions: nextQuestions });
          }
        }

        nextModules.push({ id: String(backendModuleId), title: mod.title, items: nextItems });
      }
    } catch (err) {
      setSaveError(`কন্টেন্ট সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
      setIsSaving(false);
      return;
    }

    setSubjects(nextSubjects);
    setFaqs(nextFaqs);
    setModules(nextModules);
    originalSubjectIdsRef.current = nextSubjects.map((s) => Number(s.id));
    originalFaqIdsRef.current = nextFaqs.map((f) => Number(f.id));
    originalModulesRef.current = nextModules.map((m) => ({
      id: Number(m.id),
      title: m.title,
      items: m.items.map((i) => ({
        id: Number(i.id),
        type: i.type,
        title: i.title,
        videoUrl: i.videoUrl,
        videoDuration: i.videoDuration,
      })),
    }));
    originalQuestionIdsRef.current = new Map(
      nextModules
        .flatMap((m) => m.items)
        .filter((i) => i.type === "quiz")
        .map((i) => [Number(i.id), (i.questions ?? []).map((q) => Number(q.id))])
    );

    setFiles(emptyFiles);
    setIsSaving(false);
    setSaveMessage("পরিবর্তন সংরক্ষণ করা হয়েছে।");
  };

  if (isLoading || !basicInfo) {
    return <p className="text-center text-sm text-slate-400">কোর্সের তথ্য লোড হচ্ছে…</p>;
  }

  if (isCourseError || !course) {
    return (
      <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500">
        কোর্সটি খুঁজে পাওয়া যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader
        step={step}
        title="কোর্স সম্পাদনা করুন"
        subtitle="কোর্সের সব তথ্য, মডিউল, সাবজেক্ট ও FAQ সম্পাদনা করুন"
        backHref={`/courses/${courseId}`}
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
        <StepBasicInfo value={basicInfo} onChange={setBasicInfo} files={files} onFilesChange={setFiles} />
      )}
      {step === 2 && <StepModules modules={modules} onChange={setModules} />}
      {step === 3 && (
        <StepSubjectsFaqs subjects={subjects} onSubjectsChange={setSubjects} faqs={faqs} onFaqsChange={setFaqs} />
      )}
      {step === 4 && (
        <StepReview
          basicInfo={basicInfo}
          files={files}
          modules={modules}
          subjects={subjects}
          faqs={faqs}
          published={false}
        />
      )}

      <EditWizardFooter
        step={step}
        isSaving={isSaving}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
        onNext={() => setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s))}
        onSave={handleSave}
      />
    </div>
  );
}
