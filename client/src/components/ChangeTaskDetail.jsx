function ctaskStateClass(state) {
  const key = (state || 'open').toLowerCase();
  return `state-pill state-ctask-${key}`;
}

function empty(value) {
  return value && String(value).trim() !== '' ? value : '—';
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
    <div className="cr-detail-panel">
      <h3 className="cr-detail-heading">Change task — {task.number}</h3>

      <dl className="cr-detail-grid">
        {headerRows.map(({ label, value, render, mono }) => (
          <div key={label} className="cr-detail-row">
            <dt>{label}</dt>
            <dd className={mono ? 'mono-cell' : undefined}>
              {render ? render(value) : value || '—'}
            </dd>
          </div>
        ))}
      </dl>

      <div className="ctask-content-sections">
        <div className="ctask-content-block">
          <h4 className="ctask-content-label">Short description</h4>
          <div className="cr-tab-field-body">{task.shortDescription || '—'}</div>
        </div>
        <div className="ctask-content-block">
          <h4 className="ctask-content-label">Detailed description</h4>
          <div className="cr-tab-field-body">
            {task.detailedDescription || '—'}
          </div>
        </div>
        <div className="ctask-content-block">
          <h4 className="ctask-content-label">Work notes</h4>
          <div className="cr-tab-field-body ctask-notes-empty">
            {task.workNotes?.trim()
              ? task.workNotes
              : 'No work notes have been added.'}
          </div>
        </div>
      </div>
    </div>
  );
}
