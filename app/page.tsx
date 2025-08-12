import VoiceChat from '@/components/VoiceChat';

export default function Page() {
  return (
    <main className="container">
      <div className="header">
        <div className="row" style={{ gap: 10 }}>
          <span className="title">PanSea Voice</span>
          <span className="badge">Frontend-only</span>
        </div>
      </div>
      <VoiceChat />
      <div className="footer">No backend required. Uses your browser's speech APIs for STT & TTS.</div>
    </main>
  );
} 