// src/api.js
import express from 'express';
import { openDb } from './database.js';

const router = express.Router();
router.use(express.json());

// --- GET /api/profile ---
// (This endpoint remains unchanged)
router.get('/profile', async (req, res) => {
  const db = await openDb();
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
// (This endpoint remains unchanged)
router.get('/skills', async (req, res) => {
  const db = await openDb();
  const skills = await db.all('SELECT * FROM skills ORDER BY name ASC');
  res.json(skills);
});


// --- NEW: GET /api/skills/top ---
// Finds the top skills based on how many projects they are associated with.
router.get('/skills/top', async (req, res) => {
    const db = await openDb();
    const topSkills = await db.all(`
        SELECT s.id, s.name, s.category, COUNT(ps.project_id) as project_count
        FROM skills s
        JOIN project_skills ps ON s.id = ps.skill_id
        GROUP BY s.id
        ORDER BY project_count DESC
        LIMIT 5 -- Get the top 5 skills
    `);
    res.json(topSkills);
});


// --- MODIFIED: GET /api/projects?skill=... ---
// Now supports an optional 'skill' query parameter for filtering.
router.get('/projects', async (req, res) => {
  const db = await openDb();
  const skillQuery = req.query.skill; // e.g., 'python' from /projects?skill=python

  let query = `
    SELECT
      p.*,
      GROUP_CONCAT(s.name) AS skills
    FROM projects p
    LEFT JOIN project_skills ps ON p.id = ps.project_id
    LEFT JOIN skills s ON ps.skill_id = s.id
  `;
  const params = [];

  if (skillQuery) {
    // If a skill is provided, we add a WHERE clause to filter.
    // We need to find projects whose ID is in the list of projects associated with that skill.
    query += `
      WHERE p.id IN (
        SELECT ps.project_id
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE s.name LIKE ?
      )
    `;
    params.push(`%${skillQuery}%`);
  }

  query += ` GROUP BY p.id`;

  const projects = await db.all(query, params);
  
  const projectsWithSkillsArray = projects.map(p => ({
    ...p,
    skills: p.skills ? p.skills.split(',') : []
  }));

  res.json(projectsWithSkillsArray);
});


// --- NEW: GET /api/search?q=... ---
// A general search endpoint that looks for a query term in project titles and descriptions.
router.get('/search', async (req, res) => {
    const searchTerm = req.query.q;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Search term "q" is required.' });
    }

    const db = await openDb();
    // We use the LIKE operator with '%' wildcards to find matches anywhere in the text.
    // The `?` syntax is a "parameterized query" that prevents SQL injection attacks.
    const projects = await db.all(
        'SELECT * FROM projects WHERE title LIKE ? OR description LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`]
    );

    res.json({
        projects
        // In a real app, you might also search skills, work experience, etc.
    });
});


export default router;