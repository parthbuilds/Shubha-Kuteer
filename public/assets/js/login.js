// login.js

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");

    // Restore login UI
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
        loginBtn?.classList.add("hidden");
        logoutBtn?.classList.remove("hidden");
        registerBlock && (registerBlock.style.display = "none");
    } else {
        loginBtn?.classList.remove("hidden");
        logoutBtn?.classList.add("hidden");
        registerBlock && (registerBlock.style.display = "block");
    }

    // LOGIN BUTTON FUNCTIONALITY
    window.loginUserFrontend = async function (email, password) {
        try {
            console.log("📩 Sending login request…");

            const res = await fetch("https://shubhakuteer.in/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            console.log("🔵 Login API Response:", data);

            if (!data.token || !data.user) {
                alert("Login failed. Check credentials.");
                return;
            }

            // Store Login Data
            const userData = {
                firstName: data.user.first_name || "",
                lastName: data.user.last_name || "",
                email: data.user.email || "",
                id: data.user.id || ""
            };

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("token", data.token);
            localStorage.setItem("userData", JSON.stringify(userData));

            console.log("💾 Saved userData:", userData);

            // Redirect or update UI
            window.location.href = "dashboard.html";

        } catch (err) {
            console.error("🔥 Login error:", err);
        }
    };

    // Logout
    logoutBtn?.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
});
