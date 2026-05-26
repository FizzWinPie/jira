import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import iconUrl from './assets/icon.png';
import ChangeRequestActions from './components/ChangeRequestActions';

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16l-6 7v5l-4 2v-7L4 5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMessages() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 9h10M7 13h6M5 5h14a2 2 0 0 1 2 2v8l-3-2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { chgNumber, ctaskNumber } = useParams();
  const chg = chgNumber?.toUpperCase();
  const ctask = ctaskNumber?.toUpperCase();
  const onList = !chgNumber;
  const onChangeRequest = Boolean(chg);
  const backTo = ctask ? `/changes/${chg}` : chg ? '/changes' : null;
  const recordId = ctask || chg;

  const handleSaveAndExit = () => {
    navigate('/changes');
  };

  return (
    <>
      <header className="app-header flex flex-col">
        <div className="app-header-brand bg-blue text-white">
          <span className="app-header-title">
            Southwest{' '}
            <img src={iconUrl} alt="" className="app-header-logo" />
            {' '}
            DASH Demo
          </span>
        </div>

        <div className="app-header-toolbar">
          <button type="button" className="app-header-icon-btn" aria-label="Menu">
            <IconMenu />
          </button>
          <button type="button" className="app-header-icon-btn" aria-label="Filter">
            <IconFilter />
          </button>
          <button
            type="button"
            className="app-header-icon-btn"
            aria-label="Messages"
          >
            <IconMessages />
          </button>
          <div className="app-header-module-row">
            {backTo && (
              <Link to={backTo} className="app-header-back" aria-label="Back">
                ←
              </Link>
            )}
            <span className="app-header-module">
              Change Requests
              {recordId && !onList && (
                <span className="app-header-record-id">{recordId}</span>
              )}
            </span>
          </div>
          {onList && (
            <label className="app-header-search">
              <input type="search" placeholder="Search" aria-label="Search" />
            </label>
          )}
          {onChangeRequest && (
            <ChangeRequestActions
              className="app-header-cr-actions"
              onSaveAndExit={handleSaveAndExit}
            />
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
