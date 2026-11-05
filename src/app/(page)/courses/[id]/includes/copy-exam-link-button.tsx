"use client";

import CopyShareLinkButton from "@/components/copy-share-link-button";
import { examShareUrl } from "@/lib/share-links";

/**
 * The link an admin shares for one model test or free MCQ: a short
 * /t/{course}/{exam} link (lib/share-links.ts) that goes through the student
 * login page — a logged-in student is forwarded straight to the test, anyone
 * else logs in first. The course id gives the link preview its image.
 */
export function modelTestShareUrl(examId: number, courseId: number) {
  return examShareUrl(examId, courseId);
}

export default function CopyExamLinkButton({
  examId,
  courseId,
  isDraft,
  text,
}: {
  examId: number;
  courseId: number;
  isDraft: boolean;
  text?: string;
}) {
  return (
    <CopyShareLinkButton
      url={examShareUrl(examId, courseId)}
      label="শিক্ষার্থীদের জন্য পরীক্ষার লিংক কপি করুন"
      isDraft={isDraft}
      text={text}
    />
  );
}
