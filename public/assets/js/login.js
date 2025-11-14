// login.js
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");

    // -------------------------
    // RESTORE LOGIN UI
    // -------------------------
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

    // -------------------------
    // FRONTEND LOGIN FUNCTION
    // -------------------------
    window.loginUserFrontend = async function (email, password) {
        try {
            console.log("📩 Sending login request…");

            const res = await fetch("https://shubhakuteer.in/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            console.log("🔵 Raw Login API Response:", data);

            // ⚠️ SAFELY READ USER FIELDS REGARDLESS OF API FORMAT
            const u = data.user || data.data || data.userData || data.profile || {};

            const userData = {
                firstName: u.first_name || u.fname || u.name?.split(" ")[0] || "",
                lastName: u.last_name || u.lname || u.name?.split(" ")[1] || "",
                email: u.email || data.email || "",
                id: u.id || u.user_id || data.id || ""
            };

            // -------------------------
            // SAVE TO LOCAL STORAGE
            // -------------------------
            localStorage.setItem("isLoggedIn", "true");
            if (data.token) localStorage.setItem("token", data.token);
            localStorage.setItem("userData", JSON.stringify(userData));

            console.log("💾 SAVED userData:", userData);

            window.location.href = "dashboard.html";

        } catch (err) {
            console.error("🔥 Login error:", err);
            alert("Login failed. Please try again.");
        }
    };

    // -------------------------
    // LOGOUT
    // -------------------------
    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        localStorage.removeItem("userData");

        window.location.href = "index.html";
    });
});
