"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

const APOLOGY_BLOOMS = [
  "Aku minta maaf karena beberapa sikapku bikin kamu kesel dan marah.",
  "Aku tahu belakangan ini kita sering sama-sama kewalahan saat ada masalah.",
  "Aku sedang belajar supaya saat emosi, aku tetap bisa bicara dengan lebih lembut.",
  "Aku ingin ke depannya kita lebih banyak saling dengar, bukan saling bertahan sendiri-sendiri.",
  "Kalau masih ada ruang, aku ingin memperbaiki semuanya dengan langkah kecil tapi konsisten.",
  "Kalau kamu butuh waktu, aku ngerti. Kalau kamu siap ngobrol, aku ada.",
];

const ORNAMENTS = [
  { symbol: "❤", top: "18%", left: "10%", delay: 0 },
  { symbol: "❀", top: "40%", left: "7%", delay: 0.24 },
  { symbol: "❤", top: "66%", left: "11%", delay: 0.48 },
  { symbol: "❀", top: "18%", left: "27%", delay: 0.12 },
  { symbol: "❤", top: "40%", left: "30%", delay: 0.36 },
  { symbol: "❀", top: "66%", left: "26%", delay: 0.6 },
];

export default function BloomingApology() {
  const [bloomStep, setBloomStep] = useState(-1);

  const isComplete = bloomStep >= APOLOGY_BLOOMS.length - 1;
  const revealedCount = Math.max(bloomStep + 1, 0);
  const progressPercent = (revealedCount / APOLOGY_BLOOMS.length) * 100;
  const openedPetals = Math.min(revealedCount, 6);
  const flowerScale = Math.min(0.7 + revealedCount * 0.06, 1.05);

  const currentMessage = useMemo(
    () => (bloomStep >= 0 ? APOLOGY_BLOOMS[bloomStep] : 'Sentuh bunga diatas atau klik tombol "Buka lagi" untuk membaca pesanku pelan-pelan.'),
    [bloomStep]
  );

  const growNext = () => {
    if (isComplete) return;

    setBloomStep((current) => Math.min(current + 1, APOLOGY_BLOOMS.length - 1));
  };

  const resetBloom = () => {
    setBloomStep(-1);
  };

  return (
    <article className="surface-card sm:col-span-2 bloom-card" id="blooming-apology">
      <div className="bloom-head">
        <p className="bloom-kicker">pesan kecil dari hatiku</p>
        <h2 className="section-title">Blooming Message</h2>
        <p className="section-copy">
          Setiap klik membuka satu bagian dari pesanku untuk kamu. Gak panjang, tapi aku tulis dengan tulus.
        </p>
      </div>

      <div
        className={`bloom-stage ${isComplete ? "is-complete" : "is-growing"}`}
        onClick={growNext}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            growNext();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className="sr-only">Klik untuk membuka pesan curhat berikutnya.</span>

        <div className="bloom-ornaments" aria-hidden="true">
          {ORNAMENTS.map((item) => (
            <motion.span
              key={`${item.top}-${item.left}-${item.symbol}`}
              className="bloom-ornament"
              style={{
                top: item.top,
                left: item.left,
              }}
              animate={{ y: [0, -7, 0], opacity: [0.42, 0.96, 0.42], rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY, delay: item.delay, ease: "easeInOut" }}
            >
              {item.symbol}
            </motion.span>
          ))}
        </div>

        <div className="bloom-main">
          <motion.div
            className={`bloom-flower-wrap ${isComplete ? "is-complete" : ""}`}
            animate={{ scale: flowerScale, rotate: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <div className="bloom-pot" />
            <div className="bloom-stem" />

            <AnimatePresence>
              {isComplete ? (
                <motion.div
                  key="bloom-wow-glow"
                  className="bloom-wow-glow"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              ) : null}
            </AnimatePresence>

            <div className="bloom-flower">
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={`petal-${index}`}
                  className={`bloom-petal ${index < openedPetals ? "is-open" : ""}`}
                  style={{
                    transform: `rotate(${index * 60}deg) translateY(-1.45rem) scale(${index < openedPetals ? 1 : 0.54})`,
                    opacity: index < openedPetals ? 1 : 0.35,
                  }}
                />
              ))}
              <motion.span
                className="bloom-core"
                animate={
                  isComplete
                    ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0 3px rgba(255, 232, 171, 0.34)", "0 0 0 8px rgba(255, 222, 160, 0.2)", "0 0 0 3px rgba(255, 232, 171, 0.34)"] }
                    : { scale: 1, boxShadow: "0 0 0 3px rgba(255, 232, 171, 0.32)" }
                }
                transition={{ duration: 1.2, repeat: isComplete ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`message-${bloomStep}`}
              className={`bloom-note ${bloomStep < 0 ? "is-placeholder" : ""}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.34, ease: "easeOut" }}
            >
              <p className="bloom-note-label">
                {bloomStep >= 0 ? `Pesan ke-${bloomStep + 1}` : "Siap dibaca"}
              </p>
              <p className="bloom-note-text">{currentMessage}</p>
              <p className="bloom-status">
                {isComplete
                  ? "Bunganya udah mekar sepenuhnya. Semoga cinta kita juga terus tumbuh dan berkembang."
                  : `Bunga mekar ${openedPetals}/6 kelopak`}
              </p>
              <div className="bloom-dots" aria-hidden="true">
                {APOLOGY_BLOOMS.map((_, index) => (
                  <span key={`progress-${index}`} className={`bloom-dot ${index < revealedCount ? "is-active" : ""}`} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="bloom-progress" aria-hidden="true">
          <span className="bloom-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="bloom-progress-label" aria-live="polite">
          Progress: {revealedCount}/{APOLOGY_BLOOMS.length}
        </p>
      </div>

      <div className="bloom-controls">
        <button className="hero-btn-primary" onClick={growNext} disabled={isComplete} type="button">
          {isComplete ? "Semua pesan sudah terbuka" : `Buka lagi (${revealedCount}/${APOLOGY_BLOOMS.length})`}
        </button>
        <button className="hero-btn-ghost" onClick={resetBloom} type="button">
          Ulang dari awal
        </button>
      </div>
    </article>
  );
}
