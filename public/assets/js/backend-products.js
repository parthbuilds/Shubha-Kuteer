// Backend Product Integration
// This file handles loading products from the backend API instead of static JSON

// Global product cache
let cachedProducts = null;

// Function to fetch products from backend API
async function fetchProductsFromBackend() {
    try {
        if (cachedProducts) {
            return cachedProducts;
        }

        console.log("🔄 Fetching products from backend API...");
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products from backend`);
        
        // Cache the products
        cachedProducts = products;
        return products;
    } catch (error) {
        console.error("❌ Error fetching products from backend:", error);
        
        // Fallback to static JSON if backend fails
        console.log("🔄 Falling back to static Product.json...");
        try {
            const response = await fetch('/assets/data/Product.json');
            const fallbackProducts = await response.json();
            console.log(`✅ Loaded ${fallbackProducts.length} products from fallback`);
            return fallbackProducts;
        } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError);
            return [];
        }
    }
}

// Function to render products in 4-card layout
function renderProducts4Card(products, containerSelector, limit = 4) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Container ${containerSelector} not found`);
        return;
    }

    const limitedProducts = products.slice(0, limit);
    
    container.innerHTML = limitedProducts.map(product => `
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12">
            <div class="tf-product tf-product-style-1">
                <div class="image">
                    <img src="${product.thumbImage?.[0] || product.images?.[0] || '/assets/images/product/default.png'}" alt="${product.name}">
                    <div class="badge">
                        ${product.new ? '<span class="tf-product-label tf-product-label-new">New</span>' : ''}
                        ${product.sale ? '<span class="tf-product-label tf-product-label-sale">Sale</span>' : ''}
                    </div>
                    <div class="group-button">
                        <a href="#" class="tf-product-btn tf-product-btn-compare"><i class="icon-compare"></i></a>
                        <a href="#" class="tf-product-btn tf-product-btn-wishlist"><i class="icon-heart"></i></a>
                        <a href="#" class="tf-product-btn tf-product-btn-quickview"><i class="icon-eye"></i></a>
                    </div>
                </div>
                <div class="content">
                    <div class="info">
                        <div class="star">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="icon-star ${i < (product.rate || 0) ? 'active' : ''}"></i>`
                            ).join('')}
                        </div>
                        <div class="text-tiny">${product.brand}</div>
                    </div>
                    <h3 class="title"><a href="product-default.html?id=${product.id}">${product.name}</a></h3>
                    <div class="price">
                        <span class="sale-price">₹${product.price}</span>
                        ${product.originPrice > product.price ? `<span class="regular-price">₹${product.originPrice}</span>` : ''}
                    </div>
                    <div class="group-btn">
                        <a href="#" class="tf-button tf-button-style-1" data-product-id="${product.id}">
                            <span class="text">${product.action || 'Add to cart'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Function to render products in 6-card layout
function renderProducts6Card(products, containerSelector, limit = 6) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Container ${containerSelector} not found`);
        return;
    }

    const limitedProducts = products.slice(0, limit);
    
    container.innerHTML = limitedProducts.map(product => `
        <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12">
            <div class="tf-product tf-product-style-1">
                <div class="image">
                    <img src="${product.thumbImage?.[0] || product.images?.[0] || '/assets/images/product/default.png'}" alt="${product.name}">
                    <div class="badge">
                        ${product.new ? '<span class="tf-product-label tf-product-label-new">New</span>' : ''}
                        ${product.sale ? '<span class="tf-product-label tf-product-label-sale">Sale</span>' : ''}
                    </div>
                    <div class="group-button">
                        <a href="#" class="tf-product-btn tf-product-btn-compare"><i class="icon-compare"></i></a>
                        <a href="#" class="tf-product-btn tf-product-btn-wishlist"><i class="icon-heart"></i></a>
                        <a href="#" class="tf-product-btn tf-product-btn-quickview"><i class="icon-eye"></i></a>
                    </div>
                </div>
                <div class="content">
                    <div class="info">
                        <div class="star">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="icon-star ${i < (product.rate || 0) ? 'active' : ''}"></i>`
                            ).join('')}
                        </div>
                        <div class="text-tiny">${product.brand}</div>
                    </div>
                    <h3 class="title"><a href="product-default.html?id=${product.id}">${product.name}</a></h3>
                    <div class="price">
                        <span class="sale-price">₹${product.price}</span>
                        ${product.originPrice > product.price ? `<span class="regular-price">₹${product.originPrice}</span>` : ''}
                    </div>
                    <div class="group-btn">
                        <a href="#" class="tf-button tf-button-style-1" data-product-id="${product.id}">
                            <span class="text">${product.action || 'Add to cart'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Function to render products in shop grid
function renderProductsShop(products, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Container ${containerSelector} not found`);
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12">
            <div class="tf-product tf-product-style-1">
                <div class="image">
                    <img src="${product.thumbImage?.[0] || product.images?.[0] || '/assets/images/product/default.png'}" alt="${product.name}">
                    <div class="badge">
                        ${product.new ? '<span class="tf-product-label tf-product-label-new">New</span>' : ''}
                        ${product.sale ? '<span class="tf-product-label tf-product-label-sale">Sale</span>' : ''}
                    </div>
                    <div class="group-button">
                        <a href="#" class="tf-product-btn tf-product-btn-compare"><i class="icon-compare"></i></a>
                        <a href="#" class="tf-product-btn tf-product-btn-wishlist"><i class="icon-heart"></i></a>
                        <a href="#" class="tf-product-btn tf-product-btn-quickview"><i class="icon-eye"></i></a>
                    </div>
                </div>
                <div class="content">
                    <div class="info">
                        <div class="star">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="icon-star ${i < (product.rate || 0) ? 'active' : ''}"></i>`
                            ).join('')}
                        </div>
                        <div class="text-tiny">${product.brand}</div>
                    </div>
                    <h3 class="title"><a href="product-default.html?id=${product.id}">${product.name}</a></h3>
                    <div class="price">
                        <span class="sale-price">₹${product.price}</span>
                        ${product.originPrice > product.price ? `<span class="regular-price">₹${product.originPrice}</span>` : ''}
                    </div>
                    <div class="group-btn">
                        <a href="#" class="tf-button tf-button-style-1" data-product-id="${product.id}">
                            <span class="text">${product.action || 'Add to cart'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize products when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const products = await fetchProductsFromBackend();
        
        // Render products in different layouts
        renderProducts4Card(products, '.product-grid-4', 4);
        renderProducts6Card(products, '.product-grid-6', 6);
        renderProductsShop(products, '.shop-product-grid');
        
        console.log("✅ All product grids rendered successfully");
    } catch (error) {
        console.error("❌ Error initializing products:", error);
    }
});
