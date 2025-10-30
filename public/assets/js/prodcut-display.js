document.addEventListener("DOMContentLoaded", () => {
    // This function will parse URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    const categoryParam = getUrlParameter('category');
    console.log("Category from URL:", categoryParam);

    // Call the function to load products based on the category (or all if no category)
    loadProducts(categoryParam);

    // Attach event listeners to category filter items in the sidebar
    document.querySelector('.list-type').addEventListener('click', (event) => {
        const target = event.target.closest('.item');
        if (target && target.dataset.item) {
            const selectedCategory = target.dataset.item;
            // Update URL without reloading the page, or navigate if you prefer a full reload
            history.pushState(null, '', `shop.html?category=${selectedCategory}`);
            loadProducts(selectedCategory); // Load products for the newly selected category
            // Add/remove active class for visual indication
            document.querySelectorAll('.list-type .item').forEach(item => item.classList.remove('active'));
            target.classList.add('active');
        }
    });
});

async function loadProducts(category = null) {
    const productListContainer = document.querySelector(".list-product.hide-product-sold");
    if (!productListContainer) {
        console.error("Product list container not found!");
        return;
    }

    productListContainer.innerHTML = `<div class="w-full text-center py-10">Loading products...</div>`; // Show loading state

    let apiUrl = "/api/products"; // Your base API endpoint for products

    if (category) {
        apiUrl += `?category=${category}`;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const products = await response.json();

        productListContainer.innerHTML = ""; // Clear existing content

        if (products.length === 0) {
            productListContainer.innerHTML = `<div class="w-full text-center py-10">No products found for this category.</div>`;
            return;
        }

        products.forEach(product => {
            const productElement = `
                <div class="product-item grid-type" data-item="${product.id}">
                    <div class="product-main cursor-pointer block">
                        <div class="product-thumb bg-white relative overflow-hidden rounded-2xl">
                            ${product.isNew ? `<div class="product-tag text-button-uppercase bg-green px-3 py-0.5 inline-block rounded-full absolute top-3 left-3 z-[1]">New</div>` : ''}
                            <!-- Wishlist/Compare buttons (can be simplified if not needed for quick view) -->
                            <div class="list-action-right absolute top-3 right-3 max-lg:hidden">
                                <div class="add-wishlist-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative">
                                    <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Add To Wishlist</div>
                                    <i class="ph ph-heart text-lg"></i>
                                </div>
                                <div class="compare-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative mt-2">
                                    <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Compare Product</div>
                                    <i class="ph ph-arrow-counter-clockwise text-lg compare-icon"></i>
                                    <i class="ph ph-check-circle text-lg checked-icon"></i>
                                </div>
                            </div>
                            <div class="product-img w-full h-full aspect-[3/4]">
                                <img class="w-full h-full object-cover duration-700" src="${product.imageUrl}" alt="${product.name}" />
                                <!-- Potentially another image for hover effect if you have it -->
                                ${product.hoverImageUrl ? `<img class="w-full h-full object-cover duration-700" src="${product.hoverImageUrl}" alt="${product.name}" />` : ''}
                            </div>
                            <!-- Quick View / Add To Cart buttons (can be simplified) -->
                            <div class="list-action grid grid-cols-2 gap-3 px-5 absolute w-full bottom-5 max-lg:hidden">
                                <div class="quick-view-btn w-full text-button-uppercase py-2 text-center rounded-full duration-300 bg-white hover:bg-black hover:text-white">Quick View</div>
                                <div class="add-cart-btn w-full text-button-uppercase py-2 text-center rounded-full duration-500 bg-white hover:bg-black hover:text-white">Add To Cart</div>
                            </div>
                        </div>
                        <div class="product-infor mt-4 lg:mb-7">
                            ${product.soldCount !== undefined && product.availableCount !== undefined ? `
                            <div class="product-sold sm:pb-4 pb-2">
                                <div class="progress bg-line h-1.5 w-full rounded-full overflow-hidden relative">
                                    <div class="progress-sold bg-red absolute left-0 top-0 h-full" style="width: ${((product.soldCount / (product.soldCount + product.availableCount)) * 100) || 0}%;"></div>
                                </div>
                                <div class="flex items-center justify-between gap-3 gap-y-1 flex-wrap mt-2">
                                    <div class="text-button-uppercase">
                                        <span class="text-secondary2 max-sm:text-xs">Sold: </span>
                                        <span class="max-sm:text-xs">${product.soldCount}</span>
                                    </div>
                                    <div class="text-button-uppercase">
                                        <span class="text-secondary2 max-sm:text-xs">Available: </span>
                                        <span class="max-sm:text-xs">${product.availableCount}</span>
                                    </div>
                                </div>
                            </div>` : ''}
                            <div class="product-name text-title duration-300"><a href="product-detail.html?id=${product.id}">${product.name}</a></div>
                            ${product.colors && product.colors.length > 0 ? `
                            <div class="list-color py-2 max-md:hidden flex items-center gap-3 flex-wrap duration-500">
                                ${product.colors.map(color => `
                                    <div class="color-item w-8 h-8 rounded-full duration-300 relative" style="background-color: ${color.hexCode || color.name.toLowerCase()};">
                                        <div class="tag-action bg-black text-white caption2 capitalize px-1.5 py-0.5 rounded-sm">${color.name}</div>
                                    </div>
                                `).join('')}
                            </div>` : ''}
                            <div class="product-price-block flex items-center gap-2 flex-wrap mt-1 duration-300 relative z-[1]">
                                <div class="product-price text-title">₹${product.price.toFixed(2)}</div>
                                ${product.originalPrice ? `
                                <div class="product-origin-price caption1 text-secondary2">
                                    <del>₹${product.originalPrice.toFixed(2)}</del>
                                </div>` : ''}
                                ${product.discountPercentage ? `
                                <div class="product-sale caption1 font-medium bg-green px-3 py-0.5 inline-block rounded-full">
                                    -${product.discountPercentage}%</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productListContainer.innerHTML += productElement;
        });
    } catch (error) {
        console.error("Error loading products:", error);
        productListContainer.innerHTML = `<div class="w-full text-center py-10 text-red-600">Failed to load products. Please try again later.</div>`;
    }
}

// Ensure category links in the sidebar also trigger filtering
document.querySelectorAll('.list-type .item').forEach(item => {
    item.addEventListener('click', (event) => {
        const category = event.currentTarget.dataset.item;
        history.pushState(null, '', `shop.html?category=${category}`); // Update URL
        loadProducts(category);
        document.querySelectorAll('.list-type .item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    });
});