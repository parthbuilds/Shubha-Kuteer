// assets/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");
    
    // Select the dashboard button using its correct ID "dashboard"
    const dashboardLink = document.getElementById("dashboard"); // Changed from dashboardBtn to dashboardLink

    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName"); 
    const storedUserEmail = localStorage.getItem("userEmail"); 

    if (isLoggedIn === "true") {
        // User is logged in
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        
        // Show the dashboard link
        // Assuming the parent div of the dashboard link needs to be toggled,
        // or the link itself if it's the only element in that container.
        if (dashboardLink) {
            dashboardLink.classList.remove("hidden"); 
            // If the parent div has an ID, you might need to target that instead
            // For example, if the div with class "pt-3" had an ID:
            // const dashboardLinkContainer = document.getElementById("dashboardContainer");
            // if (dashboardLinkContainer) dashboardLinkContainer.classList.remove("hidden");
        }

        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";

    } else {
        // User is not logged in
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
        
        // Hide the dashboard link
        if (dashboardLink) {
            dashboardLink.classList.add("hidden");
            // If the parent div has an ID, target that instead
            // const dashboardLinkContainer = document.getElementById("dashboardContainer");
            // if (dashboardLinkContainer) dashboardLinkContainer.classList.add("hidden");
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