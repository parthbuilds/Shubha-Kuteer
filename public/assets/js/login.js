// assets/js/login.js

document.addEventListener("DOMContentLoaded", () => {
    // Select elements related to overall page header/UI state
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");
    
    // Select elements specific to the login form
    const loginForm = document.getElementById("loginForm"); 
    const emailInput = document.getElementById("email"); 
    const passwordInput = document.getElementById("password"); 
    const loginMessage = document.getElementById("loginMessage"); 

    // Select elements to display user information (if they exist on this page, e.g., for header display)
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    // --- Initial Check of Login State from localStorage ---
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName");
    const storedUserEmail = localStorage.getItem("userEmail");

    if (isLoggedIn === "true") {
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";

    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
    }

    // --- Login Form Submission Logic ---
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); 

            const loginButton = loginForm.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = "Logging in...";
            }
            if (loginMessage) { 
                loginMessage.textContent = "";
                loginMessage.style.color = "initial";
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

                if (response.ok) {
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userName", data.user.full_name || "User");
                    localStorage.setItem("userEmail", data.user.email);   

                    if (loginMessage) {
                        loginMessage.textContent = data.message;
                        loginMessage.style.color = "green";
                    }
                    if (loginButton) {
                        loginButton.textContent = "Logged in ✅";
                    }
                    
                    window.location.assign("index.html"); 

                } else {
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
                if (loginMessage) {
                    loginMessage.textContent = "An error occurred during login. Please try again.";
                    loginMessage.style.color = "red";
                }
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = "Login";
                }
            }
        });
    }

    // --- Logout functionality ---
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