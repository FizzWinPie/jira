import { Outlet } from 'react-router-dom';
import iconUrl from './assets/icon.png';

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
          <span className="app-header-module">Change Requests</span>
          <label className="app-header-search">
            <input type="search" placeholder="Search" aria-label="Search" />
          </label>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
