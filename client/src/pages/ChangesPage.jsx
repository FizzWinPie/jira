import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchChangeRequests } from '../api';
import ChangeRequestsTable from '../components/ChangeRequestsTable';

export default function ChangesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState(() => location.state?.message ?? null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const crs = await fetchChangeRequests();
      setChangeRequests(crs);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `${err.message}. Is the API running on port 5001?`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const crNumber = (cr) => cr?.number || cr?.crId;

  if (loading) return <p className="loading">Loading…</p>;

  return (
    <>
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
        selectedNumber={null}
        onSelect={(cr) => navigate(`/changes/${crNumber(cr)}`)}
      />
    </>
  );
}
