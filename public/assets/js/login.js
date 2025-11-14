// assets/js/login.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js: DOMContentLoaded - Script started.");

    // Select elements related to overall page header/UI state
    const loginBtn = document.getElementById("loginBtn"); // e.g., a "Login" button in the header
    const logoutBtn = document.getElementById("logoutBtn"); // e.g., a "Logout" button in the header
    const registerBlock = document.getElementById("registerBlock"); // The entire block containing login/register forms

    // Select elements specific to the login form
    // Assuming the login form itself has id="loginForm"
    const loginForm = document.getElementById("loginForm"); 
    // Assuming the email input field inside the login form has id="email"
    const emailInput = document.getElementById("email"); 
    // Assuming the password input field inside the login form has id="password"
    const passwordInput = document.getElementById("password"); 
    // Assuming there's a paragraph or div to display login messages inside or near the form
    const loginMessage = document.getElementById("loginMessage"); 

    // Select elements to display user information (e.g., in a profile section or header)
    const userNameDisplay = document.getElementById("userName"); // Element to show user's full name
    const userEmailDisplay = document.getElementById("userEmail"); // Element to show user's email

    console.log("login.js: Elements selected:", { 
        loginBtn, logoutBtn, registerBlock, 
        loginForm, emailInput, passwordInput, loginMessage, 
        userNameDisplay, userEmailDisplay 
    });

    // --- Initial Check of Login State from localStorage ---
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName");
    const storedUserEmail = localStorage.getItem("userEmail");

    console.log("login.js: localStorage initial state - isLoggedIn:", isLoggedIn, "userName:", storedUserName, "userEmail:", storedUserEmail);

    if (isLoggedIn === "true") {
        console.log("login.js: User is currently logged in.");
        // Hide login-related UI, show logout-related UI
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none"; // Hide the whole login/register block

        // If on a page that also displays user info (like a header or profile snippet), update it
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";
        console.log("login.js: Display elements for user info updated (if present on this page).");

    } else {
        console.log("login.js: User is NOT logged in.");
        // Show login-related UI, hide logout-related UI
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block"; // Show the login/register block
    }

    // --- Login Form Submission Logic ---
    if (loginForm) {
        console.log("login.js: Login form (id='loginForm') found. Attaching submit listener.");
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent default form submission behavior
            console.log("login.js: Login form submitted.");

            // Get the submit button to disable it during the request
            const loginButton = loginForm.querySelector('button[type="submit"]');
            
            // Get values from input fields
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            console.log("login.js: Attempting login with email:", email);

            // Disable button and update text to provide feedback
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = "Logging in...";
            }
            if (loginMessage) { // Clear previous messages
                loginMessage.textContent = "";
                loginMessage.style.color = "initial";
            }

            try {
                // Make the API call to your backend login endpoint
                const response = await fetch("/api/auth/login", { 
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json(); // Parse the JSON response
                console.log("login.js: API response data:", data);

                if (response.ok) {
                    console.log("login.js: Login successful!");
                    // Store essential user data in localStorage
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userName", data.user.full_name); // Store user's full name
                    localStorage.setItem("userEmail", data.user.email);   // Store user's email
                    console.log("login.js: Stored in localStorage - isLoggedIn: true, token: (hidden), userName:", data.user.full_name, "userEmail:", data.user.email);

                    // Display success message and update button text
                    if (loginMessage) {
                        loginMessage.textContent = data.message;
                        loginMessage.style.color = "green";
                    }
                    if (loginButton) {
                        loginButton.textContent = "Logged in ✅";
                    }
                    
                    console.log("login.js: Redirecting to index.html");
                    // Redirect to the dashboard page after successful login
                    window.location.assign("index.html"); 

                } else {
                    console.error("login.js: Login failed:", data.message);
                    // Display error message
                    if (loginMessage) {
                        loginMessage.textContent = data.message || "Login failed.";
                        loginMessage.style.color = "red";
                    }
                    // Re-enable button and reset text
                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.textContent = "Login";
                    }
                }
            } catch (error) {
                console.error("login.js: Network or server error during login:", error);
                // Display generic error message for network issues
                if (loginMessage) {
                    loginMessage.textContent = "An error occurred during login. Please try again.";
                    loginMessage.style.color = "red";
                }
                // Re-enable button and reset text
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = "Login";
                }
            }
        });
    } else {
        console.warn("login.js: Login form (id='loginForm') not found on this page. Login submission will not be handled by this script.");
    }

    // --- Logout functionality ---
    // This listener handles any logout button (e.g., in the header)
    if (logoutBtn) {
        console.log("login.js: Logout button found. Attaching click listener.");
        logoutBtn.addEventListener("click", () => {
            console.log("login.js: Logout button clicked. Clearing localStorage.");
            // Remove all relevant items from localStorage
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("token");
            localStorage.removeItem("userName"); 
            localStorage.removeItem("userEmail"); 
            console.log("login.js: localStorage cleared. Redirecting to index.html.");
            // Redirect to the homepage after logout
            window.location.href = "index.html"; 
        });
    }
});