document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img');
    const uploadImgPreview = document.querySelector('.upload_image .upload_img'); // Corrected selector for avatar preview in settings
    const logoutBtnAnchor = document.querySelector('.menu-tab a strong.heading6'); // Assuming 'Logout' is the strong tag

    // Dashboard Overview elements
    const awaitingPickupEl = document.querySelector('.overview-item:nth-child(1) h5');
    const cancelledOrdersEl = document.querySelector('.overview-item:nth-child(2) h5');
    const totalOrdersEl = document.querySelector('.overview-item:nth-child(3) h5');
    const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');

    // Order History elements
    const listOrderContainer = document.querySelector('.list_order');
    const orderStatusTabs = document.querySelectorAll('.tab_order .menu-tab .tab-item');

    // Address forms and toggles
    const tabAddressContainer = document.querySelector('.tab_address');
    const addressTabButtons = document.querySelectorAll('.tab_address .tab_btn');
    const billingAddressForm = document.querySelector('.form_address[data-item="billing"]');
    const shippingAddressForm = document.querySelector('.form_address[data-item="shipping"]');

    // Settings (Profile & Password) forms
    const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] form');
    const uploadImageInput = document.getElementById('uploadImage');

    // API Utility function (as provided)
    async function callApi(endpoint, method = 'GET', body = null, isFormData = false) {
        const currentToken = localStorage.getItem('userToken');
        const headers = {};

        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const config = {
            method,
            headers: isFormData ? {} : { 'Content-Type': 'application/json', ...headers },
            body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        };

        if (isFormData) {
            if (currentToken) {
                config.headers['Authorization'] = `Bearer ${currentToken}`;
            }
        }

        try {
            const response = await fetch(endpoint, config);

            if (response.status === 401) {
                console.warn('Authentication failed for API call. Redirecting to login.');
                alert('Session expired or invalid. Please log in again.');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return Promise.reject(new Error('Unauthorized'));
            }

            const data = (response.status !== 204) ? await response.json().catch(() => {
                console.error(`Failed to parse JSON for ${endpoint}. Status: ${response.status}`);
                return { message: `Server responded with status ${response.status}`, success: response.ok };
            }) : { message: 'Success', status: 204, success: true };

            if (!response.ok) {
                throw new Error(data.message || `API call to ${endpoint} failed with status ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`Network or fetch error for ${endpoint}:`, error);
            throw error;
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
            return;
        }

        const currentToken = localStorage.getItem('userToken');

        if (currentToken) {
            try {
                const authData = await callApi('/api/auth/check');
                if (authData.message === 'Authorized ✅') {
                    console.log('Token validated. User is authenticated.');
                    if (logoutBtnAnchor) {
                        // Ensure the logout link correctly targets 'logout.html' for visual, but use JS for actual logout
                        const logoutLink = logoutBtnAnchor.closest('a');
                        if (logoutLink) {
                            logoutLink.href = '#!'; // Prevent default navigation
                            logoutLink.removeEventListener('click', handleLogout);
                            logoutLink.addEventListener('click', handleLogout);
                        }
                    }
                    await loadAndRenderAllUserData();
                    switchTab('dashboard'); // Ensure dashboard overview is the default active tab
                    return;
                } else {
                    console.warn('Backend rejected token without 401:', authData.message);
                    localStorage.removeItem('userToken');
                    alert('Session invalid. Please log in again.');
                    window.location.href = '/login.html';
                    return;
                }
            } catch (error) {
                if (error.message !== 'Unauthorized') {
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
            const confirmPassword = registerForm.elements.confirmPassword.value;

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
                    if (error.message !== 'Unauthorized') {
                        console.warn('Failed auth check on login/register page, clearing token:', error);
                    }
                    localStorage.removeItem('userToken');
                }
            }
        }
    }


    // --- Helper for status colors ---
    function getStatusColor(status) {
        switch (status ? status.toLowerCase() : '') {
            case 'pending': return 'yellow';
            case 'processing': return 'orange';
            case 'shipped': return 'blue';
            case 'delivery': return 'purple';
            case 'completed': return 'success';
            case 'cancelled': return 'red';
            case 'returned': return 'red';
            default: return 'gray';
        }
    }

    // --- 2. Dashboard Overview Functions ---
    function renderDashboardOverview(data) {
        if (!data) {
            console.warn('No dashboard overview data provided.');
            return;
        }

        if (awaitingPickupEl) awaitingPickupEl.textContent = data.awaitingPickup || 0;
        if (cancelledOrdersEl) cancelledOrdersEl.textContent = data.cancelledOrders || 0;
        if (totalOrdersEl) totalOrdersEl.textContent = data.totalOrders || 0;
    }

    function renderRecentOrders(orders) {
        if (!recentOrdersTableBody) {
            console.warn('Recent orders table body not found.');
            return;
        }
        recentOrdersTableBody.innerHTML = ''; // Clear existing

        if (orders && orders.length > 0) {
            orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            orders.slice(0, 5).forEach(order => {
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
                    `).join('') : '<p class="text-secondary">No products in this order</p>';

                const row = `
                    <tr class="item duration-300 border-b border-line">
                        <th scope="row" class="py-3 text-left">
                            <strong class="text-title">${order.id || 'N/A'}</strong>
                        </th>
                        <td class="py-3">${productsHtml}</td>
                        <td class="py-3 price">₹${(order.amount || 0).toFixed(2)}</td>
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

    // --- 3. Order History Functions ---
    async function renderOrderHistory(orders) {
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
                            <strong class="order_number text-button uppercase">${order.id || 'N/A'}</strong>
                        </div>
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order status:</strong>
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status || 'Unknown'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Total:</strong>
                            <strong class="text-button">₹${(order.amount || 0).toFixed(2)}</strong>
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
        orderStatusTabs.forEach(item => item.classList.remove('active'));
        const activeTab = document.querySelector(`.tab_order .menu-tab .tab-item[data-status="${status}"]`);
        if (activeTab) activeTab.classList.add('active');

        const indicator = document.querySelector('.tab_order .menu-tab .indicator');
        if (indicator && activeTab) {
            indicator.style.width = activeTab.offsetWidth + 'px';
            indicator.style.left = activeTab.offsetLeft + 'px';
        }

        try {
            const endpoint = status === 'all' ? '/api/user/profile' : `/api/user/profile?status=${status}`; // Assuming API handles status filter on profile
            const profileData = await callApi(endpoint);
            const filteredOrders = status === 'all' ? profileData.orders : profileData.orders.filter(order => order.status.toLowerCase() === status);
            renderOrderHistory(filteredOrders);
        } catch (error) {
            console.error('Error filtering orders:', error);
            alert('Failed to load filtered orders.');
            if (listOrderContainer) listOrderContainer.innerHTML = '<p class="p-4 text-center text-red-500">Error loading orders.</p>';
        }
    }

    async function cancelOrder(orderId) {
        try {
            // Assuming a PUT /api/orders/:id/cancel endpoint exists to update status
            const result = await callApi(`/api/orders/${orderId}/cancel`, 'PUT', { status: 'cancelled' });
            alert(result.message || 'Order cancelled successfully!');
            await loadAndRenderAllUserData(); // Re-load all data
            const activeStatusTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
            if (activeStatusTab) {
                filterOrdersByStatus(activeStatusTab.textContent.toLowerCase()); // Filter again based on active tab
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            alert(error.message || 'Failed to cancel order. Please try again.');
        }
    }

    // --- 4. My Address Functions ---
    function loadAddressData(addresses) {
        // Your current backend only provides user profile (name, email).
        // It does not have dedicated address fields or a /api/user/addresses endpoint.
        // This function will set default empty values or rely on `profileData.user` if you extend it
        // For now, it sets empty strings or placeholder values.

        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        // These IDs must match your HTML structure exactly
        setValue('billingFirstName', addresses.billing?.first_name);
        setValue('billingLastName', addresses.billing?.last_name);
        setValue('billingCompany', addresses.billing?.company);
        setValue('billingCountry', addresses.billing?.country);
        setValue('billingStreet', addresses.billing?.street);
        setValue('billingCity', addresses.billing?.city);
        setValue('billingState', addresses.billing?.state);
        setValue('billingZip', addresses.billing?.zip);
        setValue('billingPhone', addresses.billing?.phone);
        setValue('billingEmail', addresses.billing?.email);

        setValue('shippingFirstName', addresses.shipping?.first_name);
        setValue('shippingLastName', addresses.shipping?.last_name);
        setValue('shippingCompany', addresses.shipping?.company);
        setValue('shippingCountry', addresses.shipping?.country);
        setValue('shippingStreet', addresses.shipping?.street);
        setValue('shippingCity', addresses.shipping?.city);
        setValue('shippingState', addresses.shipping?.state);
        setValue('shippingZip', addresses.shipping?.zip);
        setValue('shippingPhone', addresses.shipping?.phone);
        setValue('shippingEmail', addresses.shipping?.email);
    }


    async function updateAddress(addressType, formData) {
        // As per the original serverless function, there's no /api/user/addresses endpoint.
        // This function will currently show an alert indicating it's not implemented.
        alert(`Updating ${addressType} address is not yet implemented on the backend.`);
        console.warn(`Attempted to update ${addressType} address with data:`, formData);
        // If you implement a PUT /api/user/addresses/{type} endpoint, uncomment and adapt the following:
        /*
        try {
            const result = await callApi(`/api/user/addresses/${addressType}`, 'PUT', formData);
            alert(result.message || `${addressType} address updated successfully!`);
            // Re-fetch all user data to refresh addresses
            await loadAndRenderAllUserData();
        } catch (error) {
            console.error(`Update ${addressType} address error:`, error);
            alert(error.message || `Failed to update ${addressType} address. Please try again.`);
        }
        */
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

        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setValue('firstName', user.first_name);
        setValue('lastName', user.last_name);
        setValue('phoneNumber', user.phone_number);
        setValue('email', user.email);
        const genderSelect = document.getElementById('gender');
        if (genderSelect && user.gender) {
            genderSelect.value = user.gender;
        } else if (genderSelect) {
            genderSelect.value = 'default';
        }
        setValue('birth', user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
    }

    async function updateProfile(formData) {
        try {
            const result = await callApi('/api/user/profile', 'PUT', formData);
            alert(result.message || 'Profile updated successfully!');
            const profileData = await callApi('/api/user/profile');
            loadProfileData(profileData.user);
        } catch (error) {
            console.error('Update profile error:', error);
            alert(error.message || 'Failed to update profile. Please try again.');
        }
    }

    async function updateProfileAvatar(file) {
        // As per the provided serverless function, there is no /api/user/avatar endpoint.
        // This will show an alert that it's not implemented.
        alert("Avatar upload is not yet implemented on the backend.");
        console.warn("Attempted avatar upload. Backend endpoint /api/user/avatar is not implemented.");

        // If you implement a PUT /api/user/avatar endpoint:
        /*
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const result = await callApi('/api/user/avatar', 'PUT', formData, true); // true for isFormData
            alert(result.message || 'Avatar updated successfully!');
            if (result.avatar_url) {
                if (userAvatarImg) userAvatarImg.src = result.avatar_url;
                if (uploadImgPreview) uploadImgPreview.src = result.avatar_url;
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert(error.message || 'Failed to upload avatar. Please try again.');
        }
        */
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
        document.querySelectorAll('.menu-tab .category-item').forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-tab .category-item[data-item="${tabName}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        document.querySelectorAll('.list-filter .filter-item').forEach(item => item.classList.remove('active'));
        const activeContentBlock = document.querySelector(`.list-filter .filter-item[data-item="${tabName}"]`);
        if (activeContentBlock) activeContentBlock.classList.add('active');

        if (tabName === 'orders') {
            const orderTabIndicator = document.querySelector('.tab_order .menu-tab .indicator');
            const firstOrderTabItem = document.querySelector('.tab_order .menu-tab .tab-item[data-status="all"]');
            if (orderTabIndicator && firstOrderTabItem) {
                orderTabIndicator.style.width = firstOrderTabItem.offsetWidth + 'px';
                orderTabIndicator.style.left = firstOrderTabItem.offsetLeft + 'px';
                orderStatusTabs.forEach(btn => btn.classList.remove('active'));
                firstOrderTabItem.classList.add('active');
            }
            filterOrdersByStatus('all');
        } else if (tabName === 'dashboard') {
            loadDashboardContent();
        }
    }

    // --- Data Loading function to call multiple APIs for dashboard ---
    async function loadAndRenderAllUserData() {
        try {
            console.log('Loading all user data...');

            // Fetch and display user profile data (from /api/user/profile)
            const profileResponse = await callApi('/api/user/profile');
            if (profileResponse.user) {
                loadProfileData(profileResponse.user);

                // Populate user-info section in the sidebar
                if (userDisplayName) userDisplayName.textContent = `${profileResponse.user.first_name || ''} ${profileResponse.user.last_name || ''}`.trim();
                if (userDisplayEmail) userDisplayEmail.textContent = profileResponse.user.email || '';
                if (userAvatarImg) userAvatarImg.src = profileResponse.user.avatar_url || '/assets/images/user-avatar.png';
                if (uploadImgPreview) uploadImgPreview.src = profileResponse.user.avatar_url || '/assets/images/user-avatar.png';


                // Load orders for recent orders and full order history
                if (profileResponse.orders) {
                    renderRecentOrders(profileResponse.orders);
                    renderOrderHistory(profileResponse.orders);
                }
            } else {
                console.warn('Profile data missing from /api/user/profile response.');
            }

            // Fetch and display dashboard summary (from /api/orders/stats)
            const dashboardSummaryResponse = await callApi('/api/orders/stats');
            if (dashboardSummaryResponse.success && dashboardSummaryResponse.data) {
                const mappedSummary = {
                    awaitingPickup: dashboardSummaryResponse.data.totalOrders - dashboardSummaryResponse.data.completedOrders,
                    cancelledOrders: 0, // Your stats API doesn't provide this directly
                    totalOrders: dashboardSummaryResponse.data.totalOrders
                };
                renderDashboardOverview(mappedSummary);
            } else {
                console.warn('Dashboard summary data missing from /api/orders/stats response.');
            }

            // Load address data (currently not available from your backend explicitly)
            // Passing an empty object, assuming loadAddressData handles defaults
            loadAddressData({});

            console.log('All user data loaded successfully.');

        } catch (error) {
            console.error('Error loading all user data:', error);
            if (error.message !== 'Unauthorized') {
                alert('Failed to load user data. Please refresh the page.');
            }
        }
    }

    // Simplified loadDashboardContent for the main dashboard view
    async function loadDashboardContent() {
        try {
            const profileResponse = await callApi('/api/user/profile');
            const dashboardSummaryResponse = await callApi('/api/orders/stats');

            if (profileResponse.user) {
                if (userDisplayName) userDisplayName.textContent = `${profileResponse.user.first_name || ''} ${profileResponse.user.last_name || ''}`.trim();
                if (userDisplayEmail) userDisplayEmail.textContent = profileResponse.user.email || '';
                if (userAvatarImg) userAvatarImg.src = profileResponse.user.avatar_url || '/assets/images/user-avatar.png';
            }

            if (dashboardSummaryResponse.success && dashboardSummaryResponse.data) {
                const mappedSummary = {
                    awaitingPickup: dashboardSummaryResponse.data.totalOrders - dashboardSummaryResponse.data.completedOrders,
                    cancelledOrders: 0,
                    totalOrders: dashboardSummaryResponse.data.totalOrders
                };
                renderDashboardOverview(mappedSummary);
            }

            if (profileResponse.orders) {
                renderRecentOrders(profileResponse.orders);
            }

        } catch (error) {
            console.error('Error loading dashboard content:', error);
            alert('Failed to load dashboard content.');
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
    orderStatusTabs.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const status = e.currentTarget.textContent.toLowerCase(); // Use textContent for status
            filterOrdersByStatus(status);
        });
    });

    // Address tab toggles
    addressTabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetItem = e.currentTarget.dataset.item;
            const targetForm = tabAddressContainer.querySelector(`.form_address[data-item="${targetItem}"]`);
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
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('password').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

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
                const fullName = `${firstName} ${lastName}`.trim();
                await updateProfile({
                    first_name: firstName,
                    last_name: lastName,
                    // The backend '/api/user/profile' PUT expects `name` as a single field
                    // You might need to adjust the backend or send `name` instead of `first_name`/`last_name`
                    name: fullName, // Sending `name` as required by backend
                    email: email,
                    // These fields are not currently handled by your backend /api/user/profile PUT
                    // phone_number: phoneNumber,
                    // gender: gender === 'default' ? null : gender,
                    // dob: dob || null
                });
            }
        });
    }

    // Avatar upload handling
    if (uploadImageInput) {
        uploadImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (uploadImgPreview) uploadImgPreview.src = event.target.result;
                    if (userAvatarImg) userAvatarImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
                await updateProfileAvatar(file);
            }
        });
    }

    // Address update form submission
    // Modified to correctly target the form directly, not its closest parent for submission
    if (billingAddressForm) {
        billingAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const addressType = billingAddressForm.dataset.item;
            const formData = {
                first_name: document.getElementById('billingFirstName').value,
                last_name: document.getElementById('billingLastName').value,
                company: document.getElementById('billingCompany').value,
                country: document.getElementById('billingCountry').value,
                street: document.getElementById('billingStreet').value,
                city: document.getElementById('billingCity').value,
                state: document.getElementById('billingState').value,
                zip: document.getElementById('billingZip').value,
                phone: document.getElementById('billingPhone').value,
                email: document.getElementById('billingEmail').value,
            };
            await updateAddress(addressType, formData);
        });
    }

    if (shippingAddressForm) {
        shippingAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const addressType = shippingAddressForm.dataset.item;
            const formData = {
                first_name: document.getElementById('shippingFirstName').value,
                last_name: document.getElementById('shippingLastName').value,
                company: document.getElementById('shippingCompany').value,
                country: document.getElementById('shippingCountry').value,
                street: document.getElementById('shippingStreet').value,
                city: document.getElementById('shippingCity').value,
                state: document.getElementById('shippingState').value,
                zip: document.getElementById('shippingZip').value,
                phone: document.getElementById('shippingPhone').value,
                email: document.getElementById('shippingEmail').value,
            };
            await updateAddress(addressType, formData);
        });
    }


    // Initial load logic based on path
    if (window.location.pathname.startsWith('/dashboard')) {
        checkDashboardAccess();
    } else {
        handleAuthPages();
    }
});