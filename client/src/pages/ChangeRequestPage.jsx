import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchChangeRequest } from '../api';
import ChangeRequestDetail from '../components/ChangeRequestDetail';

export default function ChangeRequestPage() {
  const { chgNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialCtasks] = useState(() => location.state?.ctasks ?? null);
  const [message, setMessage] = useState(() => location.state?.message ?? null);
  const [changeRequest, setChangeRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chgNumber) return;
    setLoading(true);
    try {
      const cr = await fetchChangeRequest(chgNumber.toUpperCase());
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

  const num = chgNumber?.toUpperCase();

  if (loading) {
    return (
      <div className="page-inset">
        <p className="loading">Loading…</p>
      </div>
    );
  }

  if (!changeRequest) {
    return (
      <div className="page-inset">
        <div className="empty-state">
          <p>Change request {num} not found.</p>
          <Link to="/changes" className="back-link">
            ← Back to change requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inset">
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

      <ChangeRequestDetail
        key={num}
        changeRequest={changeRequest}
        initialCtasks={initialCtasks}
        changeNumber={num}
      />
    </div>
  );
}
