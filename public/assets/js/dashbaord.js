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

        // Fetch orders from the API
        fetch("shubhakuteer.in/api/orders")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(orders => {
                console.log("All orders fetched from API:", orders);

                // Filter orders for the current user's email
                const userOrders = orders.filter(order => order.email === storedUserEmail);
                console.log("Filtered orders for the current user:", userOrders);

                if (userOrdersDisplay) {
                    if (userOrders.length > 0) {
                        // Display the filtered orders
                        userOrdersDisplay.innerHTML = "<h3>Your Orders:</h3>";
                        userOrders.forEach(order => {
                            userOrdersDisplay.innerHTML += `
                                <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                                    <p><strong>Order ID:</strong> ${order.id}</p>
                                    <p><strong>Product:</strong> ${order.productName}</p>
                                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                                    <p><strong>Total:</strong> $${order.totalAmount}</p>
                                    <p><strong>Status:</strong> ${order.status}</p>
                                </div>
                            `;
                        });
                    } else {
                        userOrdersDisplay.textContent = "No orders found for this user.";
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching orders:", error);
                if (userOrdersDisplay) {
                    userOrdersDisplay.textContent = "Failed to load orders. Please try again later.";
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