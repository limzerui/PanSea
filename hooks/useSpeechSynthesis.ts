import { useCallback, useEffect, useRef, useState } from 'react';

type UseSpeechSynthesisReturn = {
  isSupported: boolean;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (v: SpeechSynthesisVoice | null) => void;
  speak: (text: string, opts?: { rate?: number; pitch?: number; volume?: number }) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
};

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, _setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const loadVoices = () => {
      const v = synth.getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        _setSelectedVoice(v.find(x => /en|US|GB|English/i.test(x.lang)) || v[0] || null);
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

  const speak = useCallback((text: string, opts?: { rate?: number; pitch?: number; volume?: number }) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      if (selectedVoice) utt.voice = selectedVoice;
      if (opts?.rate) utt.rate = opts.rate;
      if (opts?.pitch) utt.pitch = opts.pitch;
      if (opts?.volume !== undefined) utt.volume = opts.volume;

      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
    } catch {}
  }, [selectedVoice]);

  const pause = useCallback(() => {
    try { window.speechSynthesis.pause(); } catch {}
  }, []);

  const resume = useCallback(() => {
    try { window.speechSynthesis.resume(); } catch {}
  }, []);

  const cancel = useCallback(() => {
    try { window.speechSynthesis.cancel(); setIsSpeaking(false); } catch {}
  }, []);

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice: _setSelectedVoice,
    speak,
    pause,
    resume,
    cancel
  };
} 