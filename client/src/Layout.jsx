import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { fetchHealth } from './api';

export default function Layout() {
  const [aiMode, setAiMode] = useState('…');
  const location = useLocation();
  const onChanges = location.pathname.startsWith('/changes');

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
            Jira stories → AI-drafted change requests for Southwest Airlines
          </p>
        </div>
        <span className="ai-badge">AI: {aiMode}</span>
      </header>

      <main className="app-main">
        <nav className="tabs">
          <NavLink
            to="/board"
            className={() =>
              `tab ${location.pathname === '/board' ? 'active' : ''}`
            }
          >
            Jira Board
          </NavLink>
          <NavLink
            to="/changes"
            className={() => `tab ${onChanges ? 'active' : ''}`}
          >
            Change Requests
          </NavLink>
        </nav>
        <Outlet />
      </main>
    </>
  );
}
