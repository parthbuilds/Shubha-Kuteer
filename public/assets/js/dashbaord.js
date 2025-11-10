document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
    const logoutBtn = document.querySelector('.menu-tab a[href="login.html"]');
    const userDisplayName = document.querySelector('.user-infor .name');
    const userDisplayEmail = document.querySelector('.user-infor .mail');
    const userAvatarImg = document.querySelector('.user-infor .avatar img');

    // Utility function for API calls
    async function callApi(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, config);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid, force re-login
                alert('Session expired or invalid. Please log in again.');
                localStorage.removeItem('userToken');
                window.location.href = '/login.html';
            }
            throw new Error(data.message || 'API call failed');
        }
        return data;
    }

    // 1. Initial Authentication Check and Data Loading
    async function checkAuthAndLoadUserData() {
        if (!token) {
            alert('Please log in to access your account.');
            window.location.href = '/login.html';
            return;
        }

        try {
            const authData = await callApi('/api/auth/check');
            if (authData.message === 'Authorized ✅') {
                console.log('User is authenticated.');
                // Show logout button/dashboard specific elements
                if (logoutBtn) logoutBtn.style.display = 'flex'; // Or remove 'hidden' class
                
                // Fetch and render initial data for the dashboard
                await loadAndRenderAllUserData();
                switchTab('dashboard'); // Default to dashboard view
            } else {
                throw new Error(authData.message || 'Session invalid');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            alert('Session expired or invalid. Please log in again.');
            localStorage.removeItem('userToken');
            window.location.href = '/login.html';
        }
    }

    async function loadAndRenderAllUserData() {
        try {
            // Fetch and display user profile data
            const profileData = await callApi('/api/user/profile');
            loadProfileData(profileData.user);

            // Fetch and display dashboard summary
            const dashboardSummary = await callApi('/api/user/dashboard-summary');
            renderDashboardOverview(dashboardSummary);

            // Fetch and display recent orders for dashboard
            const recentOrders = await callApi('/api/orders/recent'); // Assuming a new API for recent orders
            renderRecentOrders(recentOrders.orders);

            // Fetch and display all orders for order history tab
            const allOrders = await callApi('/api/orders');
            renderOrderHistory(allOrders.orders); // Initially render all orders

            // Fetch and display user addresses
            const userAddresses = await callApi('/api/user/addresses');
            loadAddressData(userAddresses.addresses);

        } catch (error) {
            console.error('Error loading all user data:', error);
            alert('Failed to load user data. Please try again.');
        }
    }

    // 2. Dashboard Overview Functions
    function renderDashboardOverview(data) {
        if (!data) return;
        document.querySelector('.overview-item:nth-child(1) h5').textContent = data.awaitingPickup || 0;
        document.querySelector('.overview-item:nth-child(2) h5').textContent = data.cancelledOrders || 0;
        document.querySelector('.overview-item:nth-child(3) h5').textContent = data.totalOrders || 0;
    }

    function renderRecentOrders(orders) {
        const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
        if (!recentOrdersTableBody) return;
        recentOrdersTableBody.innerHTML = ''; // Clear existing
        if (orders && orders.length > 0) {
            orders.slice(0, 5).forEach(order => { // Show up to 5 recent orders
                const row = `
                    <tr class="item duration-300 border-b border-line">
                        <th scope="row" class="py-3 text-left">
                            <strong class="text-title">${order.order_number}</strong>
                        </th>
                        <td class="py-3">
                            ${order.products.map(product => `
                                <a href="product-default.html?id=${product.id}" class="product flex items-center gap-3">
                                    <img src="${product.image || '/assets/images/product/1000x1000.png'}"
                                        alt="${product.name}" class="flex-shrink-0 w-12 h-12 rounded" />
                                    <div class="info flex flex-col">
                                        <strong class="product_name text-button">${product.name}</strong>
                                        <span class="product_tag caption1 text-secondary">${product.category || ''}, ${product.gender || ''}</span>
                                    </div>
                                </a>
                            `).join('')}
                        </td>
                        <td class="py-3 price">₹${order.total_amount.toFixed(2)}</td>
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

    // Helper for status colors
    function getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'pending': return 'yellow';
            case 'delivery': return 'purple';
            case 'completed': return 'success';
            case 'canceled': return 'red';
            default: return 'gray';
        }
    }

    // 3. Order History Functions
    async function renderOrderHistory(orders) {
        const listOrderContainer = document.querySelector('.list_order');
        if (!listOrderContainer) return;
        listOrderContainer.innerHTML = ''; // Clear existing orders

        if (!orders || orders.length === 0) {
            listOrderContainer.innerHTML = '<p class="p-4">No orders found.</p>';
            return;
        }

        orders.forEach(order => {
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
                    <div class="list_prd px-5">
                        ${order.products.map(product => `
                            <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                                <a href="product-default.html?id=${product.id}" class="flex items-center gap-5">
                                    <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                        <img src="${product.image || '/assets/images/product/1000x1000.png'}"
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
                                    <span class="prd_quantity">${product.quantity}</span>
                                    <span> X </span>
                                    <span class="prd_price">₹${product.price.toFixed(2)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex flex-wrap gap-4 p-5">
                        <button class="button-main btn_order_detail">Order Details</button>
                        ${order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'delivery' ? // Only show cancel for pending/delivery
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
                if (confirm('Are you sure you want to cancel this order?')) {
                    await cancelOrder(orderId);
                }
            });
        });
    }

    async function filterOrdersByStatus(status) {
        // Remove active from all tabs
        document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => item.classList.remove('active'));
        // Add active to the clicked tab
        document.querySelector(`.tab_order .menu-tab .tab-item[data-status="${status}"]`).classList.add('active');

        const allOrders = document.querySelectorAll('.list_order .order_item');
        allOrders.forEach(orderItem => {
            if (status === 'all' || orderItem.dataset.orderStatus === status) {
                orderItem.style.display = 'block';
            } else {
                orderItem.style.display = 'none';
            }
        });

        // You could also fetch from API if you want server-side filtering
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
            const result = await callApi(`/api/orders/cancel/${orderId}`, 'PUT'); // Or DELETE depending on your API
            alert(result.message || 'Order cancelled successfully!');
            // Re-render orders or update the specific order's status in the DOM
            const cancelledOrderItem = document.querySelector(`.order_item[data-order-id="${orderId}"]`);
            if (cancelledOrderItem) {
                cancelledOrderItem.dataset.orderStatus = 'canceled';
                const statusTag = cancelledOrderItem.querySelector('.tag');
                if (statusTag) {
                    statusTag.className = `tag px-4 py-1.5 rounded-full bg-opacity-10 bg-red text-red caption1 font-semibold`;
                    statusTag.textContent = 'Canceled';
                }
                const cancelButton = cancelledOrderItem.querySelector('.btn_cancel_order');
                if (cancelButton) cancelButton.remove(); // Remove cancel button after cancellation
            }
            // Also update dashboard summary if needed
            const dashboardSummary = await callApi('/api/user/dashboard-summary');
            renderDashboardOverview(dashboardSummary);
            // Re-render all orders to reflect the change visually across tabs
            const allOrders = await callApi('/api/orders');
            renderOrderHistory(allOrders.orders);
        } catch (error) {
            console.error('Cancel order error:', error);
            alert(error.message);
        }
    }

    // 4. My Address Functions
    function loadAddressData(addresses) {
        if (!addresses) return;

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
        } catch (error) {
            console.error(`Update ${addressType} address error:`, error);
            alert(error.message);
        }
    }

    // 5. Settings (Profile Update & Password Change) Functions
    function loadProfileData(user) {
        if (!user) return;
        userDisplayName.textContent = `${user.first_name || ''} ${user.last_name || ''}`;
        userDisplayEmail.textContent = user.email || '';
        if (user.avatar_url) {
            userAvatarImg.src = user.avatar_url;
            document.querySelector('.upload_img').src = user.avatar_url;
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
            alert(error.message);
        }
    }

    async function updateProfileAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            // Assuming your /api/user/avatar endpoint handles file uploads
            const response = await fetch('/api/user/avatar', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // 'Content-Type': 'multipart/form-data' is usually set automatically by browser for FormData
                },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Avatar upload failed');
            }
            alert(result.message || 'Avatar updated successfully!');
            // Update avatar images in UI
            if (result.avatar_url) {
                userAvatarImg.src = result.avatar_url;
                document.querySelector('.upload_img').src = result.avatar_url;
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert(error.message);
        }
    }

    async function changePassword(formData) {
        try {
            if (formData.new_password !== formData.confirm_new_password) {
                throw new Error('New password and confirm password do not match.');
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
            alert(error.message);
        }
    }

    // 6. Navigation and Tab Switching
    function switchTab(tabName) {
        // Update menu tab active state
        document.querySelectorAll('.menu-tab .category-item').forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-tab .category-item[data-item="${tabName}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        // Show/hide content blocks
        document.querySelectorAll('.list-filter .filter-item').forEach(item => item.classList.remove('active'));
        const activeContentBlock = document.querySelector(`.list-filter .filter-item[data-item="${tabName}"]`);
        if (activeContentBlock) activeContentBlock.classList.add('active');

        // Special handling for order history sub-tabs (if any)
        if (tabName === 'orders') {
            const orderTabIndicator = document.querySelector('.tab_order .menu-tab .indicator');
            const firstOrderTabItem = document.querySelector('.tab_order .menu-tab .tab-item');
            if (orderTabIndicator && firstOrderTabItem) {
                orderTabIndicator.style.width = firstOrderTabItem.offsetWidth + 'px';
                orderTabIndicator.style.left = firstOrderTabItem.offsetLeft + 'px';
                firstOrderTabItem.classList.add('active');
            }
            filterOrdersByStatus('all'); // Always show 'all' orders when entering the orders tab
        }
    }

    // Event Listeners

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
            const status = e.currentTarget.textContent.toLowerCase();
            filterOrdersByStatus(status);

            // Move indicator
            const indicator = document.querySelector('.tab_order .menu-tab .indicator');
            indicator.style.width = e.currentTarget.offsetWidth + 'px';
            indicator.style.left = e.currentTarget.offsetLeft + 'px';

            document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
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
                icon.classList.toggle('ph-caret-up'); // Assuming you have an up caret icon
                icon.classList.toggle('ph-caret-down');
            }
        });
    });


    // Profile update form submission (Setting tab)
    const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] > form');
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const email = document.getElementById('email').value;
            const gender = document.getElementById('gender').value;
            const dob = document.getElementById('birth').value;

            // Check if it's a password update or profile update
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const currentPassword = document.getElementById('password').value;

            if (newPassword || confirmPassword || currentPassword) {
                // It's a password change request
                await changePassword({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_new_password: confirmPassword
                });
            } else {
                // It's a profile update request
                await updateProfile({
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    email: email,
                    gender: gender,
                    dob: dob
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
                    document.querySelector('.upload_img').src = event.target.result;
                    userAvatarImg.src = event.target.result; // Update main avatar as well
                };
                reader.readAsDataURL(file);
                await updateProfileAvatar(file);
            }
        });
    }


    // Address update form submission
    const addressForm = document.querySelector('.tab_address > form');
    if (addressForm) {
        addressForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Determine which address form is active (billing or shipping)
            const activeBillingForm = document.querySelector('.form_address[data-item="billing"].active');
            const activeShippingForm = document.querySelector('.form_address[data-item="shipping"].active');

            let addressType;
            let formData = {};

            if (activeBillingForm) {
                addressType = 'billing';
                formData = {
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
            } else if (activeShippingForm) {
                addressType = 'shipping';
                formData = {
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
            } else {
                alert("Please open an address section to update.");
                return;
            }

            await updateAddress(addressType, formData);
        });
    }


    // Handle logout button click
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            localStorage.removeItem('userToken');
            alert('Logged out successfully.');
            window.location.href = '/login.html';
        });
    }

    // Initial call to check authentication and load data
    checkAuthAndLoadUserData();
});