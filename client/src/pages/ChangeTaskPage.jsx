import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchChangeTask } from '../api';
import ChangeTaskDetail from '../components/ChangeTaskDetail';

export default function ChangeTaskPage() {
  const { chgNumber, ctaskNumber } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chg = chgNumber?.toUpperCase();
  const ctask = ctaskNumber?.toUpperCase();

  useEffect(() => {
    if (!chg || !ctask) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchChangeTask(chg, ctask)
      .then((data) => {
        if (!cancelled) setTask(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setTask(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chg, ctask]);

  if (loading) {
    return (
      <div className="page-inset">
        <p className="loading">Loading change task…</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="page-inset">
        <div className="empty-state">
          <p>{error || `Change task ${ctask} not found.`}</p>
          <Link to={`/changes/${chg}`} className="back-link">
            ← Back to {chg}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inset">
      <ChangeTaskDetail task={task} />
    </div>
  );
}
