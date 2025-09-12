
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerBlock = document.getElementById("registerBlock");

    // Check login state
    const user = localStorage.getItem("isLoggedIn"); // or "user" if you store JSON

    if (user === "true") {
        // Logged in
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
        if (registerBlock) registerBlock.style.display = "none"; // hide register
    } else {
        // Not logged in
        loginBtn.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
        if (registerBlock) registerBlock.style.display = "block"; // show register
    }

    // Logout functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "index.html"; // redirect to homepage
    });
});