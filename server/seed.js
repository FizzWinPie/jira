import 'dotenv/config';
import mongoose from 'mongoose';
import JiraTicket from './models/JiraTicket.js';
import ChangeRequest from './models/ChangeRequest.js';
import { dummyJiraTickets } from './data/dummyJira.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swa-change-requests';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await JiraTicket.deleteMany({});
  await ChangeRequest.deleteMany({});
  await JiraTicket.insertMany(dummyJiraTickets);
  console.log(`Seeded ${dummyJiraTickets.length} Jira tickets.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
