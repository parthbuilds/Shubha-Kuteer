document.addEventListener("DOMContentLoaded", () => {
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    // Dashboard Overview Elements (using new IDs)
    const awaitingPickupCountEl = document.getElementById('awaitingPickupCount');
    const cancelledOrdersCountEl = document.getElementById('cancelledOrdersCount');
    const totalOrdersCountEl = document.getElementById('totalOrdersCount');

    // Dashboard Recent Orders Table Body
    const recentOrdersTableBody = document.querySelector('.filter-item[data-item="dashboard"] .recent_order table tbody');

    // History Orders Tab Container
    const listOrderContainer = document.querySelector('.filter-item.tab_order .list_order');

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName");
    const storedUserEmail = localStorage.getItem("userEmail");

    // Helper function to determine order status display text and class
    const getOrderStatusDisplay = (order) => {
        let statusText = 'Unknown';
        let statusClass = 'bg-gray text-gray'; // Default unknown color

        if (order.status === 'canceled') {
            statusText = 'Canceled';
            statusClass = 'bg-red text-red';
        } else if (order.delivery_status === 'delivered_at') {
            statusText = 'Delivered';
            statusClass = 'bg-green text-green';
        } else if (order.delivery_status === 'out for delivery' || order.delivery_status === 'out_for_delivery_at') {
            statusText = 'Out for Delivery';
            statusClass = 'bg-purple text-purple';
        } else if (order.status === 'pending') {
            statusText = 'Pending'; // Payment received, awaiting processing/shipping
            statusClass = 'bg-blue text-blue';
        } else if (order.status === 'completed') {
            // This assumes 'completed' means payment processed, but not necessarily delivered yet.
            // If it can still be canceled, 'Processing' is a good status.
            statusText = 'Processing';
            statusClass = 'bg-orange text-orange';
        }

        return { statusText, statusClass };
    };

    // Function to fetch and render user orders
    async function fetchAndRenderUserOrders() {
        if (!storedUserEmail) {
            console.warn("No user email found for fetching orders. User might not be logged in.");
            if (listOrderContainer) listOrderContainer.innerHTML = "<p>Please log in to view your orders.</p>";
            if (recentOrdersTableBody) recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5">Please log in to view recent orders.</td></tr>';
            if (awaitingPickupCountEl) awaitingPickupCountEl.textContent = '0';
            if (cancelledOrdersCountEl) cancelledOrdersCountEl.textContent = '0';
            if (totalOrdersCountEl) totalOrdersCountEl.textContent = '0';
            return;
        }

        const apiOrdersUrl = "https://www.shubhakuteer.in/api/orders";

        try {
            const response = await fetch(apiOrdersUrl);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status} - ${err.error || response.statusText}`);
            }
            const data = await response.json();

            if (data.success && Array.isArray(data.orders)) {
                const allOrders = data.orders;
                console.log("All orders fetched from API:", data);

                const userOrders = allOrders.filter(order => order.email === storedUserEmail);
                console.log("Filtered orders for the current user:", userOrders);

                // Clear existing content before rendering
                if (listOrderContainer) listOrderContainer.innerHTML = '';
                if (recentOrdersTableBody) recentOrdersTableBody.innerHTML = '';

                if (userOrders.length > 0) {
                    // --- Populate Dashboard Overview Counts ---
                    const awaitingPickup = userOrders.filter(order =>
                        // If order.status is 'completed' but not yet delivered, it might be 'awaiting pickup/processing'
                        (order.status === 'pending' || order.status === 'completed') &&
                        (order.delivery_status !== 'delivered_at' && order.delivery_status !== 'out for delivery' && order.delivery_status !== 'out_for_delivery_at')
                    ).length;

                    const cancelled = userOrders.filter(order => order.status === 'canceled').length;
                    const total = userOrders.length;

                    if (awaitingPickupCountEl) awaitingPickupCountEl.textContent = awaitingPickup;
                    if (cancelledOrdersCountEl) cancelledOrdersCountEl.textContent = cancelled;
                    if (totalOrdersCountEl) totalOrdersCountEl.textContent = total;

                    // --- Populate History Orders Tab ---
                    if (listOrderContainer) {
                        userOrders.forEach(order => {
                            const { statusText, statusClass } = getOrderStatusDisplay(order);

                            let productsHtml = '';
                            if (order.products) {
                                let productsArray = order.products;
                                // Attempt to parse if products is a JSON string
                                if (typeof productsArray === 'string') {
                                    try {
                                        productsArray = JSON.parse(productsArray);
                                    } catch (e) {
                                        console.error(`Error parsing products for order ${order.id}:`, e);
                                        productsArray = [];
                                    }
                                }

                                if (Array.isArray(productsArray) && productsArray.length > 0) {
                                    productsHtml = productsArray.map(product => `
                                        <div class="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                                            <a href="product-default.html?id=${product.id || ''}" class="flex items-center gap-5">
                                                <div class="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                                    <img src="${product.image || '/assets/images/product/productDefault.png'}"
                                                        alt="${product.name || 'Product Image'}"
                                                        class="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div class="prd_name text-title">${product.name || 'Unknown Product'}</div>
                                                    <div class="caption1 text-secondary mt-2">
                                                        ${product.size ? `<span class="prd_size uppercase">${product.size}</span>` : ''}
                                                        ${product.size && product.color ? `<span>/</span>` : ''}
                                                        ${product.color ? `<span class="prd_color capitalize">${product.color}</span>` : ''}
                                                    </div>
                                                </div>
                                            </a>
                                            <div class="text-title">
                                                <span class="prd_quantity">${product.quantity}</span>
                                                <span> X </span>
                                                <span class="prd_price">₹${parseFloat(product.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    `).join('');
                                } else {
                                    productsHtml = `<div class="prd_item py-5 text-secondary">No product details available for this order.</div>`;
                                }
                            } else {
                                productsHtml = `<div class="prd_item py-5 text-secondary">No product details available for this order.</div>`;
                            }


                            listOrderContainer.innerHTML += `
                                <div class="order_item mt-5 border border-line rounded-lg box-shadow-xs">
                                    <div class="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                                        <div class="flex items-center gap-2">
                                            <strong class="text-title">Order Number:</strong>
                                            <strong class="order_number text-button uppercase">${order.id}</strong>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <strong class="text-title">Order status:</strong>
                                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 ${statusClass} caption1 font-semibold">${statusText}</span>
                                        </div>
                                    </div>
                                    <div class="list_prd px-5">
                                        ${productsHtml}
                                    </div>
                                    <div class="flex flex-wrap gap-4 p-5">
                                        <a href="order-detail.html?id=${order.id}" class="button-main btn_order_detail">Order Details</a>
                                        ${order.status === 'pending' || (order.status === 'completed' && order.delivery_status !== 'delivered_at' && order.delivery_status !== 'out for delivery' && order.delivery_status !== 'out_for_delivery_at')
                                            ? `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white cancel-order-btn" data-order-id="${order.id}">Cancel Order</button>`
                                            : ''}
                                    </div>
                                </div>
                            `;
                        });

                        // Attach event listeners for cancel buttons AFTER they are added to the DOM
                        document.querySelectorAll('.cancel-order-btn').forEach(button => {
                            button.addEventListener('click', handleCancelOrder);
                        });
                    }

                    // --- Populate Dashboard Recent Orders (e.g., top 3) ---
                    if (recentOrdersTableBody) {
                        const recentThreeOrders = userOrders.slice(0, 3); // Get the 3 most recent orders
                        if (recentThreeOrders.length === 0) {
                            recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5">No recent orders.</td></tr>';
                        } else {
                            recentThreeOrders.forEach(order => {
                                let mainProduct = { name: 'N/A', category: 'N/A', image: '/assets/images/product/productDefault.png', id: '' };
                                if (order.products) {
                                    let productsArray = order.products;
                                    if (typeof productsArray === 'string') {
                                        try {
                                            productsArray = JSON.parse(productsArray);
                                        } catch (e) {
                                            console.error(`Error parsing products for recent order ${order.id}:`, e);
                                            productsArray = [];
                                        }
                                    }
                                    if (Array.isArray(productsArray) && productsArray.length > 0) {
                                        mainProduct = productsArray[0];
                                    }
                                }

                                const { statusText, statusClass } = getOrderStatusDisplay(order);

                                recentOrdersTableBody.innerHTML += `
                                    <tr class="item duration-300">
                                        <th scope="row" class="py-3 text-left">
                                            <strong class="text-title">${order.id}</strong>
                                        </th>
                                        <td class="py-3">
                                            <a href="product-default.html?id=${mainProduct.id || ''}" class="product flex items-center gap-3">
                                                <img src="${mainProduct.image || '/assets/images/product/productDefault.png'}"
                                                    alt="${mainProduct.name}"
                                                    class="flex-shrink-0 w-12 h-12 rounded" />
                                                <div class="info flex flex-col">
                                                    <strong class="product_name text-secondary">${mainProduct.name}</strong>
                                                    <span class="product_tag caption1 text-secondary">${mainProduct.category || 'Category'}</span>
                                                </div>
                                            </a>
                                        </td>
                                        <td class="py-3 price">₹${parseFloat(order.amount).toFixed(2)}</td>
                                        <td class="py-3 text-right">
                                            <span class="tag px-4 py-1.5 rounded-full bg-opacity-10 ${statusClass} caption1 font-semibold">${statusText}</span>
                                        </td>
                                    </tr>
                                `;
                            });
                        }
                    }

                } else {
                    // No orders found for the user
                    if (listOrderContainer) listOrderContainer.innerHTML = "<p>No orders found for this user.</p>";
                    if (recentOrdersTableBody) recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5">No recent orders.</td></tr>';
                    if (awaitingPickupCountEl) awaitingPickupCountEl.textContent = '0';
                    if (cancelledOrdersCountEl) cancelledOrdersCountEl.textContent = '0';
                    if (totalOrdersCountEl) totalOrdersCountEl.textContent = '0';
                    console.log("No orders found for the current user:", storedUserEmail);
                }
            } else {
                console.error("API response format error: 'success' flag is false or 'orders' is not an array.", data);
                if (listOrderContainer) listOrderContainer.innerHTML = "<p>Failed to process orders from the server.</p>";
            }
        } catch (error) {
            console.error("Error fetching or processing orders:", error);
            if (listOrderContainer) listOrderContainer.innerHTML = `<p>Failed to load orders: ${error.message}. Please try again later.</p>`;
        }
    } // End of fetchAndRenderUserOrders

    // Handle "Cancel Order" button click
    async function handleCancelOrder(event) {
        const button = event.target;
        const orderId = button.getAttribute('data-order-id');

        if (!orderId) {
            alert("Error: Order ID not found for cancel button.");
            return;
        }

        if (!confirm(`Are you sure you want to cancel Order #${orderId}? This action cannot be undone.`)) {
            return;
        }

        button.disabled = true;
        button.textContent = 'Canceling...';
        button.classList.add('opacity-50', 'cursor-not-allowed'); // Simple disabled styling

        try {
            const res = await fetch(`https://www.shubhakuteer.in/api/orders/${orderId}/cancel`, {
                method: 'PUT', // Assuming PUT is appropriate for status update, confirm with backend
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header if your API requires it for canceling orders
                    // 'Authorization': `Bearer ${localStorage.getItem('userAuthToken')}`
                },
                body: JSON.stringify({
                    status: 'canceled', // New status for the order
                    canceled_at: new Date().toISOString() // Optionally send timestamp
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `Failed to cancel order (status: ${res.status}).`);
            }

            const data = await res.json();
            alert(`Order #${orderId} has been successfully canceled.`);
            console.log("Order canceled response:", data);

            // Re-fetch and re-render all orders to update the UI
            await fetchAndRenderUserOrders();

        } catch (error) {
            console.error("Error canceling order:", error);
            alert("Failed to cancel order: " + error.message);
            button.disabled = false;
            button.textContent = 'Cancel Order';
            button.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }


    // --- Initial setup on DOMContentLoaded ---
    if (isLoggedIn === "true" && storedUserEmail) {
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";
        console.log("User is logged in. Loading orders...");
        fetchAndRenderUserOrders(); // Call the async function to load orders
    } else {
        // Handle not logged in state for all elements
        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";
        if (listOrderContainer) listOrderContainer.innerHTML = "Please log in to view your orders.";
        if (recentOrdersTableBody) recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5">Please log in to view recent orders.</td></tr>';
        if (awaitingPickupCountEl) awaitingPickupCountEl.textContent = '0';
        if (cancelledOrdersCountEl) cancelledOrdersCountEl.textContent = '0';
        if (totalOrdersCountEl) totalOrdersCountEl.textContent = '0';
        console.log("User is not logged in or email is not available in localStorage.");
    }

    // --- Tab Switching Logic (for main dashboard tabs) ---
    const tabItems = document.querySelectorAll('.menu-tab .category-item');
    const filterItems = document.querySelectorAll('.right .filter-item');

    tabItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.item;

            tabItems.forEach(tab => tab.classList.remove('active'));
            filterItems.forEach(filter => filter.classList.remove('active'));

            item.classList.add('active');
            document.querySelector(`.filter-item[data-item="${targetTab}"]`).classList.add('active');

            // If switching to the orders tab, ensure it's rendered
            if (targetTab === 'orders' && isLoggedIn === "true" && storedUserEmail) {
                fetchAndRenderUserOrders();
            }
        });
    });

    // --- Tab Switching Logic (for internal order tabs like All, Pending, Delivery) ---
    const orderTabButtons = document.querySelectorAll('.tab_order .menu-tab .tab-item');
    const orderTabIndicator = document.querySelector('.tab_order .menu-tab .indicator');

    orderTabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            orderTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const buttonWidth = button.offsetWidth;
            const buttonLeft = button.offsetLeft;
            if (orderTabIndicator) {
                orderTabIndicator.style.width = `${buttonWidth}px`;
                orderTabIndicator.style.transform = `translateX(${buttonLeft}px)`;
            }

            const filterType = button.getAttribute('data-filter'); // Assuming you add data-filter="all", "pending", "delivery"
            console.log("Order tab clicked:", filterType || button.textContent.trim());

            // TODO: Implement filtering of displayed orders based on filterType here
            // This would likely involve re-calling fetchAndRenderUserOrders with an additional filter parameter
            // or filtering the already fetched 'userOrders' array and re-rendering only the listOrderContainer.
        });
    });

    // Initialize indicator position for the initial active order tab
    const initialActiveOrderTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
    if (initialActiveOrderTab && orderTabIndicator) {
        orderTabIndicator.style.width = `${initialActiveOrderTab.offsetWidth}px`;
        orderTabIndicator.style.transform = `translateX(${initialActiveOrderTab.offsetLeft}px)`;
    }
});