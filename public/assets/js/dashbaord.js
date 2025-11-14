// document.addEventListener('DOMContentLoaded', () => {
//     // Selectors
//     const logoutBtnAnchor = document.querySelector('.menu-tab a.logout-btn');
//     const userDisplayName = document.querySelector('.user-infor .name');
//     const userDisplayEmail = document.querySelector('.user-infor .mail');
//     const userAvatarImg = document.querySelector('.user-infor .avatar img'); // New selector for avatar in user-infor
//     const uploadImgPreview = document.getElementById('uploadImgPreview'); // Selector for avatar preview in settings
//     const dashboardContentDiv = document.getElementById('dashboard-content');

//     // --- Utility function for API calls ---
//     async function callApi(endpoint, method = 'GET', body = null, isFormData = false) {
//         const currentToken = localStorage.getItem('userToken');
//         const headers = {};

//         if (currentToken) {
//             headers['Authorization'] = `Bearer ${currentToken}`;
//         }

//         const config = {
//             method,
//             headers: isFormData ? {} : { 'Content-Type': 'application/json', ...headers }, // FormData sets its own Content-Type
//             body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
//         };

//         if (isFormData) {
//              // For FormData, explicitly set Authorization header, but let browser set Content-Type
//              if (currentToken) {
//                 config.headers['Authorization'] = `Bearer ${currentToken}`;
//              }
//         }


//         try {
//             const response = await fetch(endpoint, config);

//             // Centralized 401 handling for ALL API calls
//             if (response.status === 401) {
//                 console.warn('Authentication failed for API call. Redirecting to login.');
//                 alert('Session expired or invalid. Please log in again.');
//                 localStorage.removeItem('userToken');
//                 window.location.href = '/login.html';
//                 return Promise.reject(new Error('Unauthorized')); // Reject the promise
//             }

//             // Attempt to parse JSON only if the response is not 204 No Content
//             const data = (response.status !== 204) ? await response.json().catch(() => {
//                 console.error(`Failed to parse JSON for ${endpoint}. Status: ${response.status}`);
//                 // If JSON parsing fails, but status is OK, might be an empty successful response
//                 return { message: `Server responded with status ${response.status}`, success: response.ok };
//             }) : { message: 'Success', status: 204, success: true }; // Handle 204 for successful deletions/updates without content

//             if (!response.ok) {
//                 // If data.message is present, use it; otherwise, provide a generic error
//                 throw new Error(data.message || `API call to ${endpoint} failed with status ${response.status}`);
//             }
//             return data;
//         } catch (error) {
//             console.error(`Network or fetch error for ${endpoint}:`, error);
//             throw error;
//         }
//     }

//     // --- Function to load and render dashboard content from API ---
//     // This function will fetch comprehensive user data to populate all dashboard sections
//     async function loadDashboardContent() {
//         if (!dashboardContentDiv) {
//             console.warn('Dashboard content div not found. Skipping content load.');
//             return;
//         }

//         dashboardContentDiv.innerHTML = '<p>Loading your dashboard data...</p>';

//         try {
//             // Your serverless function for '/api/dashboard-content' returns:
//             // { message, userData, dashboardStats, recentActivity }
//             const dashboardData = await callApi('/api/dashboard-content', 'GET');

//             if (dashboardData && dashboardData.userData) {
//                 // Populate user-info section (if present)
//                 if (userDisplayName) userDisplayName.textContent = `${dashboardData.userData.first_name || ''} ${dashboardData.userData.last_name || ''}`.trim();
//                 if (userDisplayEmail) userDisplayEmail.textContent = dashboardData.userData.email || '';
//                 if (userAvatarImg) userAvatarImg.src = dashboardData.userData.avatar_url || '/assets/images/user-avatar.png';
//                 if (uploadImgPreview) uploadImgPreview.src = dashboardData.userData.avatar_url || '/assets/images/user-avatar.png';


//                 // Populate the main dashboard content area
//                 dashboardContentDiv.innerHTML = `
//                     <h2 class="text-2xl font-bold mb-4">${dashboardData.message || 'Welcome to your Dashboard!'}</h2>
//                     <p class="text-lg text-secondary mb-6">Hello, ${dashboardData.userData.first_name || 'User'}!</p>

