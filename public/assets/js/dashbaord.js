document.addEventListener("DOMContentLoaded", () => {
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");
    const avatarImg = document.querySelector(".user-infor .avatar img");
    const uploadImg = document.querySelector(".upload_img");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    let userToken = localStorage.getItem("token");

    // Adjust this to your Vercel serverless function endpoint
    const API_BASE_URL = window.location.origin + '/api';

    // Global store for fetched user and order data
    let currentUserData = { user: null, orders: [] };

    // --- Initialization & Authentication Check ---
    async function initializeUserDashboard() {
        if (!isLoggedIn || isLoggedIn !== "true" || !userToken) {
            console.log("Not logged in or missing token, redirecting to login.html");
            localStorage.clear(); // Ensure clean state
            window.location.href = "login.html";
            return;
        }

        // Display cached info immediately (if available)
        // These will be updated with fresh data from fetchDashboardData
        if (userNameDisplay) userNameDisplay.textContent = localStorage.getItem("userName") || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = localStorage.getItem("userEmail") || "No Email";

        // Fetch all necessary data for the dashboard
        await fetchDashboardData();
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

                // Use the globally stored data to populate/display based on the active tab
                if (targetItem === "dashboard") {
                    updateDashboardOverview(currentUserData.orders);
                } else if (targetItem === "orders") {
                    // Get the currently active order tab status for initial display
                    const activeOrderTab = document.querySelector(".tab_order .menu-tab .tab-item.active");
                    const initialFilterStatus = activeOrderTab ? activeOrderTab.dataset.item : 'all';
                    displayOrders(currentUserData.orders, initialFilterStatus);
                } else if (targetItem === "setting") {
                    populateSettingsForm(currentUserData.user);
                }
                // 'address' tab would display its forms, no dynamic fetch needed on click if it's static forms
            }
        });
    });

    // --- Nested Tab Switching for Orders (All, Pending, Delivery, Completed, Canceled) ---
    const orderTabButtons = document.querySelectorAll(".tab_order .menu-tab .tab-item");
    orderTabButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Update indicator position
            const indicator = this.parentElement.querySelector('.indicator');
            if (indicator) { // Ensure indicator exists
                indicator.style.left = this.offsetLeft + 'px';
                indicator.style.width = this.offsetWidth + 'px';
            }

            // Remove active from all and add to clicked
            orderTabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const statusFilter = this.dataset.item; // 'all', 'pending', 'delivery', etc.
            displayOrders(currentUserData.orders, statusFilter); // Filter and display from global cache
        });
    });

    // Initialize indicator position for the default active order tab (usually 'all')
    const initialActiveOrderTab = document.querySelector(".tab_order .menu-tab .tab-item.active");
    if (initialActiveOrderTab) {
        const indicator = initialActiveOrderTab.parentElement.querySelector('.indicator');
        if (indicator) {
            indicator.style.left = initialActiveOrderTab.offsetLeft + 'px';
            indicator.style.width = initialActiveOrderTab.offsetWidth + 'px';
        }
    }


    // --- Toggle Address Forms (Billing/Shipping) ---
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
    const billingIcon = billingBtn ? billingBtn.querySelector(".ic_down") : null;
    if (billingBtn && billingForm && billingIcon) {
        billingBtn.classList.add("active");
        billingForm.classList.add("active");
        billingIcon.classList.add("rotate-180");
    }

    // --- API Functions & Data Management ---

    /**
     * Fetches combined user profile and orders from the API's dashboard endpoint.
     */
    async function fetchDashboardData() {
        if (!userToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/dashboard`, { // Consolidated endpoint
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log("Dashboard Data:", data);
                currentUserData.user = data.user;
                currentUserData.orders = data.orders;

                // Update local storage and UI for basic info
                const { first_name, last_name, email, avatar_url } = data.user;
                const fullName = `${first_name || ''} ${last_name || ''}`.trim();
                localStorage.setItem("userName", fullName);
                localStorage.setItem("userEmail", email);

                if (userNameDisplay) userNameDisplay.textContent = fullName;
                if (userEmailDisplay) userEmailDisplay.textContent = email;
                if (avatarImg && avatar_url) avatarImg.src = avatar_url;
                if (uploadImg && avatar_url) uploadImg.src = avatar_url;

                // Populate settings form (assuming initial tab might be settings or user might go there)
                populateSettingsForm(data.user);

                // Update dashboard overview and display orders for the currently active order tab
                updateDashboardOverview(data.orders);
                const activeOrderTab = document.querySelector(".tab_order .menu-tab .tab-item.active");
                const initialFilterStatus = activeOrderTab ? activeOrderTab.dataset.item : 'all';
                displayOrders(data.orders, initialFilterStatus);

            } else {
                console.error("Failed to fetch dashboard data:", data.message);
                if (response.status === 401) {
                    alert("Session expired or unauthorized. Please log in again.");
                    localStorage.clear();
                    window.location.href = "login.html";
                } else {
                    alert(`Failed to fetch dashboard data: ${data.message || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            alert("An error occurred while fetching your dashboard data.");
        }
    }

    /**
     * Populates the settings form fields with user data.
     * @param {object} user - User data object from the API.
     */
    function populateSettingsForm(user) {
        if (!user) return; // Guard against null user data
        document.getElementById("firstName").value = user.first_name || '';
        document.getElementById("lastName").value = user.last_name || '';
        document.getElementById("phoneNumber").value = user.phone_number || '';
        document.getElementById("email").value = user.email || '';
        document.getElementById("birth").value = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
        if (user.gender) {
            document.getElementById("gender").value = user.gender;
        }
        if (user.avatar_url && uploadImg) {
            uploadImg.src = user.avatar_url;
        }
    }

    /**
     * Updates the dashboard overview section with aggregated order data.
     * @param {Array} orders - An array of user's orders.
     */
    function updateDashboardOverview(orders) {
        if (!orders) orders = []; // Ensure orders is an array

        const awaitingPickupCount = orders.filter(order =>
            ['pending', 'confirmed', 'shipped', 'out for delivery'].includes((order.delivery_status || '').toLowerCase())
        ).length;
        const cancelledOrdersCount = orders.filter(order =>
            (order.delivery_status || '').toLowerCase() === 'cancelled'
        ).length;
        const totalOrdersCount = orders.length;

        // Update counts in the overview items
        document.querySelector(".overview-item:nth-child(1) .heading5").textContent = awaitingPickupCount.toString();
        document.querySelector(".overview-item:nth-child(2) .heading5").textContent = cancelledOrdersCount.toString();
        document.querySelector(".overview-item:nth-child(3) .heading5").textContent = totalOrdersCount.toString();

        // Populate recent orders on dashboard
        const recentOrdersTableBody = document.querySelector(".recent_order tbody");
        if (recentOrdersTableBody) {
            recentOrdersTableBody.innerHTML = ''; // Clear existing
            const recentOrders = orders.slice(0, 5); // Take up to 5 recent orders

            if (recentOrders.length === 0) {
                recentOrdersTableBody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-secondary">No recent orders found.</td></tr>`;
            } else {
                recentOrders.forEach(order => {
                    const firstProduct = order.products && order.products.length > 0 ? order.products[0] : null;
                    const statusTag = getStatusTag(order.delivery_status);

                    const row = `
                        <tr class="item duration-300">
                            <th scope="row" class="py-3 text-left">
                                <strong class="text-title">#${order.order_number || order._id}</strong>
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
    }

    /**
     * Generates an HTML status tag based on the order status.
     * @param {string} status - The delivery or payment status of the order.
     * @returns {string} - HTML string for the status tag.
     */
    function getStatusTag(status) {
        let className = "";
        let displayText = status;

        switch ((status || '').toLowerCase()) {
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
            case 'completed':
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

    /**
     * Displays a list of orders, filtered by status.
     * @param {Array} orders - The full list of orders.
     * @param {string} filterStatus - The status to filter by ('all', 'pending', 'delivery', etc.).
     */
    function displayOrders(orders, filterStatus = 'all') {
        const listOrderDiv = document.querySelector(".tab_order .list_order");
        if (!listOrderDiv) {
            console.error("Order list div not found.");
            return;
        }
        listOrderDiv.innerHTML = ''; // Clear previous orders

        let filteredOrders = orders;
        if (filterStatus !== 'all') {
            filteredOrders = orders.filter(order => {
                const orderStatusLower = (order.delivery_status || '').toLowerCase();
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
            const productsHtml = (order.products || []).map(product => `
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

            const statusTag = getStatusTag(order.delivery_status);

            const orderCard = `
                <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs">
                    <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order Number:</strong>
                            <strong class="order_number text-button uppercase">#${order.order_number || order._id}</strong>
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
                        <button class="button-main btn_order_detail" data-order-id="${order._id}">Order Details</button>
                        ${(order.delivery_status === 'pending' || order.delivery_status === 'confirmed') ? // Only allow cancel if pending or confirmed
                        `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white btn_cancel_order" data-order-id="${order._id}">Cancel Order</button>`
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

        // Add event listeners for "Order Details" buttons
        document.querySelectorAll(".btn_order_detail").forEach(button => {
            button.addEventListener("click", function() {
                const orderId = this.dataset.orderId;
                window.location.href = `order-details.html?id=${orderId}`; // Example redirection
            });
        });
    }

    /**
     * Handles the cancellation of an order.
     * @param {Event} event - The click event from the cancel button.
     */
    async function handleCancelOrder(event) {
        const orderId = event.target.dataset.orderId;
        if (!confirm(`Are you sure you want to cancel order ID: ${orderId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/delivery-status`, { // Use delivery-status endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ delivery_status: 'cancelled' }) // Send the new status
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(data.message);
                fetchDashboardData(); // Re-fetch all dashboard data to update the list and overview
            } else {
                console.error("Failed to cancel order:", data.error || data.message);
                alert(`Failed to cancel order: ${data.message || data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error canceling order:", error);
            alert("An error occurred while trying to cancel the order.");
        }
    }

    // --- Form Submissions (Profile and Password) ---

    // Update Profile Form (inside settings tab)
    const profileUpdateForm = document.querySelector('.filter-item[data-item="setting"] form');
    if (profileUpdateForm) {
        profileUpdateForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default form submission

            const firstName = document.getElementById("firstName").value;
            const lastName = document.getElementById("lastName").value;
            const phoneNumber = document.getElementById("phoneNumber").value;
            const email = document.getElementById("email").value; // User might change email
            const dob = document.getElementById("birth").value; // YYYY-MM-DD
            const gender = document.getElementById("gender").value;
            const uploadImageInput = document.getElementById("uploadImage");
            const avatarFile = uploadImageInput ? uploadImageInput.files[0] : null;

            if (!userToken) {
                alert("You are not logged in.");
                return;
            }

            const formData = new FormData();
            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
            formData.append('phone_number', phoneNumber);
            formData.append('email', email); // Send email even if not changed to simplify backend
            formData.append('dob', dob);
            formData.append('gender', gender);
            if (avatarFile) {
                formData.append('avatar', avatarFile); // 'avatar' should match your backend's expected field name
            }

            try {
                // Now hitting /api/user/dashboard for PUT for profile updates
                const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
                    method: 'PUT',
                    headers: {
                        // When sending FormData, DO NOT set 'Content-Type': 'application/json'
                        // The browser will set it automatically with the correct boundary.
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: formData // Send FormData directly
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert(data.message);
                    // Re-fetch all dashboard data to ensure UI is fully updated, especially if email changed
                    await fetchDashboardData();
                } else {
                    console.error("Failed to update profile:", data.message);
                    alert(`Failed to update profile: ${data.message}`);
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("An error occurred while updating your profile.");
            }
        });
    }

    // Change Password Form (part of the settings tab)
    // Make sure your HTML button for changing password has id="changePasswordButton"
    const changePasswordButton = document.getElementById("changePasswordButton");
    if (changePasswordButton) { // This check prevents the 'null' error
        changePasswordButton.addEventListener('click', async function(event) {
            event.preventDefault(); // Prevent default form submission if this button is inside a form

            const currentPasswordInput = document.getElementById("password");
            const newPasswordInput = document.getElementById("newPassword");
            const confirmNewPasswordInput = document.getElementById("confirmPassword");

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            // Only proceed with password change if new password fields are populated
            if (newPassword && confirmNewPassword) {
                if (newPassword !== confirmNewPassword) {
                    alert("New password and confirm password do not match.");
                    return;
                }
                if (newPassword.length < 6) { // Basic validation
                    alert("New password must be at least 6 characters long.");
                    return;
                }
                if (!currentPassword) {
                    alert("Current password is required to change password.");
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/user/password`, {
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

                    if (response.ok && data.success) {
                        alert(data.message);
                        // Clear password fields on success
                        currentPasswordInput.value = '';
                        newPasswordInput.value = '';
                        confirmNewPasswordInput.value = '';
                    } else {
                        console.error("Failed to change password:", data.message);
                        alert(`Failed to change password: ${data.message}`);
                    }
                } catch (error) {
                    console.error("Error changing password:", error);
                    alert("An error occurred while changing your password.");
                }
            } else {
                alert("Please enter new password and confirm new password to change your password.");
            }
        });
    }

    // Update Address Form (placeholder)
    const addressForm = document.querySelector('.tab_address form');
    if (addressForm) {
        addressForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            alert("Address update functionality is not fully implemented in this example yet. Data would be sent to an API endpoint here.");
            // Your address update logic would go here.
        });
    }

    // --- Logout Functionality ---
    const logoutLink = document.querySelector("a[href='login.html'].category-item");
    if (logoutLink) {
        logoutLink.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.clear(); // Clear all user data from local storage
            alert("You have been logged out.");
            window.location.href = "login.html"; // Redirect to login page
        });
    }

    // --- Initialize Dashboard on Load ---
    initializeUserDashboard();
});