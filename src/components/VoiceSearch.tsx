"use client";

import { useState, useRef, useCallback } from "react";

/**
 * ═══ VOICE SEARCH COMPONENT ═══
 * Uses Web Speech API for voice-first search
 * Bible ref: PreLaunch Complete Bible → Part 6 (Hirer Experience)
 * "Voice-first search in Tamil and Hindi"
 * Supports: English, Tamil, Hindi
 */

interface VoiceSearchProps {
  onResult: (text: string) => void;
  onListening?: (isListening: boolean) => void;
  placeholder?: string;
  language?: "en-IN" | "ta-IN" | "hi-IN";
}

export default function VoiceSearch({
  onResult,
  onListening,
  placeholder = "Tap mic or type...",
  language = "en-IN",
}: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [inputText, setInputText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const languageLabels: Record<string, string> = {
    "en-IN": "English",
    "ta-IN": "தமிழ்",
    "hi-IN": "हिन्दी",
  };

  const startListening = useCallback(() => {
    setError("");

    // Check browser support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Voice search not supported on this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = language;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      onListening?.(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        setInputText(text);
        onResult(text);
        setIsListening(false);
        onListening?.(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("[voice search]", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Enable in browser settings.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else {
        setError("Voice search failed. Try typing instead.");
      }
      setIsListening(false);
      onListening?.(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListening?.(false);
    };

    recognition.start();
  }, [language, onResult, onListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    onListening?.(false);
  }, [onListening]);

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      onResult(inputText.trim());
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div
        className="flex items-center gap-2 rounded-[16px] px-4 py-2"
        style={{
          background: "var(--bg-card)",
          border: isListening
            ? "2px solid var(--brand, #FF6B00)"
            : "1px solid var(--border)",
          transition: "border 0.2s",
        }}
      >
        <span className="text-[16px]">🔍</span>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
          placeholder={isListening ? `Listening in ${languageLabels[language]}...` : placeholder}
          className="flex-1 bg-transparent outline-none text-[14px] font-medium"
          style={{ color: "var(--text-1)", caretColor: "var(--brand)" }}
        />

        {/* Mic button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{
            background: isListening
              ? "var(--brand, #FF6B00)"
              : "var(--bg-surface)",
          }}
        >
          {isListening ? (
            <div style={{ position: "relative" }}>
              <span className="text-[16px]" style={{ animation: "live-blink 0.8s infinite" }}>
                🎙️
              </span>
            </div>
          ) : (
            <span className="text-[16px]">🎤</span>
          )}
        </button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-[12px]"
          style={{ background: "rgba(255,107,0,0.08)" }}
        >
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 12 + i * 4,
                  borderRadius: 2,
                  background: "var(--brand, #FF6B00)",
                  animation: `voice-bar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                }}
              />
            ))}
          </div>
          <span className="text-[12px] font-bold" style={{ color: "var(--brand, #FF6B00)" }}>
            Listening...
          </span>
          {transcript && (
            <span className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>
              &ldquo;{transcript}&rdquo;
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-[11px] font-medium px-2" style={{ color: "var(--danger, #FF3B3B)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
