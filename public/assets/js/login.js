document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js: DOMContentLoaded - Script started.");

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");
    
    const loginForm = document.getElementById("loginForm"); 
    const emailInput = document.getElementById("loginEmail"); 
    const passwordInput = document.getElementById("loginPassword"); 
    const loginMessage = document.getElementById("loginMessage"); 

    console.log("login.js: Elements selected:", { loginBtn, logoutBtn, registerBlock, loginForm, emailInput, passwordInput, loginMessage });

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    console.log("login.js: localStorage initial state - isLoggedIn:", isLoggedIn, "userName:", userName, "userEmail:", userEmail);

    if (isLoggedIn === "true") {
        console.log("login.js: User is logged in. Hiding login, showing logout.");
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none";
        
        const userNameDisplay = document.getElementById("userName");
        const userEmailDisplay = document.getElementById("userEmail");
        console.log("login.js: Display elements for user info (if on this page):", { userNameDisplay, userEmailDisplay });
        if (userNameDisplay) userNameDisplay.textContent = userName;
        if (userEmailDisplay) userEmailDisplay.textContent = userEmail;

    } else {
        console.log("login.js: User is NOT logged in. Showing login, hiding logout.");
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block";
    }

    if (loginForm) {
        console.log("login.js: Login form found. Attaching submit listener.");
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); 
            console.log("login.js: Login form submitted.");

            const email = emailInput.value;
            const password = passwordInput.value;
            console.log("login.js: Attempting login with email:", email);

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
                    localStorage.setItem("userName", data.user.full_name); 
                    localStorage.setItem("userEmail", data.user.email); 
                    console.log("login.js: Stored in localStorage - isLoggedIn: true, token: (hidden), userName:", data.user.full_name, "userEmail:", data.user.email);

                    if (loginMessage) {
                        loginMessage.textContent = data.message;
                        loginMessage.style.color = "green";
                    }
                    console.log("login.js: Redirecting to dashboard.html");
                    window.location.href = "dashboard.html"; 
                } else {
                    console.error("login.js: Login failed:", data.message);
                    if (loginMessage) {
                        loginMessage.textContent = data.message || "Login failed.";
                        loginMessage.style.color = "red";
                    }
                }
            } catch (error) {
                console.error("login.js: Network or server error during login:", error);
                if (loginMessage) {
                    loginMessage.textContent = "An error occurred during login.";
                    loginMessage.style.color = "red";
                }
            }
        });
    } else {
        console.log("login.js: Login form (id='loginForm') not found on this page.");
    }

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