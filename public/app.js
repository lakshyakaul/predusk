// public/app.js
document.addEventListener('DOMContentLoaded', () => {
    // The base URL of your API
    const API_URL = 'http://localhost:3000/api';

    // --- DOM Element References ---
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileLinks = document.getElementById('profile-links');
    const projectsContainer = document.getElementById('projects-container');
    const skillsContainer = document.getElementById('skills-container');
    const skillFilterInput = document.getElementById('skill-filter');

    // --- Data Fetching Functions ---

    // Fetch the main profile data
    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/profile`);
            const data = await response.json();
            renderProfile(data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    // Fetch top skills
    const fetchTopSkills = async () => {
        try {
            const response = await fetch(`${API_URL}/skills/top`);
            const skills = await response.json();
            renderSkills(skills);
        } catch (error) {
            console.error('Failed to fetch top skills:', error);
        }
    }

    // Fetch projects, optionally filtering by skill
    const fetchProjects = async (skill = '') => {
        try {
            const url = skill ? `${API_URL}/projects?skill=${skill}` : `${API_URL}/projects`;
            const response = await fetch(url);
            const projects = await response.json();
            renderProjects(projects);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    // --- Rendering Functions ---

    // Render profile header
    const renderProfile = (profile) => {
        profileName.textContent = profile.name;
        profileEmail.textContent = profile.email;
        profileLinks.innerHTML = `
            <a href="${profile.github_url}" target="_blank">GitHub</a> | 
            <a href="${profile.linkedin_url}" target="_blank">LinkedIn</a> | 
            <a href="${profile.portfolio_url}" target="_blank">Portfolio</a>
        `;
    };
    
    // Render top skills
    const renderSkills = (skills) => {
        skillsContainer.innerHTML = ''; // Clear existing content
        skills.forEach(skill => {
            const skillCard = document.createElement('div');
            skillCard.className = 'card';
            skillCard.innerHTML = `<h3>${skill.name}</h3> <p>Used in ${skill.project_count} project(s)</p>`;
            skillsContainer.appendChild(skillCard);
        });
    }

    // Render project cards
    const renderProjects = (projects) => {
        projectsContainer.innerHTML = ''; // Clear existing content
        if (projects.length === 0) {
            projectsContainer.innerHTML = '<p>No projects found for this skill.</p>';
            return;
        }
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'card';
            projectCard.innerHTML = `
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="skills">
                    ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                <p><a href="${project.repo_link}" target="_blank">View on GitHub</a></p>
            `;
            projectsContainer.appendChild(projectCard);
        });
    };

    // --- Event Listeners ---
    
    // Use 'keyup' for real-time filtering as the user types
    skillFilterInput.addEventListener('keyup', (event) => {
        const searchTerm = event.target.value.trim();
        fetchProjects(searchTerm);
    });

    // --- Initial Data Load ---
    const loadInitialData = () => {
        fetchProfile();
        fetchProjects(); // Load all projects initially
        fetchTopSkills();
    };

    loadInitialData();
});