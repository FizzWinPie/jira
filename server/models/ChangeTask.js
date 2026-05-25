import mongoose from 'mongoose';

const TASK_TYPES = [
  'Pre-Implementation',
  'Implementation',
  'Validation-required',
];
const TASK_STATES = ['Open', 'Closed'];
const changeTaskSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    changeNumber: { type: String, required: true, index: true },
    taskType: {
      type: String,
      enum: [...TASK_TYPES, 'Validation'],
      required: true,
    },
    location: { type: String, required: true },
    configurationItem: { type: String, default: '' },
    shortDescription: { type: String, required: true },
    detailedDescription: { type: String, default: '' },
    workNotes: { type: String, default: '' },
    state: {
      type: String,
      enum: TASK_STATES,
      default: 'Open',
    },
    automationTemplate: { type: String, default: '' },
    assignmentGroup: { type: String, required: true },
    assignedTo: { type: String, required: true },
    plannedStartDate: { type: String, required: true },
    plannedEndDate: { type: String, required: true },
    actualStartDate: { type: String, default: '' },
    actualEndDate: { type: String, default: '' },
    implementationResult: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ChangeTask', changeTaskSchema);
