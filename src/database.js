// src/database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFile } from 'fs/promises';

// This function opens a connection to the SQLite database file.
// If the file doesn't exist, it will be created.
// added export keyword in step2 coz we need our api to interact with db
export async function openDb() {
  return open({
    filename: './database.sqlite', // The file path for the database
    driver: sqlite3.Database,
  });
}

// This function initializes the database by creating tables and seeding them with initial data.
export async function initializeDb() {
  const db = await openDb();

  // Read the schema file
  const schema = await readFile('./database/schema.sql', 'utf-8');
  // Execute the SQL from the schema file to create tables
  await db.exec(schema);

  // Check if the profile is already seeded
  const profile = await db.get('SELECT * FROM profile');
  if (!profile) {
    console.log('Database is empty. Seeding with initial data...');
    await seedDb(db);
  } else {
    console.log('Database already contains data. Skipping seed.');
  }

  await db.close();
  console.log('Database initialized successfully.');
}

// This function inserts my (Gemini's) data into the database.
async function seedDb(db) {
  // Using Promise.all to run insert operations concurrently for efficiency
  await Promise.all([
    // Seed Profile
    db.run(
      `INSERT INTO profile (name, email, github_url, linkedin_url, portfolio_url) VALUES (?, ?, ?, ?, ?)`,
      'Gemini', 'gemini.ai@google.com', 'https://github.com', 'https://linkedin.com', 'https://deepmind.google/'
    ),
    
    // Seed Education
    db.run(
        `INSERT INTO education (institution, degree, start_year, end_year) VALUES (?, ?, ?, ?)`,
        'Google Labs', 'Ph.D. in Large Language Models', 2021, 2023
    ),

    // Seed Work Experience
    db.run(
        `INSERT INTO work_experience (company, position, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)`,
        'Google', 'Senior AI Engineer', '2023-Present', null, 'Developing next-generation AI models and systems.'
    ),
  ]);

  // Seed Skills (we need the IDs later)
  const skills = ['Python', 'JavaScript', 'Node.js', 'SQL', 'React', 'Docker', 'Natural Language Processing'];
  const skillIds = {};
  for (const skill of skills) {
    const result = await db.run(`INSERT INTO skills (name, category) VALUES (?, ?)`, skill, 'Technology');
    skillIds[skill] = result.lastID;
  }
  
  // Seed Projects and link skills
  const projects = [
    {
      title: 'Code Generation Service',
      description: 'An API that generates code snippets in multiple languages based on natural language prompts.',
      repo_link: 'https://github.com/project/codegen',
      skills: ['Python', 'Natural Language Processing']
    },
    {
      title: 'Portfolio API',
      description: 'The very API we are building now. A RESTful service to manage and display professional profile data.',
      repo_link: 'https://github.com/project/portfolio-api',
      skills: ['JavaScript', 'Node.js', 'SQL', 'Docker']
    }
  ];

  for (const project of projects) {
    const result = await db.run(
      `INSERT INTO projects (title, description, repo_link) VALUES (?, ?, ?)`,
      project.title, project.description, project.repo_link
    );
    const projectId = result.lastID;

    // Link skills to this project
    for (const skillName of project.skills) {
      const skillId = skillIds[skillName];
      if (skillId) {
        await db.run(`INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)`, projectId, skillId);
      }
    }
  }
  console.log('Seeding complete!');
}