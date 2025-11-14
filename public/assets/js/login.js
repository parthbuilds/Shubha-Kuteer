document.addEventListener("DOMContentLoaded", () => {
    // Select elements and check if they exist
    const loginBtn = document.getElementById("loginBtn"); // This is likely for a "Login" button that triggers a modal/page
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock"); // Assuming this is a block related to registration/login form
    
    // Select elements for the login form itself, if it exists on this page
    const loginForm = document.getElementById("loginForm"); // Assuming you have a login form with this ID
    const emailInput = document.getElementById("loginEmail"); // Input for email
    const passwordInput = document.getElementById("loginPassword"); // Input for password
    const loginMessage = document.getElementById("loginMessage"); // For displaying success/error messages

    // Handle initial login state from localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    if (isLoggedIn === "true") {
        // User is logged in
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        
        // Display user info if on a page that shows it (e.g., dashboard or profile)
        const userNameDisplay = document.getElementById("userName");
        const userEmailDisplay = document.getElementById("userEmail");
        if (userNameDisplay) userNameDisplay.textContent = userName;
        if (userEmailDisplay) userEmailDisplay.textContent = userEmail;

    } else {
        // Not logged in
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
    }

    // Login Form Submission (if loginForm exists on the page)
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent default form submission

            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch("/api/auth/login", { // Adjust endpoint if different
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Login successful
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userName", data.user.full_name); // Store full name
                    localStorage.setItem("userEmail", data.user.email); // Store email

                    if (loginMessage) {
                        loginMessage.textContent = data.message;
                        loginMessage.style.color = "green";
                    }

                    // Redirect to dashboard or home page after successful login
                    window.location.href = "dashboard.html"; // Or wherever you want to redirect
                } else {
                    // Login failed
                    if (loginMessage) {
                        loginMessage.textContent = data.message || "Login failed.";
                        loginMessage.style.color = "red";
                    }
                    console.error("Login failed:", data.message);
                }
            } catch (error) {
                if (loginMessage) {
                    loginMessage.textContent = "An error occurred during login.";
                    loginMessage.style.color = "red";
                }
                console.error("Network or server error during login:", error);
            }
        });
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
});