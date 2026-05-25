function stateClass(state) {
  const key = (state || 'in progress').toLowerCase().replace(/\s+/g, '-');
  return `state-pill state-${key}`;
}

export default function ChangeRequestDetail({ changeRequest }) {
  if (!changeRequest) return null;

  const num = changeRequest.number || changeRequest.crId;

  const rows = [
    { label: 'Number', value: num },
    { label: 'Requested by', value: changeRequest.requestedBy },
    { label: 'Source of change', value: changeRequest.sourceOfChange },
    {
      label: 'Primary business service',
      value: changeRequest.primaryBusinessService,
    },
    { label: 'Maintenance window', value: changeRequest.maintenanceWindow },
    { label: 'Location', value: changeRequest.location },
    {
      label: 'Short description',
      value: changeRequest.shortDescription || changeRequest.title,
    },
    {
      label: 'State',
      value: changeRequest.state || changeRequest.status || 'In Progress',
      render: (v) => <span className={stateClass(v)}>{v}</span>,
    },
    {
      label: 'Environment',
      value: changeRequest.environment,
      render: (v) => (
        <span className={`env-pill env-${(v || '').toLowerCase()}`}>{v || '—'}</span>
      ),
    },
    { label: 'Change type', value: changeRequest.changeType },
    { label: 'Change owning group', value: changeRequest.owningGroup },
    { label: 'Change owner', value: changeRequest.changeOwner },
  ];

  return (
    <div className="cr-detail-panel">
      <h3 className="cr-detail-heading">Change request — {num}</h3>
      <dl className="cr-detail-grid">
        {rows.map(({ label, value, render }) => (
          <div key={label} className="cr-detail-row">
            <dt>{label}</dt>
            <dd>{render ? render(value) : value || '—'}</dd>
          </div>
        ))}
      </dl>

      {(changeRequest.draft ||
        changeRequest.implementationPlan ||
        changeRequest.rollbackPlan) && (
        <div className="cr-detail-extra">
          <p className="cr-detail-extra-label">AI-generated documentation</p>
          {changeRequest.draft && (
            <div className="draft-section">
              <h4>Full description</h4>
              <div className="draft-body">{changeRequest.draft}</div>
            </div>
          )}
          {changeRequest.implementationPlan && (
            <div className="draft-section">
              <h4>Implementation plan</h4>
              <div className="draft-body">{changeRequest.implementationPlan}</div>
            </div>
          )}
          {changeRequest.rollbackPlan && (
            <div className="draft-section">
              <h4>Rollback plan</h4>
              <div className="draft-body">{changeRequest.rollbackPlan}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
