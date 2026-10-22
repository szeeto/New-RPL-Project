"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Layers3, X } from "lucide-react";
import type { GalleryItem } from "@/lib/cms-types";

export default function GallerySection({
  items,
  emptyMessage,
}: {
  items: GalleryItem[];
  emptyMessage: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const isLightboxOpen = selectedIndex !== null;

  const openLightbox = (index: number, trigger: HTMLElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    returnFocusTo.current = trigger;
    setIsClosing(false);
    setSelectedIndex(index);
  };

  const closeLightbox = useCallback(() => {
    if (selectedIndex === null || isClosing) return;
    setIsClosing(true);
    closeTimer.current = setTimeout(() => {
      setSelectedIndex(null);
      setIsClosing(false);
      returnFocusTo.current?.focus();
    }, 220);
  }, [isClosing, selectedIndex]);

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) =>
      current === null ? current : (current - 1 + items.length) % items.length,
    );
  }, [items.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((current) =>
      current === null ? current : (current + 1) % items.length,
    );
  }, [items.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, closeLightbox, showNext, showPrevious]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const selectedItem =
    selectedIndex === null ? null : items[selectedIndex] ?? null;

  return (
    <>
      <section className="showcase-panel gallery-panel" id="galeri" aria-labelledby="gallery-title">
        <div className="panel-title">
          <span id="gallery-title">
            <Layers3 size={17} /> Galeri RPL
          </span>
          <span className="panel-index">
            01 — {String(items.length).padStart(2, "0")}
          </span>
        </div>
        {items.length ? (
          <div className="public-gallery-grid">
            {items.map((item, index) => (
              <button
                className="public-gallery-card"
                key={item.id}
                type="button"
                onClick={(event) => openLightbox(index, event.currentTarget)}
                aria-label={`Buka foto ${item.title}, ${index + 1} dari ${items.length}`}
              >
                <span className="gallery-image-wrap">
                  <img src={item.image_url} alt={item.alt_text || item.title} loading="lazy" />
                </span>
                <span className="gallery-card-caption">
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                  {item.description && <span className="gallery-card-description">{item.description}</span>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="showcase-empty">
            <div className="empty-icon" aria-hidden="true"><Layers3 size={22} /></div>
            <div>
              <h3>Galeri sedang disiapkan</h3>
              <p>{emptyMessage}</p>
            </div>
          </div>
        )}
      </section>

      {selectedItem && (
        <div
          className={`gallery-lightbox${isClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${selectedIndex! + 1} dari ${items.length}: ${selectedItem.title}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            const endX = event.changedTouches[0]?.clientX;
            if (startX === null || endX === undefined) return;
            const distance = endX - startX;
            if (Math.abs(distance) > 48) {
              if (distance > 0) showPrevious();
              else showNext();
            }
            touchStartX.current = null;
          }}
        >
          <button
            className="lightbox-close"
            ref={closeButton}
            type="button"
            onClick={closeLightbox}
            aria-label="Tutup galeri"
          >
            <X size={22} />
          </button>
          <button
            className="lightbox-nav lightbox-previous"
            type="button"
            onClick={showPrevious}
            aria-label="Foto sebelumnya"
          >
            <ArrowLeft size={22} />
          </button>
          <figure className="lightbox-figure">
            <img src={selectedItem.image_url} alt={selectedItem.alt_text || selectedItem.title} />
            <figcaption>
              <span>
                {selectedItem.category && <small>{selectedItem.category}</small>}
                <strong>{selectedItem.title}</strong>
                {selectedItem.description && <span>{selectedItem.description}</span>}
              </span>
              <span className="lightbox-count">
                {String(selectedIndex! + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
          <button
            className="lightbox-nav lightbox-next"
            type="button"
            onClick={showNext}
            aria-label="Foto berikutnya"
          >
            <ArrowRight size={22} />
          </button>
        </div>
      )}
    </>
  );
}
