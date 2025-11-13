document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard JS Initialized');

    // ==================== CHECK IF USER IS LOGGED IN ====================
    const userToken = localStorage.getItem('userToken');
    
    if (!userToken) {
        console.log('❌ No token found - Redirecting to login');
        window.location.href = '/login.html';
        return;
    }

    console.log('✅ Token found');

    // ==================== DOM SELECTORS ====================
    const userName = document.querySelector('.user-infor .name');
    const userEmail = document.querySelector('.user-infor .mail');
    const userAvatar = document.querySelector('.user-infor .avatar img');

    // ==================== FETCH USER DATA ====================
    async function getUserData() {
        try {
            console.log('📡 Fetching user data...');
            
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            console.log('Response Status:', response.status);

            if (response.status === 401) {
                console.log('❌ Token expired - Redirecting to login');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return null;
            }

            const data = await response.json();
            console.log('📦 User Data:', data);

            return data;
        } catch (error) {
            console.error('❌ Error fetching user:', error);
            return null;
        }
    }

    // ==================== DISPLAY USER INFO ====================
    async function displayUserInfo() {
        console.log('👤 Displaying user info...');

        const userData = await getUserData();

        if (!userData || !userData.user) {
            console.error('❌ No user data received');
            return;
        }

        const user = userData.user;

        // Display Name
        if (userName && user.name) {
            userName.textContent = user.name;
            console.log('✅ Name displayed:', user.name);
        }

        // Display Email
        if (userEmail && user.email) {
            userEmail.textContent = user.email;
            console.log('✅ Email displayed:', user.email);
        }

        // Display Avatar
        if (userAvatar && user.avatar_url) {
            userAvatar.src = user.avatar_url;
            console.log('✅ Avatar displayed');
        }

        console.log('✅ User info fully displayed');
    }

    // ==================== LOGOUT ====================
    const logoutBtn = document.querySelector('.menu-tab a.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('👋 Logging out...');
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        });
    }

    // ==================== START ====================
    displayUserInfo();
});