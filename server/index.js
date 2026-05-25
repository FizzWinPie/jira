import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jiraRoutes from './routes/jira.js';
import changeRequestRoutes from './routes/changeRequests.js';
import JiraTicket from './models/JiraTicket.js';
import { dummyJiraTickets } from './data/dummyJira.js';

const PORT = process.env.PORT || 5001;
const MONGODB_URI =
process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swa-change-requests';
console.log(MONGODB_URI)

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    ai: process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
  });
});

app.use('/api/jira', jiraRoutes);
app.use('/api/change-requests', changeRequestRoutes);

async function ensureSeed() {
  const count = await JiraTicket.countDocuments();
  if (count === 0) {
    await JiraTicket.insertMany(dummyJiraTickets);
    console.log(`Auto-seeded ${dummyJiraTickets.length} Jira tickets.`);
  }
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    // await ensureSeed();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        process.env.GEMINI_API_KEY
          ? 'AI: Gemini enabled'
          : 'AI: using mock drafts (set GEMINI_API_KEY for live AI)'
      );
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
