import mongoose from 'mongoose';

const STATES = ['Closed', 'Cancelled', 'Open', 'In Progress', 'Completed'];
const CHANGE_TYPES = ['Normal', 'Standard', 'Informational', 'Emergency'];
const ENVIRONMENTS = ['QA', 'PROD'];
const SOURCES_OF_CHANGE = ['Jira', 'ServiceNow', 'Manual', 'Monitoring', 'Incident'];

const changeRequestSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    jiraKey: { type: String, required: true },
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    requestedBy: { type: String, required: true },
    sourceOfChange: {
      type: String,
      enum: SOURCES_OF_CHANGE,
      default: 'Jira',
    },
    primaryBusinessService: { type: String, required: true },
    maintenanceWindow: { type: String, required: true },
    location: { type: String, required: true },
    changeType: {
      type: String,
      enum: CHANGE_TYPES,
      default: 'Normal',
    },
    state: {
      type: String,
      enum: STATES,
      default: 'In Progress',
    },
    environment: {
      type: String,
      enum: ENVIRONMENTS,
      default: 'QA',
    },
    owningGroup: { type: String, required: true },
    changeOwner: { type: String, required: true },
    plannedStartDate: { type: String, required: true },
    plannedEndDate: { type: String, required: true },
    draft: { type: String, required: true },
    implementationPlan: { type: String, default: '' },
    rollbackPlan: { type: String, default: '' },
    aiGenerated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('ChangeRequest', changeRequestSchema);