//                     <h3 class="text-xl font-semibold mb-3">Your Dashboard Overview:</h3>
//                     <div class="overview-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//                         <div class="overview-item p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
//                             <h4 class="text-gray-600 text-sm uppercase">Awaiting Pickup</h4>
//                             <h5 class="text-3xl font-bold text-indigo-600 mt-2">${dashboardData.dashboardStats?.awaitingPickup || 0}</h5>
//                         </div>
//                         <div class="overview-item p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
//                             <h4 class="text-gray-600 text-sm uppercase">Cancelled Orders</h4>
//                             <h5 class="text-3xl font-bold text-red-600 mt-2">${dashboardData.dashboardStats?.cancelledOrders || 0}</h5>
//                         </div>
//                         <div class="overview-item p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
//                             <h4 class="text-gray-600 text-sm uppercase">Total Orders</h4>
//                             <h5 class="text-3xl font-bold text-green-600 mt-2">${dashboardData.dashboardStats?.totalOrders || 0}</h5>
//                         </div>
//                     </div>

//                     <h3 class="text-xl font-semibold mb-3">Recent Activity:</h3>
//                     <ul class="list-disc list-inside bg-white p-6 rounded-lg shadow-md">
//                         ${dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ?
//                             dashboardData.recentActivity.map(item => `<li class="py-1 border-b last:border-b-0 border-gray-100">${item}</li>`).join('') :
//                             '<li class="text-secondary">No recent activity.</li>'
//                         }
//                     </ul>
//                 `;
//             } else {
//                 dashboardContentDiv.innerHTML = `<p class="error text-red-500">Failed to retrieve dashboard data. No user data found.</p>`;
//             }
//         } catch (error) {
//             console.error('Error loading dashboard content:', error);
//             dashboardContentDiv.innerHTML = `<p class="error text-red-500">Failed to load dashboard. ${error.message}</p>`;
//         }
//     }

//     // --- Logout Handler ---
//     function handleLogout(event) {
//         event.preventDefault();
//         console.log('User initiated logout. Clearing token.');
//         localStorage.removeItem('userToken');
//         alert('You have been logged out.');
//         window.location.href = '/login.html';
//     }

    

//     // --- Form Submission Handlers (Login and Register) ---
//     const loginForm = document.getElementById('loginForm');
//     if (loginForm) {
//         loginForm.addEventListener('submit', async (event) => {
//             event.preventDefault();
//             const email = loginForm.elements.email.value;
//             const password = loginForm.elements.password.value;

//             try {
//                 // Call the /api/auth/login endpoint from your serverless function
//                 const response = await callApi('/api/auth/login', 'POST', { email, password });
//                 if (response && response.token) {
//                     localStorage.setItem('userToken', response.token);
//                     alert(response.message);
//                     window.location.href = '/dashboard.html';
//                 } else {
//                     alert(response.message || 'Login failed. Please check your credentials.');
//                 }
//             } catch (error) {
//                 console.error('Login form submission error:', error);
//                 alert(error.message || 'An error occurred during login. Please try again.');
//             }
//         });
//     }

//     const registerForm = document.getElementById('registerForm');
//     if (registerForm) {
//         registerForm.addEventListener('submit', async (event) => {
//             event.preventDefault();
//             const name = registerForm.elements.name.value;
//             const email = registerForm.elements.email.value;
//             const password = registerForm.elements.password.value;
//             const confirmPassword = registerForm.elements.confirmPassword.value;

//             if (password !== confirmPassword) {
//                 alert('Passwords do not match.');
//                 return;
//             }

//             try {
//                 // Call the /api/auth/register endpoint from your serverless function
//                 const response = await callApi('/api/auth/register', 'POST', { name, email, password });
//                 alert(response.message);
//                 if (response.message.includes("successful")) {
//                     window.location.href = '/login.html';
//                 }
//             } catch (error) {
//                 console.error('Registration form submission error:', error);
//                 alert(error.message || 'An error occurred during registration. Please try again.');
//             }
//         });
//     }

//     // --- Initial page load logic for login/register pages ---
//     async function handleAuthPages() {
//         if (window.location.pathname === '/login.html' || window.location.pathname === '/register.html') {
//             const currentToken = localStorage.getItem('userToken');
//             if (currentToken) {
//                 try {
//                     const data = await callApi('/api/auth/check');
//                     if (data.message === 'Authorized ✅') {
//                         console.log('Already logged in on login/register page, redirecting to dashboard.');
//                         window.location.href = '/dashboard.html';
//                     }
//                 } catch (error) {
//                     if (error.message !== 'Unauthorized') {
//                         console.warn('Failed auth check on login/register page, clearing token:', error);
//                     }
//                     localStorage.removeItem('userToken');
//                 }
//             }
//         }
//     }


