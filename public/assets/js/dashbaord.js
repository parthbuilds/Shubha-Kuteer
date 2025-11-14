// assets/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");
    
    // Select the dashboard link by its ID
    const dashboardLink = document.getElementById("dashboard"); 

    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName"); 
    const storedUserEmail = localStorage.getItem("userEmail"); 

    if (isLoggedIn === "true") {
        // User is logged in
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden"); // Show logout button
        if (registerBlock) registerBlock.style.display = "none";
        
        // Make the dashboard link visible when logged in
        if (dashboardLink) {
            dashboardLink.classList.remove("hidden"); 
        }

        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";

    } else {
        // User is not logged in
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden"); // Hide logout button
        if (registerBlock) registerBlock.style.display = "block";
        
        // Hide the dashboard link when not logged in
        if (dashboardLink) {
            dashboardLink.classList.add("hidden");
        }

        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("token");
            localStorage.removeItem("userName"); 
            localStorage.removeItem("userEmail"); 
            window.location.href = "index.html"; 
        });
    }
});