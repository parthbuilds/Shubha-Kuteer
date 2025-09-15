// login.js

document.addEventListener("DOMContentLoaded", () => {
    // Select elements and check if they exist
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");

    // Only proceed if elements exist
    if (loginBtn && logoutBtn) {
        // Check login state from localStorage
        const user = localStorage.getItem("isLoggedIn");

        if (user === "true") {
            // Logged in
            loginBtn.classList.add("hidden");
            logoutBtn.classList.remove("hidden");
            if (registerBlock) registerBlock.style.display = "none";
        } else {
            // Not logged in
            loginBtn.classList.remove("hidden");
            logoutBtn.classList.add("hidden");
            if (registerBlock) registerBlock.style.display = "block";
        }

        // Logout functionality
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "index.html"; // redirect to homepage
        });
    }
});