//     // --- 2. Dashboard Overview Functions ---
//     function renderDashboardOverview(data) {
//         if (!data) {
//             console.warn('No dashboard overview data provided.');
//             return;
//         }
//         const awaitingPickupEl = document.querySelector('.overview-item:nth-child(1) h5');
//         const cancelledOrdersEl = document.querySelector('.overview-item:nth-child(2) h5');
//         const totalOrdersEl = document.querySelector('.overview-item:nth-child(3) h5');

//         if (awaitingPickupEl) awaitingPickupEl.textContent = data.awaitingPickup || 0;
//         if (cancelledOrdersEl) cancelledOrdersEl.textContent = data.cancelledOrders || 0;
//         if (totalOrdersEl) totalOrdersEl.textContent = data.totalOrders || 0;
//     }

//     function renderRecentOrders(orders) {
//         const recentOrdersTableBody = document.querySelector('.recent_order .list table tbody');
//         if (!recentOrdersTableBody) {
//             console.warn('Recent orders table body not found.');
//             return;
//         }
//         recentOrdersTableBody.innerHTML = ''; // Clear existing

//         if (orders && orders.length > 0) {
//             orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Use created_at for sorting
//             orders.slice(0, 5).forEach(order => {
//                 const productsHtml = order.products && order.products.length > 0 ?
//                     order.products.map(product => `
//                         <a href="product-default.html?id=${product.id}" class="product flex items-center gap-3">
//                             <img src="${product.image || '/assets/images/product/productDefault.png'}"
//                                 alt="${product.name}" class="flex-shrink-0 w-12 h-12 rounded object-cover" />
//                             <div class="info flex flex-col">
//                                 <strong class="product_name text-button">${product.name}</strong>
//                                 <span class="product_tag caption1 text-secondary">${product.category || 'N/A'}, ${product.gender || 'N/A'}</span>
//                             </div>
//                         </a>
//                     `).join('') : '<p class="text-secondary">No products in this order</p>';

//                 const row = `
//                     <tr class="item duration-300 border-b border-line">
//                         <th scope="row" class="py-3 text-left">
//                             <strong class="text-title">${order.id || 'N/A'}</strong>
//                         </th>
//                         <td class="py-3">${productsHtml}</td>
//                         <td class="py-3 price">₹${(order.amount || 0).toFixed(2)}</td>
//                         <td class="py-3 text-right">
//                             <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status || 'Unknown'}</span>
//                         </td>
//                     </tr>
//                 `;
//                 recentOrdersTableBody.insertAdjacentHTML('beforeend', row);
//             });
//         } else {
//             recentOrdersTableBody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-secondary">No recent orders found.</td></tr>`;
//         }
//     }

//     function getStatusColor(status) {
//         switch (status ? status.toLowerCase() : '') {
//             case 'pending': return 'yellow';
//             case 'processing': return 'orange';
//             case 'shipped': return 'blue';
//             case 'delivery': return 'purple';
//             case 'completed': return 'success';
//             case 'cancelled': return 'red';
//             case 'returned': return 'red';
//             default: return 'gray';
//         }
//     }

//     // --- 3. Order History Functions ---
//     async function renderOrderHistory(orders) {
//         const listOrderContainer = document.querySelector('.list_order');
//         if (!listOrderContainer) {
//             console.warn('Order list container not found.');
//             return;
//         }
//         listOrderContainer.innerHTML = ''; // Clear existing orders

//         if (!orders || orders.length === 0) {
//             listOrderContainer.innerHTML = '<p class="p-4 text-center text-secondary">No orders found.</p>';
//             return;
//         }

//         orders.forEach(order => {
//             const productsHtml = order.products && order.products.length > 0 ?
//                 order.products.map(product => `
//                     <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
//                         <a href="product-default.html?id=${product.id}" class="flex items-center gap-5">
//                             <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
//                                 <img src="${product.image || '/assets/images/product/productDefault.png'}"
//                                     alt="${product.name}" class="w-full h-full object-cover" />
//                             </div>
//                             <div>
//                                 <div class="prd_name text-title">${product.name}</div>
//                                 <div class="caption1 text-secondary mt-2">
//                                     <span class="prd_quantity">${product.quantity || 1}</span>
//                                     <span> x </span>
//                                     <span class="prd_price">₹${(product.price || 0).toFixed(2)}</span>
//                                     ${product.size ? `<span class="prd_size uppercase ml-2">${product.size}</span>` : ''}
//                                     ${product.color ? `<span>/</span><span class="prd_color capitalize">${product.color}</span>` : ''}
//                                 </div>
//                             </div>
//                         </a>
//                         <div class="text-title">
//                             Subtotal: ₹${((product.quantity || 1) * (product.price || 0)).toFixed(2)}
//                         </div>
//                     </div>
//                 `).join('') : '<div class="p-3 text-secondary">No products found for this order.</div>';

