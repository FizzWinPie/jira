import mongoose from 'mongoose';

const TASK_TYPES = [
  'Pre-Implementation',
  'Implementation',
  'Validation',
];
const TASK_STATES = ['Open', 'Closed'];

const changeTaskSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    changeNumber: { type: String, required: true, index: true },
    taskType: {
      type: String,
      enum: TASK_TYPES,
      required: true,
    },
    location: { type: String, required: true },
    shortDescription: { type: String, required: true },
    state: {
      type: String,
      enum: TASK_STATES,
      default: 'Open',
    },
    assignmentGroup: { type: String, required: true },
    assignedTo: { type: String, required: true },
    plannedStartDate: { type: String, required: true },
    plannedEndDate: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('ChangeTask', changeTaskSchema);
