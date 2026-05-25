import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { fetchHealth } from './api';

export default function Layout() {
  const [aiMode, setAiMode] = useState('…');

  useEffect(() => {
    fetchHealth()
      .then((h) =>
        setAiMode(h.ai === 'gemini' ? 'Gemini AI' : 'Mock AI (no API key)')
      )
      .catch(() => setAiMode('Unavailable'));
  }, []);

  return (
    <>
      <header className="app-header">
        <div>
          <span className="logo-badge">SWA</span>
          <h1>Change Management Portal</h1>
          <p className="subtitle">
            Change requests created from Jira via automation
          </p>
        </div>
        <span className="ai-badge">AI: {aiMode}</span>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
