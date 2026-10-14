import express from 'express';
import cors from 'cors';
import router from './routes.ts';
import { seedDatabase } from './seed.ts';

export const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', router);

// Trigger non-blocking database seed check on startup
seedDatabase().catch((err) => {
  console.error('Initial database seed error:', err);
});
