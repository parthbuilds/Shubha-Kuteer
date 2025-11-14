document.addEventListener("DOMContentLoaded", () => {
    console.log("dashboard.js: DOMContentLoaded - Script started.");

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");
    const dashboardBtn = document.getElementById("dashboardBtn");

    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    console.log("dashboard.js: Elements selected:", { loginBtn, logoutBtn, registerBlock, dashboardBtn, userNameDisplay, userEmailDisplay });

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName"); 
    const storedUserEmail = localStorage.getItem("userEmail"); 

    console.log("dashboard.js: localStorage state - isLoggedIn:", isLoggedIn, "storedUserName:", storedUserName, "storedUserEmail:", storedUserEmail);

    if (isLoggedIn === "true") {
        console.log("dashboard.js: User is logged in.");
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        if (dashboardBtn) dashboardBtn.classList.remove("hidden"); 

        console.log("dashboard.js: Attempting to update userNameDisplay and userEmailDisplay.");
        if (userNameDisplay) {
            userNameDisplay.textContent = storedUserName || "Guest User";
            console.log("dashboard.js: userNameDisplay updated to:", userNameDisplay.textContent);
        } else {
            console.warn("dashboard.js: Element with id 'userName' not found.");
        }
        if (userEmailDisplay) {
            userEmailDisplay.textContent = storedUserEmail || "No Email";
            console.log("dashboard.js: userEmailDisplay updated to:", userEmailDisplay.textContent);
        } else {
            console.warn("dashboard.js: Element with id 'userEmail' not found.");
        }

    } else {
        console.log("dashboard.js: User is NOT logged in. Hiding dashboard elements, showing login.");
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
        if (dashboardBtn) dashboardBtn.classList.add("hidden"); 

        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";
        console.log("dashboard.js: User info display elements cleared.");
    }

    if (logoutBtn) {
        console.log("dashboard.js: Logout button found. Attaching click listener.");
        logoutBtn.addEventListener("click", () => {
            console.log("dashboard.js: Logout button clicked. Clearing localStorage.");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("token");
            localStorage.removeItem("userName"); 
            localStorage.removeItem("userEmail"); 
            console.log("dashboard.js: localStorage cleared. Redirecting to index.html.");
            window.location.href = "index.html"; 
        });
    }
});