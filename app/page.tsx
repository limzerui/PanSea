'use client'
import { useAccountContext } from '@/components/AccountContext';
import VoiceChat from '@/components/VoiceChat';
import { loginToSandbox } from '@/lib/sandbox';
import { useEffect } from 'react';

export default function Page() {
  const { setLoginToken, } = useAccountContext();
  const ADMIN_USERNAME = "AlbertDing123";
  const ADMIN_PASSWORD = "Fieryzk9631!";

  useEffect(() => {
    const setup = async () => {
      // Example: login and create user/account
      const token = await loginToSandbox(ADMIN_USERNAME, ADMIN_PASSWORD);
      setLoginToken(token);

      // If you want to create a user/account here, call your API and set IDs:
      // const userId = await createUser(...);
      // setUserId(userId);
      // const accountId = await createAccount(userId, ...);
      // setAccountId(accountId);
    };
    setup();
  }, []);
  
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
        
        <div className="divider" />
        
        <div className="stack">
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--accent-2)' }}>What Information the AI Needs:</h3>
          <div className="stack" style={{ gap: 16 }}>
            <div className="card">
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>Create Bank Account</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                <strong>Required:</strong> Email, Password, First Name, Last Name, Bank Choice (Bank A, B, or C)
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>
                <em>Example:</em> "Create account for abc@example.com with password 123456, first name John, last name Doe, at Bank A"
              </p>
            </div>
            
            <div className="card">
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>Transfer Money</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                <strong>Required:</strong> From Bank, To Bank, Amount
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>
                <em>Example:</em> "Transfer $500 from Bank A to Bank B"
              </p>
            </div>
            
            <div className="card">
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>Deposit/Withdraw</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                <strong>Required:</strong> Bank, Account, Amount
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>
                <em>Example:</em> "Deposit $1000 to my Bank A account" or "Withdraw $200 from Bank B"
              </p>
            </div>
            
            <div className="card">
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>Simple Greeting</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                <strong>Required:</strong> Nothing special
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>
                <em>Example:</em> "Hello" or "Hi there"
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '32px' }}>
        <VoiceChat />
      </div>
      
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