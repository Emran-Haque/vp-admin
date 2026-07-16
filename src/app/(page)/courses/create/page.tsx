"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import WizardHeader from "./includes/wizard-header";
import StepBasicInfo from "./includes/step-basic-info";
import StepModules from "./includes/step-modules";
import StepSubjectsFaqs from "./includes/step-subjects-faqs";
import StepReview from "./includes/step-review";
import WizardFooter from "./includes/wizard-footer";
import { useCreateCourseMutation, useUpdateCourseMutation } from "@/redux/api/coursesApi";
import { useCreateCourseSubjectMutation } from "@/redux/api/courseSubjectsApi";
import { useCreateFaqMutation } from "@/redux/api/contentApi";
import {
  useCreateClassMutation,
  useCreateClassVideoMutation,
  useCreateClassMaterialMutation,
} from "@/redux/api/classesApi";
import {
  useCreateExamMutation,
  useAddExamQuestionMutation,
  usePublishExamMutation,
} from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";
import type { BasicInfo, CourseFiles, CourseModule, QuizQuestion, SubjectDraft, FaqDraft } from "./includes/types";

const optionLetters = ["A", "B", "C", "D"] as const;

const emptyBasicInfo: BasicInfo = {
  name: "",
  shortDescription: "",
  fullDescription: "",
  whyNeeded: "",
  category: "",
  level: "",
  price: "",
  oldPrice: "",
  discount: "",
  isFree: false,
  duration: "",
  batchStartDate: "",
  classStartDate: "",
  totalClasses: "",
  totalQuizzes: "",
  totalAssignments: "",
  promoVideoUrl: "",
  syllabusDriveLink: "",
};

