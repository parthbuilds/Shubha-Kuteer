// document.addEventListener("DOMContentLoaded", () => {

//     const userNameDisplay = document.getElementById("userName");
//     const userEmailDisplay = document.getElementById("userEmail");

//     const isLoggedIn = localStorage.getItem("isLoggedIn");
//     const storedUserName = localStorage.getItem("userName"); 
//     const storedUserEmail = localStorage.getItem("userEmail"); 

//     // This part remains to display user info on the dashboard page
//     // assuming login.js also updates it.
//     if (isLoggedIn === "true") {
//         if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
//         if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";
//     } else {
//         if (userNameDisplay) userNameDisplay.textContent = "";
//         if (userEmailDisplay) userEmailDisplay.textContent = "";
//     }
// });

document.addEventListener("DOMContentLoaded", () => {
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    let storedUserName = localStorage.getItem("userName");
    let storedUserEmail = localStorage.getItem("userEmail");
    let userToken = localStorage.getItem("token"); // Assuming your JWT is stored as 'token'

    const API_BASE_URL = window.location.origin; // Adjust if your API is on a different origin

    // --- Initial User Info Display ---
    if (isLoggedIn === "true" && userToken) {
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";
        fetchUserProfile();
        fetchUserOrders();
    } else {
        // Redirect to login if not logged in
        console.log("Not logged in, redirecting to login.html");
        window.location.href = "login.html";
    }

    // --- Tab Switching Logic ---
    const menuTabs = document.querySelectorAll(".menu-tab .category-item");
    const filterItems = document.querySelectorAll(".list-filter .filter-item");

    menuTabs.forEach(tab => {
        tab.addEventListener("click", function(event) {
            event.preventDefault();

            // Remove 'active' from all tabs and filter items
            menuTabs.forEach(t => t.classList.remove("active"));
            filterItems.forEach(item => item.classList.remove("active"));

            // Add 'active' to the clicked tab
            this.classList.add("active");

            // Find and activate the corresponding filter item
            const targetItem = this.dataset.item;
            const activeFilterItem = document.querySelector(`.list-filter .filter-item[data-item="${targetItem}"]`);
            if (activeFilterItem) {
                activeFilterItem.classList.add("active");
                // If it's the orders tab, re-fetch orders to ensure up-to-date data
                if (targetItem === "orders") {
                    fetchUserOrders();
                } else if (targetItem === "dashboard") {
                    fetchDashboardStats();
                } else if (targetItem === "setting") {
                    fetchUserProfileForSettings(); // Refetch to populate the form
                }
            }
        });
    });

    // --- Nested Tab Switching for Orders (All, Pending, Delivery, Completed, Canceled) ---
    const orderTabButtons = document.querySelectorAll(".tab_order .menu-tab .tab-item");
    orderTabButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Update indicator
            const indicator = this.parentElement.querySelector('.indicator');
            indicator.style.left = this.offsetLeft + 'px';
            indicator.style.width = this.offsetWidth + 'px';

            // Remove active from all and add to clicked
            orderTabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const statusFilter = this.dataset.item; // 'all', 'pending', 'delivery', 'completed', 'canceled'
            displayOrders(currentOrdersData, statusFilter); // Filter and display
        });
    });

    // Initialize indicator position for the default active tab
    const initialActiveOrderTab = document.querySelector(".tab_order .menu-tab .tab-item.active");
    if (initialActiveOrderTab) {
        const indicator = initialActiveOrderTab.parentElement.querySelector('.indicator');
        indicator.style.left = initialActiveOrderTab.offsetLeft + 'px';
        indicator.style.width = initialActiveOrderTab.offsetWidth + 'px';
    }


    // --- Toggle Address Forms ---
    document.querySelectorAll(".tab_address .tab_btn").forEach(button => {
        button.addEventListener("click", function() {
            const target = this.dataset.item;
            const form = document.querySelector(`.form_address[data-item="${target}"]`);
            const icon = this.querySelector(".ic_down");

            this.classList.toggle("active");
            form.classList.toggle("active");
            icon.classList.toggle("rotate-180");
        });
    });

    // Set initial state for billing address to be open
    const billingBtn = document.querySelector(".tab_address .tab_btn[data-item='billing']");
    const billingForm = document.querySelector(".form_address[data-item='billing']");
    const billingIcon = billingBtn.querySelector(".ic_down");
    if (billingBtn && billingForm && billingIcon) {
        billingBtn.classList.add("active");
        billingForm.classList.add("active");
        billingIcon.classList.add("rotate-180");
    }

    // --- API Functions ---

    let currentOrdersData = []; // To store all fetched orders for filtering

    async function fetchUserProfile() {
        if (!userToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log("User Profile Data:", data.user);
                storedUserName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim();
                storedUserEmail = data.user.email;
                localStorage.setItem("userName", storedUserName);
                localStorage.setItem("userEmail", storedUserEmail);

                if (userNameDisplay) userNameDisplay.textContent = storedUserName;
                if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail;

                populateSettingsForm(data.user);
            } else {
                console.error("Failed to fetch user profile:", data.message);
                // Handle token expiration or unauthorized access
                if (response.status === 401) {
                    alert("Session expired or unauthorized. Please log in again.");
                    localStorage.clear();
                    window.location.href = "login.html";
                }
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            alert("An error occurred while fetching your profile.");
        }
    }

    async function fetchUserProfileForSettings() {
        // This function is similar to fetchUserProfile but specifically for the settings tab.
        // It prevents unnecessary re-rendering of other parts and ensures the form is fresh.
        if (!userToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                populateSettingsForm(data.user);
            } else {
                console.error("Failed to fetch user profile for settings:", data.message);
                if (response.status === 401) {
                    alert("Session expired or unauthorized. Please log in again.");
                    localStorage.clear();
                    window.location.href = "login.html";
                }
            }
        } catch (error) {
            console.error("Error fetching user profile for settings:", error);
        }
    }

    function populateSettingsForm(user) {
        document.getElementById("firstName").value = user.first_name || '';
        document.getElementById("lastName").value = user.last_name || '';
        document.getElementById("phoneNumber").value = user.phone_number || '';
        document.getElementById("email").value = user.email || '';
        document.getElementById("birth").value = user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''; // Format date
        if (user.gender) {
            document.getElementById("gender").value = user.gender;
        }
        // Avatar image update (if you have an avatar_url in your user data)
        // const avatarImg = document.querySelector(".upload_img");
        // if (user.avatar_url && avatarImg) {
        //     avatarImg.src = user.avatar_url;
        // }
    }

    async function fetchUserOrders() {
        if (!userToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, { // Using the profile endpoint that also returns orders
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log("User Orders Data:", data.orders);
                currentOrdersData = data.orders; // Store for filtering
                displayOrders(currentOrdersData, 'all'); // Display all orders initially
                updateDashboardOverview(currentOrdersData);
            } else {
                console.error("Failed to fetch user orders:", data.message);
                if (response.status === 401) {
                    alert("Session expired or unauthorized. Please log in again.");
                    localStorage.clear();
                    window.location.href = "login.html";
                }
            }
        } catch (error) {
            console.error("Error fetching user orders:", error);
            alert("An error occurred while fetching your order history.");
        }
    }

    function updateDashboardOverview(orders) {
        const awaitingPickupCount = orders.filter(order => order.delivery_status === 'pending' || order.delivery_status === 'confirmed' || order.delivery_status === 'shipped').length;
        const cancelledOrdersCount = orders.filter(order => order.delivery_status === 'cancelled').length;
        const totalOrdersCount = orders.length;

        document.querySelector(".overview-item:nth-child(1) .heading5").textContent = awaitingPickupCount.toString();
        document.querySelector(".overview-item:nth-child(2) .heading5").textContent = cancelledOrdersCount.toString();
        document.querySelector(".overview-item:nth-child(3) .heading5").textContent = totalOrdersCount.toString();

        // Populate recent orders on dashboard
        const recentOrdersTableBody = document.querySelector(".recent_order tbody");
        recentOrdersTableBody.innerHTML = ''; // Clear existing
        const recentOrders = orders.slice(0, 5); // Take up to 5 recent orders

        if (recentOrders.length === 0) {
            recentOrdersTableBody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-secondary">No recent orders found.</td></tr>`;
        } else {
            recentOrders.forEach(order => {
                // Assuming products array is present and each product has a name, price, and image
                const firstProduct = order.products && order.products.length > 0 ? order.products[0] : null;
                const statusTag = getStatusTag(order.delivery_status || order.status);

                const row = `
                    <tr class="item duration-300">
                        <th scope="row" class="py-3 text-left">
                            <strong class="text-title">#${order.id}</strong>
                        </th>
                        <td class="py-3">
                            ${firstProduct ? `
                                <a href="product-default.html" class="product flex items-center gap-3">
                                    <img src="${firstProduct.main_image || '/assets/images/product/productDefault.png'}"
                                        alt="${firstProduct.name}" class="flex-shrink-0 w-12 h-12 rounded" />
                                    <div class="info flex flex-col">
                                        <strong class="product_name text-button">${firstProduct.name}</strong>
                                        <span class="product_tag caption1 text-secondary">${firstProduct.category || 'N/A'}</span>
                                    </div>
                                </a>
                            ` : 'N/A'}
                        </td>
                        <td class="py-3 price">₹${parseFloat(order.amount).toFixed(2)}</td>
                        <td class="py-3 text-right">
                            ${statusTag}
                        </td>
                    </tr>
                `;
                recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
            });
        }
    }

    function getStatusTag(status) {
        let className = "";
        let displayText = status;

        switch (status.toLowerCase()) {
            case 'pending':
                className = "bg-yellow text-yellow";
                displayText = "Pending";
                break;
            case 'confirmed':
                className = "bg-blue-500 text-blue-500";
                displayText = "Confirmed";
                break;
            case 'shipped':
                className = "bg-indigo-500 text-indigo-500";
                displayText = "Shipped";
                break;
            case 'out for delivery':
                className = "bg-purple text-purple";
                displayText = "Out for Delivery";
                break;
            case 'delivered':
            case 'completed': // Assuming completed means delivered for delivery status
                className = "bg-green text-green";
                displayText = "Delivered";
                break;
            case 'cancelled':
                className = "bg-red text-red";
                displayText = "Canceled";
                break;
            default:
                className = "bg-gray-500 text-gray-500";
                displayText = "Unknown";
                break;
        }
        return `<span class="tag px-4 py-1.5 rounded-full bg-opacity-10 ${className} caption1 font-semibold">${displayText}</span>`;
    }

    function displayOrders(orders, filterStatus = 'all') {
        const listOrderDiv = document.querySelector(".tab_order .list_order");
        listOrderDiv.innerHTML = ''; // Clear previous orders

        let filteredOrders = orders;
        if (filterStatus !== 'all') {
            // Normalize status for filtering (e.g., 'delivery' should match 'shipped' or 'out for delivery')
            filteredOrders = orders.filter(order => {
                const orderStatusLower = (order.delivery_status || order.status || '').toLowerCase();
                if (filterStatus === 'delivery') {
                    return orderStatusLower === 'shipped' || orderStatusLower === 'out for delivery';
                }
                return orderStatusLower === filterStatus;
            });
        }

        if (filteredOrders.length === 0) {
            listOrderDiv.innerHTML = `<p class="text-center text-secondary py-5">No ${filterStatus === 'all' ? '' : filterStatus} orders found.</p>`;
            return;
        }

        filteredOrders.forEach(order => {
            const productsHtml = order.products.map(product => `
                <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                    <a href="product-default.html" class="flex items-center gap-5">
                        <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                            <img src="${product.main_image || '/assets/images/product/productDefault.png'}"
                                alt="${product.name}" class="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div class="prd_name text-title">${product.name}</div>
                            <div class="caption1 text-secondary mt-2">
                                ${product.sizes && product.sizes.length > 0 ? `<span class="prd_size uppercase">${product.sizes.join(', ')}</span>` : ''}
                                ${product.variations && Object.keys(product.variations).length > 0 ? `
                                    <span>/</span>
                                    <span class="prd_color capitalize">${Object.values(product.variations).flat().join(', ')}</span>
                                ` : ''}
                            </div>
                        </div>
                    </a>
                    <div class="text-title">
                        <span class="prd_quantity">${product.quantity}</span>
                        <span> X </span>
                        <span class="prd_price">₹${parseFloat(product.price).toFixed(2)}</span>
                    </div>
                </div>
            `).join('');

            const statusTag = getStatusTag(order.delivery_status || order.status);

            const orderCard = `
                <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs">
                    <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order Number:</strong>
                            <strong class="order_number text-button uppercase">#${order.id}</strong>
                        </div>
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order status:</strong>
                            ${statusTag}
                        </div>
                    </div>
                    <div class="list_prd px-5">
                        ${productsHtml}
                    </div>
                    <div class="flex flex-wrap gap-4 p-5">
                        <button class="button-main btn_order_detail" data-order-id="${order.id}">Order Details</button>
                        ${(order.delivery_status === 'pending' || order.delivery_status === 'confirmed') ? // Only allow cancel if pending or confirmed
                        `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white btn_cancel_order" data-order-id="${order.id}">Cancel Order</button>`
                        : ''}
                    </div>
                </div>
            `;
            listOrderDiv.insertAdjacentHTML('beforeend', orderCard);
        });

        // Add event listeners for new "Cancel Order" buttons
        document.querySelectorAll(".btn_cancel_order").forEach(button => {
            button.addEventListener("click", handleCancelOrder);
        });

        // Add event listeners for "Order Details" buttons (if you have a dedicated order details page or modal)
        document.querySelectorAll(".btn_order_detail").forEach(button => {
            button.addEventListener("click", function() {
                const orderId = this.dataset.orderId;
                alert(`Viewing details for Order ID: ${orderId}`);
                // Implement redirection or modal display for order details here
                // Example: window.location.href = `order-details.html?id=${orderId}`;
            });
        });
    }

    async function handleCancelOrder(event) {
        const orderId = event.target.dataset.orderId;
        if (!confirm(`Are you sure you want to cancel order #${orderId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` // Assuming user token is needed for this operation
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                fetchUserOrders(); // Re-fetch orders to update the list
            } else {
                console.error("Failed to cancel order:", data.error);
                alert(`Failed to cancel order: ${data.message || data.error}`);
            }
        } catch (error) {
            console.error("Error canceling order:", error);
            alert("An error occurred while trying to cancel the order.");
        }
    }

    // --- Form Submissions ---

    // Update Profile Form
    document.querySelector('.filter-item[data-item="setting"] form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const phoneNumber = document.getElementById("phoneNumber").value;
        const email = document.getElementById("email").value;
        const dob = document.getElementById("birth").value; // YYYY-MM-DD
        const gender = document.getElementById("gender").value;

        if (!userToken) {
            alert("You are not logged in.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ first_name: firstName, last_name: lastName, phone_number: phoneNumber, email, dob, gender })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // Update local storage and UI elements immediately
                localStorage.setItem("userName", `${firstName} ${lastName}`);
                localStorage.setItem("userEmail", email);
                if (userNameDisplay) userNameDisplay.textContent = `${firstName} ${lastName}`;
                if (userEmailDisplay) userEmailDisplay.textContent = email;
            } else {
                console.error("Failed to update profile:", data.message);
                alert(`Failed to update profile: ${data.message}`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("An error occurred while updating your profile.");
        }
    });

    // Change Password Form (inside settings)
    const changePasswordForm = document.querySelector('.filter-item[data-item="setting"] form');
    if (changePasswordForm) {
        changePasswordForm.querySelector('button[type="submit"]').addEventListener('click', async function(event) {
            // We need to differentiate between profile update and password change
            // This example assumes the password fields are part of the main settings form.
            // A more robust solution might have separate forms or clear button handlers.
            // For now, let's add a specific handler for password change if the button is clicked.

            // Only proceed if this click is specifically for password change
            // (assuming a separate button or a check for password fields changed)
            // This is a simplified example. In a real app, you'd check which button was clicked
            // or if the password fields have content.

            const currentPassword = document.getElementById("password").value;
            const newPassword = document.getElementById("newPassword").value;
            const confirmNewPassword = document.getElementById("confirmPassword").value;

            if (!currentPassword && !newPassword && !confirmNewPassword) {
                // If password fields are empty, assume user is trying to update general profile info
                // Let the main form submit handler take over
                return;
            }

            event.preventDefault(); // Prevent full form submission if we're handling password separately

            if (newPassword !== confirmNewPassword) {
                alert("New password and confirm password do not match.");
                return;
            }
            if (newPassword.length < 6) { // Basic validation
                alert("New password must be at least 6 characters long.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/user/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_new_password: confirmNewPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    // Clear password fields on success
                    document.getElementById("password").value = '';
                    document.getElementById("newPassword").value = '';
                    document.getElementById("confirmPassword").value = '';
                } else {
                    console.error("Failed to change password:", data.message);
                    alert(`Failed to change password: ${data.message}`);
                }
            } catch (error) {
                console.error("Error changing password:", error);
                alert("An error occurred while changing your password.");
            }
        });
    }

    // Update Address Form
    document.querySelector('.tab_address form').addEventListener('submit', async function(event) {
        event.preventDefault();
        alert("Address update functionality is not fully implemented in this example yet. Data would be sent to an API endpoint here.");
        // You would typically have a /api/user/address endpoint for this.
        // Example:
        /*
        const billingFirstName = document.getElementById("billingFirstName").value;
        // ... get all other address fields

        if (!userToken) {
            alert("You are not logged in.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/address`, { // You need to create this endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    type: 'billing',
                    firstName: billingFirstName,
                    // ... other address data
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
            } else {
                alert(`Failed to update address: ${data.message}`);
            }
        } catch (error) {
            console.error("Error updating address:", error);
            alert("An error occurred while updating your address.");
        }
        */
    });

    // --- Logout Functionality ---
    document.querySelector("a[href='login.html'].category-item").addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.clear(); // Clear all user data from local storage
        alert("You have been logged out.");
        window.location.href = "login.html"; // Redirect to login page
    });

    // Initial fetch for dashboard stats when the page loads or dashboard tab is active
    fetchDashboardStats();
    // Ensure initial display of orders
    fetchUserOrders();
});