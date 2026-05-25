import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import changeRequestRoutes from './routes/changeRequests.js';
import webhookRoutes from './routes/webhooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swa-change-requests';
const isProduction = process.env.NODE_ENV === 'production';
const clientDist = path.join(__dirname, '../client/dist');

const app = express();

const corsOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : [];
if (corsOrigins.length > 0) {
  app.use(cors({ origin: corsOrigins }));
} else {
  app.use(cors());
}

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    ai: process.env.GEMINI_API_KEY && process.env.USE_MOCK_AI !== 'true'
      ? 'gemini'
      : 'mock',
  });
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/change-requests', changeRequestRoutes);

function serveClient() {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    if (isProduction) {
      serveClient();
      console.log('Serving React app from client/dist');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(
        process.env.GEMINI_API_KEY && process.env.USE_MOCK_AI !== 'true'
          ? 'AI: Gemini enabled'
          : 'AI: mock drafts'
      );
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
