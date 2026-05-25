function stateClass(state) {
  const key = (state || '').toLowerCase().replace(/\s+/g, '-');
  return `state-pill state-${key}`;
}

export default function ChangeRequestsTable({
  changeRequests,
  selectedNumber,
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

  const handleRowClick = (cr) => {
    onSelect(cr);
  };

  return (
    <div className="cr-table-wrap">
      <table className="cr-table cr-table-clickable">
        <thead>
          <tr>
            <th>Number</th>
            <th>Change type</th>
            <th>State</th>
            <th>Short description</th>
            <th>Environment</th>
            <th>Change owning group</th>
            <th>Change owner</th>
            <th>Planned start</th>
            <th>Planned end</th>
          </tr>
        </thead>
        <tbody>
          {changeRequests.map((cr) => {
            const num = cr.number || cr.crId;
            const isSelected = selectedNumber === num;
            return (
              <tr
                key={num}
                className={isSelected ? 'selected' : ''}
                onClick={() => handleRowClick(cr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(cr);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
              >
                <td>
                  <strong>{num}</strong>
                </td>
                <td>{cr.changeType || '—'}</td>
                <td>
                  <span className={stateClass(cr.state || cr.status)}>
                    {cr.state || cr.status || 'In Progress'}
                  </span>
                </td>
                <td className="cr-title-cell">
                  {cr.shortDescription || cr.title || '—'}
                </td>
                <td>
                  <span
                    className={`env-pill env-${(cr.environment || '').toLowerCase()}`}
                  >
                    {cr.environment || '—'}
                  </span>
                </td>
                <td className="mono-cell">{cr.owningGroup || '—'}</td>
                <td>{cr.changeOwner || '—'}</td>
                <td className="mono-cell">{cr.plannedStartDate || '—'}</td>
                <td className="mono-cell">{cr.plannedEndDate || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="cr-table-hint">Click a row to view change request details.</p>
    </div>
  );
}
