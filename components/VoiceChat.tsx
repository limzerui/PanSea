'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { getAssistantResponse } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  id: string;
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function VoiceChat() {
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [recLang, setRecLang] = useState<string>('en-US');
  const [maxAlt, setMaxAlt] = useState<number>(1);

  const {
    isSupported: sttSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error: sttError,
    startListening,
    stopListening,
    resetTranscripts
  } = useSpeechRecognition({ language: recLang, interimResults: true, continuous: true, maxAlternatives: maxAlt, autoRestart: true });

  const {
    isSupported: ttsSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    cancel
  } = useSpeechSynthesis();

  const lastAssistantMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (finalTranscript) {
      setInputText(finalTranscript);
    }
  }, [finalTranscript]);
  type WireMsg = { role: 'user' | 'assistant'; content: string };

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
  
    const userMsg: ChatMessage = { id: generateId('usr'), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    resetTranscripts();
  
    setIsSending(true);
    try {
      // 1) Convert UI state to API message shape
      const historyForApi: WireMsg[] = [
        ...messages.map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: trimmed },
      ];
  

      const trimmedHistory = trimHistory(historyForApi, { maxTurns: 16 });
      
  
      // 3) Call backend with full history 
      const replyText = await getAssistantResponse(
        Array.isArray(trimmedHistory) ? trimmedHistory : []
      );
  
      // 4) Append assistant reply to UI
      const assistantMsg: ChatMessage = { id: generateId('asst'), role: 'assistant', text: replyText };
      lastAssistantMsgIdRef.current = assistantMsg.id;
      setMessages(prev => [...prev, assistantMsg]);
  
      if (ttsSupported && autoSpeak) speak(replyText);
    } catch (err) {
      const assistantMsg: ChatMessage = {
        id: generateId('asst'),
        role: 'assistant',
        text: 'There was an error getting a response. Please try again.',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsSending(false);
    }
  }
  
  // Keep a rolling window of history (turns = user+assistant pairs)
  function trimHistory(
    history: WireMsg[],
    opts: { maxTurns?: number; maxChars?: number } = {}
  ) {
    let out = history;
  
    if (opts.maxTurns) {
      let userTurns = 0;
      const rev: WireMsg[] = [];
      for (let i = history.length - 1; i >= 0 && userTurns < opts.maxTurns; i--) {
        rev.push(history[i]);
        if (history[i].role === 'user') userTurns++;
      }
      out = rev.reverse();
    }
  
    if (opts.maxChars) {
      let total = 0;
      const rev: WireMsg[] = [];
      for (let i = out.length - 1; i >= 0; i--) {
        const len = out[i].content.length;
        if (total + len > opts.maxChars) break;
        rev.push(out[i]);
        total += len;
      }
      out = rev.reverse();
    }
  
    return out;
  }

  function handleMicToggle() {
    if (!sttSupported) return;
    if (isListening) {
      stopListening();
    } else {
      resetTranscripts();
      startListening();
    }
  }

  async function requestMicPermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      // swallow; UI will continue to show error if denied
    }
  }

  function handleReplay() {
    if (!ttsSupported) return;
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      speak(lastAssistant.text);
    }
  }

  const sttStatus = useMemo(() => {
    if (!sttSupported) return { label: 'STT unsupported', cls: 'bad' } as const;
    if (sttError) return { label: `STT error: ${sttError}`, cls: 'bad' } as const;
    if (isListening) return { label: 'Listening…', cls: 'ok' } as const;
    return { label: 'Idle', cls: 'warn' } as const;
  }, [sttSupported, sttError, isListening]);

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Controls */}
      <div className="panel stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 10 }}>
            <span className={`status-dot ${sttStatus.cls}`} />
            <span>{sttStatus.label}</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <label className="row" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
              <span>Auto-speak responses</span>
            </label>
            {ttsSupported && (
              <select
                className="input"
                style={{ width: 220 }}
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const v = voices.find(v => v.name === e.target.value) || null;
                  setSelectedVoice(v);
                }}
              >
                <option value="">System default voice</option>
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            )}
            {!sttSupported || sttError ? (
              <button className="button ghost" onClick={requestMicPermission}>
                Grant mic
              </button>
            ) : null}
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <button
            className="button"
            onClick={handleMicToggle}
            disabled={!sttSupported}
            title={sttSupported ? 'Start/Stop microphone for voice banking' : 'Your browser does not support speech recognition'}
          >
            {isListening ? 'Stop Mic' : 'Start Mic'}
          </button>

          <button
            className="button secondary"
            onPointerDown={() => { if (!isListening) { resetTranscripts(); startListening(); } }}
            onPointerUp={() => { if (isListening) { stopListening(); } }}
            onPointerCancel={() => { if (isListening) { stopListening(); } }}
            disabled={!sttSupported}
            title="Press and hold to speak your banking request"
          >
            Hold to Talk
          </button>

          <button
            className="button secondary"
            onClick={() => {
              resetTranscripts();
              setInputText('');
            }}
          >
            Clear input
          </button>

          <button
            className="button ghost"
            onClick={handleReplay}
            disabled={!ttsSupported || isSpeaking}
            title={ttsSupported ? 'Replay last banking response' : 'Your browser does not support speech synthesis'}
          >
            Replay last response
          </button>

          <button className="button danger" onClick={cancel} disabled={!ttsSupported || !isSpeaking}>
            Stop voice
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="panel stack">
        <div className="stack">
          <label>Speak or type your banking request</label>
          <textarea
            className="input"
            rows={3}
            placeholder={sttSupported ? 'Use mic or type here…' : 'Type here (speech recognition unsupported)…'}
            value={inputText || interimTranscript}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            {sttSupported ? 'Live transcript updates while speaking. Speak naturally about what you want to do.' : 'Your browser does not support speech recognition.'}
          </span>
          <button
            className="button"
            onClick={() => handleSend(inputText || interimTranscript)}
            disabled={isSending || (!inputText && !interimTranscript)}
          >
            {isSending ? 'Processing...' : 'Send Request'}
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div className="panel stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>Banking Conversation</strong>
          <button className="button ghost" onClick={() => setMessages([])} disabled={messages.length === 0}>
            Clear history
          </button>
        </div>
        <div className="stack">
          {messages.length === 0 && (
            <div className="card" style={{ color: 'var(--muted)' }}>
              Say something with the mic, or type a message, then send.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="card" style={{
              background: m.role === 'user' ? 'rgba(108, 174, 255, 0.09)' : 'rgba(139,92,246,0.09)'
            }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.8 }}>{m.role === 'user' ? 'You' : 'Banking Assistant'}</span>
                {m.role === 'assistant' && (
                  <div className="row" style={{ gap: 8 }}>
                    <button className="button secondary" onClick={() => speak(m.text)} disabled={!ttsSupported}>
                      Play
                    </button>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 