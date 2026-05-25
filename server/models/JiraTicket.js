import mongoose from 'mongoose';

const jiraTicketSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    summary: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'Story' },
    priority: { type: String, default: 'Medium' },
    status: { type: String, default: 'To Do' },
    assignee: { type: String, default: 'Unassigned' },
    epic: { type: String, default: '' },
    labels: [{ type: String }],
    storyPoints: { type: Number, default: 0 },
    acceptanceCriteria: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('JiraTicket', jiraTicketSchema);
