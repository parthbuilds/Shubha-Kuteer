document.addEventListener('DOMContentLoaded', () => {
    const logoutBtnAnchor = Array.from(document.querySelectorAll('.menu-tab a')).find(a => a.textContent.includes('Logout'));
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img');
    const uploadImgPreview = document.querySelector('.filter-item[data-item="setting"] .upload_img');
    const dashboardContentDiv = document.querySelector('.filter-item[data-item="dashboard"]');
    const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
    const listOrderContainer = document.querySelector('.list_order');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] form');
    const uploadImageInput = document.getElementById('uploadImage');
    const addressForms = document.querySelectorAll('.tab_address form');

    async function callApi(endpoint, method = 'GET', body = null, isFormData = false) {
        const token = localStorage.getItem('userToken');
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (body) config.body = isFormData ? body : JSON.stringify(body);

        try {
            const response = await fetch(endpoint, config);
            if (response.status === 401) {
                console.warn('Authentication failed, redirecting to login.');
                alert('Session expired or invalid. Please log in again.');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
                return Promise.reject(new Error('Unauthorized'));
            }
            const data = response.status !== 204 ? await response.json().catch(() => ({ message: `Failed to parse JSON for ${endpoint}`, success: response.ok })) : { message: 'Success', status: 204, success: true };
            if (!response.ok) throw new Error(data.message || `API call to ${endpoint} failed with status ${response.status}`);
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

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

    function updateUserInfo(user) {
        if (userDisplayName) userDisplayName.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (userDisplayEmail) userDisplayEmail.textContent = user.email || '';
        const avatarSrc = user.avatar_url || '/assets/images/user-avatar.png';
        if (userAvatarImg) userAvatarImg.src = avatarSrc;
        if (uploadImgPreview) uploadImgPreview.src = avatarSrc;
    }

    function renderRecentOrders(orders) {
        if (!recentOrdersTableBody) return;
        recentOrdersTableBody.innerHTML = '';
        if (orders && orders.length > 0) {
            orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).forEach(order => {
                const productsHtml = order.products && order.products.length > 0 ?
                    order.products.map(p => `
                        <a href="product-default.html?id=${p.id}" class="product flex items-center gap-3">
                            <img src="${p.image || '/assets/images/product/productDefault.png'}" alt="${p.name}" class="flex-shrink-0 w-12 h-12 rounded object-cover" />
                            <div class="info flex flex-col">
                                <strong class="product_name text-button">${p.name}</strong>
                                <span class="product_tag caption1 text-secondary">${p.category || 'N/A'}, ${p.gender || 'N/A'}</span>
                            </div>
                        </a>`).join('') : '<p class="text-secondary">No products</p>';
                const row = `
                    <tr class="item duration-300 border-b border-line">
                        <th scope="row" class="py-3 text-left"><strong class="text-title">${order.id || 'N/A'}</strong></th>
                        <td class="py-3">${productsHtml}</td>
                        <td class="py-3 price">₹${(order.amount || 0).toFixed(2)}</td>
                        <td class="py-3 text-right">
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status || 'Unknown'}</span>
                        </td>
                    </tr>`;
                recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            recentOrdersTableBody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-secondary">No recent orders.</td></tr>`;
        }
    }

    async function renderOrderHistory(orders) {
        if (!listOrderContainer) return;
        listOrderContainer.innerHTML = '';
        if (!orders || orders.length === 0) {
            listOrderContainer.innerHTML = '<p class="p-4 text-center text-secondary">No orders found.</p>';
            return;
        }

        orders.forEach(order => {
            const productsHtml = order.products && order.products.length > 0 ?
                order.products.map(p => `
                    <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                        <a href="product-default.html?id=${p.id}" class="flex items-center gap-5">
                            <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                <img src="${p.image || '/assets/images/product/productDefault.png'}" alt="${p.name}" class="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div class="prd_name text-title">${p.name}</div>
                                <div class="caption1 text-secondary mt-2">
                                    <span class="prd_quantity">${p.quantity || 1}</span>
                                    <span> x </span>
                                    <span class="prd_price">₹${(p.price || 0).toFixed(2)}</span>
                                    ${p.size ? `<span class="prd_size uppercase ml-2">${p.size}</span>` : ''}
                                    ${p.color ? `<span>/</span><span class="prd_color capitalize">${p.color}</span>` : ''}
                                </div>
                            </div>
                        </a>
                        <div class="text-title">Subtotal: ₹${((p.quantity || 1) * (p.price || 0)).toFixed(2)}</div>
                    </div>`).join('') : '<div class="p-3 text-secondary">No products for this order.</div>';

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
                        `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white btn_cancel_order" data-order-id="${order.id}">Cancel Order</button>` : ''}
                    </div>
                </div>`;
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

    async function loadDashboardContent() {
        if (!dashboardContentDiv) return;
        dashboardContentDiv.innerHTML = '<p>Loading dashboard...</p>';
        try {
            const data = await callApi('/api/dashboard-content');
            if (data && data.userData) {
                updateUserInfo(data.userData);
                dashboardContentDiv.innerHTML = `
                    <div class="overview grid sm:grid-cols-3 gap-5">
                        <div class="overview-item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                            <div class="counter">
                                <span class="text-secondary">Awaiting Pickup</span>
                                <h5 class="heading5 mt-1">${data.dashboardStats?.awaitingPickup || 0}</h5>
                            </div>
                            <span class="ph ph-hourglass-medium text-4xl"></span>
                        </div>
                        <div class="overview-item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                            <div class="counter">
                                <span class="text-secondary">Cancelled Orders</span>
                                <h5 class="heading5 mt-1">${data.dashboardStats?.cancelledOrders || 0}</h5>
                            </div>
                            <span class="ph ph-receipt-x text-4xl"></span>
                        </div>
                        <div class="overview-item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                            <div class="counter">
                                <span class="text-secondary">Total Number of Orders</span>
                                <h5 class="heading5 mt-1">${data.dashboardStats?.totalOrders || 0}</h5>
                            </div>
                            <span class="ph ph-package text-4xl"></span>
                        </div>
                    </div>
                    <div class="recent_order pt-5 px-5 pb-2 mt-7 border border-line rounded-xl">
                        <h6 class="heading6">Recent Orders</h6>
                        <div class="list overflow-x-auto w-full mt-5">
                            <table class="w-full max-[1400px]:w-[700px] max-md:w-[700px]">
                                <thead class="border-b border-line">
                                    <tr>
                                        <th scope="col" class="pb-3 text-left text-sm font-bold uppercase text-secondary whitespace-nowrap">Order</th>
                                        <th scope="col" class="pb-3 text-left text-sm font-bold uppercase text-secondary whitespace-nowrap">Products</th>
                                        <th scope="col" class="pb-3 text-left text-sm font-bold uppercase text-secondary whitespace-nowrap">Pricing</th>
                                        <th scope="col" class="pb-3 text-right text-sm font-bold uppercase text-secondary whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                `;
                renderRecentOrders(data.recentOrders);
            } else {
                dashboardContentDiv.innerHTML = `<p class="error text-red-500">Failed to retrieve dashboard data.</p>`;
            }
        } catch (error) {
            dashboardContentDiv.innerHTML = `<p class="error text-red-500">Failed to load dashboard: ${error.message}</p>`;
        }
    }

    async function filterOrdersByStatus(status) {
        document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => item.classList.remove('active'));
        const activeTab = document.querySelector(`.tab_order .menu-tab .tab-item[data-status="${status}"]`);
        if (activeTab) activeTab.classList.add('active');

        const indicator = document.querySelector('.tab_order .menu-tab .indicator');
        if (indicator && activeTab) {
            indicator.style.width = activeTab.offsetWidth + 'px';
            indicator.style.left = activeTab.offsetLeft + 'px';
        }

        try {
            const endpoint = status === 'all' ? '/api/orders' : `/api/orders?status=${status}`;
            const response = await callApi(endpoint);
            renderOrderHistory(response.orders);
        } catch (error) {
            alert('Failed to load filtered orders.');
            if (listOrderContainer) listOrderContainer.innerHTML = '<p class="p-4 text-center text-red-500">Error loading orders.</p>';
        }
    }

    async function cancelOrder(orderId) {
        try {
            const result = await callApi(`/api/orders/${orderId}/cancel`, 'PUT', { status: 'cancelled' });
            alert(result.message || 'Order cancelled successfully!');
            await loadAllUserData();
            const activeStatusTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
            if (activeStatusTab) filterOrdersByStatus(activeStatusTab.dataset.status);
        } catch (error) {
            alert(error.message || 'Failed to cancel order.');
        }
    }

    function loadAddressData(addresses) {
        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        const billing = addresses.billing || {};
        const shipping = addresses.shipping || {};

        ['firstName', 'lastName', 'company', 'country', 'street', 'city', 'state', 'zip', 'phone', 'email'].forEach(field => {
            setValue(`billing${field.charAt(0).toUpperCase() + field.slice(1)}`, billing[field]);
            setValue(`shipping${field.charAt(0).toUpperCase() + field.slice(1)}`, shipping[field]);
        });
    }

    async function updateAddress(addressType, formData) {
        try {
            // Assuming an API endpoint like /api/user/address/billing or /api/user/address/shipping
            const result = await callApi(`/api/user/address/${addressType}`, 'PUT', formData);
            alert(result.message || `${addressType} address updated successfully!`);
            // Reload address data to reflect changes
            const userData = await callApi('/api/user/profile');
            loadAddressData(userData.user.addresses); // Assuming addresses are nested under user
        } catch (error) {
            alert(error.message || `Failed to update ${addressType} address.`);
        }
    }

    function loadProfileData(user) {
        updateUserInfo(user);

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
            const profileData = await callApi('/api/user/profile');
            loadProfileData(profileData.user);
        } catch (error) {
            alert(error.message || 'Failed to update profile.');
        }
    }

    async function updateProfileAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const result = await callApi('/api/user/avatar', 'POST', formData, true); // true for FormData
            alert(result.message || 'Avatar updated successfully!');
            const profileData = await callApi('/api/user/profile');
            updateUserInfo(profileData.user); // Update avatar display immediately
        } catch (error) {
            alert(error.message || 'Failed to upload avatar.');
        }
    }

    async function changePassword(formData) {
        try {
            if (formData.new_password !== formData.confirm_new_password) throw new Error('New passwords do not match.');
            if (!formData.new_password || formData.new_password.length < 6) throw new Error('New password must be at least 6 characters.');

            const result = await callApi('/api/user/password', 'PUT', { current_password: formData.current_password, new_password: formData.new_password });
            alert(result.message || 'Password changed successfully!');
            document.getElementById('password').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } catch (error) {
            alert(error.message || 'Failed to change password.');
        }
    }

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
                document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(btn => btn.classList.remove('active'));
                firstOrderTabItem.classList.add('active');
            }
            filterOrdersByStatus('all');
        } else if (tabName === 'dashboard') {
            loadDashboardContent();
        }
    }

    async function loadAllUserData() {
        try {
            const profileResponse = await callApi('/api/user/profile');
            if (profileResponse.user) loadProfileData(profileResponse.user);

            const ordersResponse = await callApi('/api/orders');
            if (ordersResponse.success && ordersResponse.orders) {
                renderRecentOrders(ordersResponse.orders);
                renderOrderHistory(ordersResponse.orders);
            }

            const addressResponse = await callApi('/api/user/addresses'); // Assuming a dedicated addresses endpoint
            if (addressResponse.success && addressResponse.addresses) {
                loadAddressData(addressResponse.addresses);
            }
        } catch (error) {
            if (error.message !== 'Unauthorized') alert('Failed to load user data. Please refresh.');
        }
    }

    function handleLogout(event) {
        event.preventDefault();
        localStorage.removeItem('userToken');
        alert('You have been logged out.');
        window.location.href = '/login.html';
    }

    async function checkDashboardAccess() {
        if (!window.location.pathname.startsWith('/dashboard')) return;

        const token = localStorage.getItem('userToken');
        if (!token) {
            alert('You must be logged in to view the dashboard.');
            window.location.href = '/login.html';
            return;
        }

        try {
            const authData = await callApi('/api/auth/check');
            if (authData.message === 'Authorized ✅') {
                if (logoutBtnAnchor) {
                    logoutBtnAnchor.textContent = 'Logout';
                    logoutBtnAnchor.removeEventListener('click', handleLogout);
                    logoutBtnAnchor.addEventListener('click', handleLogout);
                }
                await loadAllUserData();
                switchTab('dashboard');
            } else {
                localStorage.removeItem('userToken');
                alert('Session invalid. Please log in again.');
                window.location.href = '/login.html';
            }
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                localStorage.removeItem('userToken');
                alert('An error occurred during authentication. Please log in again.');
                window.location.href = '/login.html';
            }
        }
    }

    async function handleAuthPages() {
        if (window.location.pathname === '/login.html' || window.location.pathname === '/register.html') {
            const token = localStorage.getItem('userToken');
            if (token) {
                try {
                    const data = await callApi('/api/auth/check');
                    if (data.message === 'Authorized ✅') {
                        window.location.href = '/dashboard.html';
                    }
                } catch (error) {
                    if (error.message !== 'Unauthorized') console.warn('Auth check failed on login/register page:', error);
                    localStorage.removeItem('userToken');
                }
            }
        }
    }

    // Event Listeners
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const { email, password } = loginForm.elements;
            try {
                const response = await callApi('/api/auth/login', 'POST', { email: email.value, password: password.value });
                if (response && response.token) {
                    localStorage.setItem('userToken', response.token);
                    alert(response.message);
                    window.location.href = '/dashboard.html';
                } else alert(response.message || 'Login failed. Check credentials.');
            } catch (error) {
                alert(error.message || 'Error during login.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const { name, email, password, confirmPassword } = registerForm.elements;
            if (password.value !== confirmPassword.value) {
                alert('Passwords do not match.');
                return;
            }
            try {
                const response = await callApi('/api/auth/register', 'POST', { name: name.value, email: email.value, password: password.value });
                alert(response.message);
                if (response.message.includes("successful")) window.location.href = '/login.html';
            } catch (error) {
                alert(error.message || 'Error during registration.');
            }
        });
    }

    document.querySelectorAll('.menu-tab .category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.currentTarget.dataset.item;
            if (tabName) switchTab(tabName);
        });
    });

    document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const status = e.currentTarget.dataset.status;
            filterOrdersByStatus(status);
        });
    });

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

    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('password').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword || currentPassword || confirmPassword) {
                await changePassword({ current_password: currentPassword, new_password: newPassword, confirm_new_password: confirmPassword });
            } else {
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const email = document.getElementById('email').value;
                const phoneNumber = document.getElementById('phoneNumber').value;
                const gender = document.getElementById('gender').value;
                const dob = document.getElementById('birth').value;
                
                await updateProfile({ 
                    first_name: firstName, 
                    last_name: lastName, 
                    email: email,
                    phone_number: phoneNumber,
                    gender: gender !== 'default' ? gender : null,
                    dob: dob || null
                });
            }
        });
    }

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

    addressForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const addressType = form.dataset.item;
            if (!addressType) {
                alert("Address form type not identified.");
                return;
            }
            const formData = {
                first_name: form.querySelector('[id$="FirstName"]').value,
                last_name: form.querySelector('[id$="LastName"]').value,
                company: form.querySelector('[id$="Company"]').value,
                country: form.querySelector('[id$="Country"]').value,
                street: form.querySelector('[id$="Street"]').value,
                city: form.querySelector('[id$="City"]').value,
                state: form.querySelector('[id$="State"]').value,
                zip: form.querySelector('[id$="Zip"]').value,
                phone: form.querySelector('[id$="Phone"]').value,
                email: form.querySelector('[id$="Email"]').value,
            };
            await updateAddress(addressType, formData);
        });
    });

    if (logoutBtnAnchor) logoutBtnAnchor.addEventListener('click', handleLogout);

    if (window.location.pathname.startsWith('/dashboard')) checkDashboardAccess();
    else handleAuthPages();
});