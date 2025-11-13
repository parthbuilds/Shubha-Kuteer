document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const logoutBtnAnchor = document.querySelector('.menu-tab a.logout-btn');
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img'); // New selector for avatar in user-infor
    const uploadImgPreview = document.getElementById('uploadImgPreview'); // Selector for avatar preview in settings
    const dashboardContentDiv = document.getElementById('dashboard-content');

    // --- Utility function for API calls ---
    async function callApi(endpoint, method = 'GET', body = null) {
        const currentToken = localStorage.getItem('userToken');
        const headers = { 'Content-Type': 'application/json' };
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
        const config = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };
        try {
            const response = await fetch(endpoint, config);

            // Centralized 401 handling for ALL API calls
            if (response.status === 401) {
                console.warn('Authentication failed for API call. Redirecting to login.');
                alert('Session expired or invalid. Please log in again.');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return Promise.reject(new Error('Unauthorized')); // Reject the promise
            }

            // Attempt to parse JSON only if the response is not 204 No Content
            const data = (response.status !== 204) ? await response.json().catch(() => {
                console.error(`Failed to parse JSON for ${endpoint}. Status: ${response.status}`);
                return { message: `Server error (${response.status})` };
            }) : { message: 'Success', status: 204 }; // Handle 204 for successful deletions/updates without content

            if (!response.ok) {
                // If data.message is present, use it; otherwise, provide a generic error
                throw new Error(data.message || `API call to ${endpoint} failed with status ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`Network or fetch error for ${endpoint}:`, error);
            throw error;
        }
    }

    // --- Function to load and render dashboard content from API ---
    async function loadDashboardContent() {
        if (!dashboardContentDiv) {
            console.warn('Dashboard content div not found. Skipping content load.');
            return;
        }

        dashboardContentDiv.innerHTML = '<p>Loading your dashboard data...</p>';

        try {
            // Note: The original `loadDashboardContent` fetches `/api/dashboard-content`
            // and `loadAndRenderAllUserData` fetches individual endpoints.
            // For a single dashboard page, `loadAndRenderAllUserData` is more comprehensive.
            // This function here might be redundant if `loadAndRenderAllUserData` is used on dashboard.html
            // Let's adapt it to use individual calls for clarity, or deprecate if `loadAndRenderAllUserData` is sufficient.

            // Fetch general dashboard content (assuming it gives user data and a message)
            const dashboardMessageData = await callApi('/api/dashboard-message', 'GET'); // Example endpoint for a welcome message
            const userData = await callApi('/api/user/profile');
            const dashboardSummary = await callApi('/api/user/dashboard-summary');
            const recentOrders = await callApi('/api/orders/recent');

            if (userData && userData.user) {
                if (userDisplayName) userDisplayName.textContent = `${userData.user.first_name || ''} ${userData.user.last_name || ''}`.trim();
                if (userDisplayEmail) userDisplayEmail.textContent = userData.user.email || '';
                if (userAvatarImg) userAvatarImg.src = userData.user.avatar_url || '/assets/images/user-avatar.png';
            }

            dashboardContentDiv.innerHTML = `
                <h2>${dashboardMessageData.message || 'Welcome to your Dashboard!'}</h2>
                <p>Hello, ${userData.user.first_name || 'User'}!</p>
                <h3>Your Dashboard Overview:</h3>
                <div class="overview-grid grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div class="overview-item p-4 border rounded shadow-sm">
                        <h4>Awaiting Pickup</h4>
                        <h5>${dashboardSummary.awaitingPickup || 0}</h5>
                    </div>
                    <div class="overview-item p-4 border rounded shadow-sm">
                        <h4>Cancelled Orders</h4>
                        <h5>${dashboardSummary.cancelledOrders || 0}</h5>
                    </div>
                    <div class="overview-item p-4 border rounded shadow-sm">
                        <h4>Total Orders</h4>
                        <h5>${dashboardSummary.totalOrders || 0}</h5>
                    </div>
                </div>
                <h3 class="mt-8">Recent Activity:</h3>
                <ul>
                    ${recentOrders.orders && recentOrders.orders.length > 0 ?
                        recentOrders.orders.map(item => `<li>Order #${item.order_number} - ${item.status}</li>`).join('') :
                        '<li>No recent activity.</li>'
                    }
                </ul>
            `;
            // Also call specific rendering functions for detailed sections if they exist on the dashboard overview tab
            renderDashboardOverview(dashboardSummary);
            renderRecentOrders(recentOrders.orders);

        } catch (error) {
            console.error('Error loading dashboard content:', error);
            dashboardContentDiv.innerHTML = `<p class="error text-red-500">Failed to load dashboard. ${error.message}</p>`;
        }
    }

    // --- Logout Handler ---
    function handleLogout(event) {
        event.preventDefault();
        console.log('User initiated logout. Clearing token.');
        localStorage.removeItem('userToken');
        alert('You have been logged out.');
        window.location.href = '/login.html';
    }

    // --- Core Dashboard Access Logic ---
    async function checkDashboardAccess() {
        if (!window.location.pathname.startsWith('/dashboard')) {
            return; // Only run this logic on the dashboard page
        }

        const currentToken = localStorage.getItem('userToken');

        if (currentToken) {
            try {
                const authData = await callApi('/api/auth/check');
                if (authData.message === 'Authorized ✅') {
                    console.log('Token validated. User is authenticated.');
                    if (logoutBtnAnchor) {
                        logoutBtnAnchor.textContent = 'Logout';
                        // Ensure listener is added only once
                        logoutBtnAnchor.removeEventListener('click', handleLogout);
                        logoutBtnAnchor.addEventListener('click', handleLogout);
                    }
                    await loadAndRenderAllUserData(); // Load all specific dashboard data
                    // If a specific tab should be active on load, set it here, e.g., 'dashboard' for the overview
                    switchTab('dashboard');
                    return;
                } else {
                    console.warn('Backend rejected token without 401:', authData.message);
                    localStorage.removeItem('userToken');
                    alert('Session invalid. Please log in again.');
                    window.location.href = '/login.html';
                    return;
                }
            } catch (error) {
                // `callApi`'s 401 handler already redirects. This catches other errors.
                if (error.message !== 'Unauthorized') { // Avoid double alerts/redirects
                    console.error('Error during initial auth check for dashboard:', error);
                    localStorage.removeItem('userToken');
                    alert('An error occurred during authentication. Please log in again.');
                    window.location.href = '/login.html';
                }
                return;
            }
        }

        console.log('No valid token found. Redirecting to login.');
        alert('You must be logged in to view the dashboard.');
        localStorage.removeItem('userToken');
        window.location.href = '/login.html';
    }

    // --- Form Submission Handlers (Login and Register) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = loginForm.elements.email.value;
            const password = loginForm.elements.password.value;

            try {
                const response = await callApi('/api/auth/login', 'POST', { email, password });
                if (response && response.token) {
                    localStorage.setItem('userToken', response.token);
                    alert(response.message);
                    window.location.href = '/dashboard.html';
                } else {
                    alert(response.message || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Login form submission error:', error);
                alert(error.message || 'An error occurred during login. Please try again.');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = registerForm.elements.name.value;
            const email = registerForm.elements.email.value;
            const password = registerForm.elements.password.value;
            const confirmPassword = registerForm.elements.confirmPassword.value; // Assuming you have this field

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            try {
                const response = await callApi('/api/auth/register', 'POST', { name, email, password });
                alert(response.message);
                if (response.message.includes("successful")) {
                    window.location.href = '/login.html';
                }
            } catch (error) {
                console.error('Registration form submission error:', error);
                alert(error.message || 'An error occurred during registration. Please try again.');
            }
        });
    }

    // --- Initial page load logic for login/register pages ---
    async function handleAuthPages() {
        if (window.location.pathname === '/login.html' || window.location.pathname === '/register.html') {
            const currentToken = localStorage.getItem('userToken');
            if (currentToken) {
                try {
                    const data = await callApi('/api/auth/check');
                    if (data.message === 'Authorized ✅') {
                        console.log('Already logged in on login/register page, redirecting to dashboard.');
                        window.location.href = '/dashboard.html';
                    }
                } catch (error) {
                    if (error.message !== 'Unauthorized') { // Avoid double alerts/redirects
                        console.warn('Failed auth check on login/register page, clearing token:', error);
                    }
                    localStorage.removeItem('userToken');
                }
            }
        }
    }


    // --- 2. Dashboard Overview Functions ---
    function renderDashboardOverview(data) {
        if (!data) {
            console.warn('No dashboard overview data provided.');
            return;
        }
        // Ensure selectors are robust or handled gracefully if not present on all dashboard tabs
        const awaitingPickupEl = document.querySelector('.overview-item:nth-child(1) h5');
        const cancelledOrdersEl = document.querySelector('.overview-item:nth-child(2) h5');
        const totalOrdersEl = document.querySelector('.overview-item:nth-child(3) h5');

        if (awaitingPickupEl) awaitingPickupEl.textContent = data.awaitingPickup || 0;
        if (cancelledOrdersEl) cancelledOrdersEl.textContent = data.cancelledOrders || 0;
        if (totalOrdersEl) totalOrdersEl.textContent = data.totalOrders || 0;
    }

    function renderRecentOrders(orders) {
        const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
        if (!recentOrdersTableBody) {
            console.warn('Recent orders table body not found.');
            return;
        }
        recentOrdersTableBody.innerHTML = ''; // Clear existing

        if (orders && orders.length > 0) {
            // Sort by a date or ID if available, to ensure "recent" is actually recent
            orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)); // Assuming 'order_date' field
            orders.slice(0, 5).forEach(order => { // Show up to 5 recent orders
                const productsHtml = order.products && order.products.length > 0 ?
                    order.products.map(product => `
                        <a href="product-default.html?id=${product.id}" class="product flex items-center gap-3">
                            <img src="${product.image || '/assets/images/product/productDefault.png'}"
                                alt="${product.name}" class="flex-shrink-0 w-12 h-12 rounded object-cover" />
                            <div class="info flex flex-col">
                                <strong class="product_name text-button">${product.name}</strong>
                                <span class="product_tag caption1 text-secondary">${product.category || 'N/A'}, ${product.gender || 'N/A'}</span>
                            </div>
                        </a>
                    `).join('') : '<p>No products in this order</p>'; // Handle orders with no products

                const row = `
                    <tr class="item duration-300 border-b border-line">
                        <th scope="row" class="py-3 text-left">
                            <strong class="text-title">${order.order_number || 'N/A'}</strong>
                        </th>
                        <td class="py-3">${productsHtml}</td>
                        <td class="py-3 price">₹${(order.total_amount || 0).toFixed(2)}</td>
                        <td class="py-3 text-right">
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status || 'Unknown'}</span>
                        </td>
                    </tr>
                `;
                recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            recentOrdersTableBody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-secondary">No recent orders found.</td></tr>`;
        }
    }

    function getStatusColor(status) {
        switch (status ? status.toLowerCase() : '') { // Handle potential null/undefined status
            case 'pending': return 'yellow';
            case 'processing': return 'orange'; // Added 'processing'
            case 'shipped': return 'blue'; // Added 'shipped'
            case 'delivery': return 'purple';
            case 'completed': return 'success';
            case 'cancelled': return 'red';
            case 'returned': return 'red'; // Added 'returned'
            default: return 'gray';
        }
    }

    // --- 3. Order History Functions ---
    async function renderOrderHistory(orders) {
        const listOrderContainer = document.querySelector('.list_order');
        if (!listOrderContainer) {
            console.warn('Order list container not found.');
            return;
        }
        listOrderContainer.innerHTML = ''; // Clear existing orders

        if (!orders || orders.length === 0) {
            listOrderContainer.innerHTML = '<p class="p-4 text-center text-secondary">No orders found.</p>';
            return;
        }

        orders.forEach(order => {
            const productsHtml = order.products && order.products.length > 0 ?
                order.products.map(product => `
                    <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                        <a href="product-default.html?id=${product.id}" class="flex items-center gap-5">
                            <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                <img src="${product.image || '/assets/images/product/productDefault.png'}"
                                    alt="${product.name}" class="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div class="prd_name text-title">${product.name}</div>
                                <div class="caption1 text-secondary mt-2">
                                    <span class="prd_quantity">${product.quantity || 1}</span>
                                    <span> x </span>
                                    <span class="prd_price">₹${(product.price || 0).toFixed(2)}</span>
                                    ${product.size ? `<span class="prd_size uppercase ml-2">${product.size}</span>` : ''}
                                    ${product.color ? `<span>/</span><span class="prd_color capitalize">${product.color}</span>` : ''}
                                </div>
                            </div>
                        </a>
                        <div class="text-title">
                            Subtotal: ₹${((product.quantity || 1) * (product.price || 0)).toFixed(2)}
                        </div>
                    </div>
                `).join('') : '<div class="p-3 text-secondary">No products found for this order.</div>';

            const orderItemHTML = `
                <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs" data-order-id="${order.id}" data-order-status="${(order.status || '').toLowerCase()}">
                    <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order Number:</strong>
                            <strong class="order_number text-button uppercase">${order.order_number || 'N/A'}</strong>
                        </div>
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order status:</strong>
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status || 'Unknown'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Total:</strong>
                            <strong class="text-button">₹${(order.total_amount || 0).toFixed(2)}</strong>
                        </div>
                    </div>
                    <div class="list_prd px-5">${productsHtml}</div>
                    <div class="flex flex-wrap gap-4 p-5">
                        <button class="button-main btn_order_detail">Order Details</button>
                        ${(order.status || '').toLowerCase() === 'pending' || (order.status || '').toLowerCase() === 'processing' ?
                        `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white btn_cancel_order" data-order-id="${order.id}">Cancel Order</button>`
                        : ''}
                    </div>
                </div>
            `;
            listOrderContainer.insertAdjacentHTML('beforeend', orderItemHTML);
        });

        // Attach event listeners to cancel buttons
        listOrderContainer.querySelectorAll('.btn_cancel_order').forEach(button => {
            button.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.orderId;
                if (orderId && confirm('Are you sure you want to cancel this order?')) {
                    await cancelOrder(orderId);
                }
            });
        });
    }

    async function filterOrdersByStatus(status) {
        document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => item.classList.remove('active'));
        const activeTab = document.querySelector(`.tab_order .menu-tab .tab-item[data-status="${status}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Move indicator
        const indicator = document.querySelector('.tab_order .menu-tab .indicator');
        if (indicator && activeTab) {
            indicator.style.width = activeTab.offsetWidth + 'px';
            indicator.style.left = activeTab.offsetLeft + 'px';
        }

        const allOrderItems = document.querySelectorAll('.list_order .order_item');
        if (allOrderItems.length > 0) {
            allOrderItems.forEach(orderItem => {
                if (status === 'all' || (orderItem.dataset.orderStatus && orderItem.dataset.orderStatus === status)) {
                    orderItem.style.display = 'block';
                } else {
                    orderItem.style.display = 'none';
                }
            });
        } else {
            // If orders are fetched dynamically per filter, uncomment this
            try {
                const endpoint = status === 'all' ? '/api/orders' : `/api/orders?status=${status}`;
                const filteredOrders = await callApi(endpoint);
                renderOrderHistory(filteredOrders.orders);
            } catch (error) {
                console.error('Error filtering orders:', error);
                // The `callApi` function already handles 401 and throws.
                // For other errors, you might want a more specific message.
                alert('Failed to load filtered orders.');
                const listOrderContainer = document.querySelector('.list_order');
                if (listOrderContainer) listOrderContainer.innerHTML = '<p class="p-4 text-center text-red-500">Error loading orders.</p>';
            }
        }
    }

    async function cancelOrder(orderId) {
        try {
            const result = await callApi(`/api/orders/${orderId}/cancel`, 'PUT'); // Consistent endpoint convention
            alert(result.message || 'Order cancelled successfully!');
            await loadAndRenderAllUserData(); // Re-fetch all data to refresh all relevant sections
            // Re-apply current filter if any
            const activeStatusTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
            if (activeStatusTab) {
                filterOrdersByStatus(activeStatusTab.dataset.status);
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            alert(error.message || 'Failed to cancel order. Please try again.');
        }
    }

    // --- 4. My Address Functions ---
    function loadAddressData(addresses) {
        if (!addresses) {
            console.warn('No address data provided.');
            return;
        }

        const billingAddress = addresses.billing || {};
        const shippingAddress = addresses.shipping || {};

        // Helper to safely set value
        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        // Billing
        setValue('billingFirstName', billingAddress.first_name);
        setValue('billingLastName', billingAddress.last_name);
        setValue('billingCompany', billingAddress.company);
        setValue('billingCountry', billingAddress.country);
        setValue('billingStreet', billingAddress.street);
        setValue('billingCity', billingAddress.city);
        setValue('billingState', billingAddress.state);
        setValue('billingZip', billingAddress.zip);
        setValue('billingPhone', billingAddress.phone);
        setValue('billingEmail', billingAddress.email);

        // Shipping
        setValue('shippingFirstName', shippingAddress.first_name);
        setValue('shippingLastName', shippingAddress.last_name);
        setValue('shippingCompany', shippingAddress.company);
        setValue('shippingCountry', shippingAddress.country);
        setValue('shippingStreet', shippingAddress.street);
        setValue('shippingCity', shippingAddress.city);
        setValue('shippingState', shippingAddress.state);
        setValue('shippingZip', shippingAddress.zip);
        setValue('shippingPhone', shippingAddress.phone);
        setValue('shippingEmail', shippingAddress.email);
    }

    async function updateAddress(addressType, formData) {
        try {
            const result = await callApi(`/api/user/addresses/${addressType}`, 'PUT', formData);
            alert(result.message || `${addressType} address updated successfully!`);
            // Re-fetch and load all address data to ensure UI is consistent
            const userAddresses = await callApi('/api/user/addresses');
            loadAddressData(userAddresses.addresses);
        } catch (error) {
            console.error(`Update ${addressType} address error:`, error);
            alert(error.message || `Failed to update ${addressType} address. Please try again.`);
        }
    }

    // --- 5. Settings (Profile Update & Password Change) Functions ---
    function loadProfileData(user) {
        if (!user) {
            console.warn('No user profile data provided.');
            return;
        }
        if (userDisplayName) userDisplayName.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (userDisplayEmail) userDisplayEmail.textContent = user.email || '';

        const avatarSrc = user.avatar_url || '/assets/images/user-avatar.png';
        if (userAvatarImg) userAvatarImg.src = avatarSrc;
        if (uploadImgPreview) uploadImgPreview.src = avatarSrc;

        // Profile Update fields
        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setValue('firstName', user.first_name);
        setValue('lastName', user.last_name);
        setValue('phoneNumber', user.phone_number);
        setValue('email', user.email);
        setValue('gender', user.gender || 'default');
        setValue('birth', user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
    }

    async function updateProfile(formData) {
        try {
            const result = await callApi('/api/user/profile', 'PUT', formData);
            alert(result.message || 'Profile updated successfully!');
            // Re-fetch and display updated profile to refresh the UI
            const profileData = await callApi('/api/user/profile');
            loadProfileData(profileData.user);
        } catch (error) {
            console.error('Update profile error:', error);
            alert(error.message || 'Failed to update profile. Please try again.');
        }
    }

    async function updateProfileAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const currentToken = localStorage.getItem('userToken');
            if (!currentToken) {
                throw new Error('No authentication token found for avatar upload.');
            }

            const response = await fetch('/api/user/avatar', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Session expired or invalid. Please log in again.');
                    localStorage.removeItem('userToken');
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(result.message || `Avatar upload failed with status ${response.status}`);
            }

            alert(result.message || 'Avatar updated successfully!');
            if (result.avatar_url) {
                if (userAvatarImg) userAvatarImg.src = result.avatar_url;
                if (uploadImgPreview) uploadImgPreview.src = result.avatar_url;
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert(error.message || 'Failed to upload avatar. Please try again.');
        }
    }

    async function changePassword(formData) {
        try {
            if (formData.new_password !== formData.confirm_new_password) {
                throw new Error('New password and confirm password do not match.');
            }
            if (!formData.new_password || formData.new_password.length < 6) {
                throw new Error('New password must be at least 6 characters long.');
            }

            const result = await callApi('/api/user/password', 'PUT', {
                current_password: formData.current_password,
                new_password: formData.new_password
            });
            alert(result.message || 'Password changed successfully!');
            // Clear password fields
            document.getElementById('password').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } catch (error) {
            console.error('Change password error:', error);
            alert(error.message || 'Failed to change password. Please try again.');
        }
    }

    // --- 6. Navigation and Tab Switching ---
    function switchTab(tabName) {
        // Update menu tab active state
        document.querySelectorAll('.menu-tab .category-item').forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-tab .category-item[data-item="${tabName}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        // Show/hide content blocks
        document.querySelectorAll('.list-filter .filter-item').forEach(item => item.classList.remove('active'));
        const activeContentBlock = document.querySelector(`.list-filter .filter-item[data-item="${tabName}"]`);
        if (activeContentBlock) activeContentBlock.classList.add('active');

        // Special handling for order history sub-tabs
        if (tabName === 'orders') {
            const orderTabIndicator = document.querySelector('.tab_order .menu-tab .indicator');
            const firstOrderTabItem = document.querySelector('.tab_order .menu-tab .tab-item[data-status="all"]');
            if (orderTabIndicator && firstOrderTabItem) {
                orderTabIndicator.style.width = firstOrderTabItem.offsetWidth + 'px';
                orderTabIndicator.style.left = firstOrderTabItem.offsetLeft + 'px';
                document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(btn => btn.classList.remove('active'));
                firstOrderTabItem.classList.add('active');
            }
            filterOrdersByStatus('all'); // Always show 'all' orders when entering the orders tab
        } else if (tabName === 'dashboard') {
            // Re-render dashboard overview if it's the active tab and data might have changed
            // This is handled by loadAndRenderAllUserData initially, but good to have a refresh option
            // loadDashboardContent(); // This would re-fetch and render just the dashboard section
        }
    }

    // --- Data Loading function to call multiple APIs for dashboard ---
    async function loadAndRenderAllUserData() {
        try {
            console.log('Loading all user data...');
            // Fetch and display user profile data
            const profileData = await callApi('/api/user/profile');
            loadProfileData(profileData.user);

            // Fetch and display dashboard summary
            const dashboardSummary = await callApi('/api/user/dashboard-summary');
            renderDashboardOverview(dashboardSummary);

            // Fetch and display recent orders for dashboard (if recent_order div exists)
            const recentOrders = await callApi('/api/orders/recent');
            renderRecentOrders(recentOrders.orders);

            // Fetch and display all orders for order history tab
            const allOrders = await callApi('/api/orders');
            renderOrderHistory(allOrders.orders);

            // Fetch and display user addresses
            const userAddresses = await callApi('/api/user/addresses');
            loadAddressData(userAddresses.addresses);
            console.log('All user data loaded successfully.');

        } catch (error) {
            console.error('Error loading all user data:', error);
            // `callApi` already handles 401 redirects. This catches other errors.
            if (error.message !== 'Unauthorized') {
                alert('Failed to load user data. Please refresh the page.');
            }
        }
    }


    // --- Event Listeners ---

    // Side menu navigation
    document.querySelectorAll('.menu-tab .category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.currentTarget.dataset.item;
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    // Order history sub-tabs
    document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const status = e.currentTarget.dataset.status;
            filterOrdersByStatus(status);
        });
    });

    // Address tab toggles
    document.querySelectorAll('.tab_address .tab_btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetItem = e.currentTarget.dataset.item;
            const targetForm = document.querySelector(`.tab_address .form_address[data-item="${targetItem}"]`);
            const icon = e.currentTarget.querySelector('.ic_down');

            if (targetForm && icon) {
                e.currentTarget.classList.toggle('active');
                targetForm.classList.toggle('active');
                icon.classList.toggle('ph-caret-up');
                icon.classList.toggle('ph-caret-down');
            }
        });
    });

    // Profile update and Password change form submission (Setting tab)
    const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] form');
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Password fields
            const currentPasswordEl = document.getElementById('password');
            const newPasswordEl = document.getElementById('newPassword');
            const confirmPasswordEl = document.getElementById('confirmPassword');

            const currentPassword = currentPasswordEl ? currentPasswordEl.value : '';
            const newPassword = newPasswordEl ? newPasswordEl.value : '';
            const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';

            // Profile fields
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const email = document.getElementById('email').value;
            const gender = document.getElementById('gender').value;
            const dob = document.getElementById('birth').value;

            // Determine if it's a password change or profile update
            if (newPassword || currentPassword || confirmPassword) {
                await changePassword({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_new_password: confirmPassword
                });
            } else {
                await updateProfile({
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    email: email,
                    gender: gender === 'default' ? null : gender,
                    dob: dob || null
                });
            }
        });
    }

    // Avatar upload handling
    const uploadImageInput = document.getElementById('uploadImage');
    if (uploadImageInput) {
        uploadImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (uploadImgPreview) uploadImgPreview.src = event.target.result;
                    if (userAvatarImg) userAvatarImg.src = event.target.result; // Update main avatar too
                };
                reader.readAsDataURL(file);
                await updateProfileAvatar(file);
            }
        });
    }

    // Address update form submission
    const addressForms = document.querySelectorAll('.tab_address form');
    addressForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formElement = e.target;
            const addressType = formElement.dataset.item;

            if (!addressType) {
                alert("Address form type not identified. Missing data-item attribute.");
                return;
            }

            // Using consistent `id$` selectors for robustness
            const formData = {
                first_name: formElement.querySelector('[id$="FirstName"]').value,
                last_name: formElement.querySelector('[id$="LastName"]').value,
                company: formElement.querySelector('[id$="Company"]').value,
                country: formElement.querySelector('[id$="Country"]').value,
                street: formElement.querySelector('[id$="Street"]').value,
                city: formElement.querySelector('[id$="City"]').value,
                state: formElement.querySelector('[id$="State"]').value,
                zip: formElement.querySelector('[id$="Zip"]').value,
                phone: formElement.querySelector('[id$="Phone"]').value,
                email: formElement.querySelector('[id$="Email"]').value,
            };

            await updateAddress(addressType, formData);
        });
    });

    // Initial load logic based on path
    if (window.location.pathname.startsWith('/dashboard')) {
        checkDashboardAccess();
    } else {
        handleAuthPages();
    }
});