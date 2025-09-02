// src/api.js
import express from 'express';
import { openDb } from './database.js';

const router = express.Router();
router.use(express.json());

// --- AUTHENTICATION MIDDLEWARE ---
// This function runs before any route that uses it.
// It checks for a valid "Authorization: Bearer <token>" header.

// --- AUTHENTICATION MIDDLEWARE ---
const authenticate = (req, res, next) => {
    // ... (This function is unchanged)
    const authHeader = req.headers.authorization;
    const secretKey = process.env.API_SECRET_KEY;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Bearer token missing' });
    }
    const token = authHeader.split(' ')[1];
    if (token === secretKey) {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
};

// =================================================================
// --- PUBLIC READ-ONLY Endpoints ---
// =================================================================

// GET /api/profile (unchanged)
router.get('/profile', async (req, res) => {
    const db = await openDb();
    const [profile, education, work_experience] = await Promise.all([
        db.get('SELECT * FROM profile LIMIT 1'),
        db.all('SELECT * FROM education ORDER BY end_year DESC'),
        db.all('SELECT * FROM work_experience ORDER BY start_date DESC'),
    ]);
    res.json({ ...profile, education, work_experience });
});

// GET /api/skills (unchanged)
router.get('/skills', async (req, res) => {
    const db = await openDb();
    const skills = await db.all('SELECT * FROM skills ORDER BY name ASC');
    res.json(skills);
});

// --- READ-ONLY Endpoints (No Auth Required) ---

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

// =================================================================
// --- SECURED WRITE Endpoints ---
// =================================================================

// --- PROFILE (UPDATE) ---
router.put('/profile', authenticate, async (req, res) => {
    const { name, email, github_url, linkedin_url, portfolio_url } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
    }
    const db = await openDb();
    await db.run(
        'UPDATE profile SET name = ?, email = ?, github_url = ?, linkedin_url = ?, portfolio_url = ? WHERE id = 1',
        name, email, github_url, linkedin_url, portfolio_url
    );
    res.json({ message: 'Profile updated successfully.' });
});


// --- SKILLS (CRUD) ---
router.post('/skills', authenticate, async (req, res) => {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ message: 'Skill name is required.' });
    const db = await openDb();
    const result = await db.run('INSERT INTO skills (name, category) VALUES (?, ?)', name, category);
    res.status(201).json({ id: result.lastID, name, category });
});

router.put('/skills/:id', authenticate, async (req, res) => {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ message: 'Skill name is required.' });
    const db = await openDb();
    const result = await db.run('UPDATE skills SET name = ?, category = ? WHERE id = ?', name, category, req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Skill not found.' });
    res.json({ message: 'Skill updated.' });
});

router.delete('/skills/:id', authenticate, async (req, res) => {
    const db = await openDb();
    // Important: Check if the skill is being used by any projects before deleting.
    const usage = await db.get('SELECT COUNT(*) as count FROM project_skills WHERE skill_id = ?', req.params.id);
    if (usage.count > 0) {
        return res.status(409).json({ message: 'Cannot delete skill as it is currently linked to projects.' });
    }
    const result = await db.run('DELETE FROM skills WHERE id = ?', req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Skill not found.' });
    res.status(204).send();
});


// --- EDUCATION (CRUD) ---
router.post('/education', authenticate, async (req, res) => {
    const { institution, degree, start_year, end_year } = req.body;
    if (!institution || !degree) return res.status(400).json({ message: 'Institution and degree are required.' });
    const db = await openDb();
    const result = await db.run('INSERT INTO education (institution, degree, start_year, end_year) VALUES (?, ?, ?, ?)', institution, degree, start_year, end_year);
    res.status(201).json({ id: result.lastID, ...req.body });
});

router.put('/education/:id', authenticate, async (req, res) => {
    const { institution, degree, start_year, end_year } = req.body;
    if (!institution || !degree) return res.status(400).json({ message: 'Institution and degree are required.' });
    const db = await openDb();
    const result = await db.run('UPDATE education SET institution = ?, degree = ?, start_year = ?, end_year = ? WHERE id = ?', institution, degree, start_year, end_year, req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Education entry not found.' });
    res.json({ message: 'Education entry updated.' });
});

router.delete('/education/:id', authenticate, async (req, res) => {
    const db = await openDb();
    const result = await db.run('DELETE FROM education WHERE id = ?', req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Education entry not found.' });
    res.status(204).send();
});


// --- WORK EXPERIENCE (CRUD) ---
router.post('/work', authenticate, async (req, res) => {
    const { company, position, start_date, end_date, description } = req.body;
    if (!company || !position) return res.status(400).json({ message: 'Company and position are required.' });
    const db = await openDb();
    const result = await db.run('INSERT INTO work_experience (company, position, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)', company, position, start_date, end_date, description);
    res.status(201).json({ id: result.lastID, ...req.body });
});

router.put('/work/:id', authenticate, async (req, res) => {
    const { company, position, start_date, end_date, description } = req.body;
    if (!company || !position) return res.status(400).json({ message: 'Company and position are required.' });
    const db = await openDb();
    const result = await db.run('UPDATE work_experience SET company = ?, position = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?', company, position, start_date, end_date, description, req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Work entry not found.' });
    res.json({ message: 'Work entry updated.' });
});

router.delete('/work/:id', authenticate, async (req, res) => {
    const db = await openDb();
    const result = await db.run('DELETE FROM work_experience WHERE id = ?', req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Work entry not found.' });
    res.status(204).send();
});

// --- PROJECTS (CRUD - already existed) ---

// POST /api/projects - Create a new project
// We apply the `authenticate` middleware just for this route.
router.post('/projects', authenticate, async (req, res) => {
    const { title, description, repo_link, live_link } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }
    
    const db = await openDb();
    const result = await db.run(
        'INSERT INTO projects (title, description, repo_link, live_link) VALUES (?, ?, ?, ?)',
        title, description, repo_link, live_link
    );

    res.status(201).json({ id: result.lastID, title, description });
});

// PUT /api/projects/:id - Update an existing project
router.put('/projects/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, description, repo_link, live_link } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    const db = await openDb();
    const result = await db.run(
        'UPDATE projects SET title = ?, description = ?, repo_link = ?, live_link = ? WHERE id = ?',
        title, description, repo_link, live_link, id
    );

    if (result.changes === 0) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    res.json({ id, title, description });
});

// DELETE /api/projects/:id - Delete a project
router.delete('/projects/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const db = await openDb();

    // First, delete any skill associations for this project to avoid foreign key errors.
    await db.run('DELETE FROM project_skills WHERE project_id = ?', id);
    
    // Then, delete the project itself.
    const result = await db.run('DELETE FROM projects WHERE id = ?', id);

    if (result.changes === 0) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    res.status(204).send(); // 204 No Content is standard for a successful deletion.
});

export default router;