const emptyFiles: CourseFiles = {
  thumbnail: null,
  coverImage: null,
  syllabusPdf: null,
};

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(emptyBasicInfo);
  const [files, setFiles] = useState<CourseFiles>(emptyFiles);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [subjects, setSubjects] = useState<SubjectDraft[]>([]);
  const [faqs, setFaqs] = useState<FaqDraft[]>([]);

  // Once the course is first saved (draft or published) we keep updating the same
  // record instead of creating a new one on every subsequent draft save.
  const [courseId, setCourseId] = useState<number | null>(null);
  const [persistedSubjectIds, setPersistedSubjectIds] = useState<string[]>([]);
  const [persistedFaqIds, setPersistedFaqIds] = useState<string[]>([]);
  // Maps local (client-generated) module/item/question ids to the backend record
  // id once persisted, so re-saving a draft doesn't create duplicates.
  const [persistedModuleIds, setPersistedModuleIds] = useState<Record<string, number>>({});
  const [persistedItemIds, setPersistedItemIds] = useState<Record<string, number>>({});
  const [persistedQuestionIds, setPersistedQuestionIds] = useState<Record<string, number>>({});

  const [published, setPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  const [createCourse] = useCreateCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const [createCourseSubject] = useCreateCourseSubjectMutation();
  const [createFaq] = useCreateFaqMutation();
  const [createClass] = useCreateClassMutation();
  const [createClassVideo] = useCreateClassVideoMutation();
  const [createClassMaterial] = useCreateClassMaterialMutation();
  const [createExam] = useCreateExamMutation();
  const [addExamQuestion] = useAddExamQuestionMutation();
  const [publishExam] = usePublishExamMutation();

  const handleSubmit = async (isPublished: boolean) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setDraftMessage(null);

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
    formData.append("is_published", String(isPublished));
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

    let course;
    try {
      course = courseId
        ? await updateCourse({ id: courseId, data: formData }).unwrap()
        : await createCourse(formData).unwrap();
      setCourseId(course.id);
    } catch (err) {
      console.error("Failed to save course:", err);
      setSubmitError(`কোর্স সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
      setIsSubmitting(false);
      return;
    }

    const newSubjects = subjects.filter((s) => !persistedSubjectIds.includes(s.id));
    for (const s of newSubjects) {
      try {
        await createCourseSubject({ course: course.id, name: s.name, ordering: subjects.indexOf(s) }).unwrap();
        setPersistedSubjectIds((prev) => [...prev, s.id]);
      } catch (err) {
        console.error(`Failed to add subject "${s.name}":`, err);
        setSubmitError(`সাবজেক্ট "${s.name}" যোগ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSubmitting(false);
        return;
      }
    }

    const newFaqs = faqs.filter((f) => !persistedFaqIds.includes(f.id));
    for (const f of newFaqs) {
      try {
        await createFaq({
          question: f.question,
          answer: f.answer,
          category: "general",
          related_course: course.id,
          related_book: null,
          ordering: faqs.indexOf(f),
          is_active: true,
        }).unwrap();
        setPersistedFaqIds((prev) => [...prev, f.id]);
      } catch (err) {
        console.error(`Failed to add FAQ "${f.question}":`, err);
        setSubmitError(`FAQ "${f.question}" যোগ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSubmitting(false);
        return;
      }
    }

    const persistQuizQuestions = async (examId: number, questions: QuizQuestion[]) => {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (persistedQuestionIds[q.id] || !q.question.trim()) continue;
        const createdQuestion = await addExamQuestion({
          examId,
          data: {
            question_text: q.question,
            option_a: q.options[0] ?? "",
            option_b: q.options[1] ?? "",
            option_c: q.options[2] ?? "",
            option_d: q.options[3] ?? "",
            correct_option: optionLetters[q.correctIndex ?? 0],
            explanation: "",
            order: i + 1,
          },
        }).unwrap();
        setPersistedQuestionIds((prev) => ({ ...prev, [q.id]: createdQuestion.id }));
      }
    };

    for (const mod of modules) {
      let backendModuleId = persistedModuleIds[mod.id];
      if (!backendModuleId) {
        try {
          const createdClass = await createClass({ course: course.id, title: mod.title }).unwrap();
          backendModuleId = createdClass.id;
          setPersistedModuleIds((prev) => ({ ...prev, [mod.id]: createdClass.id }));
        } catch (err) {
          console.error(`Failed to add session "${mod.title}":`, err);
          setSubmitError(`অধিবেশন "${mod.title}" যোগ করা যায়নি: ${extractErrorMessage(err)}`);
          setIsSubmitting(false);
          return;
        }
      }

      const videoItems = mod.items.filter((i) => i.type === "video");

      for (const item of mod.items) {
        try {
          const existingItemId = persistedItemIds[item.id];
          if (existingItemId) {
            if (item.type === "quiz") {
              await persistQuizQuestions(existingItemId, item.questions ?? []);
              if ((item.questions ?? []).some((q) => q.question.trim())) {
                await publishExam(existingItemId).unwrap();
              }
            }
            continue;
          }

          if (item.type === "video") {
            const createdVideo = await createClassVideo({
              course_class: backendModuleId,
              title: item.title,
              video_url: item.videoUrl || "",
              duration: item.videoDuration || "",
              order: videoItems.indexOf(item),
            }).unwrap();
            setPersistedItemIds((prev) => ({ ...prev, [item.id]: createdVideo.id }));
          } else if (item.type === "file") {
            const materialForm = new FormData();
            materialForm.append("course_class", String(backendModuleId));
            materialForm.append("title", item.title);
            if (item.file) materialForm.append("file", item.file);
            const createdMaterial = await createClassMaterial(materialForm).unwrap();
            setPersistedItemIds((prev) => ({ ...prev, [item.id]: createdMaterial.id }));
          } else {
            const createdExam = await createExam({
              course: course.id,
              course_class: backendModuleId,
              title: item.title,
              duration_minutes: 30,
            }).unwrap();
            setPersistedItemIds((prev) => ({ ...prev, [item.id]: createdExam.id }));
            await persistQuizQuestions(createdExam.id, item.questions ?? []);
            if ((item.questions ?? []).some((q) => q.question.trim())) {
              await publishExam(createdExam.id).unwrap();
            }
          }
        } catch (err) {
          console.error(`Failed to add content "${item.title}":`, err);
          setSubmitError(`কন্টেন্ট "${item.title}" যোগ করা যায়নি: ${extractErrorMessage(err)}`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    setIsSubmitting(false);
    if (isPublished) {
      setPublished(true);
    } else {
      setDraftMessage(`"${basicInfo.name || "কোর্স"}" খসড়া হিসেবে সংরক্ষণ করা হয়েছে।`);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader step={step} />

      {isSubmitting && (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center text-sm text-slate-400">
          সংরক্ষণ করা হচ্ছে…
        </p>
      )}

      {Boolean(submitError) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-500">{submitError}</p>
        </div>
      )}

      {Boolean(draftMessage) && !published && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-500">{draftMessage}</p>
        </div>
      )}

      {step === 1 && (
        <StepBasicInfo value={basicInfo} onChange={setBasicInfo} files={files} onFilesChange={setFiles} />
      )}
      {step === 2 && <StepModules modules={modules} onChange={setModules} />}
      {step === 3 && (
        <StepSubjectsFaqs
          subjects={subjects}
          onSubjectsChange={setSubjects}
          faqs={faqs}
          onFaqsChange={setFaqs}
        />
      )}
      {step === 4 && (
        <StepReview
          basicInfo={basicInfo}
          files={files}
          modules={modules}
          subjects={subjects}
          faqs={faqs}
          published={published}
        />
      )}

      <WizardFooter
        step={step}
        published={published}
        isSubmitting={isSubmitting}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
        onNext={() => setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s))}
        onSaveDraft={() => handleSubmit(false)}
        onPublish={() => handleSubmit(true)}
      />
    </div>
  );
}
