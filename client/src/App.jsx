import { useCallback, useEffect, useState } from 'react';
import {
  fetchBoard,
  fetchChangeRequests,
  fetchHealth,
  generateChangeRequest,
} from './api';
import JiraBoard from './components/JiraBoard';
import ChangeRequestsTable from './components/ChangeRequestsTable';
import ChangeRequestDetail from './components/ChangeRequestDetail';

const TABS = [
  { id: 'board', label: 'Jira Board' },
  { id: 'changes', label: 'Change Requests' },
];

export default function App() {
  const [tab, setTab] = useState('board');
  const [boardData, setBoardData] = useState({ columns: [], board: {} });
  const [changeRequests, setChangeRequests] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedCr, setSelectedCr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  const [aiMode, setAiMode] = useState('…');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [board, crs, health] = await Promise.all([
        fetchBoard(),
        fetchChangeRequests(),
        fetchHealth(),
      ]);
      setBoardData(board);
      setChangeRequests(crs);
      setAiMode(health.ai === 'gemini' ? 'Gemini AI' : 'Mock AI (no API key)');
    } catch (err) {
      setMessage({
        type: 'error',
        text: `${err.message}. Is the API running on port 5001?`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const crNumber = (cr) => cr?.number || cr?.crId;

  const handleGenerate = async (jiraKey) => {
    setGenerating(true);
    setMessage(null);
    try {
      const { changeRequest, aiSource } = await generateChangeRequest(jiraKey);
      setChangeRequests((prev) => [changeRequest, ...prev]);
      setSelectedCr(changeRequest);
      setTab('changes');
      const sourceLabel =
        aiSource === 'gemini'
          ? 'Gemini'
          : aiSource === 'mock-quota'
            ? 'mock (quota exceeded)'
            : 'mock';
      setMessage({
        type: 'success',
        text: `Created ${crNumber(changeRequest)} using ${sourceLabel} AI draft.`,
      });
    } catch (err) {
      if (err.status === 409 && err.data?.changeRequest) {
        setSelectedCr(err.data.changeRequest);
        setTab('changes');
        setMessage({
          type: 'info',
          text: `Change request already exists: ${crNumber(err.data.changeRequest)}`,
        });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
    } finally {
      setGenerating(false);
    }
  };

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
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'changes' && changeRequests.length > 0 && (
                <span style={{ marginLeft: '0.35rem', opacity: 0.7 }}>
                  ({changeRequests.length})
                </span>
              )}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="loading">Loading…</p>
        ) : (
          <>
            {tab === 'board' && (
              <JiraBoard
                board={boardData.board}
                columns={boardData.columns}
                selectedKey={selectedKey}
                onSelectTicket={setSelectedKey}
                onGenerate={handleGenerate}
                generating={generating}
                message={message}
              />
            )}

            {tab === 'changes' && (
              <>
                {message && (
                  <div
                    className={`alert ${
                      message.type === 'error'
                        ? 'alert-error'
                        : message.type === 'success'
                          ? 'alert-success'
                          : 'alert-info'
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                <ChangeRequestsTable
                  changeRequests={changeRequests}
                  selectedNumber={crNumber(selectedCr)}
                  onSelect={(cr) => setSelectedCr(cr)}
                />
                <ChangeRequestDetail changeRequest={selectedCr} />
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
