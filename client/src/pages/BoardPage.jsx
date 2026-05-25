import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBoard, generateChangeRequest } from '../api';
import JiraBoard from '../components/JiraBoard';

export default function BoardPage() {
  const navigate = useNavigate();
  const [boardData, setBoardData] = useState({ columns: [], board: {} });
  const [selectedKey, setSelectedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const board = await fetchBoard();
      setBoardData(board);
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
      const { changeRequest, ctasks, aiSource } =
        await generateChangeRequest(jiraKey);
      const sourceLabel =
        aiSource === 'gemini'
          ? 'Gemini'
          : aiSource === 'mock-quota'
            ? 'mock (quota exceeded)'
            : 'mock';
      navigate(`/changes/${crNumber(changeRequest)}`, {
        state: {
          ctasks,
          message: {
            type: 'success',
            text: `Created ${crNumber(changeRequest)} with ${sourceLabel} planning from Jira.`,
          },
        },
      });
    } catch (err) {
      if (err.status === 409 && err.data?.changeRequest) {
        navigate(`/changes/${crNumber(err.data.changeRequest)}`, {
          state: {
            message: {
              type: 'info',
              text: `Change request already exists: ${crNumber(err.data.changeRequest)}`,
            },
          },
        });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <p className="loading">Loading…</p>;

  return (
    <JiraBoard
      board={boardData.board}
      columns={boardData.columns}
      selectedKey={selectedKey}
      onSelectTicket={setSelectedKey}
      onGenerate={handleGenerate}
      generating={generating}
      message={message}
    />
  );
}
