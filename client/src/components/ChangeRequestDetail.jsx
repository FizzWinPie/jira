import { useEffect, useState } from 'react';
import { fetchChangeTasks } from '../api';
import ChangeRequestTabs from './ChangeRequestTabs';
import ChangeTasksTable from './ChangeTasksTable';

function stateClass(state) {
  const key = (state || 'in progress').toLowerCase().replace(/\s+/g, '-');
  return `state-pill state-${key}`;
}

export default function ChangeRequestDetail({ changeRequest, initialCtasks }) {
  const [ctasks, setCtasks] = useState(initialCtasks || []);
  const [ctasksLoading, setCtasksLoading] = useState(false);

  const num = changeRequest?.number || changeRequest?.crId;

  useEffect(() => {
    if (!num) {
      setCtasks([]);
      return;
    }
    if (initialCtasks?.length) {
      setCtasks(initialCtasks);
      return;
    }

    let cancelled = false;
    setCtasksLoading(true);
    fetchChangeTasks(num)
      .then((data) => {
        if (!cancelled) setCtasks(data);
      })
      .catch(() => {
        if (!cancelled) setCtasks([]);
      })
      .finally(() => {
        if (!cancelled) setCtasksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [num, initialCtasks]);

  if (!changeRequest) return null;

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

      <ChangeRequestTabs changeRequest={changeRequest} />

      <section className="ctask-section">
        <h4 className="ctask-section-heading">Change tasks (CTASK)</h4>
        <ChangeTasksTable ctasks={ctasks} loading={ctasksLoading} />
      </section>
    </div>
  );
}
