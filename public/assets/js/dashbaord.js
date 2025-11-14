document.addEventListener("DOMContentLoaded", () => {
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");
    const userOrdersDisplay = document.getElementById("userOrders"); // Assuming you have an element to display orders

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName");
    const storedUserEmail = localStorage.getItem("userEmail");

    if (isLoggedIn === "true" && storedUserEmail) {
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";

        console.log("User is logged in.");
        console.log("Stored User Name:", storedUserName);
        console.log("Stored User Email:", storedUserEmail);

        // **IMPORTANT:** Ensure the URL includes the protocol (https://) and domain
        // Replace 'YOUR_BACKEND_DOMAIN' with the actual domain if different from shubhakuteer.in
        const apiOrdersUrl = "https://shubhakuteer.in/api/orders"; // Corrected URL with protocol

        // Fetch orders from the API
        fetch(apiOrdersUrl)
            .then(response => {
                if (!response.ok) {
                    // If the response is not OK (e.g., 404, 500), throw an error
                    return response.json().then(err => { throw new Error(`HTTP error! status: ${response.status} - ${err.error || response.statusText}`); });
                }
                return response.json(); // Parse the JSON response body
            })
            .then(data => {
                // The backend code returns an object with a 'success' flag and an 'orders' array
                if (data.success && Array.isArray(data.orders)) {
                    const allOrders = data.orders;
                    console.log("All orders fetched from API (full response data):", data);
                    console.log("Extracted 'orders' array:", allOrders);

                    // Filter orders for the current user's email
                    const userOrders = allOrders.filter(order => order.email === storedUserEmail);
                    console.log("Filtered orders for the current user:", userOrders);

                    // --- Console Log for Matching Orders ---
                    if (userOrders.length > 0) {
                        console.log("\n--- Matched Orders for User:", storedUserEmail, "---");
                        userOrders.forEach((order, index) => {
                            console.log(`\nOrder #${index + 1} (ID: ${order.id}):`);
                            console.log("  First Name:", order.first_name);
                            console.log("  Last Name:", order.last_name);
                            console.log("  Email:", order.email);
                            console.log("  Phone Number:", order.phone_number);
                            console.log("  Amount:", order.amount);
                            console.log("  Status:", order.status);
                            console.log("  Delivery Status:", order.delivery_status);
                            console.log("  Products:", order.products); // Will show the parsed array of products
                            console.log("  Created At:", order.created_at);
                            // Add any other relevant order details you want to log
                        });
                        console.log("------------------------------------------");

                        // --- Display logic for matched orders (same as before) ---
                        if (userOrdersDisplay) {
                            userOrdersDisplay.innerHTML = "<h3>Your Orders:</h3>";
                            userOrders.forEach(order => {
                                // You can customize the display here to show more details
                                userOrdersDisplay.innerHTML += `
                                    <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                                        <p><strong>Order ID:</strong> ${order.id}</p>
                                        <p><strong>Product Count:</strong> ${order.products ? order.products.length : 0}</p>
                                        <p><strong>Total Amount:</strong> $${order.amount}</p>
                                        <p><strong>Status:</strong> ${order.status}</p>
                                        <p><strong>Delivery Status:</strong> ${order.delivery_status}</p>
                                        ${order.products && order.products.length > 0 ? `
                                            <p><strong>Items:</strong></p>
                                            <ul>
                                                ${order.products.map(p => `<li>${p.name} (Qty: ${p.quantity}, Price: $${p.price})</li>`).join('')}
                                            </ul>
                                        ` : '<p>No product details available.</p>'}
                                    </div>
                                `;
                            });
                        }
                    } else {
                        if (userOrdersDisplay) {
                            userOrdersDisplay.textContent = "No orders found for this user.";
                        }
                        console.log("No orders found for the current user:", storedUserEmail);
                    }
                } else {
                    console.error("API response format error: 'success' flag is false or 'orders' is not an array.", data);
                    if (userOrdersDisplay) {
                        userOrdersDisplay.textContent = "Failed to process orders from the server.";
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching or processing orders:", error);
                if (userOrdersDisplay) {
                    userOrdersDisplay.textContent = `Failed to load orders: ${error.message}. Please try again later.`;
                }
            });

    } else {
        // Clear display if not logged in or email not available
        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";
        if (userOrdersDisplay) userOrdersDisplay.textContent = "Please log in to view your orders.";
        console.log("User is not logged in or email is not available in localStorage.");
    }
});