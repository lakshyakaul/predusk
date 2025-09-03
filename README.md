# Profile API

This project is a full-stack application that stores a professional profile in a database and exposes it via a RESTful API with a minimal frontend for querying.

---

**Live URL** `(https://profile-api-fpjk.onrender.com/)`

---

## Architecture

* **Backend:** Node.js with Express.js
* **Database:** SQLite (file-based)
* **Frontend:** Vanilla JavaScript, HTML, and CSS (served as a static site)
* **Hosting:** Deployed on Render (Web Service for backend, Static Site for frontend)

---

## Database Schema

The database consists of several tables to store profile, skills, projects, work, and education data.


-- The main profile table for your core information.
```
CREATE TABLE profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT
);
```

-- Table to store your skills.
```
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT -- e.g., 'Language', 'Framework', 'Tool'
);
```

-- Table for your projects.
```
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    repo_link TEXT,
    live_link TEXT
);
```

-- This is a "join table" to link skills with projects.
-- A project can have many skills, and a skill can be used in many projects.
```
CREATE TABLE project_skills (
    project_id INTEGER,
    skill_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(skill_id) REFERENCES skills(id),
    PRIMARY KEY (project_id, skill_id)
);
```

-- Table for your work history.
```
CREATE TABLE work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    description TEXT
);
```

-- Table for your education.
```
CREATE TABLE education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    start_year INTEGER,
    end_year INTEGER
);
```

---

## API Endpoints & Sample Requests

Here are the main endpoints available. Replace `[BASE_URL]` with `https://profile-api-fpjk.onrender.com/`.

**Get the full profile:**
```bash
curl [BASE_URL]/api/profile
```

**Get all projects:**
```bash
curl [BASE_URL]/api/projects
```

**Filter projects by skill:**
```bash
curl "[BASE_URL]/api/projects?skill=python"
```

**Get top 5 skills:**
```bash
curl [BASE_URL]/api/skills/top
```

**Search projects:**
```bash
curl "[BASE_URL]/api/search?q=API"
```

**Health Check:**
```bash
curl [BASE_URL]/health
```

---

## Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the server:**
    The server will initialize and seed the SQLite database on the first run.
    ```bash
    node src/index.js
    ```
4.  **Access the application:**
    * The API will be running at `http://localhost:3000`.
    * The frontend can be accessed by opening the `public/index.html` file in your browser or navigating to `http://localhost:3000`.

---

## Known Limitations

* The database is SQLite, which is not ideal for high-concurrency production environments.
* The API has no authentication or rate limiting. All endpoints are public.
* Error handling is basic.

---
