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
      'Lakshya Kaul', 'lakshyakaul05@gmail.com', 'https://github.com/lakshyakaul', 'https://in.linkedin.com/in/lakshya-kaul-b97299262', 'https://lakshya-kaul-portfolio.netlify.app/'
    ),
    
    // Seed Education
    db.run(
        `INSERT INTO education (institution, degree, start_year, end_year) VALUES (?, ?, ?, ?)`,
        'Manipal University Jaipur', 'B.Tech in Computer Science', 2022, 2026
    ),

    // Seed Work Experience
    db.run(
        `INSERT INTO work_experience (company, position, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)`,
        'DRDO', 'Intern', '2023-05-28', '2023-07-28', 'Spring Boot backend developer'
    ),
  ]);

  // Seed Skills (we need the IDs later)
  const skills = ['Python', 'JavaScript', 'Node.js', 'SQL', 'React', 'Elixir', 'Spring Boot', 'Java', 'Maven', 'Postman'];
  const skillIds = {};
  for (const skill of skills) {
    const result = await db.run(`INSERT INTO skills (name, category) VALUES (?, ?)`, skill, 'Technology');
    skillIds[skill] = result.lastID;
  }
  
  // Seed Projects and link skills
  const projects = [
    {
      title: 'TOPSIS algorithm backend implementation',
      description: 'An API for implementing TOPSIS algorithm based on MCDM i.e. Multi Criteria Decision Making',
      repo_link: 'https://github.com/lakshyakaul/topsis',
      skills: ['Java', 'Spring Boot', 'Maven', 'Postman']
    },
    {
      title: 'Portfolio API',
      description: 'This project being viewed right now. A RESTful service to manage and display professional profile data.',
      repo_link: 'https://github.com/lakshyakaul/predusk',
      skills: ['JavaScript', 'Node.js', 'SQLite', 'Express']
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