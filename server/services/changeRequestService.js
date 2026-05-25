import ChangeRequest from '../models/ChangeRequest.js';
import ChangeTask from '../models/ChangeTask.js';
import { generatePlanningFromJira } from './aiService.js';
import {
  buildChangeMetadata,
  nextChangeNumber,
} from '../utils/changeRequestDefaults.js';
import { createCtasksForChange } from '../utils/ctaskDefaults.js';

/**
 * Create CHG + CTASKs from a MongoDB Jira ticket (board, /generate, or webhook).
 */
export async function createChangeRequestFromTicket(ticket, options = {}) {
  const jiraKey = ticket.key;

  const existing = await ChangeRequest.findOne({ jiraKey });
  if (existing) {
    const ctasks = await ChangeTask.find({ changeNumber: existing.number }).sort({
      number: 1,
    });
    return {
      existing: true,
      changeRequest: existing,
      ctasks,
      aiSource: null,
    };
  }

  const aiResult = await generatePlanningFromJira(ticket);
  const metadata = buildChangeMetadata(ticket, {
    requestedBy: options.requestedBy,
    sourceOfChange: options.sourceOfChange || 'Jira',
  });
  const number = await nextChangeNumber(ChangeRequest);

  const changeRequest = await ChangeRequest.create({
    number,
    jiraKey: ticket.key,
    title: aiResult.title || ticket.summary,
    shortDescription: metadata.shortDescription,
    requestedBy: metadata.requestedBy,
    sourceOfChange: metadata.sourceOfChange,
    primaryBusinessService: metadata.primaryBusinessService,
    maintenanceWindow: metadata.maintenanceWindow,
    location: metadata.location,
    changeType: aiResult.changeType || metadata.changeType,
    state: metadata.state,
    environment: aiResult.environment || metadata.environment,
    owningGroup: aiResult.owningGroup || metadata.owningGroup,
    changeOwner: metadata.changeOwner,
    plannedStartDate: metadata.plannedStartDate,
    plannedEndDate: metadata.plannedEndDate,
    planning: aiResult.planning,
    notes: '',
    pir: '',
    processIntegration: '',
    governance: '',
    aiGenerated: true,
  });

  const ctasks = await createCtasksForChange(changeRequest, ticket);

  return {
    existing: false,
    changeRequest,
    ctasks,
    aiSource: aiResult.source,
  };
}
