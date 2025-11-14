document.addEventListener("DOMContentLoaded", () => {

    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName"); 
    const storedUserEmail = localStorage.getItem("userEmail"); 

    // This part remains to display user info on the dashboard page
    // assuming login.js also updates it.
    if (isLoggedIn === "true") {
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";
    } else {
        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";
    }
});