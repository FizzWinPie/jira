import mongoose from 'mongoose';

const changeRequestSchema = new mongoose.Schema(
  {
    crId: { type: String, required: true, unique: true },
    jiraKey: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    priority: { type: String, default: 'Medium' },
    environment: { type: String, default: 'Production' },
    riskLevel: { type: String, default: 'Medium' },
    requestedBy: { type: String, default: 'AI Change Agent' },
    draft: { type: String, required: true },
    implementationPlan: { type: String, default: '' },
    rollbackPlan: { type: String, default: '' },
    aiGenerated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('ChangeRequest', changeRequestSchema);
