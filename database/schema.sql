-- This file defines the structure of our database.

-- Drop tables if they already exist to ensure a clean setup.
DROP TABLE IF EXISTS profile;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS project_skills;
DROP TABLE IF EXISTS work_experience;
DROP TABLE IF EXISTS education;

-- The main profile table for your core information.
CREATE TABLE profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT
);

-- Table to store your skills.
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT -- e.g., 'Language', 'Framework', 'Tool'
);

-- Table for your projects.
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    repo_link TEXT,
    live_link TEXT
);

-- This is a "join table" to link skills with projects.
-- A project can have many skills, and a skill can be used in many projects.
CREATE TABLE project_skills (
    project_id INTEGER,
    skill_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(skill_id) REFERENCES skills(id),
    PRIMARY KEY (project_id, skill_id)
);

-- Table for your work history.
CREATE TABLE work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    description TEXT
);

-- Table for your education.
CREATE TABLE education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    start_year INTEGER,
    end_year INTEGER
);