export type CmsCollection = "gallery" | "faq" | "articles" | "teachers";

export type GalleryItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  image_path: string;
  alt_text: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  cover_url: string;
  cover_path: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TeacherItem = {
  id: string;
  full_name: string;
  nip: string;
  photo_url: string;
  photo_path: string;
  subject: string;
  position: string;
  education: string;
  email: string;
  bio: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type CmsItem = GalleryItem | FaqItem | ArticleItem | TeacherItem;
