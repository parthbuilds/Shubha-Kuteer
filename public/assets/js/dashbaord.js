document.addEventListener("DOMContentLoaded", () => {
    const userNameDisplay = document.getElementById("userName");
    const userEmailDisplay = document.getElementById("userEmail");

    // Elements for the Dashboard 'Recent Orders' (optional, will only show a few if implemented)
    const recentOrdersTableBody = document.querySelector('.filter-item[data-item="dashboard"] .recent_order table tbody');
    const awaitingPickupCount = document.getElementById('awaitingPickupCount');
    const cancelledOrdersCount = document.getElementById('cancelledOrdersCount');
    const totalOrdersCount = document.getElementById('totalOrdersCount');

    // Element for the History Orders Tab
    const listOrderContainer = document.querySelector('.filter-item.tab_order .list_order');

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUserName = localStorage.getItem("userName");
    const storedUserEmail = localStorage.getItem("userEmail");

    // Helper function to determine status text and class
    const getOrderStatusDisplay = (order) => {
        let statusText = 'Unknown';
        let statusClass = 'bg-gray text-gray'; // Default unknown color

        if (order.status === 'canceled') {
            statusText = 'Canceled';
            statusClass = 'bg-red text-red';
        } else if (order.delivery_status === 'delivered_at') {
            statusText = 'Delivered';
            statusClass = 'bg-green text-green';
        } else if (order.delivery_status === 'out_for_delivery_at') {
            statusText = 'Out for Delivery';
            statusClass = 'bg-purple text-purple';
        } else if (order.status === 'pending') {
            statusText = 'Pending';
            statusClass = 'bg-blue text-blue'; // Using blue for pending, adjust as needed
        } else if (order.status === 'completed') {
            // This case handles your example where 'status' is 'completed' but delivery might be pending
            // If completed means *shipped and arrived*, then 'delivered' is better.
            // If completed means *payment received and being processed*, then 'pending' or 'processing' is better.
            // For now, if no specific delivery status, we'll call it Completed.
            statusText = 'Completed';
            statusClass = 'bg-green text-green'; // Green for completed
        }

        // You could add more specific status mappings here if you have them
        // e.g., 'processing', 'shipped', 'returned', etc.

        return { statusText, statusClass };
    };


    if (isLoggedIn === "true" && storedUserEmail) {
        if (userNameDisplay) userNameDisplay.textContent = storedUserName || "Guest User";
        if (userEmailDisplay) userEmailDisplay.textContent = storedUserEmail || "No Email";

        console.log("User is logged in.");
        console.log("Stored User Name:", storedUserName);
        console.log("Stored User Email:", storedUserEmail);

        const apiOrdersUrl = "https://www.shubhakuteer.in/api/orders";

        fetch(apiOrdersUrl)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(`HTTP error! status: ${response.status} - ${err.error || response.statusText}`); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success && Array.isArray(data.orders)) {
                    const allOrders = data.orders;
                    console.log("All orders fetched from API (full response data):", data);
                    console.log("Extracted 'orders' array:", allOrders);

                    const userOrders = allOrders.filter(order => order.email === storedUserEmail);
                    console.log("Filtered orders for the current user:", userOrders);

                    if (userOrders.length > 0) {
                        console.log("\n--- Matched Orders for User:", storedUserEmail, "---");
                        userOrders.forEach((order, index) => {
                            console.log(`\nOrder #${index + 1} (ID: ${order.id}):`);
                            console.log("  First Name:", order.first_name);
                            console.log("  Last Name:", order.last_name);
                            console.log("  Email:", order.email);
                            console.log("  Phone Number:", order.phone_number);
                            console.log("  Amount:", order.amount);
                            console.log("  Status (primary):", order.status);
                            console.log("  Delivery Status:", order.delivery_status);
                            console.log("  Products:", order.products);
                            console.log("  Created At:", order.created_at);
                        });
                        console.log("------------------------------------------");

                        // Clear existing dummy orders if any
                        if (listOrderContainer) {
                            listOrderContainer.innerHTML = '';
                        }
                        if (recentOrdersTableBody) {
                             recentOrdersTableBody.innerHTML = '';
                        }

                        // --- Populate Dashboard Overview Counts ---
                        // Re-evaluate 'Awaiting Pickup' based on our new status logic
                        const awaitingPickup = userOrders.filter(order =>
                            order.status === 'pending' || order.delivery_status === 'out_for_delivery_at'
                        ).length;

                        const cancelled = userOrders.filter(order => order.status === 'canceled').length;
                        const total = userOrders.length;

                        if (awaitingPickupCount) awaitingPickupCount.textContent = awaitingPickup;
                        if (cancelledOrdersCount) cancelledOrdersCount.textContent = cancelled;
                        if (totalOrdersCount) totalOrdersCount.textContent = total;


                        // --- Populate History Orders Tab ---
                        if (listOrderContainer) {
                            userOrders.forEach(order => {
                                const { statusText, statusClass } = getOrderStatusDisplay(order);

                                let productsHtml = '';
                                if (order.products && order.products.length > 0) {
                                    productsHtml = order.products.map(product => `
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
                                                        ${product.size ? `<span class="prd_size uppercase">${product.size}</span><span>/</span>` : ''}
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
                                    productsHtml = `<div class="prd_item py-5">No product details available for this order.</div>`;
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
                                            <button class="button-main btn_order_detail">Order Details</button>
                                            ${order.status === 'pending' && statusText !== 'Canceled' ? `<button class="button-main bg-surface border border-line hover:bg-black text-black hover:text-white">Cancel Order</button>` : ''}
                                        </div>
                                    </div>
                                `;
                            });
                        }

                        // --- Populate Dashboard Recent Orders (e.g., top 3) ---
                        if (recentOrdersTableBody) {
                            const recentThreeOrders = userOrders.slice(0, 3); // Get the 3 most recent orders
                            recentThreeOrders.forEach(order => {
                                const mainProduct = order.products && order.products.length > 0 ? order.products[0] : { name: 'N/A', category: 'N/A', image: '/assets/images/product/productDefault.png' };
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
                                                    <strong class="product_name text-button">${mainProduct.name}</strong>
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


                    } else {
                        if (listOrderContainer) {
                            listOrderContainer.innerHTML = "<p>No orders found for this user.</p>";
                        }
                        if (recentOrdersTableBody) {
                             recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5">No recent orders.</td></tr>';
                        }
                        if (awaitingPickupCount) awaitingPickupCount.textContent = '0';
                        if (cancelledOrdersCount) cancelledOrdersCount.textContent = '0';
                        if (totalOrdersCount) totalOrdersCount.textContent = '0';

                        console.log("No orders found for the current user:", storedUserEmail);
                    }
                } else {
                    console.error("API response format error: 'success' flag is false or 'orders' is not an array.", data);
                    if (listOrderContainer) {
                        listOrderContainer.innerHTML = "<p>Failed to process orders from the server.</p>";
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching or processing orders:", error);
                if (listOrderContainer) {
                    listOrderContainer.innerHTML = `<p>Failed to load orders: ${error.message}. Please try again later.</p>`;
                }
            });

    } else {
        if (userNameDisplay) userNameDisplay.textContent = "";
        if (userEmailDisplay) userEmailDisplay.textContent = "";
        if (listOrderContainer) listOrderContainer.innerHTML = "Please log in to view your orders.";
        if (recentOrdersTableBody) recentOrdersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5">Please log in to view recent orders.</td></tr>';
        if (awaitingPickupCount) awaitingPickupCount.textContent = '0';
        if (cancelledOrdersCount) cancelledOrdersCount.textContent = '0';
        if (totalOrdersCount) totalOrdersCount.textContent = '0';
        console.log("User is not logged in or email is not available in localStorage.");
    }

    // --- Tab Switching Logic (already there, just keeping it) ---
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
        });
    });

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

            console.log("Order tab clicked:", button.textContent.trim());
        });
    });

    const initialActiveOrderTab = document.querySelector('.tab_order .menu-tab .tab-item.active');
    if (initialActiveOrderTab && orderTabIndicator) {
        orderTabIndicator.style.width = `${initialActiveOrderTab.offsetWidth}px`;
        orderTabIndicator.style.transform = `translateX(${initialActiveOrderTab.offsetLeft}px)`;
    }
});