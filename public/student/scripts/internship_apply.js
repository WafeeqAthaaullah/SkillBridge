// public/scripts/internship_apply.js

document.addEventListener('DOMContentLoaded', function() {
    // ... (existing code for getting elements, getStudentId, fetchData, initializePage) ...

    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const internshipTitleElem = document.getElementById('internshipTitle');
    const internshipCompanyElem = document.getElementById('internshipCompany');
    const applicationForm = document.getElementById('internshipApplicationForm');
    const applicantNameInput = document.getElementById('applicantName');
    const applicantEmailInput = document.getElementById('applicantEmail');
    const applicantPhoneInput = document.getElementById('applicantPhone');
    // Add elements for GPA and Skills if you added them to internship_apply.html
    const applicantGPAInput = document.getElementById('applicantGPA');
    const applicantSkillsInput = document.getElementById('applicantSkills');


    const currentResumeFileNameSpan = document.getElementById('currentResumeFileName');
    const viewCurrentResumeLink = document.getElementById('viewCurrentResumeLink');
    const uploadResumeInput = document.getElementById('uploadResume');
    const newResumeFileNameSpan = document.getElementById('newResumeFileName');
    const currentCoverLetterFileNameSpan = document.getElementById('currentCoverLetterFileName');
    const viewCurrentCoverLetterLink = document.getElementById('viewCurrentCoverLetterLink');
    const uploadCoverLetterInput = document.getElementById('uploadCoverLetter');
    const newCoverLetterFileNameSpan = document.getElementById('newCoverLetterFileName');
    const cancelApplyBtn = document.getElementById('cancelApplyBtn');

    let currentInternshipId = null;
    let studentProfile = null; // Will store fetched student data
    let internshipDetails = null; // Will store fetched internship data

    function getStudentId() {
        return localStorage.getItem('studentId');
    }

    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Unknown error'}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            throw error;
        }
    }

    async function initializePage() {
        const studentId = getStudentId();

        if (!studentId) {
            alert('Student not logged in or ID not found. Please log in.');
            window.location.href = 'login.html';
            return;
        }

        try {
            studentProfile = await fetchData(`/api/students/${studentId}`);
            studentNameDisplay.textContent = studentProfile.name || 'Student';

            applicantNameInput.value = studentProfile.name || '';
            applicantEmailInput.value = studentProfile.email || '';
            applicantPhoneInput.value = studentProfile.phone || '';
            // Populate GPA and Skills if you added them to HTML
            if (applicantGPAInput) applicantGPAInput.value = studentProfile.gpa || '';
            if (applicantSkillsInput) applicantSkillsInput.value = studentProfile.skills || '';


            displayCurrentDocument(studentProfile.resume_url, currentResumeFileNameSpan, viewCurrentResumeLink);
            displayCurrentDocument(studentProfile.cover_letter_url, currentCoverLetterFileNameSpan, viewCurrentCoverLetterLink);

            const urlParams = new URLSearchParams(window.location.search);
            currentInternshipId = parseInt(urlParams.get('internshipId'));

            if (isNaN(currentInternshipId)) {
                internshipTitleElem.textContent = 'Error: Internship not specified.';
                internshipCompanyElem.textContent = '';
                applicationForm.style.display = 'none';
                alert('No internship selected. Please go back to listings.');
                return;
            }

            internshipDetails = await fetchData(`/api/internships/${currentInternshipId}`);

            if (!internshipDetails) {
                internshipTitleElem.textContent = 'Error: Internship not found.';
                internshipCompanyElem.textContent = '';
                applicationForm.style.display = 'none';
                alert('The selected internship could not be found.');
                return;
            }

            internshipTitleElem.textContent = internshipDetails.title;
            internshipCompanyElem.textContent = internshipDetails.companyName;

        } catch (error) {
            console.error('Failed to initialize page data:', error);
            alert('Failed to load required data. Please try again or contact support.');
            applicationForm.style.display = 'none';
        }
    }

    function displayCurrentDocument(url, fileNameSpan, viewLink) {
        if (url && url !== '#') {
            fileNameSpan.textContent = url.split('/').pop();
            viewLink.href = url;
            viewLink.style.display = 'inline-flex';
        } else {
            fileNameSpan.textContent = 'Not available from profile.';
            viewLink.style.display = 'none';
        }
    }

    function handleFileUpload(inputElement, fileNameSpan, viewLink) {
        inputElement.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.type !== 'application/pdf') {
                    alert('Please upload a PDF file.');
                    inputElement.value = '';
                    fileNameSpan.textContent = 'No new file selected.';
                    viewLink.style.display = 'none';
                    return;
                }

                const maxSize = (inputElement.id === 'uploadResume') ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert(`File size exceeds ${maxSize / (1024 * 1024)}MB. Please choose a smaller file.`);
                    inputElement.value = '';
                    fileNameSpan.textContent = 'No new file selected.';
                    viewLink.style.display = 'none';
                    return;
                }

                fileNameSpan.textContent = file.name;
                viewLink.href = URL.createObjectURL(file);
                viewLink.style.display = 'inline-flex';
            } else {
                fileNameSpan.textContent = 'No new file selected.';
                viewLink.href = '#';
                viewLink.style.display = 'none';
            }
        });
    }

    handleFileUpload(uploadResumeInput, newResumeFileNameSpan, viewCurrentResumeLink);
    handleFileUpload(uploadCoverLetterInput, newCoverLetterFileNameSpan, viewCurrentCoverLetterLink);


    // --- MODIFIED: Handle Form Submission for File Uploads ---
    applicationForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Create a FormData object
        const formData = new FormData();

        // Append all necessary text fields
        formData.append('student_id', getStudentId());
        formData.append('internship_id', currentInternshipId);
        formData.append('application_date', new Date().toISOString().split('T')[0]);
        formData.append('status', 'Pending');

        // Append student profile data (already fetched and available)
        formData.append('student_name', studentProfile.name || '');
        formData.append('student_email', studentProfile.email || '');
        formData.append('student_phone', studentProfile.phone || '');
        formData.append('student_gpa', studentProfile.gpa || ''); // Make sure studentProfile has these
        formData.append('student_skills', studentProfile.skills || ''); // Make sure studentProfile has these

        let resumeProvided = false;

        // Handle Resume Upload or Existing Resume
        if (uploadResumeInput.files.length > 0) {
            formData.append('resume_file', uploadResumeInput.files[0]); // Append the actual File object
            resumeProvided = true;
        } else if (studentProfile.resume_url) {
            formData.append('resume_url_existing', studentProfile.resume_url); // Indicate use of existing URL
            resumeProvided = true;
        }

        // Handle Cover Letter Upload or Existing Cover Letter
        if (uploadCoverLetterInput.files.length > 0) {
            formData.append('cover_letter_file', uploadCoverLetterInput.files[0]); // Append the actual File object
        } else if (studentProfile.cover_letter_url) {
            formData.append('cover_letter_url_existing', studentProfile.cover_letter_url); // Indicate use of existing URL
        }

        if (!resumeProvided) {
            alert('A resume is required to submit your application.');
            return;
        }
        
        console.log("Submitting application with FormData...");
        // FormData content is not easily readable via console.log directly

        try {
            // Remove 'Content-Type' header as FormData sets it automatically
            const result = await fetchData('/api/applications', {
                method: 'POST',
                // headers: { 'Content-Type': 'application/json' }, // REMOVE THIS LINE
                body: formData // Send FormData directly
            });

            if (result.success || result.id) {
                alert("Application submitted successfully!\nYou can view your application status on 'My Applications' page.");
                window.location.href = `student_applications.html`;
            } else {
                alert("Application submission failed: " + (result.message || "Unknown error."));
            }
        } catch (error) {
            alert("Application submission failed: " + error.message);
            console.error('Application submission error:', error);
        }
    });

    cancelApplyBtn.addEventListener('click', function() {
        if (internshipDetails) {
            window.location.href = `internship_detail.html?id=${internshipDetails.id}`;
        } else {
            window.location.href = `internships.html`;
        }
    });

    initializePage();
});