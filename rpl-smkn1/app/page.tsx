import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Camera,
  Check,
  Code2,
  Database,
  ExternalLink,
  Layers3,
  Mail,
  Monitor,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cmsUnavailableText, getPublicContent } from "@/lib/public-content";
import SiteHeader from "./site-header";

const navigation = [
  ["Beranda", "#beranda"],
  ["Tentang", "#tentang"],
  ["FAQ", "#faq"],
  ["Guru", "#guru"],
  ["Galeri", "#galeri"],
  ["Artikel", "#artikel"],
];

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`section-heading${centered ? " centered" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function EmptyContent({ type, message }: { type: "gallery" | "faq" | "articles"; message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        {type === "gallery" ? <Layers3 size={24} /> : type === "faq" ? <Users size={24} /> : <Braces size={24} />}
      </div>
      <div>
        <h3>{type === "gallery" ? "Galeri sedang disiapkan" : type === "faq" ? "Belum ada pertanyaan" : "Belum ada artikel"}</h3>
        <p>
          {message}
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getPublicContent();
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero" id="beranda" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-orb hero-orb-one" aria-hidden="true" />
          <div className="hero-orb hero-orb-two" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="status-dot" />
                SMK NEGERI 1 BUKIT SUNDI · SUMATERA BARAT
              </div>
              <h1 id="hero-title">
                Belajar hari ini.
                <br />
                <span>Membangun esok.</span>
              </h1>
              <p className="hero-description">
                Unggul dalam Kompetensi, Kuat dalam Karakter. Kenali program
                Rekayasa Perangkat Lunak SMK Negeri 1 Bukit Sundi—sekolah
                pencetak tenaga profesional di bidang perangkat lunak.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#tentang">
                  Kenali program RPL <ArrowRight size={17} />
                </a>
                <a className="button button-quiet" href="#faq">
                  Punya pertanyaan? <ArrowDown size={16} />
                </a>
              </div>
              <div className="hero-note">
                <span className="note-rule" />
                Dari rasa ingin tahu, menjadi karya yang bisa digunakan.
              </div>
            </div>

            <div
              className="hero-visual"
              aria-label="Ilustrasi ruang kerja pengembangan perangkat lunak">
              <div className="visual-glow" />
              <div className="editor-window">
                <div className="editor-topbar">
                  <div className="window-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>project / langkah-pertama.ts</span>
                  <Code2 size={16} aria-hidden="true" />
                </div>
                <div className="editor-body">
                  <div className="code-lines" aria-hidden="true">
                    <span className="line-number">01</span>
                    <code>
                      <b>const</b> <i>ide</i> ={" "}
                      <em>&quot;berani mencoba&quot;</em>;
                    </code>
                    <span className="line-number">02</span>
                    <code>
                      <b>function</b> <i>buatSesuatu</i>() {"{"}
                    </code>
                    <span className="line-number">03</span>
                    <code className="indent">
                      <b>return</b> <em>&quot;mulai dari sini&quot;</em>;
                    </code>
                    <span className="line-number">04</span>
                    <code>{"}"}</code>
                    <span className="line-number">05</span>
                    <code className="code-blank">&nbsp;</code>
                    <span className="line-number">06</span>
                    <code>
                      <i>buatSesuatu</i>();
                    </code>
                  </div>
                  <div className="editor-footer">
                    <span>
                      <span className="status-dot" /> Semua perubahan tersimpan
                    </span>
                    <span>TypeScript&nbsp; · &nbsp;UTF-8</span>
                  </div>
                </div>
              </div>
              <div className="float-card float-card-top">
                <span className="float-icon mint-icon">
                  <Monitor size={17} />
                </span>
                <span>
                  <b>Web</b>
                  <small>Bangun ide</small>
                </span>
                <ArrowUpRight size={14} className="float-arrow" />
              </div>
              <div className="float-card float-card-bottom">
                <span className="float-icon purple-icon">
                  <Database size={17} />
                </span>
                <span>
                  <b>Logika</b>
                  <small>Atasi masalah</small>
                </span>
                <Check size={15} className="float-check" />
              </div>
              <div className="visual-caption">
                <span>01</span> IDE · KOLABORASI · KARYA
              </div>
            </div>
          </div>
          <a
            href="#tentang"
            className="scroll-cue"
            aria-label="Gulir ke bagian tentang RPL">
            <span />
          </a>
        </section>

        <section className="intro-strip" aria-label="Fokus pembelajaran">
          <div className="intro-strip-inner">
            <span className="strip-label">Belajar dengan tujuan</span>
            <span>
              <Code2 size={16} /> Berpikir logis
            </span>
            <span>
              <Users size={16} /> Berkarya bersama
            </span>
            <span>
              <Sparkles size={16} /> Bertumbuh lewat praktik
            </span>
          </div>
        </section>

        <section className="section about-section" id="tentang">
          <div className="about-layout">
            <div className="about-aside">
              <span className="eyebrow">01 / TENTANG PROGRAM</span>
              <div className="about-art" aria-hidden="true">
                <div className="art-ring ring-one" />
                <div className="art-ring ring-two" />
                <div className="art-card">
                  <div className="art-card-top">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="art-symbol">
                    <Code2 size={43} strokeWidth={1.5} />
                  </div>
                  <span className="art-caption">IDE → SOLUSI</span>
                </div>
                <div className="art-tag tag-one">
                  <Monitor size={14} /> Aplikasi
                </div>
                <div className="art-tag tag-two">
                  <Smartphone size={14} /> Mobile
                </div>
              </div>
              <div className="about-aside-foot">
                <span className="aside-number">01</span>
                <span>
                  Belajar memahami, merancang, dan membangun perangkat lunak.
                </span>
              </div>
            </div>
            <div className="about-content">
              <SectionHeading
                eyebrow="Kenali Rekayasa Perangkat Lunak"
                title="Teknologi bukan cuma kode. Ini tentang memecahkan masalah."
              />
              <p>
                Rekayasa Perangkat Lunak (RPL) adalah salah satu jurusan di
                bidang teknologi informasi yang berfokus pada pengembangan
                perangkat lunak, baik aplikasi desktop, web, maupun mobile.
                Siswa memahami seluruh siklus hidup pengembangan perangkat
                lunak—dari analisis kebutuhan dan perancangan, hingga
                implementasi, pengujian, dan pemeliharaan.
              </p>
              <p>
                Di jurusan RPL, siswa mempelajari bahasa pemrograman seperti
                Java, Python, JavaScript, dan PHP, disertai teknologi pendukung
                seperti database, framework, dan tools pengembangan modern.
                Materi lainnya mencakup desain UI/UX, keamanan aplikasi, dan
                manajemen proyek perangkat lunak.
              </p>
              <p>
                Proses belajar tidak hanya teori. Proyek, tugas kelompok, dan
                magang di industri memberi ruang untuk bekerja dalam tim,
                memecahkan masalah nyata, dan menghasilkan produk perangkat
                lunak yang dapat digunakan masyarakat luas.
              </p>
              <div
                className="skill-list"
                aria-label="Bahasa pemrograman yang dipelajari">
                <span>Java</span>
                <span>Python</span>
                <span>JavaScript</span>
                <span>PHP</span>
              </div>
              <a href="#faq" className="text-link">
                Lihat pertanyaan umum <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section className="section learning-section">
          <div className="learning-top">
            <SectionHeading
              eyebrow="Belajar dari prosesnya"
              title="Dari ide kecil menuju solusi nyata."
              description="Siklus pengembangan perangkat lunak mengajak siswa berpikir runtut, mencoba, lalu terus menyempurnakan."
            />
            <span className="learning-index" aria-hidden="true">
              RPL / 01—04
            </span>
          </div>
          <div className="process-grid">
            {[
              {
                number: "01",
                title: "Pahami",
                text: "Analisis kebutuhan dan masalah yang ingin diselesaikan.",
                icon: Sparkles,
              },
              {
                number: "02",
                title: "Rancang",
                text: "Susun rancangan solusi dan antarmuka yang mudah digunakan.",
                icon: Layers3,
              },
              {
                number: "03",
                title: "Bangun",
                text: "Implementasikan ide menjadi perangkat lunak yang berfungsi.",
                icon: Braces,
              },
              {
                number: "04",
                title: "Uji & rawat",
                text: "Uji hasilnya, perbaiki, lalu pelihara aplikasi.",
                icon: Check,
              },
            ].map(({ number, title, text, icon: Icon }) => (
              <article className="process-card" key={number}>
                <div className="process-card-top">
                  <span>{number}</span>
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="process-footnote">
            <span className="status-dot" /> Belajar melalui proyek, tugas
            kelompok, dan magang di industri.
          </p>
        </section>

        <section className="faq-section" id="faq">
          <div className="section faq-layout">
            <div className="faq-intro">
              <SectionHeading
                eyebrow="02 / JAWABAN SINGKAT"
                title="Pertanyaan yang sering ditanyakan."
                description="Hal-hal yang ingin diketahui sebelum mengenal lebih jauh program RPL."
              />
              <a
                className="button button-dark"
                href="mailto:rplsmkn1bukitsundii@gmail.com">
                Tanyakan langsung <Mail size={16} />
              </a>
            </div>
            <div className="faq-list">
              {content.faq.length ? content.faq.map(({ id, question, answer }, index) => (
                <details className="faq-item" key={id}>
                  <summary>
                    <span className="faq-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="faq-question">{question}</span>
                    <span className="faq-toggle" aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              )) : <EmptyContent type="faq" message={cmsUnavailableText(content)} />}
            </div>
          </div>
        </section>

        <section className="section teachers-section" id="guru">
          <div className="teachers-heading">
            <SectionHeading
              eyebrow="03 / ORANG-ORANG DI BALIK PROGRAM RPL"
              title="Belajar bersama para guru RPL."
              description="Kenali nama-nama pengajar program Rekayasa Perangkat Lunak."
            />
            <span className="teacher-count">
              <Users size={17} /> {content.teachers.length} pengajar
            </span>
          </div>
          <div className="teacher-grid">
            {content.teachers.map((teacher, index) => (
              <article className="teacher-card" key={teacher.id}>
                <div
                  className={`teacher-portrait ${["mint", "peach", "lavender", "blue", "yellow"][index % 5]}`}
                  aria-label={`Foto ${teacher.full_name}`}>
                  {teacher.photo_url
                    ? <img src={teacher.photo_url} alt={teacher.full_name} />
                    : <span>{teacher.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>}
                  <span className="portrait-index">RPL · 0{index + 1}</span>
                  <div className="portrait-lines" />
                </div>
                <div className="teacher-info">
                  <h3>{teacher.full_name}</h3>
                  <p>{teacher.position || teacher.subject}</p>
                  {teacher.position && <p>{teacher.subject}</p>}
                  {teacher.bio && <p>{teacher.bio}</p>}
                </div>
              </article>
            ))}
          </div>
          {!content.teachers.length && <p className="teacher-note">{content.teacherError || cmsUnavailableText(content)}</p>}
        </section>

        <section className="section showcase-section" id="galeri">
          <div className="showcase-heading">
            <SectionHeading
              eyebrow="04 / KEGIATAN & KARYA"
              title="Cerita RPL, dari ruang belajar."
              description="Dokumentasi kegiatan dan kabar program."
            />
            <span className="section-code">GALLERY / JOURNAL</span>
          </div>
          <div className="showcase-grid">
            <div className="showcase-panel gallery-panel">
              <div className="panel-title">
                <span>
                  <Layers3 size={17} /> Galeri RPL
                </span>
                <span className="panel-index">01 — {String(content.gallery.length).padStart(2, "0")}</span>
              </div>
              {content.gallery.length ? (
                <div className="public-gallery-grid">
                  {content.gallery.slice(0, 6).map((item) => (
                    <article className="public-gallery-card" key={item.id}>
                      <img src={item.image_url} alt={item.alt_text} loading="lazy" />
                      <div>
                        <span>{item.category}</span>
                        <h3>{item.title}</h3>
                        {item.description && <p>{item.description}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : <EmptyContent type="gallery" message={cmsUnavailableText(content)} />}
              <div className="panel-decoration" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="showcase-panel article-panel" id="artikel">
              <div className="panel-title">
                <span>
                  <Braces size={17} /> Blog & Artikel
                </span>
                <span className="panel-index">02 — {String(content.articles.length).padStart(2, "0")}</span>
              </div>
              {content.articles.length ? (
                <div className="public-article-list">
                  {content.articles.slice(0, 3).map((article) => (
                    <Link className="public-article-card" href={`/artikel/${encodeURIComponent(article.slug)}`} key={article.id}>
                      {article.cover_url && <img src={article.cover_url} alt="" loading="lazy" />}
                      <span>
                        <small>{article.category} · {article.author}</small>
                        <strong>{article.title}</strong>
                        <p>{article.summary}</p>
                      </span>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                </div>
              ) : <EmptyContent type="articles" message={cmsUnavailableText(content)} />}
              <div className="article-panel-link">
                <a
                  href="https://smkn1bukitsundi.sch.id"
                  target="_blank"
                  rel="noreferrer">
                  Kunjungi situs sekolah <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section" aria-label="Hubungi program RPL">
          <div className="cta-pattern" aria-hidden="true" />
          <div className="cta-content">
            <span className="eyebrow">MULAI DARI RASA INGIN TAHU</span>
            <h2>Ide berikutnya bisa datang dari kamu.</h2>
            <p>Ingin mengenal program Rekayasa Perangkat Lunak lebih lanjut?</p>
            <a
              className="button button-light"
              href="mailto:rplsmkn1bukitsundii@gmail.com">
              Hubungi program RPL <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="cta-stamp" aria-hidden="true">
            <Code2 size={29} />
            <span>
              THINK
              <br />
              BUILD
              <br />
              GROW
            </span>
          </div>
        </section>
      </main>
      <footer className="site-footer" id="kontak">
        <div className="footer-main">
          <div className="footer-brand">
            <a
              className="brand"
              href="#beranda"
              aria-label="RPL, kembali ke beranda">
              <span className="brand-mark">
                <Code2 size={20} />
              </span>
              <span className="brand-text">
                RPL<span>SMKN 1 BUKIT SUNDI</span>
              </span>
            </a>
            <p>
              Membangun masa depan digital.
              <br />
              Unggul dalam kompetensi, kuat dalam karakter.
            </p>
          </div>
          <div className="footer-links">
            <span className="footer-label">Jelajahi</span>
            {navigation.slice(1).map(([label, href]) => (
              <a href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
          <div className="footer-contact">
            <span className="footer-label">Temukan kami</span>
            <p>
              Jalan Solok - Muaro Paneh Km. 7, Nagari Muaro Paneh, Kecamatan
              Bukit Sundi, Kabupaten Solok, Sumatera Barat
            </p>
            <a href="mailto:rplsmkn1bukitsundii@gmail.com">
              rplsmkn1bukitsundii@gmail.com
            </a>
            <div className="social-links">
              <a
                href="https://www.instagram.com/rplsmkn1bukitsundi?igsh=MXExenU0NHM1am81YQ=="
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram RPL SMKN 1 Bukit Sundi">
                <Camera size={16} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook">
                <Users size={16} />
              </a>
              <a
                href="https://smkn1bukitsundi.sch.id"
                target="_blank"
                rel="noreferrer"
                aria-label="Situs SMK Negeri 1 Bukit Sundi">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © 2026 · Rekayasa Perangkat Lunak SMK Negeri 1 Bukit Sundi
          </span>
          <span>Patra Sawali XII RPL 2</span>
          <a href="#beranda">Kembali ke atas ↑</a>
        </div>
      </footer>
    </>
  );
}
