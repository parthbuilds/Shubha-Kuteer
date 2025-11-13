document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard Initialized');

    // ==================== GLOBAL STATE ====================
    const userToken = localStorage.getItem('userToken');
    console.log('🔑 Token Check:', userToken ? '✅ Found' : '❌ Not Found');

    // Only redirect if NO token AND on dashboard page
    if (!userToken && window.location.pathname.includes('dashboard')) {
        console.log('❌ No token on dashboard - Redirecting to login');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 500);
        return;
    }

    if (!userToken) {
        console.log('⚠️ No token but not on dashboard');
        return;
    }

    // ==================== DOM ELEMENTS ====================
    const userName = document.querySelector('.user-infor .name');
    const userEmail = document.querySelector('.user-infor .mail');
    const userAvatar = document.querySelector('.user-infor .avatar img');
    const logoutBtn = document.querySelector('.menu-tab a.logout-btn');

    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // ==================== API CALL FUNCTION ====================
    async function apiCall(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('userToken');
        
        if (!token) {
            console.warn('❌ No token available for API call');
            return null;
        }

        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            console.log(`📡 ${method} ${endpoint}`);
            const response = await fetch(endpoint, config);
            
            console.log(`✅ Status: ${response.status}`);

            // Handle 401 - Token expired
            if (response.status === 401) {
                console.warn('🔐 Token expired');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return null;
            }

            // Handle 204 - No content
            if (response.status === 204) {
                return { success: true };
            }

            const data = await response.json();
            console.log(`📦 Response:`, data);
            return data;

        } catch (error) {
            console.error('❌ API Error:', error);
            return null;
        }
    }

    // ==================== 1. LOAD USER PROFILE ====================
    async function loadUserProfile() {
        console.log('👤 Loading user profile...');

        const response = await apiCall('/api/user/profile');

        if (!response) {
            console.error('❌ No response from API');
            return false;
        }

        // Handle different response structures
        const user = response.user || response.data || response;

        if (!user || !user.name) {
            console.error('❌ No user data in response');
            console.error('Response structure:', response);
            return false;
        }

        console.log('✅ User data:', user);

        // Display in header
        if (userName) {
            userName.textContent = user.name;
            console.log('✅ Name set:', user.name);
        }

        if (userEmail) {
            userEmail.textContent = user.email || '';
            console.log('✅ Email set:', user.email);
        }

        if (userAvatar && user.avatar_url) {
            userAvatar.src = user.avatar_url;
        }

        // Fill form fields
        if (firstNameInput || lastNameInput) {
            const nameParts = (user.name || '').split(' ');
            if (firstNameInput) firstNameInput.value = nameParts[0] || '';
            if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';
        }

        if (emailInput) {
            emailInput.value = user.email || '';
        }

        return true;
    }

    // ==================== 2. LOAD DASHBOARD STATS ====================
    async function loadDashboardStats() {
        console.log('📊 Loading stats...');

        const response = await apiCall('/api/orders/stats');

        if (!response || !response.data) {
            console.warn('⚠️ No stats data');
            return;
        }

        const stats = response.data;
        const items = document.querySelectorAll('.overview .overview-item h5');

        if (items[0]) items[0].textContent = (stats.totalOrders - stats.completedOrders) || 0;
        if (items[1]) items[1].textContent = stats.cancelledOrders || 0;
        if (items[2]) items[2].textContent = stats.totalOrders || 0;

        console.log('✅ Stats loaded');
    }

    // ==================== 3. LOAD RECENT ORDERS ====================
    async function loadRecentOrders() {
        console.log('📋 Loading recent orders...');

        const response = await apiCall('/api/orders');

        const tbody = document.querySelector('.recent_order .list table tbody');
        if (!tbody) {
            console.warn('⚠️ Table tbody not found');
            return;
        }

        tbody.innerHTML = '';

        if (!response || !response.orders || response.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3">No orders</td></tr>';
            return;
        }

        const orders = response.orders.slice(0, 5);

        orders.forEach(order => {
            const productName = order.products && order.products[0] 
                ? order.products[0].name 
                : 'Product';

            const row = `
                <tr class="border-b">
                    <td class="py-3"><strong>${order.id}</strong></td>
                    <td class="py-3">${productName}</td>
                    <td class="py-3">₹${parseFloat(order.amount || 0).toFixed(2)}</td>
                    <td class="py-3"><span class="tag">${order.status}</span></td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        console.log('✅ Recent orders loaded');
    }

    // ==================== 4. LOAD ALL ORDERS ====================
    async function loadAllOrders() {
        console.log('📜 Loading all orders...');

        const response = await apiCall('/api/orders');

        const container = document.querySelector('.list_order');
        if (!container) {
            console.warn('⚠️ Order container not found');
            return;
        }

        container.innerHTML = '';

        if (!response || !response.orders || response.orders.length === 0) {
            container.innerHTML = '<p class="text-center py-4">No orders</p>';
            return;
        }

        response.orders.forEach(order => {
            const productsHtml = order.products
                ? order.products.map(p => `
                    <div class="py-2 border-b">
                        <strong>${p.name}</strong> - ${p.quantity}x ₹${parseFloat(p.price || 0).toFixed(2)}
                    </div>
                `).join('')
                : '<p>No products</p>';

            const html = `
                <div class="border rounded-lg p-5 mb-5">
                    <div class="flex justify-between mb-3">
                        <strong>Order #${order.id}</strong>
                        <span>${order.status}</span>
                    </div>
                    <div>${productsHtml}</div>
                    <div class="text-right mt-3">
                        <strong>₹${parseFloat(order.amount || 0).toFixed(2)}</strong>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });

        console.log('✅ All orders loaded');
    }

    // ==================== 5. UPDATE PROFILE ====================
    async function updateProfile() {
        const firstName = firstNameInput?.value.trim() || '';
        const lastName = lastNameInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';

        if (!firstName || !email) {
            alert('First name and email required');
            return;
        }

        const fullName = lastName ? `${firstName} ${lastName}` : firstName;

        const response = await apiCall('/api/user/profile', 'PUT', {
            name: fullName,
            email: email
        });

        if (response) {
            alert('Profile updated');
            await loadUserProfile();
        } else {
            alert('Failed to update');
        }
    }

    // ==================== 6. CHANGE PASSWORD ====================
    async function changePassword() {
        const current = currentPasswordInput?.value || '';
        const newPass = newPasswordInput?.value || '';
        const confirm = confirmPasswordInput?.value || '';

        if (!current || !newPass || !confirm) {
            alert('All fields required');
            return;
        }

        if (newPass !== confirm) {
            alert('Passwords do not match');
            return;
        }

        if (newPass.length < 6) {
            alert('Password too short');
            return;
        }

        const response = await apiCall('/api/user/password', 'PUT', {
            current_password: current,
            new_password: newPass
        });

        if (response) {
            alert('Password changed');
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            alert('Failed to change password');
        }
    }

    // ==================== 7. LOGOUT ====================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        });
    }

    // ==================== 8. TAB SWITCHING ====================
    document.querySelectorAll('.menu-tab .category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.classList.contains('logout-btn')) {
                e.preventDefault();
                const tab = item.getAttribute('data-item');

                document.querySelectorAll('.menu-tab .category-item').forEach(m => m.classList.remove('active'));
                item.classList.add('active');

                document.querySelectorAll('.list-filter .filter-item').forEach(f => f.classList.remove('active'));
                document.querySelector(`.list-filter .filter-item[data-item="${tab}"]`)?.classList.add('active');

                if (tab === 'dashboard') {
                    loadDashboardStats();
                    loadRecentOrders();
                } else if (tab === 'orders') {
                    loadAllOrders();
                } else if (tab === 'setting') {
                    loadUserProfile();
                }
            }
        });
    });

    // ==================== 9. FORM HANDLERS ====================
    const profileForm = document.querySelector('.filter-item[data-item="setting"] form:first-of-type');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProfile();
        });
    }

    const passwordForms = document.querySelectorAll('.filter-item[data-item="setting"] form');
    if (passwordForms[1]) {
        passwordForms[1].addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }

    // ==================== 10. INITIALIZE ====================
    async function init() {
        console.log('⚙️ Initializing dashboard...');
        
        const loaded = await loadUserProfile();
        
        if (loaded) {
            await loadDashboardStats();
            await loadRecentOrders();
            await loadAllOrders();
            console.log('✅ Dashboard ready');
        } else {
            console.error('❌ Failed to load profile');
        }
    }

    init();
});