//             const orderItemHTML = `
//                 <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs" data-order-id="${order.id}" data-order-status="${(order.status || '').toLowerCase()}">
//                     <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
//                         <div class="flex items-center gap-2">
//                             <strong class="text-title">Order Number:</strong>
//                             <strong class="order_number text-button uppercase">${order.id || 'N/A'}</strong>
//                         </div>
//                         <div class="flex items-center gap-2">
//                             <strong class="text-title">Order status:</strong>
//                             <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-${getStatusColor(order.status)} text-${getStatusColor(order.status)} caption1 font-semibold">${order.status || 'Unknown'}</span>
//                         </div>
//                         <div class="flex items-center gap-2">
//                             <strong class="text-title">Total:</strong>
//                             <strong class="text-button">₹${(order.amount || 0).toFixed(2)}</strong>
//                         </div>
//                     </div>
//                     <div class="list_prd px-5">${productsHtml}</div>
//                     <div class="flex flex-wrap gap-4 p-5">
//                         <button class="button-main btn_order_detail">Order Details</button>
//                         ${(order.status || '').toLowerCase() === 'pending' || (order.status || '').toLowerCase() === 'processing' ?
//                         `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white btn_cancel_order" data-order-id="${order.id}">Cancel Order</button>`
//                         : ''}
//                     </div>
//                 </div>
//             `;
//             listOrderContainer.insertAdjacentHTML('beforeend', orderItemHTML);
//         });

//         // Attach event listeners to cancel buttons
//         listOrderContainer.querySelectorAll('.btn_cancel_order').forEach(button => {
//             button.addEventListener('click', async (e) => {
//                 const orderId = e.target.dataset.orderId;
//                 if (orderId && confirm('Are you sure you want to cancel this order?')) {
//                     await cancelOrder(orderId);
//                 }
//             });
//         });
//     }

//     // Function to filter orders, either client-side or by re-fetching from API
//     async function filterOrdersByStatus(status) {
//         document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => item.classList.remove('active'));
//         const activeTab = document.querySelector(`.tab_order .menu-tab .tab-item[data-status="${status}"]`);
//         if (activeTab) activeTab.classList.add('active');

//         const indicator = document.querySelector('.tab_order .menu-tab .indicator');
//         if (indicator && activeTab) {
//             indicator.style.width = activeTab.offsetWidth + 'px';
//             indicator.style.left = activeTab.offsetLeft + 'px';
//         }

//         try {
//             // Your serverless function /api/orders now handles a `status` query parameter.
//             const endpoint = status === 'all' ? '/api/orders' : `/api/orders?status=${status}`;
//             const filteredOrdersResponse = await callApi(endpoint); // Assume your API can filter
//             renderOrderHistory(filteredOrdersResponse.orders);
//         } catch (error) {
//             console.error('Error filtering orders:', error);
//             alert('Failed to load filtered orders.');
//             const listOrderContainer = document.querySelector('.list_order');
//             if (listOrderContainer) listOrderContainer.innerHTML = '<p class="p-4 text-center text-red-500">Error loading orders.</p>';
//         }
//     }

//     async function cancelOrder(orderId) {
//         try {
//             // Use the specific DELETE /api/orders/:id endpoint for cancellation or PUT for status update
//             const result = await callApi(`/api/orders/${orderId}/cancel`, 'PUT', { status: 'cancelled' }); // Assuming PUT to update status to cancelled
//             alert(result.message || 'Order cancelled successfully!');
//             await loadAndRenderAllUserData();
//             const activeStatusTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
//             if (activeStatusTab) {
//                 filterOrdersByStatus(activeStatusTab.dataset.status);
//             }
//         } catch (error) {
//             console.error('Cancel order error:', error);
//             alert(error.message || 'Failed to cancel order. Please try again.');
//         }
//     }

//     // --- 4. My Address Functions ---
//     function loadAddressData(addresses) {
//         if (!addresses) {
//             console.warn('No address data provided.');
//             return;
//         }

