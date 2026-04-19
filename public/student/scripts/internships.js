// project-root/public/scripts/internships.js

document.addEventListener('DOMContentLoaded', async function() {

    // Get elements
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const keywordSearch = document.getElementById('keywordSearch');
    const locationFilter = document.getElementById('locationFilter');
    const skillsFilter = document.getElementById('skillsFilter');
    const stipendFilter = document.getElementById('stipendFilter');
    const durationFilter = document.getElementById('durationFilter');
    const companyFilter = document.getElementById('companyFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const internshipListingsContainer = document.getElementById('internshipListingsContainer');
    const internshipCountSpan = document.getElementById('internshipCount');
    const noInternshipsMessage = document.getElementById('noInternshipsMessage');

    let allInternships = []; // Store all internships fetched from API
    let currentFilteredInternships = []; // Internships currently displayed after filters

    // Retrieve studentId from localStorage, similar to student_dashboard.js
    const studentId = localStorage.getItem('studentId'); 

    if (!studentId) {
        console.error('Student ID not found in localStorage. Cannot load student profile.');
        studentNameDisplay.textContent = 'Student (Login Required)'; // Indicate problem
        // You might want to redirect to login if this page requires a logged-in user
        // window.location.href = '/login'; 
        // return; // Exit if no studentId is found and page requires it
    }

    // Helper function to fetch data from your API (similar to student_dashboard.js)
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            return null; // Return null on error so calling code can handle it
        }
    }

    // --- Fetch Student Profile Data (using the working /api/students/:id endpoint) ---
    async function fetchStudentProfile() {
        if (studentId) { // Only fetch if studentId is available
            const studentProfile = await fetchData(`/api/students/${studentId}`);
            if (studentProfile) {
                studentNameDisplay.textContent = studentProfile.name || 'Student';
            } else {
                console.error('Failed to load student profile data from API.');
                studentNameDisplay.textContent = 'Student (Error)';
            }
        } else {
            studentNameDisplay.textContent = 'Student (Not Logged In)';
        }
    }

    // --- Function to fetch All Internships ---
    async function fetchAllInternships() {
        try {
            const internships = await fetchData('/api/internships'); // API endpoint for all internships
            // The fetchData helper now handles response.ok check and error parsing
            return internships || []; // Return empty array if fetchData returns null due to error
        } catch (error) {
            console.error('Error in fetchAllInternships:', error);
            internshipListingsContainer.innerHTML = '<p class="error-message">Failed to load internships. Please try again later.</p>';
            internshipCountSpan.textContent = '0';
            noInternshipsMessage.style.display = 'none';
            return [];
        }
    }

    // --- Function to Render Internships (NO CHANGES HERE) ---
    function renderInternships(internshipsToDisplay) {
        internshipListingsContainer.innerHTML = ''; // Clear existing listings
        currentFilteredInternships = internshipsToDisplay;
        internshipCountSpan.textContent = internshipsToDisplay.length;

        if (internshipsToDisplay.length === 0) {
            noInternshipsMessage.style.display = 'block'; // Show "no internships" message
            return;
        } else {
            noInternshipsMessage.style.display = 'none'; // Hide message if there are internships
        }

        internshipsToDisplay.forEach(internship => {
            const card = document.createElement('div');
            card.classList.add('internship-card');
            card.innerHTML = `
                <h4>${internship.title}</h4>
                <p class="card-company"><i class="fas fa-building"></i> ${internship.companyName}</p>
                <p class="card-info"><i class="fas fa-map-marker-alt"></i> ${internship.location}</p>
                <p class="card-info"><i class="fas fa-money-bill-wave"></i> Stipend: $${internship.stipend || 'N/A'}/month</p>
                <p class="card-info"><i class="fas fa-clock"></i> Duration: ${internship.duration || 'N/A'}</p>
                <p class="card-skills">Skills: ${Array.isArray(internship.requiredSkills) ? internship.requiredSkills.join(', ') : 'N/A'}</p>
                <div class="card-actions">
                    <a href="internship_detail.html?id=${internship.id}" class="btn-primary">View Details</a>
                </div>
            `;
            internshipListingsContainer.appendChild(card);
        });
    }

    // --- Filtering Logic (NO CHANGES HERE - already robust) ---
    function applyFilters() {
        let filtered = [...allInternships]; // Start with all internships

        const keyword = keywordSearch.value.toLowerCase().trim();
        const location = locationFilter.value.toLowerCase().trim();
        const skills = skillsFilter.value.toLowerCase().split(',').map(s => s.trim()).filter(s => s !== '');
        const minStipend = parseFloat(stipendFilter.value);
        const maxDuration = parseFloat(durationFilter.value);
        const company = companyFilter.value.toLowerCase().trim();

        // Filter by Keyword (title, description, skills, company name)
        if (keyword) {
            filtered = filtered.filter(internship =>
                internship.title.toLowerCase().includes(keyword) ||
                internship.description.toLowerCase().includes(keyword) ||
                internship.companyName.toLowerCase().includes(keyword) ||
                (Array.isArray(internship.requiredSkills) && internship.requiredSkills.some(skill => skill.toLowerCase().includes(keyword)))
            );
        }

        // Filter by Location
        if (location) {
            filtered = filtered.filter(internship =>
                internship.location && internship.location.toLowerCase().includes(location)
            );
        }

        // Filter by Skills (must contain at least one of the entered skills)
        if (skills.length > 0) {
            filtered = filtered.filter(internship =>
                Array.isArray(internship.requiredSkills) && internship.requiredSkills.some(skill =>
                    skills.some(filterSkill => skill.toLowerCase().includes(filterSkill))
                )
            );
        }

        // Filter by Minimum Stipend
        if (!isNaN(minStipend) && minStipend >= 0) {
            filtered = filtered.filter(internship =>
                internship.stipend !== null && parseFloat(internship.stipend) >= minStipend
            );
        }

        // Filter by Maximum Duration
        if (!isNaN(maxDuration) && maxDuration >= 0) {
            filtered = filtered.filter(internship => {
                if (!internship.duration) return false;
                const durationMatch = String(internship.duration).match(/(\d+)\s*months?/i);
                if (durationMatch && durationMatch[1]) {
                    return parseFloat(durationMatch[1]) <= maxDuration;
                }
                return false;
            });
        }

        // Filter by Company Name
        if (company) {
            filtered = filtered.filter(internship =>
                internship.companyName && internship.companyName.toLowerCase().includes(company)
            );
        }
        
        // Always filter for 'Active' internships for students
        filtered = filtered.filter(internship => internship.status === 'Active');

        renderInternships(filtered);
    }

    // --- Initial Data Load ---
    // Fetch profile and all internships concurrently
    await Promise.all([
        fetchStudentProfile(), // This will now use /api/students/:id
        (async () => { allInternships = await fetchAllInternships(); })()
    ]);

    // Initial render when the page loads (showing all active internships)
    applyFilters();


    // --- Event Listeners (NO CHANGES HERE) ---
    applyFiltersBtn.addEventListener('click', applyFilters);

    resetFiltersBtn.addEventListener('click', function() {
        keywordSearch.value = '';
        locationFilter.value = '';
        skillsFilter.value = '';
        stipendFilter.value = '';
        durationFilter.value = '';
        companyFilter.value = '';
        applyFilters(); // Re-render all active internships
    });
});