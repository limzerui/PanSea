import VoiceChat from '@/components/VoiceChat';

export default function Page() {
  return (
    <main className="container">
      <div className="header">
        <div className="row" style={{ gap: 10 }}>
          <span className="title">PanSea Banking Assistant</span>
          <span className="badge">Voice-Enabled</span>
        </div>
      </div>
      
      {/* Welcome and Instructions */}
      <div className="panel stack">
        <div className="stack">
          <h2 style={{ margin: 0, color: 'var(--accent)' }}>Welcome to Your Voice Banking Assistant</h2>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text)' }}>
            Use your voice to manage your banking accounts naturally. You can create accounts, check balances, 
            make transfers, and more, all through conversation.
          </p>
        </div>
        
        <div className="divider" />
        
        
        <div className="stack">
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--accent-2)' }}>💡 How to Use:</h3>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li><strong>Click "Start Mic"</strong> or use "Hold to Talk" button</li>
            <li><strong>Speak naturally</strong> about what you want to do</li>
            <li><strong>Wait for AI response</strong> - it will ask for missing details if needed</li>
            <li><strong>Confirm or provide</strong> any additional information requested</li>
            <li><strong>Listen to results</strong> - responses are spoken back to you</li>
          </ol>
        </div>
      </div>
      
      <VoiceChat />
      
      <div className="footer">
        <div className="stack" style={{ gap: 8, textAlign: 'center' }}>
          <span>🔒 Secure Banking • 🎤 Voice-First Interface • 🤖 AI-Powered</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            This is a sandbox environment for testing. No real money is involved.
          </span>
        </div>
      </div>
    </main>
  );
} 