document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard Initialized');

    // ==================== CHECK TOKEN ====================
    const userToken = localStorage.getItem('userToken');
    
    if (!userToken) {
        console.log('❌ No token - Redirecting to login');
        window.location.href = '/login.html';
        return;
    }

    console.log('✅ Token found');

    // ==================== API CALL ====================
    async function apiCall(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('userToken');

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(endpoint, options);

            if (response.status === 401) {
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return null;
            }

            if (response.status === 204) {
                return { success: true };
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    // ==================== LOAD USER DATA ====================
    async function loadUserData() {
        console.log('👤 Loading user data...');

        const data = await apiCall('/api/user/profile');

        if (!data || !data.user) {
            console.error('❌ No user data');
            return;
        }

        const user = data.user;
        console.log('✅ User data:', user);

        // Get name, email, phone
        const fullName = user.name || 'User';
        const email = user.email || '';
        const phone = user.phone || user.phone_number || '(+91) XXXXXXXXXX';

        // ===== UPDATE HEADER =====
        const headerName = document.querySelector('.user-infor .name');
        const headerEmail = document.querySelector('.user-infor .mail');
        const headerAvatar = document.querySelector('.user-infor .avatar img');

        if (headerName) {
            headerName.textContent = fullName;
            console.log('✅ Header name updated');
        }

        if (headerEmail) {
            headerEmail.textContent = email;
            console.log('✅ Header email updated');
        }

        if (headerAvatar && user.avatar_url) {
            headerAvatar.src = user.avatar_url;
        }

        // ===== UPDATE ORDER DETAIL MODAL =====
        const orderName = document.querySelector('.order_name');
        const orderPhone = document.querySelector('.order_phone');
        const orderEmail = document.querySelector('.order_email');

        if (orderName) {
            orderName.textContent = fullName;
            console.log('✅ Order modal name updated:', fullName);
        }

        if (orderPhone) {
            orderPhone.textContent = phone;
            console.log('✅ Order modal phone updated:', phone);
        }

        if (orderEmail) {
            orderEmail.textContent = email;
            console.log('✅ Order modal email updated:', email);
        }

        // ===== UPDATE SETTINGS FORM =====
        const nameParts = fullName.split(' ');
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const phoneInput = document.getElementById('phoneNumber');
        const emailInput = document.getElementById('email');

        if (firstNameInput) firstNameInput.value = nameParts[0] || '';
        if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';
        if (phoneInput) phoneInput.value = phone;
        if (emailInput) emailInput.value = email;

        console.log('✅ All user data displayed');
    }

    // ==================== LOGOUT ====================
    const logoutLink = document.querySelector('a[href="login.html"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        });
    }

    // ==================== INITIALIZE ====================
    loadUserData();
});