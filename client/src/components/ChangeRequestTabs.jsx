import { useState } from 'react';

const TABS = [
  { id: 'notes', label: 'Notes' },
  { id: 'planning', label: 'Planning' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'pir', label: 'PIR' },
  { id: 'process', label: 'Process integration' },
  { id: 'governance', label: 'Governance' },
];

function resolvePlanning(cr) {
  const p = cr.planning || {};
  return {
    detailedDescription:
      p.detailedDescription || cr.draft || '',
    businessJustification: p.businessJustification || '',
    implementationPlan: p.implementationPlan || cr.implementationPlan || '',
    changeValidationPlan: p.changeValidationPlan || '',
    remediationBackoutPlan:
      p.remediationBackoutPlan || cr.rollbackPlan || '',
  };
}

function PlanningField({ label, value }) {
  const text = value?.trim() ? value : 'Generating from Jira…';
  return (
    <div className="cr-field-row">
      <span className="cr-field-label">{label}</span>
      <div className="cr-field-value-box">{text}</div>
    </div>
  );
}

function ScheduleField({ label, value }) {
  const hasValue = value && String(value).trim() !== '';
  return (
    <div className="cr-field-row">
      <span className="cr-field-label">{label}</span>
      <div
        className={`cr-field-value-box${hasValue ? '' : ' cr-field-value-empty'}`}
      >
        {hasValue ? value : '—'}
      </div>
    </div>
  );
}

export default function ChangeRequestTabs({ changeRequest }) {
  const [activeTab, setActiveTab] = useState('planning');
  const planning = resolvePlanning(changeRequest);

  return (
    <div className="cr-subtabs-wrap">
      <nav className="cr-subtabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cr-subtab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="cr-subtab-panel">
        {activeTab === 'notes' && (
          <div className="cr-field-row">
            <span className="cr-field-label">Notes</span>
            <div className="cr-field-value-box cr-field-value-empty">
              No notes have been added to this change request.
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="cr-tab-planning">
            <PlanningField
              label="Detailed description"
              value={planning.detailedDescription}
            />
            <PlanningField
              label="Reason for change (business justification)"
              value={planning.businessJustification}
            />
            <PlanningField
              label="Implementation plan"
              value={planning.implementationPlan}
            />
            <PlanningField
              label="Change validation plan"
              value={planning.changeValidationPlan}
            />
            <PlanningField
              label="Remediation / backout plan"
              value={planning.remediationBackoutPlan}
            />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="cr-tab-planning">
            <ScheduleField
              label="Planned start date"
              value={changeRequest.plannedStartDate}
            />
            <ScheduleField
              label="Planned end date"
              value={changeRequest.plannedEndDate}
            />
            <ScheduleField label="CAB date" value="" />
            <ScheduleField label="Release" value="" />
            <ScheduleField label="Actual start date" value="" />
            <ScheduleField label="Actual end date" value="" />
            <ScheduleField label="Implementation state start" value="" />
            <ScheduleField label="Implementation state end" value="" />
          </div>
        )}

        {activeTab === 'pir' && (
          <div className="cr-field-row">
            <span className="cr-field-label">PIR</span>
            <div className="cr-field-value-box cr-field-value-empty">
              Post-implementation review (PIR) has not been documented.
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div className="cr-field-row">
            <span className="cr-field-label">Process integration</span>
            <div className="cr-field-value-box cr-field-value-empty">
              No process integration records for this change.
            </div>
          </div>
        )}

        {activeTab === 'governance' && (
          <div className="cr-field-row">
            <span className="cr-field-label">Governance</span>
            <div className="cr-field-value-box cr-field-value-empty">
              No governance items recorded for this change.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
