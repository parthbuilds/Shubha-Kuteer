document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");
    const dashboardBtn = document.getElementById("dashboardBtn");

    // Elements to display user information
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    // Check login state from localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName"); // Get stored name
    const storedUserEmail = localStorage.getItem("userEmail"); // Get stored email

    if (isLoggedIn === "true") {
        // ✅ User is logged in
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        if (dashboardBtn) dashboardBtn.classList.remove("hidden"); // Show dashboard button

        // Display user's name and email
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";

        // You might want to fetch more dashboard content here using the token
        // fetchDashboardContent(localStorage.getItem("token"));

    } else {
        // ❌ User is not logged in
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
        if (dashboardBtn) dashboardBtn.classList.add("hidden"); // Hide dashboard button

        // Clear or hide user info if not logged in
        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";

        // Optionally redirect to login page if not logged in
        // window.location.href = "login.html"; 
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("token");
            localStorage.removeItem("userName"); // Remove stored user name
            localStorage.removeItem("userEmail"); // Remove stored user email
            window.location.href = "index.html"; // redirect to homepage
        });
    }

    // Example function to fetch dashboard content (if you want to expand)
    async function fetchDashboardContent(token) {
        try {
            const response = await fetch('/api/dashboard-content', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Dashboard content:", data);
                // Update your dashboard UI with fetched data
                // e.g., if you have an element for welcome message:
                // const welcomeMessage = document.getElementById("welcomeMessage");
                // if (welcomeMessage) welcomeMessage.textContent = data.message;
            } else {
                console.error("Failed to fetch dashboard content:", data.message);
                // Handle unauthorized or other errors, maybe redirect to login
            }
        } catch (error) {
            console.error("Error fetching dashboard content:", error);
        }
    }
});