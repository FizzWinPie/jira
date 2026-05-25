import ChangeTask from '../models/ChangeTask.js';
import { formatPlannedDate, pickChangeOwner } from './changeRequestDefaults.js';

const TASK_TYPES = [
  'Pre-Implementation',
  'Implementation',
  'Validation-required',
];

const ASSIGNED_PERSONAS = [
  'Maria Chen',
  'James Okonkwo',
  'Priya Sharma',
  'Alex Rivera',
  'Taylor Brooks',
  'Sam Patel',
  'Jordan Lee',
];

const CONFIG_ITEMS = [
  'southwest.com — Digital Channels',
  'Crew Scheduling API',
  'Rapid Rewards — Email Service',
  'Airport Gate Display System',
  'Finance ETL Pipeline',
  'Inflight Wi-Fi Portal',
  'Ground Ops Tablet App',
  'Customer Push Notification Service',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parsePlannedDate(str) {
  const normalized = String(str).replace(' ', 'T');
  return new Date(normalized);
}

function taskWindow(changeRequest, taskIndex, totalTasks) {
  const start = parsePlannedDate(changeRequest.plannedStartDate);
  const end = parsePlannedDate(changeRequest.plannedEndDate);
  const spanMs = end.getTime() - start.getTime();
  const slice = spanMs / totalTasks;
  const taskStart = new Date(start.getTime() + slice * taskIndex);
  const taskEnd = new Date(start.getTime() + slice * (taskIndex + 1));
  return {
    plannedStartDate: formatPlannedDate(taskStart),
    plannedEndDate: formatPlannedDate(taskEnd),
  };
}

export function inferConfigurationItem(changeRequest, ticket) {
  if (changeRequest?.primaryBusinessService) {
    return changeRequest.primaryBusinessService;
  }
  const labelMap = {
    mobile: 'southwest.com — Mobile Check-in',
    api: 'Crew Scheduling API',
    loyalty: 'Rapid Rewards — Email Service',
    gates: 'Airport Gate Display System',
    finance: 'Finance ETL Pipeline',
    wifi: 'Inflight Wi-Fi Portal',
  };
  for (const label of ticket?.labels || []) {
    if (labelMap[label]) return labelMap[label];
  }
  return pick(CONFIG_ITEMS);
}

function shortDescriptionFor(taskType, ticket, changeRequest) {
  const summary = ticket?.summary || changeRequest.shortDescription;
  switch (taskType) {
    case 'Pre-Implementation':
      return `Pre-implementation readiness and CAB prep for ${summary}`;
    case 'Implementation':
      return `Execute implementation and deployment for ${summary}`;
    case 'Validation-required':
      return `Post-implementation validation and sign-off for ${summary}`;
    default:
      return summary;
  }
}

export function detailedDescriptionFor(taskType, ticket, changeRequest) {
  const key = ticket?.key || changeRequest.jiraKey;
  const summary = ticket?.summary || changeRequest.shortDescription;
  const desc = ticket?.description || '';
  const criteria = (ticket?.acceptanceCriteria || [])
    .map((c, i) => `${i + 1}. ${c}`)
    .join('\n');

  const typeBlock = {
    'Pre-Implementation': `Pre-implementation activities for ${key}:\n• Confirm CAB approval and change window (${changeRequest.maintenanceWindow})\n• Validate ${changeRequest.environment} prerequisites\n• Review runbooks with ${changeRequest.owningGroup}`,
    Implementation: `Implementation activities for ${key}:\n• Deploy changes to ${changeRequest.environment}\n• Execute deployment steps per implementation plan\n• Coordinate with ${changeRequest.changeOwner} for execution`,
    'Validation-required': `Validation activities for ${key}:\n• Execute test cases and acceptance criteria\n• Confirm monitoring and health checks\n• Document results for PIR`,
  };

  return `${typeBlock[taskType] || typeBlock.Implementation}\n\nJira context — ${summary}\n\n${desc}${
    criteria ? `\n\nAcceptance criteria:\n${criteria}` : ''
  }`;
}

export function enrichCtaskDoc(task, changeRequest, ticket) {
  const doc = task.toObject ? task.toObject() : { ...task };
  const taskType =
    doc.taskType === 'Validation' ? 'Validation-required' : doc.taskType;

  return {
    ...doc,
    taskType,
    configurationItem:
      doc.configurationItem || inferConfigurationItem(changeRequest, ticket),
    detailedDescription:
      doc.detailedDescription ||
      detailedDescriptionFor(taskType, ticket, changeRequest),
    workNotes: doc.workNotes ?? '',
    automationTemplate: doc.automationTemplate ?? '',
    actualStartDate: doc.actualStartDate ?? '',
    actualEndDate: doc.actualEndDate ?? '',
    implementationResult: doc.implementationResult ?? '',
  };
}

export async function nextCtaskNumber() {
  const docs = await ChangeTask.find({ number: /^CTASK/i })
    .select('number')
    .lean();
  let max = 1234566;
  for (const doc of docs) {
    const match = String(doc.number).match(/^CTASK(\d+)$/i);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `CTASK${String(max + 1).padStart(7, '0')}`;
}

export async function createCtasksForChange(changeRequest, ticket) {
  await ChangeTask.deleteMany({ changeNumber: changeRequest.number });

  const ctasks = [];
  let seq = await nextCtaskNumber();
  const seqNum = () => {
    const current = seq;
    const n = parseInt(seq.replace('CTASK', ''), 10) + 1;
    seq = `CTASK${String(n).padStart(7, '0')}`;
    return current;
  };

  const location = changeRequest.location;
  const assignmentGroup = changeRequest.owningGroup;
  const assignedTo =
    changeRequest.changeOwner ||
    pickChangeOwner(ticket) ||
    pick(ASSIGNED_PERSONAS);
  const configurationItem = inferConfigurationItem(changeRequest, ticket);

  TASK_TYPES.forEach((taskType, index) => {
    const { plannedStartDate, plannedEndDate } = taskWindow(
      changeRequest,
      index,
      TASK_TYPES.length
    );
    const base = {
      number: seqNum(),
      changeNumber: changeRequest.number,
      taskType,
      location,
      configurationItem,
      shortDescription: shortDescriptionFor(taskType, ticket, changeRequest),
      detailedDescription: detailedDescriptionFor(taskType, ticket, changeRequest),
      workNotes: '',
      state: 'Open',
      automationTemplate: '',
      assignmentGroup,
      assignedTo:
        index === 1 ? assignedTo : pick(ASSIGNED_PERSONAS.concat(assignedTo)),
      plannedStartDate,
      plannedEndDate,
      actualStartDate: '',
      actualEndDate: '',
      implementationResult: '',
    };
    ctasks.push(base);
  });

  return ChangeTask.insertMany(ctasks);
}
