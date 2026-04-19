// project-root/public/scripts/student_profile.js

document.addEventListener('DOMContentLoaded', async () => {
    const studentId = localStorage.getItem('studentId');

    if (!studentId) {
        console.error('Student ID not found in localStorage. Redirecting to login.');
        window.location.href = '/login';
        return;
    }

    // Helper function to fetch data from your API
    async function fetchData(url, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            if (!response.ok) {
                // Try to read error message from body, fall back to statusText
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message}`);
            }
            // For PUT/POST that might return empty body (e.g., 204 No Content), handle it gracefully
            if (response.status === 204 || response.headers.get('Content-Length') === '0') {
                return {}; // Return empty object if no content
            }
            return await response.json();
        } catch (error) {
            console.error(`Error ${method} from ${url}:`, error);
            alert(`Failed to ${method === 'GET' ? 'load' : 'save'} profile. Please try again. Error: ${error.message}`);
            return null;
        }
    }

    // Get elements
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const studentProfileForm = document.getElementById('studentProfileForm');
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');
    const profilePhoneInput = document.getElementById('profilePhone');
    const profileMajorInput = document.getElementById('profileMajor');
    const profileUniversityInput = document.getElementById('profileUniversity');
    const profileGPAInput = document.getElementById('profileGPA');
    const profileSkillsTextarea = document.getElementById('profileSkills');
    const profileResumeInput = document.getElementById('profileResume');
    const resumeFileNameSpan = document.getElementById('resumeFileName');
    const viewResumeLink = document.getElementById('viewResumeLink');
    const profileCoverLetterInput = document.getElementById('profileCoverLetter');
    const coverLetterFileNameSpan = document.getElementById('coverLetterFileName');
    const viewCoverLetterLink = document.getElementById('viewCoverLetterLink');
    const resetProfileBtn = document.getElementById('resetProfileBtn');

    let currentProfileData = null; // Will store the profile data fetched from the API

    // --- Function to populate form fields with profile data ---
    function populateForm(profile) {
        if (!profile) return; // Guard clause if profile data is null


        profileNameInput.value = profile.name || '';
        profileEmailInput.value = profile.email || '';
        profilePhoneInput.value = profile.phone || '';
        profileMajorInput.value = profile.major || '';
        profileUniversityInput.value = profile.university || '';
        profileGPAInput.value = profile.gpa || '';
        // If skills from backend is an array, join it for display in textarea
        profileSkillsTextarea.value = Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || '';


        // Resume and Cover Letter display using backend URLs
        // --- UPDATED: Use resume_url ---
        if (profile.resume_url) {
            resumeFileNameSpan.textContent = profile.resume_url.split('/').pop(); // Get file name from URL
            viewResumeLink.href = profile.resume_url;
            viewResumeLink.style.display = 'inline-flex';
        } else {
            resumeFileNameSpan.textContent = 'No file selected.';
            viewResumeLink.style.display = 'none';
        }
        // --- UPDATED: Use cover_letter_url ---
        if (profile.cover_letter_url) {
            coverLetterFileNameSpan.textContent = profile.cover_letter_url.split('/').pop(); // Get file name from URL
            viewCoverLetterLink.href = profile.cover_letter_url;
            viewCoverLetterLink.style.display = 'inline-flex';
        } else {
            coverLetterFileNameSpan.textContent = 'No file selected.';
            viewCoverLetterLink.style.display = 'none';
        }

        // Update student name in header (also in student_dashboard.js logic)
        studentNameDisplay.textContent = profile.name || 'Student Name';
    }

    // --- Function to load student profile from API ---
    async function loadStudentProfile() {
        currentProfileData = await fetchData(`/api/students/${studentId}`);
        if (currentProfileData) {
            populateForm(currentProfileData);
        } else {
            // Display default/error state if profile can't be loaded
            studentNameDisplay.textContent = 'Error Loading Name';
            profileNameInput.value = 'Error Loading...';
            profileEmailInput.value = 'Error Loading...';
            // Disable form fields to prevent submission of incomplete/bad data
            studentProfileForm.querySelectorAll('input, textarea, button[type="submit"]').forEach(el => el.disabled = true);
        }
    }

    // --- Event Listeners ---

    // Handle form submission (saving profile data)
    studentProfileForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        // Collect updated data from form fields
        const updatedProfile = {
            name: profileNameInput.value.trim(),
            email: profileEmailInput.value.trim(),
            phone: profilePhoneInput.value.trim(),
            major: profileMajorInput.value.trim(),
            university: profileUniversityInput.value.trim(),
            gpa: profileGPAInput.value.trim(),
            // Split the skills string into an array, trim each, and filter out empty strings
            skills: profileSkillsTextarea.value.split(',').map(s => s.trim()).filter(s => s !== ''),

            // For file URLs, we send back the existing URLs or null if not set
            resume_url: viewResumeLink.style.display !== 'none' ? viewResumeLink.href : null,
            cover_letter_url: viewCoverLetterLink.style.display !== 'none' ? viewCoverLetterLink.href : null,
        };

        // Basic client-side validation
        if (!updatedProfile.name || !updatedProfile.email || !updatedProfile.major || !updatedProfile.university) {
            alert('Name, Email, Major, and University are required fields.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedProfile.email)) {
            alert('Please enter a valid email address.');
            return;
        }
        if (updatedProfile.gpa && !/^[0-4]\.\d{1,2}$/.test(updatedProfile.gpa)) {
            alert('Please enter a valid GPA (e.g., 3.5, 4.0).');
            return;
        }

        console.log("Attempting to save student profile:", updatedProfile);

        // Send data to backend using PUT request
        const result = await fetchData(`/api/students/${studentId}`, 'PUT', updatedProfile);

        if (result) { // If result is not null (meaning fetch was successful)
            alert('Profile updated successfully!');
            // Re-fetch profile data to ensure UI reflects any canonical changes from the backend
            await loadStudentProfile();
        } else {

        }
    });


    resetProfileBtn.addEventListener('click', function() {
        populateForm(currentProfileData);
        alert('Form fields reset to last loaded data.');
    });


    profileResumeInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file for your Resume.');
                profileResumeInput.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Resume file size exceeds 5MB. Please choose a smaller file.');
                profileResumeInput.value = '';
                return;
            }
            resumeFileNameSpan.textContent = file.name;
            viewResumeLink.href = URL.createObjectURL(file); // Create a temporary URL for preview
            viewResumeLink.style.display = 'inline-flex';
        } else {
            resumeFileNameSpan.textContent = 'No file selected.';
            viewResumeLink.href = '#';
            viewResumeLink.style.display = 'none';
        }
    });

    profileCoverLetterInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file for your Cover Letter.');
                profileCoverLetterInput.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('Cover letter file size exceeds 2MB. Please choose a smaller file.');
                profileCoverLetterInput.value = '';
                return;
            }
            coverLetterFileNameSpan.textContent = file.name;
            viewCoverLetterLink.href = URL.createObjectURL(file); // Create a temporary URL for preview
            viewCoverLetterLink.style.display = 'inline-flex';
        } else {
            coverLetterFileNameSpan.textContent = 'No file selected.';
            viewCoverLetterLink.href = '#';
            viewCoverLetterLink.style.display = 'none';
        }
    });

    // Initial load of the student profile when the page loads
    loadStudentProfile();
});