"use client";

import { useState } from "react";
import WizardHeader from "./includes/wizard-header";
import StepBasicInfo from "./includes/step-basic-info";
import StepModules from "./includes/step-modules";
import StepReview from "./includes/step-review";
import WizardFooter from "./includes/wizard-footer";
import { useCreateCourseMutation } from "@/redux/api/coursesApi";
import type { BasicInfo, CourseModule } from "./includes/types";

const emptyBasicInfo: BasicInfo = {
  name: "",
  description: "",
  category: "",
  level: "",
  price: "",
  duration: "",
};

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(emptyBasicInfo);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [createCourse, { isLoading: isPublishing, isSuccess: published, isError, error }] =
    useCreateCourseMutation();

  const handlePublish = () => {
    createCourse({
      title: basicInfo.name,
      category: Number(basicInfo.category),
      short_description: basicInfo.description,
      price: basicInfo.price || "0",
      duration: basicInfo.duration,
      level: basicInfo.level,
      is_published: true,
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader step={step} />

      {step === 1 && <StepBasicInfo value={basicInfo} onChange={setBasicInfo} />}
      {step === 2 && <StepModules modules={modules} onChange={setModules} />}
      {step === 3 && (
        <StepReview
          basicInfo={basicInfo}
          modules={modules}
          published={published}
          isPublishing={isPublishing}
          error={isError ? error : undefined}
        />
      )}

      <WizardFooter
        step={step}
        published={published}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
        onNext={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s))}
        onPublish={handlePublish}
      />
    </div>
  );
}
