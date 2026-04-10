"use client";

import { toPng } from "html-to-image";
import { useMemo, useRef, useState } from "react";
import { FaSmileWink } from "react-icons/fa";

type AnalysisResult = {
  score: number;
  tone: string;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  rewrite: string;
};

type AnalysisResponse = {
  result: AnalysisResult;
  provider: "gemini";
  model?: string;
  message?: string;
};

const EMPATHY_PROMPT = "Kalau suatu saat aku lagi marah atau kita berantem lagi, kamu bakal merespons aku seperti apa supaya masalahnya nggak makin besar dan kita bisa baikan?";
const WHATSAPP_TARGET_NUMBER = "6281211361258";

const dataUrlToFile = (dataUrl: string, fileName: string) => {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
};

export default function PromiseAndChoice() {
  const [draft, setDraft] = useState("");
  const [hasGeneratedResult, setHasGeneratedResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  const scoreWidth = useMemo(() => `${result?.score ?? 0}%`, [result?.score]);
  const canShare = hasGeneratedResult && draft.trim().length > 0 && result !== null;
  const strengthsForDisplay = result && result.strengths.length > 0 ? result.strengths : ["-"];

  const runChecker = async () => {
    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/empathy-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft }),
      });

      const data = (await response.json()) as AnalysisResponse | { error?: string };

      if (!response.ok || !("result" in data)) {
        throw new Error(("error" in data && data.error) || "Gagal memproses jawaban.");
      }

      setResult(data.result);
      setStatusMessage(data.message ?? "Sudah aku baca dan aku rangkum pelan-pelan.");
      setHasGeneratedResult(true);
    } catch (error) {
      setResult(null);
      setHasGeneratedResult(false);
      setStatusMessage(error instanceof Error ? error.message : "Maaf, ada kendala saat memproses jawabannya.");
    } finally {
      setIsLoading(false);
    }
  };

  const shareToWhatsapp = () => {
    if (!canShare || result === null) return;

    const nl = "\r\n";

    const reportLines = [
      "CATATAN CARA MENGHADAPI KONFLIK",
      "===============================",
      `Pertanyaan: ${EMPATHY_PROMPT}`,
      `Jawaban kamu: ${draft.trim()}`,
      "-------------------------------",
      `Skor Empati: ${result.score}/100 (${result.tone})`,
      "-------------------------------",
      "Yang Sudah Bagus:",
      ...strengthsForDisplay.map((item) => `- ${item}`),
      "",
      "Yang Perlu Diperbaiki:",
      ...result.issues.map((item) => `- ${item}`),
      "",
      "Saran Lanjut:",
      ...result.suggestions.map((item) => `- ${item}`),
      "",
      "Contoh Tindakan yang Direkomendasikan:",
      result.rewrite,
    ];

    const url = `https://wa.me/${WHATSAPP_TARGET_NUMBER}?text=${encodeURIComponent(reportLines.join(nl))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareResultAsImage = async () => {
    if (!canShare || result === null || !resultCardRef.current) return;

    try {
      const dataUrl = await toPng(resultCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const fileName = `hasil-konflik-${new Date().toISOString().slice(0, 10)}.png`;
      const imageFile = dataUrlToFile(dataUrl, fileName);
      const caption = "Aku kirim hasil pendekatan konfliknya ya. Aku lampirin screenshot hasilnya.";

      const canUseNativeShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [imageFile] });

      if (canUseNativeShare) {
        await navigator.share({
          title: "Hasil pendekatan konflik",
          text: caption,
          files: [imageFile],
        });
        setStatusMessage("Silakan pilih WhatsApp di menu share untuk kirim screenshot + caption.");
        return;
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();

      const waUrl = `https://wa.me/${WHATSAPP_TARGET_NUMBER}?text=${encodeURIComponent(caption)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setStatusMessage("Screenshot hasil sudah di-download. Tinggal attach gambarnya di WhatsApp.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatusMessage("Share dibatalkan.");
        return;
      }
      setStatusMessage("Gagal membuat screenshot hasil. Coba lagi sebentar.");
    }
  };

  return (
    <article className="surface-card sm:col-span-2 empathy-card" id="closing-choice">
      <div className="empathy-head">
        <p className="empathy-kicker">cara kita menghadapi konflik</p>
        <h2 className="section-title">Conflict Resolution Approach</h2>
      </div>

      <p className="section-copy mb-1">
        Bagian ini aku bikin karena aku pengen kita punya cara yang lebih sehat ke depannya.
      </p>
      <p className="section-copy mb-4">
        Kalau nanti kita berantem lagi, aku harap kita bisa tetap saling denger, nggak saling nyerang, dan fokus cari solusi, bukan menang-menangan.
      </p>

      <div className="empathy-prompt-card">
        <p className="empathy-prompt-label">Pertanyaan buat kamu</p>
        <p className="empathy-prompt-text">{EMPATHY_PROMPT}</p>
      </div>

      <label className="empathy-label" htmlFor="empathy-input">
        Jawaban kamu
      </label>
      <textarea
        id="empathy-input"
        className="empathy-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Isi sesuai kata hati kamu."
      />

      <div className="empathy-actions">
        <button className="hero-btn-primary" onClick={runChecker} disabled={isLoading} type="button">
          {isLoading ? "Sedang memproses..." : "Lihat Output Pendekatanmu"}
        </button>
      </div>

      {statusMessage ? <p className="empathy-status">{statusMessage}</p> : null}

      {hasGeneratedResult && result !== null ? (
        <div className="empathy-result" aria-live="polite" ref={resultCardRef}>
          <div className="empathy-score-row">
            <div>
              <p className="empathy-score-title">Skor Empati: {result.score}/100</p>
              <p className="empathy-source">Dirangkum dari jawaban kamu</p>
            </div>
            <p className="empathy-tone">{result.tone}</p>
          </div>

          <div className="empathy-bar" aria-hidden="true">
            <span className="empathy-bar-fill" style={{ width: scoreWidth }} />
          </div>

          <div className="empathy-grid">
            <div>
              <h3 className="empathy-subtitle">Yang Sudah Bagus:</h3>
              <ul className="empathy-list">
                {strengthsForDisplay.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="empathy-subtitle">Yang Perlu Diperbaiki:</h3>
              <ul className="empathy-list is-warning">
                {result.issues.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="empathy-suggestion-box">
            <h3 className="empathy-subtitle">Saran Lanjutan:</h3>
            <ul className="empathy-list">
              {result.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="empathy-suggestion-box">
            <h3 className="empathy-subtitle">Contoh tindakan yang aku rekomendasikan:</h3>
            <p className="empathy-rewrite">{result.rewrite}</p>
          </div>

          <p className="empathy-status empathy-status--highlight">
            * Jangan lupa kasih tau ayang kamu hasilnya ya... <FaSmileWink aria-hidden="true" style={{ display: "inline", marginLeft: "0.32rem", verticalAlign: "-0.08em", color: "var(--accent)" }} />
          </p>

          <button className="hero-btn-ghost empathy-share-button" onClick={shareToWhatsapp} disabled={!canShare} type="button">
            Share ke WhatsApp
          </button>

          <button className="hero-btn-ghost empathy-share-button" onClick={shareResultAsImage} disabled={!canShare} type="button">
            Share via Screenshot (PNG)
          </button>
        </div>
      ) : null}
    </article>
  );
}