//         // Your serverless function does not currently provide '/api/user/addresses'.
//         // This function assumes a structure like: { billing: {}, shipping: {} }
//         // For now, it will load empty data or assume the data structure from `profileData.user`
//         // If your backend adds an address endpoint, this needs to be updated.
//         // For demonstration, using placeholder data or `user` object if it contains address fields
//         const billingAddress = addresses.billing || {}; // Placeholder if you add /api/user/addresses
//         const shippingAddress = addresses.shipping || {}; // Placeholder if you add /api/user/addresses

//         const setValue = (id, value) => {
//             const el = document.getElementById(id);
//             if (el) el.value = value || '';
//         };

//         // Billing - these fields likely don't exist in your `users` table directly
//         setValue('billingFirstName', billingAddress.first_name);
//         setValue('billingLastName', billingAddress.last_name);
//         setValue('billingCompany', billingAddress.company);
//         setValue('billingCountry', billingAddress.country);
//         setValue('billingStreet', billingAddress.street);
//         setValue('billingCity', billingAddress.city);
//         setValue('billingState', billingAddress.state);
//         setValue('billingZip', billingAddress.zip);
//         setValue('billingPhone', billingAddress.phone);
//         setValue('billingEmail', billingAddress.email);

//         // Shipping - same as billing
//         setValue('shippingFirstName', shippingAddress.first_name);
//         setValue('shippingLastName', shippingAddress.last_name);
//         setValue('shippingCompany', shippingAddress.company);
//         setValue('shippingCountry', shippingAddress.country);
//         setValue('shippingStreet', shippingAddress.street);
//         setValue('shippingCity', shippingAddress.city);
//         setValue('shippingState', shippingAddress.state);
//         setValue('shippingZip', shippingAddress.zip);
//         setValue('shippingPhone', shippingAddress.phone);
//         setValue('shippingEmail', shippingAddress.email);

//         // Placeholder for address data if your API doesn't have a dedicated /api/user/addresses
//         // If the backend `profile` endpoint provides address fields, use those here.
//     }

//     async function updateAddress(addressType, formData) {
//         // Your serverless function does not currently provide an endpoint for '/api/user/addresses/{type}'
//         // This function is a placeholder. If you implement such an endpoint, update this.
//         alert(`Updating ${addressType} address is not yet implemented on the backend.`);
//         console.warn(`Attempted to update ${addressType} address with data:`, formData);
//         // If you implement:
//         // try {
//         //     const result = await callApi(`/api/user/addresses/${addressType}`, 'PUT', formData);
//         //     alert(result.message || `${addressType} address updated successfully!`);
//         //     const userAddresses = await callApi('/api/user/addresses'); // Re-fetch
//         //     loadAddressData(userAddresses.addresses);
//         // } catch (error) {
//         //     console.error(`Update ${addressType} address error:`, error);
//         //     alert(error.message || `Failed to update ${addressType} address. Please try again.`);
//         // }
//     }

//     // --- 5. Settings (Profile Update & Password Change) Functions ---
//     function loadProfileData(user) {
//         if (!user) {
//             console.warn('No user profile data provided.');
//             return;
//         }

//         // Update top-bar user info
//         if (userDisplayName) userDisplayName.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
//         if (userDisplayEmail) userDisplayEmail.textContent = user.email || '';

//         // Update avatar images
//         const avatarSrc = user.avatar_url || '/assets/images/user-avatar.png'; // Assuming `avatar_url` is part of your user object
//         if (userAvatarImg) userAvatarImg.src = avatarSrc;
//         if (uploadImgPreview) uploadImgPreview.src = avatarSrc;

//         // Profile Update fields
//         const setValue = (id, value) => {
//             const el = document.getElementById(id);
//             if (el) el.value = value || '';
//         };

//         // Your serverless function's '/api/user/profile' GET currently returns `name` as a single field
//         // and you split it to first_name/last_name. Make sure these are reflected accurately.
//         setValue('firstName', user.first_name);
//         setValue('lastName', user.last_name);
//         setValue('phoneNumber', user.phone_number); // This field is not currently in your backend user query
//         setValue('email', user.email);
//         setValue('gender', user.gender || 'default'); // This field is not currently in your backend user query
//         setValue('birth', user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''); // This field is not currently in your backend user query
//     }

//     async function updateProfile(formData) {
//         try {
//             // Call the PUT /api/user/profile endpoint from your serverless function
//             const result = await callApi('/api/user/profile', 'PUT', formData);
//             alert(result.message || 'Profile updated successfully!');
//             // Re-fetch and display updated profile to refresh the UI
//             const profileData = await callApi('/api/user/profile'); // This call should get updated data
//             loadProfileData(profileData.user);
//         } catch (error) {
//             console.error('Update profile error:', error);
//             alert(error.message || 'Failed to update profile. Please try again.');
//         }
//     }

