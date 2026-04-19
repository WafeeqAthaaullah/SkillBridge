// pageHandlers.js - Handles serving specific HTML pages based on routes

const myModule = require('./myModule');

// Student Pages
function handleRoot(req, res) {
    myModule.navigateToHome(res);
}

function handleLoginGet(req, res) {
    myModule.login(res);
}

function handleSignupGet(req, res) {
    myModule.signup(res);
}

function handleHomeGet(req, res) {
    myModule.navigateToHome(res);
}

function handleMyProfileGet(req, res) {
    myModule.navigateToUserProfile(res);
}

function handleStudentDashboardGet(req, res) {
    myModule.studentDashboard(res);
}

function handleStudentInternshipsGet(req, res) {
    myModule.studentInternships(res);
}

function handleStudentInternshipDetailGet(req, res) {
    myModule.studentInternshipDetail(res);
}

function handleInternshipApplyGet(req, res) {
    myModule.internshipApply(res);
}

function handleStudentApplicationsGet(req, res) {
    myModule.studentApplications(res);
}

function handleStudentLogoutPageGet(req, res) {
    myModule.studentLogoutPage(res);
}


// Company Pages
function handleCompanyLoginGet(req, res) {
    myModule.companyLogin(res);
}

function handleCompanySignupGet(req, res) {
    myModule.companySignup(res);
}

function handleCompanyDashboardGet(req, res) {
    myModule.companyDashboard(res);
}

function handleCompanyProfileGet(req, res) {
    myModule.companyProfile(res);
}

function handleManageInternshipsGet(req, res) {
    myModule.manageInternships(res);
}

function handlePostInternshipGet(req, res) {
    myModule.postInternship(res);
}

function handleViewApplicationsGet(req, res) {
    myModule.viewApplications(res);
}

// Logout (redirects to /login)
function handleLogoutGet(req, res) {
    console.log('Logging out (no session to clear server-side). Redirecting to login.');
    myModule.logout(res);
}

module.exports = {
    handleRoot,
    handleLoginGet,
    handleSignupGet,
    handleHomeGet,
    handleMyProfileGet,
    handleStudentDashboardGet,
    handleStudentInternshipsGet,
    handleStudentInternshipDetailGet,
    handleInternshipApplyGet,
    handleStudentApplicationsGet,
    handleStudentLogoutPageGet,

    handleCompanyLoginGet,
    handleCompanySignupGet,
    handleCompanyDashboardGet,
    handleCompanyProfileGet,
    handleManageInternshipsGet,
    handlePostInternshipGet,
    handleViewApplicationsGet,
    
    handleLogoutGet
};