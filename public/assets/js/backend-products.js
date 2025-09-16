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

        const response = await fetch('/api/admin/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        cachedProducts = products;
        return products;
    } catch (error) {
        console.error('Error fetching products from backend:', error);
        // Fallback to static JSON if backend fails
        try {
            const response = await fetch('./assets/data/Product.json');
            const fallbackProducts = await response.json();
            console.log('Using fallback products from JSON');
            return fallbackProducts;
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return [];
        }
    }
}

// Function to convert backend product format to frontend format
function convertBackendProductToFrontend(backendProduct) {
    return {
        id: backendProduct.id.toString(),
        category: backendProduct.category || 'fashion',
        type: backendProduct.type || 'product',
        name: backendProduct.name,
        new: backendProduct.is_new === 1,
        sale: backendProduct.on_sale === 1,
        rate: backendProduct.rate || 4,
        price: parseFloat(backendProduct.price) || 0,
        originPrice: parseFloat(backendProduct.origin_price) || parseFloat(backendProduct.price) || 0,
        brand: backendProduct.brand || 'SHUBHA KUTEER',
        sold: backendProduct.sold || 0,
        quantity: backendProduct.quantity || 100,
        quantityPurchase: 1,
        sizes: backendProduct.sizes ? JSON.parse(backendProduct.sizes) : ['M', 'L', 'XL'],
        variation: [
            {
                color: "default",
                colorCode: "#DB4444",
                colorImage: "./assets/images/product/color/48x48.png",
                image: backendProduct.main_image || "./assets/images/product/bag-1.png"
            }
        ],
        thumbImage: [
            backendProduct.thumb_image || backendProduct.main_image || "./assets/images/product/bag-1.png"
        ],
        images: backendProduct.gallery ? JSON.parse(backendProduct.gallery) : [
            backendProduct.main_image || "./assets/images/product/bag-1.png"
        ],
        description: backendProduct.description || "Quality product from Shubha Kuteer",
        action: backendProduct.action || "add to cart",
        slug: backendProduct.slug || backendProduct.name.toLowerCase().replace(/\s+/g, '-')
    };
}

// Function to create product item HTML (updated to use backend data)
function createProductItem(product, index = 0) {
    const isNew = product.new ? 'bg-green' : '';
    const isSale = product.sale ? 'bg-red' : '';
    const tagClass = isNew || isSale;
    const tagText = product.new ? 'New' : product.sale ? 'Sale' : '';
    
    const discountPercent = product.originPrice > product.price ? 
        Math.round(((product.originPrice - product.price) / product.originPrice) * 100) : 0;

    return `
        <div class="product-item grid-type" data-item="${product.id}">
            <div class="product-main cursor-pointer block">
                <div class="product-thumb bg-white relative overflow-hidden rounded-2xl">
                    ${tagClass ? `<div class="product-tag text-button-uppercase ${tagClass} px-3 py-0.5 inline-block rounded-full absolute top-3 left-3 z-[1]">${tagText}</div>` : ''}
                    <div class="product-image relative">
                        <img src="${product.thumbImage[0] || product.images[0] || './assets/images/product/bag-1.png'}" 
                             alt="${product.name}" 
                             class="w-full aspect-square object-cover" />
                    </div>
                    <div class="product-action absolute top-3 right-3 flex flex-col gap-2">
                        <div class="action-item w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-green hover:text-white transition-all">
                            <i class="ph ph-heart text-sm"></i>
                        </div>
                        <div class="action-item w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-green hover:text-white transition-all">
                            <i class="ph ph-eye text-sm"></i>
                        </div>
                    </div>
                </div>
                <div class="product-infor p-4">
                    <div class="product-name text-button mb-2 line-clamp-2">${product.name}</div>
                    <div class="product-category caption1 text-secondary2 mb-2">${product.type}</div>
                    
                    <div class="product-rating flex items-center gap-1 mb-2">
                        <div class="list-star flex items-center gap-1">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="ph ph-star ${i < product.rate ? 'text-yellow' : 'text-gray-300'} text-xs"></i>`
                            ).join('')}
                        </div>
                        <div class="caption1 text-secondary2">(${product.sold})</div>
                    </div>

                    <div class="product-price-block flex items-center gap-2 flex-wrap mt-1 duration-300 relative z-[1]">
                        <div class="product-price text-title">₹${product.price.toFixed(2)}</div>
                        ${product.originPrice > product.price ? 
                            `<div class="product-origin-price caption1 text-secondary2"><del>₹${product.originPrice.toFixed(2)}</del></div>` : ''
                        }
                        ${discountPercent > 0 ? 
                            `<div class="product-discount caption1 text-green font-semibold">-${discountPercent}%</div>` : ''
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to load products into a specific container
async function loadProductsIntoContainer(containerSelector, limit = null, gridCols = 'grid-cols-2') {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Container not found: ${containerSelector}`);
        return;
    }

    try {
        // Show loading state
        container.innerHTML = '<div class="col-span-full text-center py-8">Loading products...</div>';
        
        const backendProducts = await fetchProductsFromBackend();
        const products = backendProducts.map(convertBackendProductToFrontend);
        
        // Limit products if specified
        const displayProducts = limit ? products.slice(0, limit) : products;
        
        if (displayProducts.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-8">No products found</div>';
            return;
        }

        // Update grid classes
        container.className = container.className.replace(/grid-cols-\d+/, gridCols);
        
        // Generate product HTML
        const productsHTML = displayProducts.map((product, index) => 
            createProductItem(product, index)
        ).join('');

        container.innerHTML = productsHTML;
        
        // Add event listeners to the new product items
        addEventToProductItem(container);
        
        console.log(`Loaded ${displayProducts.length} products into ${containerSelector}`);
        
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<div class="col-span-full text-center py-8 text-red-500">Error loading products</div>';
    }
}

// Initialize product loading for different sections
document.addEventListener('DOMContentLoaded', async () => {
    // Load products for different sections based on page
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        // Home page - load recent products (2x2 grid)
        await loadProductsIntoContainer('.list-product.hide-product-sold', 4, 'grid-cols-2');
        
        // Load "You May Also Like" products (4 items)
        await loadProductsIntoContainer('.list-product:not(.hide-product-sold)', 4, 'xl:grid-cols-4 sm:grid-cols-3 grid-cols-2');
        
    } else if (currentPage === 'shop.html') {
        // Shop page - load all products (3 columns)
        await loadProductsIntoContainer('.list-product.hide-product-sold[data-item="12"]', null, 'sm:grid-cols-3 grid-cols-2');
        
        // Load recently viewed products (4 columns)
        await loadProductsIntoContainer('.list-product.hide-product-sold.grid.xl\\:grid-cols-4', 4, 'xl:grid-cols-4 sm:grid-cols-3 grid-cols-2');
        
    } else if (currentPage === 'new-collection.html') {
        // New collection page
        await loadProductsIntoContainer('.list-product', null, 'sm:grid-cols-3 grid-cols-2');
    }
});

// Export functions for use in other files
window.BackendProducts = {
    fetchProductsFromBackend,
    convertBackendProductToFrontend,
    createProductItem,
    loadProductsIntoContainer
};
