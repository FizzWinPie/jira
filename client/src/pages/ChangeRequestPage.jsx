import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchChangeRequest, fetchChangeRequests } from '../api';
import ChangeRequestDetail from '../components/ChangeRequestDetail';
import ChangeRequestsTable from '../components/ChangeRequestsTable';

export default function ChangeRequestPage() {
  const { chgNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialCtasks] = useState(() => location.state?.ctasks ?? null);
  const [message, setMessage] = useState(() => location.state?.message ?? null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRequest, setChangeRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chgNumber) return;
    setLoading(true);
    try {
      const [crs, cr] = await Promise.all([
        fetchChangeRequests(),
        fetchChangeRequest(chgNumber.toUpperCase()),
      ]);
      setChangeRequests(crs);
      setChangeRequest(cr);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setChangeRequest(null);
    } finally {
      setLoading(false);
    }
  }, [chgNumber]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const crNumber = (cr) => cr?.number || cr?.crId;
  const num = chgNumber?.toUpperCase();

  if (loading) return <p className="loading">Loading…</p>;

  if (!changeRequest) {
    return (
      <div className="empty-state">
        <p>Change request {num} not found.</p>
        <Link to="/changes" className="back-link">
          ← Back to change requests
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-toolbar">
        <Link to="/changes" className="back-link">
          ← All change requests
        </Link>
      </div>

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

      <ChangeRequestsTable
        changeRequests={changeRequests}
        selectedNumber={num}
        onSelect={(cr) => navigate(`/changes/${crNumber(cr)}`)}
      />

      <ChangeRequestDetail
        key={num}
        changeRequest={changeRequest}
        initialCtasks={initialCtasks}
        changeNumber={num}
      />
    </>
  );
}
