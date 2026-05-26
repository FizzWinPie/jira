export default function ChangeRequestActions({ className = '', onSaveAndExit }) {
  return (
    <div className={className}>
      <button type="button" className="cr-header-btn cr-header-btn-save">
        Save
      </button>
      <button
        type="button"
        className="cr-header-btn cr-header-btn-save"
        onClick={onSaveAndExit}
      >
        Save and exit
      </button>
      <button type="button" className="cr-header-btn cr-header-btn-outline">
        Conflict calendar
      </button>
      <button type="button" className="cr-header-btn cr-header-btn-outline">
        Maintenance schedule
      </button>
    </div>
  );
}
