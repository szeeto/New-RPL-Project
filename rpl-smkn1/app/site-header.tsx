"use client";

import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["Beranda", "#beranda"],
  ["Tentang", "#tentang"],
  ["FAQ", "#faq"],
  ["Guru", "#guru"],
  ["Galeri", "#galeri"],
  ["Artikel", "#artikel"],
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#beranda" aria-label="RPL, ke beranda">
          <span className="brand-mark">
            <Image src="/logo.png" alt="" width={60} height={55} priority />
          </span>
          <span className="brand-text">
            RPL<span>SMKN 1 BUKIT SUNDI</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {links.map(([label, href], index) => (
            <a className={index === 0 ? "active" : ""} href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
        <a
          className="header-cta"
          href="https://smkn1bukitsundi.sch.id"
          target="_blank"
          rel="noreferrer">
          Situs sekolah <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <nav
        className={`mobile-nav${menuOpen ? " is-open" : ""}`}
        id="mobile-navigation"
        aria-label="Navigasi seluler"
        aria-hidden={!menuOpen}>
        {links.map(([label, href]) => (
          <a
            href={href}
            key={href}
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}>
            {label}
            <ArrowUpRight size={14} />
          </a>
        ))}
        <a
          href="https://smkn1bukitsundi.sch.id"
          target="_blank"
          rel="noreferrer"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}>
          Situs sekolah
          <ArrowUpRight size={14} />
        </a>
      </nav>
    </header>
  );
}
