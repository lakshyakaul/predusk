// src/index.js

import express from 'express';
import { initializeDb } from './database.js'; // Import our new function
import cors from 'cors';
import apiRoutes from './api.js';

// --- DATABASE INITIALIZATION ---
// We run this function once when the server starts to set up the database.
initializeDb().catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1); // Exit the process if DB setup fails
});
// -----------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.static('public')); // Serve static files from the 'public' directory

// --- API Routes ---
// Mount our API router under the /api path.
// All routes defined in api.js will now be accessible under /api/...
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

// The root path '/' will now serve index.html from the 'public' folder automatically.
// app.get('/', (req, res) => {
//     res.send('Welcome to the Profile API! Database is set up.');
// });

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});