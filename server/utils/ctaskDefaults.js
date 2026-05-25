import ChangeTask from '../models/ChangeTask.js';
import { formatPlannedDate, pickChangeOwner } from './changeRequestDefaults.js';

const TASK_TYPES = [
  'Pre-Implementation',
  'Implementation',
  'Validation',
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

function shortDescriptionFor(taskType, ticket, changeRequest) {
  const summary = ticket?.summary || changeRequest.shortDescription;
  switch (taskType) {
    case 'Pre-Implementation':
      return `Pre-implementation readiness and CAB prep for ${summary}`;
    case 'Implementation':
      return `Execute implementation and deployment for ${summary}`;
    case 'Validation':
      return `Post-implementation validation and sign-off for ${summary}`;
    default:
      return summary;
  }
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

/**
 * Create three CTASK subtasks (Pre-Implementation, Implementation, Validation) per CHG.
 */
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

  TASK_TYPES.forEach((taskType, index) => {
    const { plannedStartDate, plannedEndDate } = taskWindow(
      changeRequest,
      index,
      TASK_TYPES.length
    );
    ctasks.push({
      number: seqNum(),
      changeNumber: changeRequest.number,
      taskType,
      location,
      shortDescription: shortDescriptionFor(taskType, ticket, changeRequest),
      state: 'Open',
      assignmentGroup,
      assignedTo:
        index === 1 ? assignedTo : pick(ASSIGNED_PERSONAS.concat(assignedTo)),
      plannedStartDate,
      plannedEndDate,
    });
  });

  return ChangeTask.insertMany(ctasks);
}
