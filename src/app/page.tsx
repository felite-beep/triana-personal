"use client";

import Image from "next/image";
import { useState } from "react";
import BloomingApology from "@/components/BloomingApology";
import PromiseAndChoice from "@/components/PromiseAndChoice";

export default function Home() {
  const [visibleSections, setVisibleSections] = useState(1);
  const isVideoFile = (path: string) => /\.(mp4|webm|ogg)$/i.test(path);

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const stickyHeader = document.querySelector("main > header") as HTMLElement | null;
    const offset = (stickyHeader?.offsetHeight ?? 0) + 18;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  };

  const revealNextSection = (targetId: string) => {
    const scrollToTarget = () => scrollToSection(targetId);

    const sectionOrder: Record<string, number> = {
      "story-cards": 2,
      "memory-timeline": 3,
      "blooming-apology": 4,
      "closing-choice": 5,
    };

    const required = sectionOrder[targetId] ?? 1;

    if (visibleSections >= required) {
      scrollToTarget();
      return;
    }

    setVisibleSections((current) => Math.min(5, current + 1));
    window.setTimeout(scrollToTarget, 140);
  };

  const revealAllSections = () => {
    if (visibleSections < 5) {
      setVisibleSections(5);
    }

    window.setTimeout(() => {
      scrollToSection("story-cards");
    }, 140);
  };

  const storyCards = [
    {
      tag: "Aku Datang Pelan-Pelan",
      title: "Aku nggak datang buat maksa semuanya langsung baik",
      body: "Aku cuma pengen buka ruang ngobrol yang lebih tenang. Belajar nyampein perasaan tanpa bikin keadaan makin berat.",
    },
    {
      tag: "Isi Hatiku",
      title: "Aku kangen. Dan aku belajar. Lagi dan lagi.",
      body: "Di balik semuanya, aku masih peduli sama kamu. Dan aku sadar, aku belum selalu bisa bersikap dewasa, terutama saat emosi. Sekarang aku lagi bener-bener berusaha memperbaiki itu.",
    },
    {
      tag: "Harapanku",
      title: "Aku nggak butuh jawaban sekarang.",
      body: "Tapi kalau suatu saat kita coba lagi, aku harap kita bisa jalanin dengan komunikasi yang lebih hangat, lebih jujur, dan saling jaga.",
    },
  ];

  const timelineMoments = [
    {
      date: "26 Oktober 2025",
      place: "Nikahan Bella",
      title: "Pertama kali ketemu",
      insight: "Aku masih inget momen itu. Sederhana, tapi dari situ semuanya mulai terasa beda.",
      image: "/memories/moment-1.jpg",
      imageAlt: "Kenangan pertama kali kita ketemu di nikahan Bella",
    },
    {
      date: "27 Desember 2025",
      place: "Jakarta",
      title: "Ngopi santai di jalan Sabang",
      insight: "Jalan pelan-pelan, ngobrol santai, dan rasanya kita nyambung tanpa harus maksa.",
      image: "/memories/moment-2.mp4",
      imageAlt: "Kenangan ketiga kali ketemu di kafe Jalan Sabang, Jakarta",
    },
    {
      date: "28 Maret 2026",
      place: "Ciwalk, Bandung",
      title: "Terakhir kali ketemu",
      insight: "Waktu itu masih keinget jelas. Hangat, simpel, tapi cukup buat ninggalin rasa yang susah dilupain.",
      image: "/memories/moment-3.jpg",
      imageAlt: "Kenangan terakhir kali kita ketemu di Bandung, Ciwalk",
    },
  ];

  return (
    <div className="page-shell relative flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12">
      <main className="w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-black/10 bg-white/70 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-900/70">
            for you, triana
          </p>
          <p className="text-sm text-stone-700">sedikit curahan hati aku</p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          <article className="hero-shell surface-card sm:col-span-2">
            <p className="hero-kicker">untuk kamu, yang masih aku sayang</p>
            <h1 className="hero-title">Aku minta maaf.
Aku datang dengan niat yang lebih tenang, tanpa emosi yang meledak-ledak seperti sebelumnya.</h1>
            <p className="hero-copy">
              Aku tahu akhir-akhir ini hubungan kita lagi nggak baik, dan mungkin capek juga buat kamu.
Di sini aku nggak mau sok kuat atau nutupin apa yang aku rasain.

Aku kangen. Aku masih peduli.
Dan aku sadar, masih banyak hal dari diriku yang perlu aku perbaiki.

Lewat halaman ini, aku cuma ingin minta maaf dengan tulus.
Dan kalau kamu masih ada sedikit ruang, aku pengen kita bisa ngobrol lagi—pelan-pelan, tanpa tekanan.
            </p>

            <div className="hero-cta-row">
              <button className="hero-btn-primary" onClick={() => revealNextSection("story-cards")} type="button">
                Baca pelan-pelan
              </button>
              <button className="hero-btn-ghost" onClick={revealAllSections} type="button">
                Langsung Lihat Semua Aja
              </button>
            </div>

            <div className="hero-meta-grid">
              <div>
                <p className="hero-meta-label">Fokus</p>
                <p className="hero-meta-value">Tulus, tenang, tanpa menyalahkan</p>
              </div>
              <div>
                <p className="hero-meta-label">Durasi baca</p>
                <p className="hero-meta-value">3 sampai 5 menit</p>
              </div>
              <div>
                <p className="hero-meta-label">Tujuan</p>
                <p className="hero-meta-value">Membuka ruang komunikasi yang lebih sehat</p>
              </div>
            </div>
          </article>

          {visibleSections >= 2 ? (
            <>
              <article id="story-cards" className="surface-card sm:col-span-2">
                <h2 className="section-title">Yang Ingin Aku Sampaikan</h2>
                <p className="section-copy mb-5">
  Ada beberapa hal yang mungkin belum pernah aku sampaikan dengan cara yang tepat.
  Jadi aku coba tulis pelan-pelan di sini.
                </p>

                <div className="story-grid">
                  {storyCards.map((card) => (
                    <div key={card.tag} className="story-card-item">
                      <p className="story-chip">{card.tag}</p>
                      <h3 className="story-title">{card.title}</h3>
                      <p className="story-copy">{card.body}</p>
                    </div>
                  ))}
                </div>
              </article>

              {visibleSections < 3 ? (
                <div className="sm:col-span-2 mt-1">
                  <button className="hero-btn-ghost" onClick={() => revealNextSection("memory-timeline")} type="button">
                    Lanjut ke Perjalanan Kita
                  </button>
                </div>
              ) : null}

              {visibleSections >= 3 ? (
                <article id="memory-timeline" className="surface-card sm:col-span-2">
                  <h2 className="section-title">Perjalanan Kita</h2>
                  <p className="section-copy mb-5">
                    Aku buat section ini biar kita sama-sama ingat hal-hal kecil yang dulu pernah bikin semuanya terasa hangat.
                  </p>

                  <div className="timeline-list">
                    {timelineMoments.map((moment, index) => {
                      const isVideo = isVideoFile(moment.image);

                      return (
                        <article key={moment.date} className={`timeline-item ${isVideo ? "timeline-item--video" : "timeline-item--image"}`}>
                          <div className={`timeline-media-wrap ${isVideo ? "timeline-media-wrap--video" : ""}`}>
                            {isVideo ? (
                              <video
                                className="timeline-media timeline-media--video"
                                src={moment.image}
                                muted
                                loop
                                autoPlay
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <Image
                                className="timeline-media"
                                src={moment.image}
                                alt={moment.imageAlt}
                                width={1200}
                                height={900}
                                loading="eager"
                                sizes="(min-width: 760px) 11rem, 34vw"
                              />
                            )}
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-top">
                              <p className="timeline-index">Momen 0{index + 1}</p>
                              <h3 className="timeline-title">{moment.title}</h3>
                              <p className="timeline-meta">
                                {moment.date} | {moment.place}
                              </p>
                            </div>
                            <p className="timeline-insight">{moment.insight}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </article>
              ) : null}

              {visibleSections >= 3 && visibleSections < 4 ? (
                <div className="sm:col-span-2 mt-1">
                  <button className="hero-btn-ghost" onClick={() => revealNextSection("blooming-apology")} type="button">
                    Lanjut ke Blooming Message
                  </button>
                </div>
              ) : null}

              {visibleSections >= 4 ? <BloomingApology /> : null}

              {visibleSections >= 4 && visibleSections < 5 ? (
                <div className="sm:col-span-2 mt-1">
                  <button className="hero-btn-ghost" onClick={() => revealNextSection("closing-choice")} type="button">
                    Lanjut ke Conflict Resolution Approach
                  </button>
                </div>
              ) : null}

              {visibleSections >= 5 ? <PromiseAndChoice /> : null}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