//     async function updateProfileAvatar(file) {
//         const formData = new FormData();
//         formData.append('avatar', file);

//         try {
//             // Your serverless function does not currently have a /api/user/avatar endpoint.
//             // This will throw an error or hit a default path on the server.
//             // If you implement this, ensure the serverless function handles `multipart/form-data`.
//             // For now, this will alert that it's not implemented.

//             alert("Avatar upload is not yet implemented on the backend.");
//             console.warn("Attempted avatar upload. Backend endpoint /api/user/avatar is not implemented.");

//             // Placeholder for if you implement it:
//             // const result = await callApi('/api/user/avatar', 'PUT', formData, true); // `true` for isFormData
//             // alert(result.message || 'Avatar updated successfully!');
//             // if (result.avatar_url) {
//             //     if (userAvatarImg) userAvatarImg.src = result.avatar_url;
//             //     if (uploadImgPreview) uploadImgPreview.src = result.avatar_url;
//             // }

//         } catch (error) {
//             console.error('Avatar upload error:', error);
//             alert(error.message || 'Failed to upload avatar. Please try again.');
//         }
//     }

//     async function changePassword(formData) {
//         try {
//             if (formData.new_password !== formData.confirm_new_password) {
//                 throw new Error('New password and confirm password do not match.');
//             }
//             if (!formData.new_password || formData.new_password.length < 6) {
//                 throw new Error('New password must be at least 6 characters long.');
//             }

//             // Call the PUT /api/user/password endpoint from your serverless function
//             const result = await callApi('/api/user/password', 'PUT', {
//                 current_password: formData.current_password,
//                 new_password: formData.new_password
//             });
//             alert(result.message || 'Password changed successfully!');
//             // Clear password fields
//             document.getElementById('password').value = '';
//             document.getElementById('newPassword').value = '';
//             document.getElementById('confirmPassword').value = '';
//         } catch (error) {
//             console.error('Change password error:', error);
//             alert(error.message || 'Failed to change password. Please try again.');
//         }
//     }

//     // --- 6. Navigation and Tab Switching ---
//     function switchTab(tabName) {
//         // Update menu tab active state
//         document.querySelectorAll('.menu-tab .category-item').forEach(item => item.classList.remove('active'));
//         const activeMenuItem = document.querySelector(`.menu-tab .category-item[data-item="${tabName}"]`);
//         if (activeMenuItem) activeMenuItem.classList.add('active');

//         // Show/hide content blocks
//         document.querySelectorAll('.list-filter .filter-item').forEach(item => item.classList.remove('active'));
//         const activeContentBlock = document.querySelector(`.list-filter .filter-item[data-item="${tabName}"]`);
//         if (activeContentBlock) activeContentBlock.classList.add('active');

//         // Special handling for order history sub-tabs
//         if (tabName === 'orders') {
//             const orderTabIndicator = document.querySelector('.tab_order .menu-tab .indicator');
//             const firstOrderTabItem = document.querySelector('.tab_order .menu-tab .tab-item[data-status="all"]');
//             if (orderTabIndicator && firstOrderTabItem) {
//                 orderTabIndicator.style.width = firstOrderTabItem.offsetWidth + 'px';
//                 orderTabIndicator.style.left = firstOrderTabItem.offsetLeft + 'px';
//                 document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(btn => btn.classList.remove('active'));
//                 firstOrderTabItem.classList.add('active');
//             }
//             filterOrdersByStatus('all'); // Always show 'all' orders when entering the orders tab
//         } else if (tabName === 'dashboard') {
//             loadDashboardContent(); // Re-render dashboard overview if it's the active tab
//         }
//     }

//     // --- Data Loading function to call multiple APIs for dashboard ---
//     async function loadAndRenderAllUserData() {
//         try {
//             console.log('Loading all user data...');

//             // Fetch and display user profile data (from /api/user/profile)
//             const profileResponse = await callApi('/api/user/profile');
//             if (profileResponse.user) {
//                 loadProfileData(profileResponse.user);
//             } else {
//                 console.warn('Profile data missing from /api/user/profile response.');
//             }

