document.addEventListener('DOMContentLoaded', () => {
    // Moved token retrieval to specific functions or callApi for consistency.
    // The 'logoutBtn' will always point to the login.html link, but we'll conditionally change its text/behavior.
    const logoutBtnAnchor = document.querySelector('.menu-tab a[href="login.html"]');
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img');
    const uploadImgPreview = document.querySelector('.upload_img'); // Also need to target this for avatar preview

    // --- Utility function for API calls ---
    async function callApi(endpoint, method = 'GET', body = null) {
        const currentToken = localStorage.getItem('userToken'); // Always get the latest token here

        const headers = {
            'Content-Type': 'application/json',
        };

        // Add Authorization header only if a token exists
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        } else {
            // Optional: Log a warning or throw an error if an API call is made without a token
            console.warn(`Attempted API call to ${endpoint} without an authentication token.`);
            // You might want to immediately redirect if most calls require auth
            // window.location.href = '/login.html';
            // throw new Error('Authentication required.');
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(endpoint, config);
            const data = await response.json().catch(() => {
                // Handle cases where response is not JSON (e.g., server error pages)
                console.error(`Failed to parse JSON for ${endpoint}. Response status: ${response.status}`);
                return { message: `Server error (${response.status})` };
            });

            if (!response.ok) {
                // Specific handling for 401 Unauthorized errors
                if (response.status === 401) {
                    alert('Session expired or invalid. Please log in again.');
                    localStorage.removeItem('userToken');
                    window.location.href = '/login.html';
                    return; // Crucial to stop execution after redirect
                }
                throw new Error(data.message || `API call to ${endpoint} failed with status ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`Network or fetch error for ${endpoint}:`, error);
            // Re-throw to be caught by specific function's try-catch if needed,
            // or handle as a general failure.
            throw error;
        }
    }

    // --- 1. Initial Authentication Check and Data Loading ---
    async function checkAuthAndLoadUserData() {
        const currentToken = localStorage.getItem('userToken'); // Always check the latest token

        if (!currentToken) {
            // User is not logged in, adjust UI for non-authenticated state
            console.log('No token found. User is not authenticated.');
            alert('Please log in to access your account.'); // This might be annoying, consider if always needed
            // Ensure logout button shows "Login" if user is not logged in
            if (logoutBtnAnchor) {
                logoutBtnAnchor.textContent = 'Login';
                logoutBtnAnchor.href = '/login.html';
            }
            window.location.href = '/login.html';
            return;
        }

        // If a token exists, try to validate it with the backend
        try {
            console.log('Token found, attempting authentication check...');
            const authData = await callApi('/api/auth/check');
            if (authData.message === 'Authorized ✅') {
                console.log('User is authenticated. ✅');
                // Adjust UI for authenticated state
                if (logoutBtnAnchor) {
                    logoutBtnAnchor.textContent = 'Logout';
                    // We'll handle logout logic with an event listener, not just href
                }

                // Proceed to load dashboard data
                await loadAndRenderAllUserData();
                switchTab('dashboard'); // Default to dashboard view
            } else {
                // If backend says not authorized but didn't return 401 (e.g., custom message)
                console.warn('Backend rejected token without 401:', authData.message);
                throw new Error(authData.message || 'Session invalid');
            }
        } catch (error) {
            console.error('Auth check error (in checkAuthAndLoadUserData catch block):', error);
            // The 401 handler in callApi usually catches this. This is for other errors.
            alert('Session expired or invalid. Please log in again.');
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        }
    }

    // --- 2. Dashboard Overview Functions ---
    function renderDashboardOverview(data) {
        if (!data) {
            console.warn('No dashboard overview data provided.');
            return;
        }
        document.querySelector('.overview-item:nth-child(1) h5').textContent = data.awaitingPickup || 0;
        document.querySelector('.overview-item:nth-child(2) h5').textContent = data.cancelledOrders || 0;
        document.querySelector('.overview-item:nth-child(3) h5').textContent = data.totalOrders || 0;
    }

    function renderRecentOrders(orders) {
        const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
        if (!recentOrdersTableBody) {
            console.warn('Recent orders table body not found.');
            return;
        }
        recentOrdersTableBody.innerHTML = ''; // Clear existing

        if (orders && orders.length > 0) {
            orders.slice(0, 5).forEach(order => { // Show up to 5 recent orders
                const productsHtml = order.products.map(product => `
                    <a href="product-default.html?id=${product.id}" class="product flex items-center gap-3">
                        <img src="${product.image || '/assets/images/product/productDefault.png'}"
                            alt="${product.name}" class="flex-shrink-0 w-12 h-12 rounded" />
                        <div class="info flex flex-col">
                            <strong class="product_name text-button">${product.name}</strong>
                            <span class="product_tag caption1 text-secondary">${product.category || ''}, ${product.gender || ''}</span>
                        </div>
                    </a>
                `).join('');

                const row = `
                    <tr class="item duration-300 border-b border-line">
                        <th scope="row" class="py-3 text-left">
                            <strong class="text-title">${order.order_number}</strong>
                        </th>
                        <td class="py-3">${productsHtml}</td>
                        <td class="py-3 price">₹${(order.total_amount || 0).toFixed(2)}</td>
                        <td class="py-3 text-right">
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status}</span>
                        </td>
                    </tr>
                `;
                recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            recentOrdersTableBody.innerHTML = `<tr><td colspan="4" class="py-3 text-center">No recent orders found.</td></tr>`;
        }
    }

    function getStatusColor(status) {
        switch (status ? status.toLowerCase() : '') { // Handle potential null/undefined status
            case 'pending': return 'yellow';
            case 'delivery': return 'purple';
            case 'completed': return 'success';
            case 'canceled': return 'red';
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
            listOrderContainer.innerHTML = '<p class="p-4 text-center">No orders found.</p>';
            return;
        }

        orders.forEach(order => {
            const productsHtml = order.products.map(product => `
                <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                    <a href="product-default.html?id=${product.id}" class="flex items-center gap-5">
                        <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                            <img src="${product.image || '/assets/images/product/productDefault.png'}"
                                alt="${product.name}" class="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div class="prd_name text-title">${product.name}</div>
                            <div class="caption1 text-secondary mt-2">
                                <span class="prd_size uppercase">${product.size || ''}</span>
                                <span>/</span>
                                <span class="prd_color capitalize">${product.color || ''}</span>
                            </div>
                        </div>
                    </a>
                    <div class="text-title">
                        <span class="prd_quantity">${product.quantity || 1}</span>
                        <span> X </span>
                        <span class="prd_price">₹${(product.price || 0).toFixed(2)}</span>
                    </div>
                </div>
            `).join('');

            const orderItemHTML = `
                <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs" data-order-id="${order.id}" data-order-status="${order.status.toLowerCase()}">
                    <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order Number:</strong>
                            <strong class="order_number text-button uppercase">${order.order_number}</strong>
                        </div>
                        <div class="flex items-center gap-2">
                            <strong class="text-title">Order status:</strong>
                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status}</span>
                        </div>
                    </div>
                    <div class="list_prd px-5">${productsHtml}</div>
                    <div class="flex flex-wrap gap-4 p-5">
                        <button class="button-main btn_order_detail">Order Details</button>
                        ${order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'delivery' ?
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

        const allOrders = document.querySelectorAll('.list_order .order_item');
        allOrders.forEach(orderItem => {
            if (status === 'all' || orderItem.dataset.orderStatus === status) {
                orderItem.style.display = 'block';
            } else {
                orderItem.style.display = 'none';
            }
        });

        // If you want server-side filtering (recommended for large datasets):
        // try {
        //     const endpoint = status === 'all' ? '/api/orders' : `/api/orders?status=${status}`;
        //     const filteredOrders = await callApi(endpoint);
        //     renderOrderHistory(filteredOrders.orders);
        // } catch (error) {
        //     console.error('Error filtering orders:', error);
        //     alert('Failed to filter orders.');
        // }
    }

    async function cancelOrder(orderId) {
        try {
            const result = await callApi(`/api/orders/cancel/${orderId}`, 'PUT');
            alert(result.message || 'Order cancelled successfully!');
            // After successful cancellation, re-fetch and re-render all relevant data
            await loadAndRenderAllUserData();
            // Re-apply current filter if any
            const activeStatusTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
            if (activeStatusTab) {
                filterOrdersByStatus(activeStatusTab.dataset.status);
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            alert(error.message || 'Failed to cancel order.');
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

        // Billing
        document.getElementById('billingFirstName').value = billingAddress.first_name || '';
        document.getElementById('billingLastName').value = billingAddress.last_name || '';
        document.getElementById('billingCompany').value = billingAddress.company || '';
        document.getElementById('billingCountry').value = billingAddress.country || '';
        document.getElementById('billingStreet').value = billingAddress.street || '';
        document.getElementById('billingCity').value = billingAddress.city || '';
        document.getElementById('billingState').value = billingAddress.state || '';
        document.getElementById('billingZip').value = billingAddress.zip || '';
        document.getElementById('billingPhone').value = billingAddress.phone || '';
        document.getElementById('billingEmail').value = billingAddress.email || '';

        // Shipping
        document.getElementById('shippingFirstName').value = shippingAddress.first_name || '';
        document.getElementById('shippingLastName').value = shippingAddress.last_name || '';
        document.getElementById('shippingCompany').value = shippingAddress.company || '';
        document.getElementById('shippingCountry').value = shippingAddress.country || '';
        document.getElementById('shippingStreet').value = shippingAddress.street || '';
        document.getElementById('shippingCity').value = shippingAddress.city || '';
        document.getElementById('shippingState').value = shippingAddress.state || '';
        document.getElementById('shippingZip').value = shippingAddress.zip || '';
        document.getElementById('shippingPhone').value = shippingAddress.phone || '';
        document.getElementById('shippingEmail').value = shippingAddress.email || '';
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
            alert(error.message || `Failed to update ${addressType} address.`);
        }
    }

    // --- 5. Settings (Profile Update & Password Change) Functions ---
    function loadProfileData(user) {
        if (!user) {
            console.warn('No user profile data provided.');
            return;
        }
        userDisplayName.textContent = `${user.first_name || ''} ${user.last_name || ''}`;
        userDisplayEmail.textContent = user.email || '';
        if (user.avatar_url) {
            if (userAvatarImg) userAvatarImg.src = user.avatar_url;
            if (uploadImgPreview) uploadImgPreview.src = user.avatar_url;
        } else {
            // Set default avatar if none exists
            if (userAvatarImg) userAvatarImg.src = '/assets/images/user-avatar.png'; // Or your default avatar path
            if (uploadImgPreview) uploadImgPreview.src = '/assets/images/user-avatar.png';
        }

        // Profile Update fields
        document.getElementById('firstName').value = user.first_name || '';
        document.getElementById('lastName').value = user.last_name || '';
        document.getElementById('phoneNumber').value = user.phone_number || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('gender').value = user.gender || 'default';
        document.getElementById('birth').value = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
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
            alert(error.message || 'Failed to update profile.');
        }
    }

    async function updateProfileAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            // Direct fetch (like your original) is fine, but needs to retrieve token correctly
            const currentToken = localStorage.getItem('userToken');
            if (!currentToken) {
                throw new Error('No authentication token found for avatar upload.');
            }

            const response = await fetch('/api/user/avatar', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentToken}` // Use the latest token here
                    // 'Content-Type': 'multipart/form-data' is usually set automatically by browser for FormData
                },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) {
                // Specific handling for 401 Unauthorized errors in direct fetch
                if (response.status === 401) {
                    alert('Session expired or invalid. Please log in again.');
                    localStorage.removeItem('userToken');
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(result.message || `Avatar upload failed with status ${response.status}`);
            }
            alert(result.message || 'Avatar updated successfully!');
            // Update avatar images in UI
            if (result.avatar_url) {
                if (userAvatarImg) userAvatarImg.src = result.avatar_url;
                if (uploadImgPreview) uploadImgPreview.src = result.avatar_url;
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert(error.message || 'Failed to upload avatar.');
        }
    }

    async function changePassword(formData) {
        try {
            if (formData.new_password !== formData.confirm_new_password) {
                throw new Error('New password and confirm password do not match.');
            }
            if (!formData.new_password || formData.new_password.length < 6) { // Basic validation
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
            alert(error.message || 'Failed to change password.');
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
            // Re-initialize order tab indicator and filter if needed
            const orderTabIndicator = document.querySelector('.tab_order .menu-tab .indicator');
            const firstOrderTabItem = document.querySelector('.tab_order .menu-tab .tab-item'); // Assumes first tab is 'all'
            if (orderTabIndicator && firstOrderTabItem) {
                // Reset indicator to 'all' tab
                orderTabIndicator.style.width = firstOrderTabItem.offsetWidth + 'px';
                orderTabIndicator.style.left = firstOrderTabItem.offsetLeft + 'px';
                document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(btn => btn.classList.remove('active'));
                firstOrderTabItem.classList.add('active');
            }
            filterOrdersByStatus('all'); // Always show 'all' orders when entering the orders tab
        }
    }

    // --- Data Loading function to call multiple APIs ---
    async function loadAndRenderAllUserData() {
        try {
            console.log('Loading all user data...');
            // Fetch and display user profile data
            const profileData = await callApi('/api/user/profile');
            loadProfileData(profileData.user);

            // Fetch and display dashboard summary
            const dashboardSummary = await callApi('/api/user/dashboard-summary');
            renderDashboardOverview(dashboardSummary);

            // Fetch and display recent orders for dashboard
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
            // This alert will be shown if any of the above API calls fail
            // It might be redundant if callApi already redirected for 401s.
            // Consider if you need a separate alert for other errors here.
            alert('Failed to load user data. Please try again.');
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
            const status = e.currentTarget.dataset.status; // Use data-status for consistency
            filterOrdersByStatus(status);
        });
    });

    // Address tab toggles
    document.querySelectorAll('.tab_address .tab_btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetItem = e.currentTarget.dataset.item;
            const targetForm = document.querySelector(`.tab_address .form_address[data-item="${targetItem}"]`);
            const icon = e.currentTarget.querySelector('.ic_down'); // Assuming this class is on the icon

            if (targetForm && icon) {
                e.currentTarget.classList.toggle('active');
                targetForm.classList.toggle('active');
                icon.classList.toggle('ph-caret-up');
                icon.classList.toggle('ph-caret-down');
            }
        });
    });

    // Profile update and Password change form submission (Setting tab)
    const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] form'); // Target the form directly
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Password fields
            const currentPassword = document.getElementById('password').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Profile fields
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const email = document.getElementById('email').value;
            const gender = document.getElementById('gender').value;
            const dob = document.getElementById('birth').value;

            if (currentPassword || newPassword || confirmPassword) {
                // If any password field is filled, assume password change
                await changePassword({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_new_password: confirmPassword
                });
            } else {
                // Otherwise, assume profile update
                await updateProfile({
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    email: email,
                    gender: gender === 'default' ? null : gender, // Send null if default selected
                    dob: dob || null // Send null if empty
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
                    // Update preview immediately
                    if (uploadImgPreview) uploadImgPreview.src = event.target.result;
                    if (userAvatarImg) userAvatarImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
                await updateProfileAvatar(file);
            }
        });
    }

    // Address update form submission
    const addressForms = document.querySelectorAll('.tab_address form'); // Get all address forms
    addressForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formElement = e.target;
            const addressType = formElement.dataset.item; // Assumes form has data-item="billing" or "shipping"

            if (!addressType) {
                alert("Address form type not identified.");
                return;
            }

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


    // Handle logout button click
    if (logoutBtnAnchor) {
        logoutBtnAnchor.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            localStorage.removeItem('userToken');
            alert('Logged out successfully.');
            window.location.href = '/login.html';
        });
    }

    // Initial call to check authentication and load data
    checkAuthAndLoadUserData();
});