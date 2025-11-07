document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");
    const searchIcon = document.querySelector(".ph-magnifying-glass");

    const API_URL = "https://www.shubhakuteer.in/api/admin/products"; 
    const SHOP_PAGE_BASE_URL = "/shop.html"; 

    // Define your canonical list of categories/search terms here
    const CANONICAL_CATEGORIES = [
        "Bedsheets",
        "Honeycomb Towels",
        "Dohar and Quilts",
        "Table Range",
        "More",
        "Gifting",
        "Apparels",
        "Bags and Kits",
        "Cushions and Pillow Covers"
    ];

    let products = [];
    let fuzzysortSearchableItems = []; // To store fuzzysort processed data
    // Also prepare a fuzzysort-ready version of your canonical categories
    let fuzzysortCanonicalCategories = [];

    fetch(API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            products = data;
            fuzzysortSearchableItems = products.map(p => {
                const safeSlug = p.slug ? String(p.slug) : ''; 
                return {
                    target: `${p.name} ${p.category || ''} ${p.type || ''} ${p.brand || ''}`.trim(),
                    original: { ...p, slug: safeSlug }
                };
            });
            // Prepare canonical categories for fuzzy matching
            fuzzysortCanonicalCategories = CANONICAL_CATEGORIES.map(cat => ({
                target: cat.toLowerCase(), // Search target for fuzzy matching
                original: cat            // The exact, original string to use in the URL
            }));

            console.log("Products loaded and indexed for fuzzy search.");
        })
        .catch(err => {
            console.error("Failed to fetch products:", err);
            suggestionsBox.innerHTML = "<div class='p-2 text-red-500'>Failed to load products. Please try again later.</div>";
            suggestionsBox.classList.remove("hidden");
        });

    const getProductUrl = (productSlug) => {
        if (productSlug && productSlug !== '') {
            return `/products/${productSlug}`; 
        }
        console.warn("Attempted to get product URL for an item with no slug. Redirecting to shop page.");
        return SHOP_PAGE_BASE_URL;
    };

    const showSuggestions = (query) => {
        const q = query.trim();
        if (!q) {
            suggestionsBox.classList.add("hidden");
            return;
        }

        const results = fuzzysort.go(q, fuzzysortSearchableItems, {
            key: 'target',
            limit: 5,
            threshold: -500 
        });

        if (results.length === 0) {
            suggestionsBox.classList.add("hidden");
            return;
        }

        const html = results.map(result => {
            const originalProduct = result.obj.original;
            const productUrl = getProductUrl(originalProduct.slug);
            
            const displayValue = originalProduct.name;
            const highlightedDisplayValue = fuzzysort.highlight(fuzzysort.single(q, displayValue), 
                                                                 '<b class="text-blue-600">', '</b>') || displayValue;

            return `
                <div class="p-2 hover:bg-gray-100 cursor-pointer text-gray-800" data-url="${productUrl}">
                    ${highlightedDisplayValue}
                </div>
            `;
        }).join("");

        suggestionsBox.innerHTML = html;
        suggestionsBox.classList.remove("hidden");
    };

    searchInput.addEventListener("input", (e) => {
        showSuggestions(e.target.value);
    });

    document.addEventListener("click", (e) => {
        if (!suggestionsBox.contains(e.target) && e.target !== searchInput && e.target !== searchIcon) {
            suggestionsBox.classList.add("hidden");
        }
    });

    suggestionsBox.addEventListener("click", (e) => {
        const url = e.target.closest("[data-url]")?.dataset.url;
        if (url) {
            window.location.href = url;
        }
    });

    const performSearch = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) {
            window.location.href = SHOP_PAGE_BASE_URL; 
            return;
        }

        // --- NEW: Prioritize matching against canonical categories first ---
        const canonicalMatch = fuzzysort.go(q, fuzzysortCanonicalCategories, {
            key: 'target',
            limit: 1,
            threshold: -200 // A decent threshold for matching against canonical terms
        });

        if (canonicalMatch.length > 0) {
            const matchedCanonicalTerm = canonicalMatch[0].obj.original; // Get the original, exact string
            window.location.href = `${SHOP_PAGE_BASE_URL}?cat=${encodeURIComponent(matchedCanonicalTerm)}`;
            return; // Redirected to canonical category, stop here
        }
        // --- END NEW SECTION ---


        // 1. Try to find a direct product match (if no canonical category match)
        const productResults = fuzzysort.go(q, fuzzysortSearchableItems, {
            key: 'target',
            limit: 1,
            threshold: -300 
        });

        if (productResults.length > 0) {
            const bestMatchProduct = productResults[0].obj.original;
            const productUrl = getProductUrl(bestMatchProduct.slug);
            window.location.href = productUrl;
            return;
        }

        // 2. If no direct product match, try to match categories or types from product data
        const searchableCategoriesAndTypes = Array.from(new Set([
            ...products.map(p => p.category).filter(Boolean),
            ...products.map(p => p.type).filter(Boolean)
        ])).map(item => ({ target: item.toLowerCase(), original: item }));

        const categoryOrTypeResults = fuzzysort.go(q, searchableCategoriesAndTypes, {
            key: 'target',
            limit: 1,
            threshold: -200
        });

        if (categoryOrTypeResults.length > 0) {
            const bestMatchTerm = categoryOrTypeResults[0].obj.original;
            const isCategory = products.some(p => p.category === bestMatchTerm);
            const param = isCategory ? 'cat' : 'type'; 
            
            window.location.href = `${SHOP_PAGE_BASE_URL}?${param}=${encodeURIComponent(bestMatchTerm)}`;
            return;
        }

        // 3. If no product, canonical category, or product category/type match, redirect to general shop with search query
        alert(`No close match found for "${query}". Redirecting to general shop page with search term.`);
        window.location.href = `${SHOP_PAGE_BASE_URL}?cat=${encodeURIComponent(query)}`;
    };

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch(searchInput.value);
        }
    });

    searchIcon.addEventListener("click", () => {
        performSearch(searchInput.value);
    });
});