//             // Fetch and display dashboard summary (from /api/orders/stats)
//             const dashboardSummaryResponse = await callApi('/api/orders/stats');
//             if (dashboardSummaryResponse.success && dashboardSummaryResponse.data) {
//                 // Map API response to expected renderDashboardOverview format
//                 const mappedSummary = {
//                     awaitingPickup: dashboardSummaryResponse.data.totalOrders - dashboardSummaryResponse.data.completedOrders, // Example calculation
//                     cancelledOrders: 0, // Your stats API doesn't provide this directly
//                     totalOrders: dashboardSummaryResponse.data.totalOrders
//                 };
//                 renderDashboardOverview(mappedSummary);
//             } else {
//                 console.warn('Dashboard summary data missing from /api/orders/stats response.');
//             }

//             // Fetch and display recent orders for dashboard (from /api/orders?limit=5)
//             // Note: Your /api/orders doesn't have a limit parameter, so we fetch all and slice
//             const allOrdersResponse = await callApi('/api/orders');
//             if (allOrdersResponse.success && allOrdersResponse.orders) {
//                 renderRecentOrders(allOrdersResponse.orders);
//                 // Also use these orders for the full order history tab
//                 renderOrderHistory(allOrdersResponse.orders);
//             } else {
//                 console.warn('All orders data missing from /api/orders response.');
//             }

//             // Fetch and display user addresses (currently not available in your backend)
//             // For now, load empty data or assume default from profile if it extends to addresses
//             loadAddressData({}); // Pass empty object as placeholder

//             console.log('All user data loaded successfully.');

//         } catch (error) {
//             console.error('Error loading all user data:', error);
//             if (error.message !== 'Unauthorized') {
//                 alert('Failed to load user data. Please refresh the page.');
//             }
//         }
//     }

//     // ===== NEW FUNCTION TO LOAD USER NAME TO HEADER =====
//     async function loadUserNameToHeader() {
//         try {
//             console.log('📥 Loading user name to header...');
            
//             const profileData = await callApi('/api/user/profile');
            
//             if (profileData && profileData.user) {
//                 const user = profileData.user;
//                 const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
//                 const email = user.email || '';
                
//                 // Update header name
//                 if (userDisplayName) {
//                     userDisplayName.textContent = fullName;
//                     console.log('✅ User name displayed:', fullName);
//                 }
                
//                 // Update header email
//                 if (userDisplayEmail) {
//                     userDisplayEmail.textContent = email;
//                     console.log('✅ User email displayed:', email);
//                 }
                
//                 // Update avatar
//                 if (userAvatarImg && user.avatar_url) {
//                     userAvatarImg.src = user.avatar_url;
//                 }
                
//                 return true;
//             }
//             return false;
//         } catch (error) {
//             console.error('Error loading user name:', error);
//             return false;
//         }
//     }

//     // --- Event Listeners ---

//     // Side menu navigation
//     document.querySelectorAll('.menu-tab .category-item').forEach(item => {
//         item.addEventListener('click', (e) => {
//             e.preventDefault();
//             const tabName = e.currentTarget.dataset.item;
//             if (tabName) {
//                 switchTab(tabName);
//             }
//         });
//     });

//     // Order history sub-tabs
//     document.querySelectorAll('.tab_order .menu-tab .tab-item').forEach(item => {
//         item.addEventListener('click', (e) => {
//             e.preventDefault();
//             const status = e.currentTarget.dataset.status;
//             filterOrdersByStatus(status);
//         });
//     });

//     // Address tab toggles
//     document.querySelectorAll('.tab_address .tab_btn').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             e.preventDefault();
//             const targetItem = e.currentTarget.dataset.item;
//             const targetForm = document.querySelector(`.tab_address .form_address[data-item="${targetItem}"]`);
//             const icon = e.currentTarget.querySelector('.ic_down');

//             if (targetForm && icon) {
//                 e.currentTarget.classList.toggle('active');
//                 targetForm.classList.toggle('active');
//                 icon.classList.toggle('ph-caret-up');
//                 icon.classList.toggle('ph-caret-down');
//             }
//         });
//     });

//     // Profile update and Password change form submission (Setting tab)
//     const profileSettingsForm = document.querySelector('.filter-item[data-item="setting"] form');
//     if (profileSettingsForm) {
//         profileSettingsForm.addEventListener('submit', async (e) => {
//             e.preventDefault();

//             const currentPasswordEl = document.getElementById('password');
//             const newPasswordEl = document.getElementById('newPassword');
//             const confirmPasswordEl = document.getElementById('confirmPassword');

