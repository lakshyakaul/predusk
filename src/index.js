// src/index.js

import express from 'express';
import { initializeDb } from './database.js'; // Import our new function

// --- DATABASE INITIALIZATION ---
// We run this function once when the server starts to set up the database.
initializeDb().catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1); // Exit the process if DB setup fails
});
// -----------------------------

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

app.get('/', (req, res) => {
    res.send('Welcome to the Profile API! Database is set up.');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});