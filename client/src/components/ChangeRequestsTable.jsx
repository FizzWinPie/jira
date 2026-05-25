export default function ChangeRequestsTable({
  changeRequests,
  selectedCrId,
  onSelect,
}) {
  if (!changeRequests.length) {
    return (
      <div className="empty-state">
        <p>No change requests yet.</p>
        <p style={{ fontSize: '0.9rem' }}>
          Go to the Jira board, select a ticket, and click &quot;Generate change
          request (AI)&quot; to create a draft.
        </p>
      </div>
    );
  }

  return (
    <div className="cr-table-wrap">
      <table className="cr-table">
        <thead>
          <tr>
            <th>CR ID</th>
            <th>Jira</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Environment</th>
            <th>Risk</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {changeRequests.map((cr) => (
            <tr
              key={cr.crId}
              className={selectedCrId === cr.crId ? 'selected' : ''}
            >
              <td>
                <strong>{cr.crId}</strong>
              </td>
              <td>{cr.jiraKey}</td>
              <td>{cr.title}</td>
              <td>
                <span className="status-draft">{cr.status}</span>
              </td>
              <td>{cr.priority}</td>
              <td>{cr.environment}</td>
              <td>{cr.riskLevel}</td>
              <td>
                {new Date(cr.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => onSelect(cr)}
                >
                  View draft
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
