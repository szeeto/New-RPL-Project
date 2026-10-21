import { NextResponse } from "next/server";
import { z } from "zod";
import {
  articleSchema,
  collectionSchemas,
  faqSchema,
  gallerySchema,
} from "@/lib/cms-schemas";
import { getAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";
import type { CmsCollection } from "@/lib/cms-types";

const paramsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(150).default(""),
  category: z.string().trim().max(80).default(""),
  status: z.enum(["all", "published", "draft"]).default("all"),
  sort: z.enum(["newest", "oldest", "title", "order"]).default("newest"),
});
const tables: CmsCollection[] = ["gallery", "faq", "articles", "teachers"];

function validCollection(value: string): value is CmsCollection {
  return tables.includes(value as CmsCollection);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function safeSearchValue(value: string) {
  return value.replace(/[(),."\\]/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ collection: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    const { collection } = await context.params;
    if (!validCollection(collection)) return NextResponse.json({ error: "Konten tidak dikenal." }, { status: 404 });

    const url = new URL(request.url);
    const parsed = paramsSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Filter tidak valid." }, { status: 400 });
    const { page, pageSize, status, sort } = parsed.data;
    const search = safeSearchValue(parsed.data.search);
    const { category } = parsed.data;
    const searchable = collection === "gallery" ? "title,description,category"
      : collection === "faq" ? "question,answer"
        : collection === "articles" ? "title,summary,category,author"
          : "full_name,subject,position,nip,email";
    const orderColumn = sort === "title" ? (collection === "faq" ? "question" : collection === "teachers" ? "full_name" : "title")
      : sort === "order" ? "sort_order"
        : sort === "oldest" ? "created_at" : collection === "articles" ? "published_at" : "created_at";
    const categoryColumn = collection === "teachers" ? "subject" : "category";

    let query = getAdminSupabase()
      .from(collection)
      .select("*", { count: "exact" });
    if (search) query = query.or(searchable.split(",").map((field) => `${field}.ilike.%${escapeLike(search)}%`).join(","));
    if (category && collection !== "faq") query = query.eq(categoryColumn, category);
    if (status !== "all") query = query.eq("published", status === "published");
    const ascending = sort === "oldest" || sort === "title" || sort === "order";
    const { data, count, error } = await query
      .order(orderColumn, { ascending, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;

    const { data: categoryRows, error: categoryError } = collection === "faq"
      ? { data: [], error: null }
      : await getAdminSupabase().from(collection).select(categoryColumn).order(categoryColumn);
    if (categoryError) throw categoryError;
    const categories = [...new Set((categoryRows || [])
      .map((row) => Object.values(row)[0])
      .filter((value): value is string => typeof value === "string" && Boolean(value)))];
    return NextResponse.json({
      items: data || [],
      total: count || 0,
      page,
      pageSize,
      categories,
    });
  } catch (error) {
    console.error("CMS list error", error);
    return NextResponse.json({ error: "Konten tidak dapat dimuat. Periksa konfigurasi database." }, { status: 503 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ collection: string }> },
) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    const { collection } = await context.params;
    if (!validCollection(collection)) return NextResponse.json({ error: "Konten tidak dikenal." }, { status: 404 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }
    const parsed = collectionSchemas[collection].safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: "Periksa kembali isian formulir.",
        fields: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const db = getAdminSupabase();
    const created = collection === "gallery"
      ? await db.from("gallery").insert(gallerySchema.parse(body)).select("*").single()
      : collection === "faq"
        ? await db.from("faq").insert(faqSchema.parse(body)).select("*").single()
        : collection === "articles"
          ? await db.from("articles").insert(articleSchema.parse(body)).select("*").single()
          : await db.from("teachers").insert(collectionSchemas.teachers.parse(body)).select("*").single();
    const { data, error } = created;
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Slug tersebut sudah digunakan." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("CMS create error", error);
    return NextResponse.json({ error: "Konten tidak dapat disimpan." }, { status: 503 });
  }
}
