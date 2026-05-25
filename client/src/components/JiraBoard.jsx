import { useState } from 'react';

function priorityClass(priority) {
  return `pill pill-priority-${(priority || 'medium').toLowerCase()}`;
}

export default function JiraBoard({
  board,
  columns,
  selectedKey,
  onSelectTicket,
  onGenerate,
  generating,
  message,
}) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleSelect = (ticket) => {
    setSelectedTicket(ticket);
    onSelectTicket(ticket.key);
  };

  const allTickets = columns.flatMap((col) => board[col] || []);
  const detail =
    selectedTicket ||
    allTickets.find((t) => t.key === selectedKey) ||
    null;

  return (
    <div>
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

      <div className="board">
        {columns.map((col) => (
          <div key={col} className="column">
            <h3>
              {col}
              <span className="column-count">{(board[col] || []).length}</span>
            </h3>
            {(board[col] || []).map((ticket) => (
              <div
                key={ticket.key}
                className={`ticket-card ${
                  selectedKey === ticket.key ? 'selected' : ''
                }`}
                onClick={() => handleSelect(ticket)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSelect(ticket);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="ticket-key">{ticket.key}</div>
                <div className="ticket-summary">{ticket.summary}</div>
                <div className="ticket-meta">
                  <span className="pill pill-type">{ticket.type}</span>
                  <span className={priorityClass(ticket.priority)}>
                    {ticket.priority}
                  </span>
                  {ticket.storyPoints > 0 && (
                    <span className="pill pill-type">{ticket.storyPoints} SP</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {detail && (
        <div className="detail-panel">
          <h2>
            {detail.key}: {detail.summary}
          </h2>
          <p className="desc">{detail.description}</p>
          <div className="ticket-meta" style={{ marginBottom: '0.75rem' }}>
            <span className="pill pill-type">{detail.epic}</span>
            <span className="pill pill-type">{detail.assignee}</span>
            {(detail.labels || []).map((l) => (
              <span key={l} className="pill pill-type">
                {l}
              </span>
            ))}
          </div>
          {detail.acceptanceCriteria?.length > 0 && (
            <>
              <strong style={{ fontSize: '0.85rem' }}>Acceptance criteria</strong>
              <ul className="criteria">
                {detail.acceptanceCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={generating}
            onClick={() => onGenerate(detail.key)}
          >
            {generating ? 'AI drafting change request…' : 'Generate change request (AI)'}
          </button>
        </div>
      )}

      {!detail && (
        <p className="empty-state" style={{ marginTop: '2rem' }}>
          Select a Jira card to view details and generate an AI change request draft.
        </p>
      )}
    </div>
  );
}