//             const currentPassword = currentPasswordEl ? currentPasswordEl.value : '';
//             const newPassword = newPasswordEl ? newPasswordEl.value : '';
//             const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';

//             const firstName = document.getElementById('firstName').value;
//             const lastName = document.getElementById('lastName').value;
//             const phoneNumber = document.getElementById('phoneNumber').value; // Not in backend users table
//             const email = document.getElementById('email').value;
//             const gender = document.getElementById('gender').value;       // Not in backend users table
//             const dob = document.getElementById('birth').value;          // Not in backend users table

//             // Determine if it's a password change or profile update
//             if (newPassword || currentPassword || confirmPassword) {
//                 await changePassword({
//                     current_password: currentPassword,
//                     new_password: newPassword,
//                     confirm_new_password: confirmPassword
//                 });
//             } else {
//                 // The backend /api/user/profile PUT expects `name` as a single field, not first_name/last_name
//                 // For now, concatenate. If your backend is updated to accept first_name/last_name, adjust here.
//                 const fullName = `${firstName} ${lastName}`.trim();

//                 await updateProfile({
//                     name: fullName, // Backend expects 'name'
//                     email: email,
//                     // These fields are not currently handled by your backend /api/user/profile PUT
//                     // phone_number: phoneNumber,
//                     // gender: gender === 'default' ? null : gender,
//                     // dob: dob || null
//                 });
//             }
//         });
//     }

//     // Avatar upload handling
//     const uploadImageInput = document.getElementById('uploadImage');
//     if (uploadImageInput) {
//         uploadImageInput.addEventListener('change', async (e) => {
//             const file = e.target.files[0];
//             if (file) {
//                 const reader = new FileReader();
//                 reader.onload = (event) => {
//                     if (uploadImgPreview) uploadImgPreview.src = event.target.result;
//                     if (userAvatarImg) userAvatarImg.src = event.target.result;
//                 };
//                 reader.readAsDataURL(file);
//                 await updateProfileAvatar(file); // This will currently show an alert as backend is not ready
//             }
//         });
//     }

//     // Address update form submission
//     const addressForms = document.querySelectorAll('.tab_address form');
//     addressForms.forEach(form => {
//         form.addEventListener('submit', async (e) => {
//             e.preventDefault();

//             const formElement = e.target;
//             const addressType = formElement.dataset.item;

//             if (!addressType) {
//                 alert("Address form type not identified. Missing data-item attribute.");
//                 return;
//             }

//             const formData = {
//                 first_name: formElement.querySelector('[id$="FirstName"]').value,
//                 last_name: formElement.querySelector('[id$="LastName"]').value,
//                 company: formElement.querySelector('[id$="Company"]').value,
//                 country: formElement.querySelector('[id$="Country"]').value,
//                 street: formElement.querySelector('[id$="Street"]').value,
//                 city: formElement.querySelector('[id$="City"]').value,
//                 state: formElement.querySelector('[id$="State"]').value,
//                 zip: formElement.querySelector('[id$="Zip"]').value,
//                 phone: formElement.querySelector('[id$="Phone"]').value,
//                 email: formElement.querySelector('[id$="Email"]').value,
//             };

//             await updateAddress(addressType, formData); // This will currently show an alert as backend is not ready
//         });
//     });

//     // Handle logout button click
//     if (logoutBtnAnchor) {
//         logoutBtnAnchor.addEventListener('click', handleLogout); // Already handled by checkDashboardAccess, but good to ensure
//     }

//     // Initial load logic based on path
//     if (window.location.pathname.startsWith('/dashboard')) {
//         checkDashboardAccess();
//     } else {
//         handleAuthPages();
//     }
// });
function showUserOnFrontend() {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    console.log("Restoring user from localStorage:", userData);

    const output = document.getElementById("user-output");

    if (!output) return;

    // If user is not found
    if (!userData.email) {
        output.innerHTML = `<p>No user logged in.</p>`;
        return;
    }

    output.innerHTML = `
        <h3>Logged-in User Details</h3>
        <p><strong>First Name:</strong> ${userData.firstName}</p>
        <p><strong>Last Name:</strong> ${userData.lastName}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>User ID:</strong> ${userData.id}</p>
    `;
}


// -------------------------------
// PAGE LOAD – RESTORE USER
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
    showUserOnFrontend();
});


// -------------------------------
// LOGIN BUTTON HANDLER
// -------------------------------
document.getElementById("login-btn")?.addEventListener("click", () => {
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
        alert("Enter email & password");
        return;
    }

    loginUser(email, password);
});