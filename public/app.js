document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_URL = 'https://profile-api-fpjk.onrender.com/api'; // Replace with your deployed URL if needed
    let API_KEY = null; // We will prompt for this when needed

    // --- DOM ELEMENT REFERENCES ---
    const profileHeader = document.getElementById('profile-header');
    const projectsContainer = document.getElementById('projects-container');
    const skillsContainer = document.getElementById('skills-container');
    const workContainer = document.getElementById('work-container');
    const educationContainer = document.getElementById('education-container');
    const skillFilterInput = document.getElementById('skill-filter');

    // --- GENERIC API FUNCTIONS ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const config = { method, headers };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `API request failed with status ${response.status}`);
        }
        
        // Handle 204 No Content for DELETE requests
        if (response.status === 204) {
            return null;
        }
        
        return response.json();
    }

    // --- RENDER FUNCTIONS ---
    function renderProfile(profile) {
        profileHeader.innerHTML = `
            <div data-id="${profile.id}" class="profile-card">
                <div class="view-mode">
                    <h1>${profile.name}</h1>
                    <p>${profile.email}</p>
                    <p><a href="${profile.github_url}">GitHub</a> | <a href="${profile.linkedin_url}">LinkedIn</a></p>
                </div>
            </div>`;
    }
    
    function renderCollection(container, items, type) {
        container.innerHTML = '';
        items.forEach(item => container.appendChild(createCard(item, type)));
    }

    // --- CARD CREATION AND EDITING ---
    function createCard(item, type) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = item.id;
        card.dataset.type = type;
        
        let viewHtml = '';
        switch(type) {
            case 'project':
                const skillsHtml = item.skills && item.skills.length 
                    ? `<div class="skills-list">Skills: ${item.skills.map(s => `<span>${s}</span>`).join(', ')}</div>` 
                    : '';
                viewHtml = `<h3>${item.title}</h3><p>${item.description}</p>${skillsHtml}`;
                break;
            case 'skill':
                viewHtml = `<h3>${item.name}</h3><p>${item.category || ''}</p>`;
                break;
            case 'work':
                viewHtml = `<h3>${item.position} at ${item.company}</h3><p>${item.start_date} - ${item.end_date || 'Present'}</p>`;
                break;
            case 'education':
                viewHtml = `<h3>${item.degree}</h3><p>${item.institution}</p><p>${item.start_year} - ${item.end_year}</p>`;
                break;
        }

        card.innerHTML = `
            <div class="view-mode">${viewHtml}</div>`;
        return card;
    }

    // --- EVENT HANDLERS ---
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    const debouncedFilter = debounce(async (skill) => {
        try {
            const endpoint = skill ? `/projects?skill=${encodeURIComponent(skill)}` : '/projects';
            const projects = await apiRequest(endpoint);
            renderCollection(projectsContainer, projects, 'project');
        } catch (error) {
            console.error('Failed to filter projects:', error);
            projectsContainer.innerHTML = `<p>Error loading projects.</p>`;
        }
    }, 300);

    skillFilterInput.addEventListener('input', (e) => {
        debouncedFilter(e.target.value);
    });

    // --- INITIAL DATA LOAD ---
    async function loadData() {
        try {
            const [profileData, projects, skills] = await Promise.all([
                apiRequest('/profile'),
                apiRequest('/projects'),
                apiRequest('/skills')
            ]);
            
            renderProfile(profileData);
            renderCollection(workContainer, profileData.work_experience, 'work');
            renderCollection(educationContainer, profileData.education, 'education');
            renderCollection(projectsContainer, projects, 'project');
            renderCollection(skillsContainer, skills, 'skill');
        } catch (error) {
            document.body.innerHTML = `<p>Failed to load data: ${error.message}</p>`;
        }
    }

    loadData();
});