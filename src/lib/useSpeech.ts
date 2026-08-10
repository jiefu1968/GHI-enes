"use client";

// Voice input (speech-to-text) and audio output (text-to-speech) using
// the browser's own native Web Speech API — no backend, no API cost,
// no new dependency. Support varies by browser (works well in Chrome/
// Edge; Safari has partial support; Firefox has none for recognition)
// — every hook here exposes `isSupported` so callers can hide the
// button entirely rather than show something that silently does
// nothing, which is worse than not offering it.

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResponseLangMode } from "./language";

// Maps this app's response-language selection to a BCP-47 tag the
// browser's speech APIs expect. "auto" defaults to English since
// that's this deployment's primary language (see language.ts) — there's
// no reliable way to detect which of the two the person is about to
// speak before they've spoken it.
function toSpeechLang(lang: ResponseLangMode): string {
  if (lang === "es") return "es-ES";
  return "en-US";
}

// ── Voice input (microphone → text) ──
export function useSpeechRecognition(lang: ResponseLangMode) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const start = useCallback(
    (onResult: (text: string) => void) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.lang = toSpeechLang(lang);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript ?? "";
        if (text) onResult(text);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [lang]
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, start, stop };
}

// ── Audio output (text → speech) ──
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Voices load asynchronously in some browsers (notably Chrome) — an
  // empty array on the first call is normal, not a bug. Re-fetching
  // after "voiceschanged" fires is the standard workaround.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Picks the best free voice available for the target language. Chrome
  // (and some other browsers) ship several voices per language of very
  // different quality — network-backed "Google ..." voices sound
  // noticeably more natural than the low-quality on-device default the
  // browser otherwise picks automatically. This costs nothing and needs
  // no API key; it just requires actually choosing instead of leaving
  // the browser's own (often worst-available) default in place.
  function pickBestVoice(langTag: string): SpeechSynthesisVoice | null {
    const prefix = langTag.split("-")[0] ?? langTag; // "en-US" -> "en"
    const candidates = voicesRef.current.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    if (candidates.length === 0) return null;
    const premium = candidates.find(
      (v) => !v.localService || /google|natural|neural|enhanced|premium/i.test(v.name)
    );
    return premium ?? candidates[0] ?? null;
  }

  const speak = useCallback((id: string, text: string, lang: ResponseLangMode) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // stop anything already playing first

    // Strip markdown tokens the AI's response contains — TTS should
    // read words, not literal "**" or "#" characters.
    const clean = text
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^[-•]\s+/gm, "")
      .replace(/---+/g, "");

    const langTag = toSpeechLang(lang);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langTag;
    const bestVoice = pickBestVoice(langTag);
    if (bestVoice) utterance.voice = bestVoice;
    // Slightly slower than the 1.0 default reads more naturally for
    // longer theological/missiological content than full speed does.
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  return { isSupported, speakingId, speak, stop };
}
