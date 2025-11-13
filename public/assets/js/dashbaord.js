document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard JS Initialized');

    // ==================== GLOBAL VARIABLES ====================
    let currentUser = null;
    let allOrders = [];

    // ==================== DOM SELECTORS ====================
    const logoutBtnAnchor = document.querySelector('.menu-tab a.logout-btn');
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img');
    const uploadImgPreview = document.getElementById('uploadImgPreview');
    const dashboardContentDiv = document.getElementById('dashboard-content');
    
    // Profile Form Elements
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    // Form References
    const profileForm = document.querySelector('.filter-item[data-item="setting"] form');
    const passwordForm = document.querySelectorAll('.filter-item[data-item="setting"] form')[1];

    // ==================== UTILITY: API CALL FUNCTION ====================
    async function callApi(endpoint, method = 'GET', body = null, isFormData = false) {
        const currentToken = localStorage.getItem('userToken');
        
        console.log(`📡 API ${method}: ${endpoint}`);
        
        if (!currentToken && !endpoint.includes('/login')) {
            console.warn('❌ No token found - Redirecting to login');
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
            return null;
        }

        const headers = isFormData 
            ? { 'Authorization': `Bearer ${currentToken}` }
            : {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
              };

        const config = {
            method,
            headers,
            body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        };

        try {
            const response = await fetch(endpoint, config);
            console.log(`✅ Status: ${response.status}`);

            if (response.status === 401) {
                console.warn('🔐 Unauthorized - Token expired');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return null;
            }

            if (response.status === 204) {
                return { success: true, message: 'Success' };
            }

            const data = await response.json().catch(() => {
                console.error('Failed to parse JSON response');
                return null;
            });

            if (!response.ok) {
                throw new Error(data?.message || `API call failed with status ${response.status}`);
            }

            console.log('📦 Response:', data);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
            return null;
        }
    }

    // ==================== 1. LOGOUT HANDLER ====================
    function handleLogout(event) {
        if (event) event.preventDefault();
        console.log('👋 User logging out...');
        localStorage.removeItem('userToken');
        alert('You have been logged out successfully.');
        window.location.href = '/login.html';
    }

    if (logoutBtnAnchor) {
        logoutBtnAnchor.addEventListener('click', handleLogout);
    }

    // ==================== 2. LOAD USER PROFILE ====================
    async function loadUserProfile() {
        try {
            console.log('👤 Loading user profile...');
            const profileData = await callApi('/api/user/profile', 'GET');

            if (!profileData || !profileData.user) {
                console.error('❌ No user data returned');
                return null;
            }

            currentUser = profileData.user;
            console.log('✅ User Profile Loaded:', currentUser);

            // Update header with user info
            if (userDisplayName) {
                userDisplayName.textContent = currentUser.name || currentUser.first_name || 'User';
            }
            if (userDisplayEmail) {
                userDisplayEmail.textContent = currentUser.email || '';
            }

            // Update avatar
            const avatarSrc = currentUser.avatar_url || currentUser.avatar || '/assets/images/user-avatar.png';
            if (userAvatarImg) {
                userAvatarImg.src = avatarSrc;
                userAvatarImg.onerror = () => {
                    userAvatarImg.src = '/assets/images/user-avatar.png';
                };
            }
            if (uploadImgPreview) {
                uploadImgPreview.src = avatarSrc;
            }

            // Update profile form fields
            const fullName = currentUser.name || '';
            const nameParts = fullName.split(' ');
            const firstNameValue = nameParts[0] || '';
            const lastNameValue = nameParts.slice(1).join(' ') || '';

            if (firstName) firstName.value = firstNameValue;
            if (lastName) lastName.value = lastNameValue;
            if (email) email.value = currentUser.email || '';

            return currentUser;
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            alert('Failed to load user profile. Please try again.');
            return null;
        }
    }

    // ==================== 3. LOAD DASHBOARD OVERVIEW (STATS) ====================
    async function loadDashboardOverview() {
        try {
            console.log('📊 Loading dashboard overview...');
            const statsData = await callApi('/api/orders/stats', 'GET');

            if (!statsData || !statsData.data) {
                console.warn('⚠️ No stats data returned');
                return;
            }

            const stats = statsData.data;
            console.log('📈 Dashboard Stats:', stats);

            // Update overview cards
            const overviewItems = document.querySelectorAll('.overview .overview-item h5');
            
            if (overviewItems[0]) {
                const awaitingPickup = (stats.totalOrders || 0) - (stats.completedOrders || 0);
                overviewItems[0].textContent = Math.max(0, awaitingPickup);
            }
            if (overviewItems[1]) {
                overviewItems[1].textContent = stats.cancelledOrders || 0;
            }
            if (overviewItems[2]) {
                overviewItems[2].textContent = stats.totalOrders || 0;
            }

            console.log('✅ Dashboard overview updated');
        } catch (error) {
            console.error('❌ Error loading dashboard overview:', error);
        }
    }

    // ==================== 4. LOAD RECENT ORDERS ====================
    async function loadRecentOrders() {
        try {
            console.log('📋 Loading recent orders...');
            const ordersData = await callApi('/api/orders', 'GET');

            if (!ordersData || !ordersData.orders) {
                console.warn('⚠️ No orders data returned');
                const tbody = document.querySelector('.recent_order .list table tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="4" class="py-3 text-center text-secondary">No orders found.</td></tr>';
                }
                return;
            }

            const orders = ordersData.orders.slice(0, 5); // Get first 5 orders
            allOrders = ordersData.orders; // Store all orders
            console.log('🛒 Recent Orders:', orders);

            const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
            if (!recentOrdersTableBody) {
                console.warn('⚠️ Recent orders table body not found');
                return;
            }

            recentOrdersTableBody.innerHTML = '';

            if (orders.length === 0) {
                recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="py-3 text-center text-secondary">No orders found.</td></tr>';
                return;
            }

            orders.forEach(order => {
                // Build product HTML
                let productsHtml = '';
                if (order.products && order.products.length > 0) {
                    productsHtml = order.products.map(product => `
                        <a href="product-default.html?id=${product.id || ''}" class="product flex items-center gap-3">
                            <img src="${product.image || product.thumbImage?.[0] || '/assets/images/product/productDefault.png'}"
                                alt="${product.name || 'Product'}" 
                                class="flex-shrink-0 w-12 h-12 rounded object-cover"
                                onerror="this.src='/assets/images/product/productDefault.png'" />
                            <div class="info">
                                <strong class="product_name text-button">${product.name || 'Unknown Product'}</strong>
                                <span class="product_tag caption1 text-secondary">${product.category || 'N/A'}</span>
                            </div>
                        </a>
                    `).join('');
                } else {
                    productsHtml = '<span class="text-secondary">No products</span>';
                }

                const statusColor = getStatusColor(order.status);
                const row = `
                    <tr class="item border-b border-line hover:bg-gray-50">
                        <th class="py-3 text-left">
                            <strong class="text-title">${order.id || 'N/A'}</strong>
                        </th>
                        <td class="py-3">${productsHtml}</td>
                        <td class="py-3 price">
                            <strong>₹${parseFloat(order.amount || 0).toFixed(2)}</strong>
                        </td>
                        <td class="py-3 text-right">
                            <span class="tag px-4 py-1.5 rounded-full bg-${statusColor}-100 text-${statusColor}-600 caption1 font-semibold">
                                ${order.status || 'Unknown'}
                            </span>
                        </td>
                    </tr>
                `;
                recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
            });

            console.log('✅ Recent orders loaded');
        } catch (error) {
            console.error('❌ Error loading recent orders:', error);
        }
    }

    // ==================== 5. LOAD ALL ORDERS FOR ORDER HISTORY ====================
    async function loadOrderHistory() {
        try {
            console.log('📜 Loading order history...');
            const ordersData = await callApi('/api/orders', 'GET');

            if (!ordersData || !ordersData.orders) {
                console.warn('⚠️ No orders data returned');
                const listOrderContainer = document.querySelector('.list_order');
                if (listOrderContainer) {
                    listOrderContainer.innerHTML = '<p class="p-4 text-center text-secondary">No orders found.</p>';
                }
                return;
            }

            const orders = ordersData.orders;
            allOrders = orders;
            console.log('📦 All Orders:', orders);

            const listOrderContainer = document.querySelector('.list_order');
            if (!listOrderContainer) {
                console.warn('⚠️ Order container not found');
                return;
            }

            listOrderContainer.innerHTML = '';

            if (orders.length === 0) {
                listOrderContainer.innerHTML = '<p class="p-4 text-center text-secondary">No orders found.</p>';
                return;
            }

            orders.forEach(order => {
                // Build products list HTML
                let productsHtml = '';
                if (order.products && order.products.length > 0) {
                    productsHtml = order.products.map(product => `
                        <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                            <a href="product-default.html?id=${product.id || ''}" class="flex items-center gap-5 flex-1">
                                <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                    <img src="${product.image || product.thumbImage?.[0] || '/assets/images/product/productDefault.png'}"
                                        alt="${product.name || 'Product'}"
                                        class="w-full h-full object-cover"
                                        onerror="this.src='/assets/images/product/productDefault.png'" />
                                </div>
                                <div>
                                    <div class="prd_name text-title">${product.name || 'Unknown Product'}</div>
                                    <div class="caption1 text-secondary mt-2">
                                        <span class="prd_quantity">${product.quantity || 1}</span>
                                        <span> x </span>
                                        <span class="prd_price">₹${parseFloat(product.price || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </a>
                            <div class="text-title font-semibold">
                                ₹${(parseFloat(product.quantity || 1) * parseFloat(product.price || 0)).toFixed(2)}
                            </div>
                        </div>
                    `).join('');
                } else {
                    productsHtml = '<div class="p-3 text-secondary">No products in this order.</div>';
                }

                const statusColor = getStatusColor(order.status);
                const orderItemHTML = `
                    <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs overflow-hidden" data-order-id="${order.id}">
                        <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line bg-gray-50">
                            <div class="flex items-center gap-2">
                                <strong class="text-title">Order:</strong>
                                <strong class="order_number text-button uppercase">#${order.id || 'N/A'}</strong>
                            </div>
                            <div class="flex items-center gap-2">
                                <strong class="text-title">Status:</strong>
                                <span class="tag px-4 py-1.5 rounded-full bg-${statusColor}-100 text-${statusColor}-600 caption1 font-semibold">
                                    ${order.status || 'Unknown'}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <strong class="text-title">Total:</strong>
                                <strong class="text-button">₹${parseFloat(order.amount || 0).toFixed(2)}</strong>
                            </div>
                        </div>
                        <div class="list_prd px-5">${productsHtml}</div>
                        <div class="flex flex-wrap gap-4 p-5 bg-gray-50">
                            <button class="button-main btn_order_detail" data-order-id="${order.id}">View Details</button>
                            ${(['pending', 'processing'].includes((order.status || '').toLowerCase())) ?
                            `<button class="button-main bg-surface border border-line btn_cancel_order" data-order-id="${order.id}">Cancel Order</button>`
                            : ''}
                        </div>
                    </div>
                `;
                listOrderContainer.insertAdjacentHTML('beforeend', orderItemHTML);
            });

            // Attach event listeners
            listOrderContainer.querySelectorAll('.btn_cancel_order').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    if (confirm('Are you sure you want to cancel this order?')) {
                        await cancelOrder(orderId);
                    }
                });
            });

            listOrderContainer.querySelectorAll('.btn_order_detail').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    showOrderDetail(orderId);
                });
            });

            console.log('✅ Order history loaded');
        } catch (error) {
            console.error('❌ Error loading order history:', error);
        }
    }

    // ==================== 6. CANCEL ORDER ====================
    async function cancelOrder(orderId) {
        try {
            console.log(`🗑️ Cancelling order ${orderId}...`);
            const result = await callApi(`/api/orders/${orderId}/cancel`, 'PUT', { status: 'cancelled' });

            if (result && result.message) {
                alert(result.message || 'Order cancelled successfully!');
                await loadOrderHistory();
                await loadDashboardOverview();
                await loadRecentOrders();
            } else {
                throw new Error('Failed to cancel order');
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            alert(error.message || 'Failed to cancel order.');
        }
    }

    // ==================== 7. SHOW ORDER DETAIL MODAL ====================
    function showOrderDetail(orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) {
            alert('Order not found');
            return;
        }

        console.log('📄 Showing order detail:', order);

        const modalHTML = `
            <div class="modal-overlay" id="orderDetailModal">
                <div class="modal-content rounded-lg p-6 max-w-2xl bg-white">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-title">Order Details</h2>
                        <button class="close-btn text-2xl">&times;</button>
                    </div>
                    
                    <div class="order-details space-y-4">
                        <div class="flex justify-between">
                            <span class="text-secondary">Order ID:</span>
                            <strong>${order.id}</strong>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-secondary">Status:</span>
                            <strong>${order.status}</strong>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-secondary">Order Date:</span>
                            <strong>${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-secondary">Total Amount:</span>
                            <strong class="text-lg">₹${parseFloat(order.amount || 0).toFixed(2)}</strong>
                        </div>
                    </div>

                    <div class="mt-6">
                        <h3 class="text-button mb-3">Products:</h3>
                        <div class="space-y-2">
                            ${order.products && order.products.length > 0 ?
                                order.products.map(p => `
                                    <div class="flex justify-between p-3 bg-gray-50 rounded">
                                        <div>
                                            <strong>${p.name}</strong>
                                            <p class="text-secondary text-sm">Qty: ${p.quantity || 1}</p>
                                        </div>
                                        <strong>₹${(parseFloat(p.quantity || 1) * parseFloat(p.price || 0)).toFixed(2)}</strong>
                                    </div>
                                `).join('')
                                : '<p class="text-secondary">No products</p>'}
                        </div>
                    </div>

                    <div class="mt-6 flex gap-3">
                        <button class="button-main flex-1 close-btn-modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('orderDetailModal');
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners to close buttons
        const modal = document.getElementById('orderDetailModal');
        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.close-btn-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ==================== 8. UPDATE PROFILE ====================
    async function updateProfile(formData) {
        try {
            console.log('✏️ Updating profile...');
            const result = await callApi('/api/user/profile', 'PUT', formData);

            if (result && result.message) {
                alert(result.message || 'Profile updated successfully!');
                await loadUserProfile();
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            alert(error.message || 'Failed to update profile.');
        }
    }

    // ==================== 9. CHANGE PASSWORD ====================
    async function changePassword(formData) {
        try {
            // Validation
            if (!formData.current_password || !formData.new_password) {
                throw new Error('All fields are required');
            }
            if (formData.new_password !== formData.confirm_new_password) {
                throw new Error('Passwords do not match.');
            }
            if (formData.new_password.length < 6) {
                throw new Error('Password must be at least 6 characters.');
            }

            console.log('🔐 Changing password...');
            const result = await callApi('/api/user/password', 'PUT', {
                current_password: formData.current_password,
                new_password: formData.new_password
            });

            if (result && result.message) {
                alert(result.message || 'Password changed successfully!');
                if (currentPassword) currentPassword.value = '';
                if (newPassword) newPassword.value = '';
                if (confirmPassword) confirmPassword.value = '';
            } else {
                throw new Error('Failed to change password');
            }
        } catch (error) {
            console.error('❌ Error changing password:', error);
            alert(error.message || 'Failed to change password.');
        }
    }

    // ==================== 10. GET STATUS COLOR ====================
    function getStatusColor(status) {
        const statusLower = (status || '').toLowerCase();
        const colors = {
            'pending': 'yellow',
            'processing': 'orange',
            'shipped': 'blue',
            'delivery': 'purple',
            'delivered': 'green',
            'completed': 'green',
            'cancelled': 'red',
            'returned': 'red'
        };
        return colors[statusLower] || 'gray';
    }

    // ==================== 11. SWITCH TABS ====================
    function switchTab(tabName) {
        console.log(`📑 Switching to tab: ${tabName}`);

        // Update menu items
        const menuItems = document.querySelectorAll('.menu-tab .category-item');
        menuItems.forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-tab .category-item[data-item="${tabName}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        // Update content tabs
        const filterItems = document.querySelectorAll('.list-filter .filter-item');
        filterItems.forEach(item => item.classList.remove('active'));
        const activeContentBlock = document.querySelector(`.list-filter .filter-item[data-item="${tabName}"]`);
        if (activeContentBlock) activeContentBlock.classList.add('active');

        // Load data for specific tabs
        if (tabName === 'orders') {
            loadOrderHistory();
        } else if (tabName === 'dashboard') {
            loadDashboardOverview();
            loadRecentOrders();
        } else if (tabName === 'setting') {
            loadUserProfile();
        }
    }

    // ==================== 12. FORM HANDLERS ====================
    
    // Profile Form Handler
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstNameVal = firstName?.value || '';
            const lastNameVal = lastName?.value || '';
            const emailVal = email?.value || '';

            if (!firstNameVal || !emailVal) {
                alert('First name and email are required');
                return;
            }

            await updateProfile({
                name: `${firstNameVal} ${lastNameVal}`.trim(),
                email: emailVal
            });
        });
    }

    // Password Form Handler
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPasswordVal = currentPassword?.value || '';
            const newPasswordVal = newPassword?.value || '';
            const confirmPasswordVal = confirmPassword?.value || '';

            await changePassword({
                current_password: currentPasswordVal,
                new_password: newPasswordVal,
                confirm_new_password: confirmPasswordVal
            });
        });
    }

    // ==================== 13. MENU NAVIGATION ====================
    const menuItems = document.querySelectorAll('.menu-tab .category-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.classList.contains('logout-btn')) {
                e.preventDefault();
                const tabName = item.getAttribute('data-item');
                if (tabName) {
                    switchTab(tabName);
                }
            }
        });
    });

    // ==================== 14. CHECK DASHBOARD ACCESS & INITIALIZE ====================
    async function checkDashboardAccess() {
        const currentToken = localStorage.getItem('userToken');

        if (!currentToken) {
            console.log('🔐 No token found. Redirecting to login.');
            window.location.href = '/login.html';
            return;
        }

        try {
            console.log('✅ Token found. Initializing dashboard...');
            
            // Verify token by checking auth
            const authData = await callApi('/api/auth/check', 'GET');

            if (authData && (authData.message === 'Authorized ✅' || authData.authorized === true)) {
                console.log('✅ User is authenticated. Loading dashboard data...');
                
                // Load all initial data
                await loadUserProfile();
                await loadDashboardOverview();
                await loadRecentOrders();
                await loadOrderHistory();
                
                // Initialize with dashboard tab
                switchTab('dashboard');
                
            } else {
                console.warn('⚠️ Auth check failed');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('❌ Dashboard access check failed:', error);
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        }
    }

    // ==================== 15. PAGE DETECTION & INITIALIZATION ====================
    if (window.location.pathname.includes('dashboard')) {
        console.log('📍 Dashboard page detected - Checking access...');
        checkDashboardAccess();
    }
});