const OWNING_GROUPS = [
  'adfs_dev',
  'cds_dev',
  'southwest.com',
  'oqs support',
  'network_ops',
  'crew_systems',
  'loyalty_platform',
  'airport_systems',
  'finance_etl',
];

const CHANGE_OWNERS = [
  'Maria Chen',
  'James Okonkwo',
  'Priya Sharma',
  'Alex Rivera',
  'Taylor Brooks',
  'Jordan Lee',
  'Sam Patel',
  'Chris Nguyen',
  'Dana Whitfield',
  'Riley Martinez',
];

const REQUESTED_BY = [
  'Maria Chen',
  'James Okonkwo',
  'Priya Sharma',
  'Alex Rivera',
  'Taylor Brooks',
  'Sam Patel',
  'Jordan Lee',
  'IT Change Management',
];

const LOCATIONS = [
  'DAL - Dallas Love Field',
  'PHX - Phoenix Sky Harbor',
  'BWI - Baltimore/Washington',
  'HOU - Houston Hobby',
  'DEN - Denver',
  'HDQ - Corporate Headquarters',
  'All Stations',
];

const MAINTENANCE_WINDOWS = [
  'Standard — Tue–Thu 22:00–04:00 CT',
  'Extended — Sat 00:00–06:00 CT',
  'Low-traffic — Sun 02:00–06:00 CT',
  'Emergency — Immediate (CAB approval required)',
];

