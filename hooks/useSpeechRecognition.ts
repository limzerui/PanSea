import { useCallback, useEffect, useRef, useState } from 'react';

type UseSpeechRecognitionOptions = {
  language?: string;
  interimResults?: boolean;
  continuous?: boolean;
  maxAlternatives?: number;
  autoRestart?: boolean; // restart automatically on 'no-speech'/natural end
};

type UseSpeechRecognitionReturn = {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscripts: () => void;
};

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const {
    language = 'en-US',
    interimResults = true,
    continuous = false,
    maxAlternatives = 1,
    autoRestart = true
  } = options;

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const userRequestedStopRef = useRef<boolean>(false);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.lang = language;
      rec.interimResults = interimResults;
      rec.continuous = continuous;
      try { rec.maxAlternatives = maxAlternatives; } catch {}

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
        lastErrorRef.current = null;
      };
      rec.onerror = (event: any) => {
        try { console.error('[SpeechRecognition] error', event); } catch {}
        const code = event?.error || 'speech recognition error';
        lastErrorRef.current = code;
        setError(code);
      };
      rec.onend = () => {
        setIsListening(false);
        // Auto-restart on benign ends if user did not explicitly stop
        const shouldRestart = autoRestart && !userRequestedStopRef.current;
        const benignError = lastErrorRef.current === null || lastErrorRef.current === '' || lastErrorRef.current === 'no-speech';
        if (shouldRestart && benignError) {
          setTimeout(() => {
            try { recognitionRef.current?.start?.(); } catch {}
          }, 250);
        }
      };
      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }
        setInterimTranscript(interim);
        if (final) {
          setFinalTranscript(prev => (prev ? prev + ' ' : '') + final.trim());
        }
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, [language, interimResults, continuous, maxAlternatives, autoRestart]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      userRequestedStopRef.current = false;
      setInterimTranscript('');
      setFinalTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      try { console.warn('[SpeechRecognition] start() failed', err); } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      userRequestedStopRef.current = true;
      recognitionRef.current.stop();
    } catch {}
  }, []);

  const resetTranscripts = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
    lastErrorRef.current = null;
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscripts
  };
} 