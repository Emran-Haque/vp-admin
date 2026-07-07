export type ContentType = "video" | "file" | "quiz";

export type ModuleItem = {
  id: string;
  type: ContentType;
  title: string;
};

export type CourseModule = {
  id: string;
  title: string;
  items: ModuleItem[];
};

export type BasicInfo = {
  name: string;
  description: string;
  category: string;
  level: string;
  price: string;
  duration: string;
};