const EPIC_TO_SERVICE = {
  'Digital Experience': 'southwest.com — Digital Channels',
  'Crew Operations': 'Crew Scheduling & Rostering',
  Loyalty: 'Rapid Rewards — Loyalty Platform',
  'Airport Operations': 'Airport Systems — Gate & Boarding',
  'Finance Systems': 'Finance — Reporting & ETL',
  'Inflight Experience': 'Inflight — Connectivity & Entertainment',
  'Ground Operations': 'Ground Ops — Turnaround & Baggage',
  'Customer Notifications': 'Customer Comms — Notifications',
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatPlannedDate(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

export function buildPlannedWindow() {
  const start = new Date('2026-05-21T08:00:00');
  const dayOffset = Math.floor(Math.random() * 14);
  start.setDate(start.getDate() + dayOffset);
  const durationHours = 2 + Math.floor(Math.random() * 6);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return {
    plannedStartDate: formatPlannedDate(start),
    plannedEndDate: formatPlannedDate(end),
  };
}

export function inferChangeType(ticket) {
  if (ticket.priority === 'Critical') return 'Emergency';
  if (ticket.type === 'Bug') return 'Normal';
  if (ticket.type === 'Task') return 'Standard';
  if (ticket.storyPoints >= 8) return 'Normal';
  return pick(['Normal', 'Standard', 'Informational']);
}

export function inferEnvironment(ticket) {
  if (
    ticket.priority === 'Critical' ||
    ticket.labels?.includes('finance') ||
    ticket.labels?.includes('production')
  ) {
    return 'PROD';
  }
  return pick(['QA', 'PROD']);
}

export function pickOwningGroup(ticket) {
  const labelMap = {
    mobile: 'southwest.com',
    api: 'cds_dev',
    crew: 'crew_systems',
    loyalty: 'loyalty_platform',
    gates: 'airport_systems',
    finance: 'finance_etl',
    wifi: 'network_ops',
  };
  for (const label of ticket.labels || []) {
    if (labelMap[label]) return labelMap[label];
  }
  return pick(OWNING_GROUPS);
}

export function pickChangeOwner(ticket) {
  if (ticket.assignee && ticket.assignee !== 'Unassigned') {
    return ticket.assignee;
  }
  return pick(CHANGE_OWNERS);
}

export function pickRequestedBy(ticket) {
  if (ticket.assignee && ticket.assignee !== 'Unassigned') {
    return ticket.assignee;
  }
  return pick(REQUESTED_BY);
}

export function inferPrimaryBusinessService(ticket) {
  if (ticket.epic && EPIC_TO_SERVICE[ticket.epic]) {
    return EPIC_TO_SERVICE[ticket.epic];
  }
  return pick(Object.values(EPIC_TO_SERVICE));
}

export function inferMaintenanceWindow(ticket) {
  if (ticket.priority === 'Critical') {
    return 'Emergency — Immediate (CAB approval required)';
  }
  if (ticket.priority === 'High') {
    return 'Extended — Sat 00:00–06:00 CT';
  }
  return pick(MAINTENANCE_WINDOWS.filter((w) => !w.startsWith('Emergency')));
}

export function inferLocation(ticket) {
  const labelLocations = {
    bwi: 'BWI - Baltimore/Washington',
    gates: pick(['DAL - Dallas Love Field', 'PHX - Phoenix Sky Harbor']),
    crew: pick(['DAL - Dallas Love Field', 'PHX - Phoenix Sky Harbor']),
  };
  for (const label of ticket.labels || []) {
    if (labelLocations[label]) return labelLocations[label];
  }
  if (ticket.description?.includes('DAL')) return 'DAL - Dallas Love Field';
  if (ticket.description?.includes('PHX')) return 'PHX - Phoenix Sky Harbor';
  if (ticket.description?.includes('BWI')) return 'BWI - Baltimore/Washington';
  return pick(LOCATIONS);
}

export async function nextChangeNumber(ChangeRequest) {
  const docs = await ChangeRequest.find({ number: /^CHG/i })
    .select('number')
    .lean();
  let max = 123455;
  for (const doc of docs) {
    const match = String(doc.number).match(/^CHG(\d+)$/i);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `CHG${String(max + 1).padStart(6, '0')}`;
}

export function buildChangeMetadata(ticket) {
  const { plannedStartDate, plannedEndDate } = buildPlannedWindow();
  return {
    shortDescription: ticket.summary,
    requestedBy: pickRequestedBy(ticket),
    sourceOfChange: 'Jira',
    primaryBusinessService: inferPrimaryBusinessService(ticket),
    maintenanceWindow: inferMaintenanceWindow(ticket),
    location: inferLocation(ticket),
    changeType: inferChangeType(ticket),
    state: 'In Progress',
    environment: inferEnvironment(ticket),
    owningGroup: pickOwningGroup(ticket),
    changeOwner: pickChangeOwner(ticket),
    plannedStartDate,
    plannedEndDate,
  };
}

function ensureNonEmpty(value, fallback) {
  const t = typeof value === 'string' ? value.trim() : '';
  return t.length > 0 ? value.trim() : fallback;
}

export function buildPlanningContent(ticket, aiResult = {}) {
  const env = inferEnvironment(ticket);
  const group = pickOwningGroup(ticket);

  const fallbackDescription = `Detailed description — ${ticket.key}\n\n${ticket.summary}\n\n${ticket.description}`;
  const fallbackJustification = `Reason for change — ${ticket.key}\n\n${ticket.summary}\n\nBusiness driver: ${ticket.epic || 'Operations'}. Priority: ${ticket.priority}.`;
  const fallbackImplementation = `1. CAB approval for ${ticket.key}\n2. Deploy to ${env} (${group})\n3. Validate and close change`;
  const criteria = (ticket.acceptanceCriteria || [])
    .map((c, i) => `${i + 1}. ${c}`)
    .join('\n');
  const fallbackValidation = criteria
    ? `Validation — ${ticket.key}:\n${criteria}`
    : `1. Smoke tests in ${env}\n2. Monitor 2 hours post-change`;
  const fallbackBackout = `1. Revert deployment for ${ticket.key}\n2. Restore last known good state\n3. Notify ${group}`;

  return {
    detailedDescription: ensureNonEmpty(
      aiResult.draft || aiResult.detailedDescription,
      fallbackDescription
    ),
    businessJustification: ensureNonEmpty(
      aiResult.businessJustification,
      fallbackJustification
    ),
    implementationPlan: ensureNonEmpty(
      aiResult.implementationPlan,
      fallbackImplementation
    ),
    changeValidationPlan: ensureNonEmpty(
      aiResult.changeValidationPlan,
      fallbackValidation
    ),
    remediationBackoutPlan: ensureNonEmpty(
      aiResult.rollbackPlan || aiResult.remediationBackoutPlan,
      fallbackBackout
    ),
  };
}
