document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const logoutBtnAnchor = document.querySelector('.menu-tab a.logout-btn');
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img');
    const uploadImgPreview = document.getElementById('uploadImgPreview');
    const dashboardContentDiv = document.getElementById('dashboard-content');

    // --- Utility function for API calls ---
    async function callApi(endpoint, method = 'GET', body = null, isFormData = false) {
        const currentToken = localStorage.getItem('userToken');
        if (!currentToken) {
            console.warn('No token found');
            return null;
        }

        const headers = {
            'Authorization': `Bearer ${currentToken}`
        };

        const config = {
            method,
            headers: isFormData ? { 'Authorization': `Bearer ${currentToken}` } : { ...headers, 'Content-Type': 'application/json' },
            body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        };

        try {
            const response = await fetch(endpoint, config);

            if (response.status === 401) {
                console.warn('Authentication failed. Redirecting to login.');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return null;
            }

            if (response.status === 204) {
                return { success: true, message: 'Success' };
            }

            const data = await response.json().catch(() => {
                console.error(`Failed to parse JSON for ${endpoint}`);
                return null;
            });

            if (!response.ok) {
                throw new Error(data?.message || `API call failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // --- Logout Handler ---
    function handleLogout(event) {
        event.preventDefault();
        console.log('User logging out...');
        localStorage.removeItem('userToken');
        alert('You have been logged out.');
        window.location.href = '/login.html';
    }

    // --- 1. Load User Profile Data ---
    async function loadUserProfile() {
        try {
            console.log('Loading user profile...');
            const profileData = await callApi('/api/user/profile', 'GET');

            if (!profileData || !profileData.user) {
                console.error('No user data returned from /api/user/profile');
                return null;
            }

            const user = profileData.user;
            console.log('User profile loaded:', user);

            // Update header with user info
            if (userDisplayName) {
                userDisplayName.textContent = user.name || user.first_name || 'User';
            }
            if (userDisplayEmail) {
                userDisplayEmail.textContent = user.email || '';
            }

            // Update avatar
            const avatarSrc = user.avatar_url || '/assets/images/user-avatar.png';
            if (userAvatarImg) userAvatarImg.src = avatarSrc;
            if (uploadImgPreview) uploadImgPreview.src = avatarSrc;

            // Update profile form fields
            const firstName = user.name ? user.name.split(' ')[0] : '';
            const lastName = user.name ? user.name.split(' ').slice(1).join(' ') : '';

            document.getElementById('firstName').value = firstName;
            document.getElementById('lastName').value = lastName;
            document.getElementById('email').value = user.email || '';

            return user;
        } catch (error) {
            console.error('Error loading user profile:', error);
            alert('Failed to load user profile.');
            return null;
        }
    }

    // --- 2. Load Dashboard Overview (Stats) ---
    async function loadDashboardOverview() {
        try {
            console.log('Loading dashboard overview...');
            const statsData = await callApi('/api/orders/stats', 'GET');

            if (!statsData || !statsData.data) {
                console.warn('No stats data returned');
                return;
            }

            const stats = statsData.data;
            console.log('Dashboard stats:', stats);

            // Update overview cards
            const awaitingPickupEl = document.querySelector('.overview-item:nth-child(1) h5');
            const cancelledOrdersEl = document.querySelector('.overview-item:nth-child(2) h5');
            const totalOrdersEl = document.querySelector('.overview-item:nth-child(3) h5');

            if (awaitingPickupEl) {
                awaitingPickupEl.textContent = stats.totalOrders - stats.completedOrders || 0;
            }
            if (cancelledOrdersEl) {
                cancelledOrdersEl.textContent = stats.cancelledOrders || 0;
            }
            if (totalOrdersEl) {
                totalOrdersEl.textContent = stats.totalOrders || 0;
            }
        } catch (error) {
            console.error('Error loading dashboard overview:', error);
        }
    }

    // --- 3. Load Recent Orders ---
    async function loadRecentOrders() {
        try {
            console.log('Loading recent orders...');
            const ordersData = await callApi('/api/orders', 'GET');

            if (!ordersData || !ordersData.orders) {
                console.warn('No orders data returned');
                return;
            }

            const orders = ordersData.orders.slice(0, 5); // Get first 5 orders
            console.log('Recent orders:', orders);

            const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
            if (!recentOrdersTableBody) return;

            recentOrdersTableBody.innerHTML = '';

            if (orders.length === 0) {
                recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="py-3 text-center text-secondary">No orders found.</td></tr>';
                return;
            }

            orders.forEach(order => {
                const productsHtml = order.products && order.products.length > 0 ?
                    order.products.map(product => `
                        <a href="product-default.html?id=${product.id}" class="product flex items-center gap-3">
                            <img src="${product.image || '/assets/images/product/productDefault.png'}"
                                alt="${product.name}" class="flex-shrink-0 w-12 h-12 rounded object-cover" />
                            <div class="info">
                                <strong class="product_name text-button">${product.name}</strong>
                                <span class="product_tag caption1 text-secondary">${product.category || 'N/A'}</span>
                            </div>
                        </a>
                    `).join('') : '<p class="text-secondary">No products</p>';

                const statusColor = getStatusColor(order.status);
                const row = `
                    <tr class="item border-b border-line">
                        <th class="py-3 text-left">
                            <strong class="text-title">${order.id || 'N/A'}</strong>
                        </th>
                        <td class="py-3">${productsHtml}</td>
                        <td class="py-3 price">₹${(order.amount || 0).toFixed(2)}</td>
                        <td class="py-3 text-right">
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${statusColor} text-${statusColor} caption1 font-semibold">${order.status || 'Unknown'}</span>
                        </td>
                    </tr>
                `;
                recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
            });
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    // --- 4. Load All Orders for Order History ---
    async function loadOrderHistory() {
        try {
            console.log('Loading order history...');
            const ordersData = await callApi('/api/orders', 'GET');

            if (!ordersData || !ordersData.orders) {
                console.warn('No orders data returned');
                return;
            }

            const orders = ordersData.orders;
            console.log('All orders:', orders);

            const listOrderContainer = document.querySelector('.list_order');
            if (!listOrderContainer) return;

            listOrderContainer.innerHTML = '';

            if (orders.length === 0) {
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
                                    </div>
                                </div>
                            </a>
                            <div class="text-title">
                                ₹${((product.quantity || 1) * (product.price || 0)).toFixed(2)}
                            </div>
                        </div>
                    `).join('') : '<div class="p-3 text-secondary">No products in this order.</div>';

                const statusColor = getStatusColor(order.status);
                const orderItemHTML = `
                    <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs" data-order-id="${order.id}">
                        <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                            <div class="flex items-center gap-2">
                                <strong class="text-title">Order:</strong>
                                <strong class="order_number text-button uppercase">${order.id || 'N/A'}</strong>
                            </div>
                            <div class="flex items-center gap-2">
                                <strong class="text-title">Status:</strong>
                                <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${statusColor} text-${statusColor} caption1 font-semibold">${order.status || 'Unknown'}</span>
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
                            `<button class="button-main bg-surface border border-line btn_cancel_order" data-order-id="${order.id}">Cancel Order</button>`
                            : ''}
                        </div>
                    </div>
                `;
                listOrderContainer.insertAdjacentHTML('beforeend', orderItemHTML);
            });

            // Attach cancel order listeners
            listOrderContainer.querySelectorAll('.btn_cancel_order').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const orderId = e.target.dataset.orderId;
                    if (confirm('Cancel this order?')) {
                        await cancelOrder(orderId);
                    }
                });
            });
        } catch (error) {
            console.error('Error loading order history:', error);
        }
    }

    // --- 5. Cancel Order ---
    async function cancelOrder(orderId) {
        try {
            const result = await callApi(`/api/orders/${orderId}/cancel`, 'PUT', { status: 'cancelled' });
            alert(result.message || 'Order cancelled successfully!');
            await loadOrderHistory();
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(error.message || 'Failed to cancel order.');
        }
    }

    // --- 6. Update Profile ---
    async function updateProfile(formData) {
        try {
            const result = await callApi('/api/user/profile', 'PUT', formData);
            alert(result.message || 'Profile updated successfully!');
            await loadUserProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Failed to update profile.');
        }
    }

    // --- 7. Change Password ---
    async function changePassword(formData) {
        try {
            if (formData.new_password !== formData.confirm_new_password) {
                throw new Error('Passwords do not match.');
            }
            if (formData.new_password.length < 6) {
                throw new Error('Password must be at least 6 characters.');
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
            console.error('Error changing password:', error);
            alert(error.message || 'Failed to change password.');
        }
    }

    // --- 8. Get Status Color ---
    function getStatusColor(status) {
        const statusLower = (status || '').toLowerCase();
        const colors = {
            'pending': 'yellow',
            'processing': 'orange',
            'shipped': 'blue',
            'delivery': 'purple',
            'completed': 'green',
            'cancelled': 'red',
            'returned': 'red'
        };
        return colors[statusLower] || 'gray';
    }

    // --- 9. Switch Tabs ---
    function switchTab(tabName) {
        document.querySelectorAll('.menu-tab .category-item').forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-tab .category-item[data-item="${tabName}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        document.querySelectorAll('.list-filter .filter-item').forEach(item => item.classList.remove('active'));
        const activeContentBlock = document.querySelector(`.list-filter .filter-item[data-item="${tabName}"]`);
        if (activeContentBlock) activeContentBlock.classList.add('active');

        if (tabName === 'orders') {
            loadOrderHistory();
        } else if (tabName === 'dashboard') {
            loadDashboardOverview();
            loadRecentOrders();
        }
    }

    // --- 10. Check Dashboard Access ---
    async function checkDashboardAccess() {
        if (!window.location.pathname.includes('dashboard')) {
            return;
        }

        const currentToken = localStorage.getItem('userToken');
        if (!currentToken) {
            console.log('No token found. Redirecting to login.');
            window.location.href = '/login.html';
            return;
        }

        try {
            console.log('Checking dashboard access...');
            const authData = await callApi('/api/auth/check', 'GET');

            if (authData && authData.message === 'Authorized ✅') {
                console.log('User is authenticated. Loading dashboard...');
                
                // Load all user data
                await loadUserProfile();
                await loadDashboardOverview();
                await loadRecentOrders();
                await loadOrderHistory();
                
                // Set logout button
                if (logoutBtnAnchor) {
                    logoutBtnAnchor.addEventListener('click', handleLogout);
                }
                
                switchTab('dashboard');
            } else {
                console.warn('Auth check failed');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Dashboard access check failed:', error);
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        }
    }

    // --- 11. Login Form Handler ---
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
                    alert('Login successful!');
                    window.location.href = '/dashboard.html';
                } else {
                    alert(response?.message || 'Login failed.');
                }
            } catch (error) {
                alert(error.message || 'Login error.');
            }
        });
    }

    // --- 12. Profile Settings Form Handler ---
    const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] form');
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('password')?.value || '';
            const newPassword = document.getElementById('newPassword')?.value || '';
            const confirmPassword = document.getElementById('confirmPassword')?.value || '';
            const firstName = document.getElementById('firstName')?.value || '';
            const lastName = document.getElementById('lastName')?.value || '';
            const email = document.getElementById('email')?.value || '';

            if (newPassword) {
                await changePassword({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_new_password: confirmPassword
                });
            } else {
                const fullName = `${firstName} ${lastName}`.trim();
                await updateProfile({
                    name: fullName,
                    email: email
                });
            }
        });
    }

    // --- 13. Menu Navigation ---
    document.querySelectorAll('.menu-tab .category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.currentTarget.dataset.item;
            if (tabName) switchTab(tabName);
        });
    });

    // --- 14. Initialize ---
    if (window.location.pathname.includes('dashboard')) {
        checkDashboardAccess();
    } else if (window.location.pathname.includes('login')) {
        const token = localStorage.getItem('userToken');
        if (token) {
            window.location.href = '/dashboard.html';
        }
    }
});