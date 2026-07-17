export function inferMaterialKind(file: File | null | undefined): string {
  const ext = file?.name.split(".").pop()?.toLowerCase();
  if (ext === "doc" || ext === "docx") return "doc";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  return "pdf";
}
