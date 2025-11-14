// assets/js/login.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js: DOMContentLoaded - Script started.");

    // Select elements
    const loginBtn = document.getElementById("loginBtn"); // Main header login button
    const logoutBtn = document.getElementById("logoutBtn"); // Main header logout button
    const registerBlock = document.getElementById("registerBlock"); // The login/register block
    
    // Login form elements (from login.html)
    const loginForm = document.getElementById("loginForm"); 
    const emailInput = document.getElementById("email"); // Corrected ID from 'loginEmail' to 'email'
    const passwordInput = document.getElementById("password"); // Corrected ID from 'loginPassword' to 'password'
    const loginMessage = document.getElementById("loginMessage"); // Add this <p id="loginMessage"></p> inside your form or near it.

    // Elements to display user info (if they exist on this page, e.g., for header display)
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    console.log("login.js: Elements selected:", { loginBtn, logoutBtn, registerBlock, loginForm, emailInput, passwordInput, loginMessage, userNameDisplay, userEmailDisplay });

    // Handle initial login state from localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName");
    const storedUserEmail = localStorage.getItem("userEmail");

    console.log("login.js: localStorage initial state - isLoggedIn:", isLoggedIn, "userName:", storedUserName, "userEmail:", storedUserEmail);

    if (isLoggedIn === "true") {
        console.log("login.js: User is logged in. Hiding login, showing logout.");
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        
        // Display user info if these elements exist on the current page
        if (userNameDisplay) userNameDisplay.textContent = storedUserName;
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail;
        console.log("login.js: Display elements for user info updated (if present on this page).");

    } else {
        console.log("login.js: User is NOT logged in. Showing login, hiding logout.");
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
    }

    // --- Login Form Submission Logic ---
    if (loginForm) {
        console.log("login.js: Login form (id='loginForm') found. Attaching submit listener.");
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); 
            console.log("login.js: Login form submitted.");

            const loginButton = loginForm.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            console.log("login.js: Attempting login with email:", email);

            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = "Logging in...";
            }

            try {
                const response = await fetch("/api/auth/login", { 
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                console.log("login.js: API response data:", data);

                if (response.ok) {
                    console.log("login.js: Login successful!");
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userName", data.user.full_name); // Store full name
                    localStorage.setItem("userEmail", data.user.email); // Store email
                    console.log("login.js: Stored in localStorage - isLoggedIn: true, token: (hidden), userName:", data.user.full_name, "userEmail:", data.user.email);

                    if (loginMessage) {
                        loginMessage.textContent = data.message;
                        loginMessage.style.color = "green";
                    }
                    if (loginButton) {
                        loginButton.textContent = "Logged in ✅";
                    }
                    
                    console.log("login.js: Redirecting to dashboard.html");
                    // Assuming dashboard.html is where user info should be displayed after login
                    window.location.assign("dashboard.html"); 
                } else {
                    console.error("login.js: Login failed:", data.message);
                    if (loginMessage) {
                        loginMessage.textContent = data.message || "Login failed.";
                        loginMessage.style.color = "red";
                    }
                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.textContent = "Login";
                    }
                }
            } catch (error) {
                console.error("login.js: Network or server error during login:", error);
                if (loginMessage) {
                    loginMessage.textContent = "An error occurred during login.";
                    loginMessage.style.color = "red";
                }
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = "Login";
                }
            }
        });
    } else {
        console.warn("login.js: Login form (id='loginForm') not found on this page. Login submission will not be handled by this script.");
    }

    // --- Logout functionality (for any logout button, typically in header) ---
    if (logoutBtn) {
        console.log("login.js: Logout button found. Attaching click listener.");
        logoutBtn.addEventListener("click", () => {
            console.log("login.js: Logout button clicked. Clearing localStorage.");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("token");
            localStorage.removeItem("userName"); 
            localStorage.removeItem("userEmail"); 
            console.log("login.js: localStorage cleared. Redirecting to index.html.");
            window.location.href = "index.html"; 
        });
    }
});