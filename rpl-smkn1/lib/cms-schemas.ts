import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const order = z.number().int().min(0).max(100000);
const bool = z.boolean();
const httpUrl = z.string().url().refine(
  (value) => /^https?:\/\//i.test(value),
  "URL gambar harus menggunakan HTTP atau HTTPS.",
);

export const gallerySchema = z.object({
  title: text(120),
  description: optionalText(2000),
  category: text(80),
  image_url: httpUrl,
  image_path: text(500),
  alt_text: text(180),
  sort_order: order.default(0),
  published: bool.default(false),
}).strict();

export const faqSchema = z.object({
  question: text(250),
  answer: text(5000),
  sort_order: order.default(0),
  published: bool.default(false),
}).strict();

export const articleSchema = z.object({
  title: text(180),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
  summary: text(500),
  content: text(30000),
  category: text(80),
  author: text(120),
  cover_url: z.union([httpUrl, z.literal("")]),
  cover_path: z.string().max(500),
  published: bool,
  published_at: z.string().datetime().nullable(),
}).strict();

export const teacherSchema = z.object({
  full_name: text(160),
  nip: optionalText(40),
  photo_url: z.union([httpUrl, z.literal("")]),
  photo_path: z.string().max(500),
  subject: text(120),
  position: optionalText(120),
  education: optionalText(120),
  email: z.union([z.string().email().max(254), z.literal("")]),
  bio: optionalText(2000),
  published: bool.default(false),
}).strict();

export const collectionSchemas = {
  gallery: gallerySchema,
  faq: faqSchema,
  articles: articleSchema,
  teachers: teacherSchema,
} as const;
