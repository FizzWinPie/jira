function ctaskStateClass(state) {
  const key = (state || 'open').toLowerCase();
  return `state-pill state-ctask-${key}`;
}

function empty(value) {
  return value && String(value).trim() !== '' ? value : '—';
}

function isEmpty(value) {
  return !value || String(value).trim() === '' || value === '—';
}

function ContentField({ label, value, emptyMessage }) {
  const text = value?.trim() ? value : emptyMessage || '—';
  const empty = !value?.trim();
  return (
    <div className="cr-field-row">
      <span className="cr-field-label">{label}</span>
      <div className={`cr-field-value-box${empty ? ' cr-field-value-empty' : ''}`}>
        {text}
      </div>
    </div>
  );
}

export default function ChangeTaskDetail({ task }) {
  if (!task) return null;

  const headerRows = [
    { label: 'Number', value: task.number },
    { label: 'Change request', value: task.changeNumber },
    { label: 'Location', value: task.location },
    { label: 'Configuration item', value: task.configurationItem },
    { label: 'Planned start date', value: task.plannedStartDate, mono: true },
    { label: 'Planned end date', value: task.plannedEndDate, mono: true },
    {
      label: 'State',
      value: task.state,
      render: (v) => <span className={ctaskStateClass(v)}>{v}</span>,
    },
    { label: 'Task type', value: task.taskType },
    { label: 'Automation template', value: empty(task.automationTemplate) },
    { label: 'Assignment group', value: task.assignmentGroup },
    { label: 'Assigned to', value: task.assignedTo },
    { label: 'Actual start', value: empty(task.actualStartDate), mono: true },
    { label: 'Actual end', value: empty(task.actualEndDate), mono: true },
    {
      label: 'Implementation result',
      value: empty(task.implementationResult),
    },
  ];

  return (
    <div className="cr-detail-stack">
      <div className="cr-detail-meta">
        <dl className="cr-detail-grid">
          {headerRows.map(({ label, value, render, mono }) => (
            <div key={label} className="cr-detail-row">
              <dt>{label}</dt>
              <dd
                className={[
                  isEmpty(value) && !render ? 'cr-field-value-empty' : '',
                  mono ? 'mono-cell' : '',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined}
              >
                {render ? render(value) : value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="cr-detail-section">
        <div className="cr-tab-planning">
          <ContentField label="Short description" value={task.shortDescription} />
          <ContentField
            label="Detailed description"
            value={task.detailedDescription}
          />
        </div>
      </div>

      <div className="cr-detail-section">
        <div className="cr-tab-planning">
          <ContentField
            label="Work notes"
            value={task.workNotes}
            emptyMessage="No work notes have been added."
          />
        </div>
      </div>
    </div>
  );
}
