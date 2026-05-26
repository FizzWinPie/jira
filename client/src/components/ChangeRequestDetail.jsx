import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchChangeTasks } from '../api';
import ChangeRequestActions from './ChangeRequestActions';
import ChangeRequestTabs from './ChangeRequestTabs';
import ChangeTasksTable from './ChangeTasksTable';

function stateClass(state) {
  const key = (state || 'in progress').toLowerCase().replace(/\s+/g, '-');
  return `state-pill state-${key}`;
}

export default function ChangeRequestDetail({
  changeRequest,
  initialCtasks,
  changeNumber,
}) {
  const navigate = useNavigate();
  const [ctasks, setCtasks] = useState(initialCtasks || []);
  const [ctasksLoading, setCtasksLoading] = useState(false);

  const num = changeNumber || changeRequest?.number || changeRequest?.crId;

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
    { label: 'Maintenance window', value: changeRequest.maintenanceWindow },
    { label: 'Requested by', value: changeRequest.requestedBy },
    {
      label: 'Short description',
      value: changeRequest.shortDescription || changeRequest.title,
    },
    { label: 'Source of change', value: changeRequest.sourceOfChange },
    {
      label: 'State',
      value: changeRequest.state || changeRequest.status || 'In Progress',
      render: (v) => <span className={stateClass(v)}>{v}</span>,
    },
    {
      label: 'Primary business service',
      value: changeRequest.primaryBusinessService,
    },
    {
      label: 'Environment',
      value: changeRequest.environment,
      render: (v) => (
        <span className={`env-pill env-${(v || '').toLowerCase()}`}>{v || '—'}</span>
      ),
    },
    { label: 'Location', value: changeRequest.location },
    { label: 'Change type', value: changeRequest.changeType },
    {
      label: 'Implementation awareness',
      value: changeRequest.implementationAwareness,
    },
    { label: 'Change owning group', value: changeRequest.owningGroup },
    { label: 'PCI risk', value: changeRequest.pciRisk },
    { label: 'Change owner', value: changeRequest.changeOwner },
  ];

  const handleSaveAndExit = () => {
    navigate('/changes');
  };

  return (
    <div className="cr-detail-stack">
      <div className="cr-detail-meta">
        <dl className="cr-detail-grid">
          {rows.map(({ label, value, render }) => (
            <div key={label} className="cr-detail-row">
              <dt>{label}</dt>
              <dd>{render ? render(value) : value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="cr-detail-section">
        <ChangeRequestTabs changeRequest={changeRequest} />
      </div>

      <ChangeRequestActions
        className="cr-detail-actions"
        onSaveAndExit={handleSaveAndExit}
      />

      <div className="cr-detail-section">
        <section className="ctask-section">
          <h4 className="ctask-section-heading">Change tasks (CTASK)</h4>
          <ChangeTasksTable
            ctasks={ctasks}
            loading={ctasksLoading}
            selectedTaskNumber={null}
            onSelect={(task) =>
              navigate(`/changes/${num}/tasks/${task.number}`)
            }
          />
        </section>
      </div>
    </div>
  );
}
