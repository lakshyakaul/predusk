// src/api.js
import express from 'express';
import { openDb } from './database.js';

// Create a new router instance
const router = express.Router();

// Middleware to parse JSON bodies, which we'll need for POST/PUT requests later
router.use(express.json());

// --- GET /api/profile ---
// Fetches the complete profile including education and work experience.
router.get('/profile', async (req, res) => {
  const db = await openDb();
  // Promise.all allows us to run all these database queries concurrently
  const [profile, education, work_experience] = await Promise.all([
    db.get('SELECT * FROM profile LIMIT 1'),
    db.all('SELECT * FROM education ORDER BY end_year DESC'),
    db.all('SELECT * FROM work_experience ORDER BY start_date DESC'),
  ]);

  res.json({
    ...profile,
    education,
    work_experience,
  });
});

// --- GET /api/skills ---
// Fetches all skills from the database.
router.get('/skills', async (req, res) => {
  const db = await openDb();
  const skills = await db.all('SELECT * FROM skills ORDER BY name ASC');
  res.json(skills);
});

// --- GET /api/projects ---
// Fetches all projects and joins them with their associated skills.
router.get('/projects', async (req, res) => {
  const db = await openDb();
  
  // This SQL query is more advanced. It does the following:
  // 1. Selects all columns from the projects table (p.*).
  // 2. Uses GROUP_CONCAT to combine all skill names for a project into a single comma-separated string.
  // 3. Joins projects with project_skills and skills tables to link them correctly.
  // 4. Groups the results by project id to ensure one row per project.
  const projects = await db.all(`
    SELECT
      p.*,
      GROUP_CONCAT(s.name) AS skills
    FROM projects p
    LEFT JOIN project_skills ps ON p.id = ps.project_id
    LEFT JOIN skills s ON ps.skill_id = s.id
    GROUP BY p.id
  `);

  // We split the comma-separated skills string into an array for cleaner JSON.
  const projectsWithSkillsArray = projects.map(p => ({
    ...p,
    skills: p.skills ? p.skills.split(',') : []
  }));

  res.json(projectsWithSkillsArray);
});


// Export the router so it can be used in our main server file
export default router;