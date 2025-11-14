document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------
    // DOM SAFETY CHECK
    // -----------------------------
    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");
    const searchIcon = document.querySelector(".ph-magnifying-glass");

    if (!searchInput || !suggestionsBox || !searchIcon) {
        console.error("❌ Search bar elements missing in DOM.");
        return;
    }

    console.log("✅ Search DOM Loaded.");

    const API_URL = "https://www.shubhakuteer.in/api/admin/products"; 
    const SHOP_PAGE_BASE_URL = "/shop.html"; 
    const PRODUCT_DISPLAY_BASE_URL = "/product-default.html";

    const CANONICAL_CATEGORIES = [
        "Bedsheets","Honeycomb Towels","Dohar and Quilts","Table Range",
        "More","Gifting","Apparels","Bags and Kits","Cushions and Pillow Covers"
    ];

    const SYNONYM_MAP = {
        "kaftan": "Apparels",
        "kaftans": "Apparels",
        "kaf": "Apparels",
        "king size bedsheets": "Bedsheets",
        "queen size bedsheets": "Bedsheets",
        "towel": "Honeycomb Towels",
        "pillow": "Cushions and Pillow Covers",
        "cushion": "Cushions and Pillow Covers",
        "dohar": "Dohar and Quilts",
        "table mat": "Table Range",
        "bag": "Bags and Kits",
        "curtain": "More"
    };

    let products = [];
    let fuzzysortSearchableItems = [];
    let fuzzysortCanonicalAndSynonymTerms = [];

    // -----------------------------
    // LOAD PRODUCT LIST
    // -----------------------------
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            products = data;

            fuzzysortSearchableItems = products.map(p => {
                return {
                    target: `${p.name} ${p.category || ''} ${p.type || ''} ${p.brand || ''}`.trim(),
                    original: { ...p, id: String(p.id || "") }
                };
            });

            fuzzysortCanonicalAndSynonymTerms = [
                ...CANONICAL_CATEGORIES.map(cat => ({ target: cat.toLowerCase(), original: cat })),
                ...Object.entries(SYNONYM_MAP).map(([term, cat]) => ({
                    target: term.toLowerCase(), original: cat
                }))
            ];

            console.log("✅ Products loaded for search.");
        })
        .catch(err => console.error("❌ Failed loading products:", err));

    // -----------------------------
    // PRODUCT URL BUILDER
    // -----------------------------
    const getProductUrl = (id) =>
        id ? `${PRODUCT_DISPLAY_BASE_URL}?id=${encodeURIComponent(id)}` : SHOP_PAGE_BASE_URL;

    // -----------------------------
    // SHOW SUGGESTIONS
    // -----------------------------
    const showSuggestions = (query) => {
        const q = query.trim();
        if (!q) return suggestionsBox.classList.add("hidden");

        const results = fuzzysort.go(q, fuzzysortSearchableItems, { key: "target", limit: 5 });

        if (!results.length) {
            suggestionsBox.classList.add("hidden");
            return;
        }

        suggestionsBox.innerHTML = results.map(r => `
            <div class="p-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                 data-url="${getProductUrl(r.obj.original.id)}">
                ${r.obj.original.name}
            </div>
        `).join("");

        suggestionsBox.classList.remove("hidden");
    };

    searchInput.addEventListener("input", e => showSuggestions(e.target.value));

    suggestionsBox.addEventListener("click", e => {
        const url = e.target.closest("[data-url]")?.dataset.url;
        if (url) window.location.href = url;
    });

    document.addEventListener("click", e => {
        if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
            suggestionsBox.classList.add("hidden");
        }
    });

    // -----------------------------
    // PERFORM SEARCH
    // -----------------------------
    const performSearch = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return window.location.href = SHOP_PAGE_BASE_URL;

        // 1. Category Redirect
        const catMatch = fuzzysort.go(q, fuzzysortCanonicalAndSynonymTerms, { limit: 1 });
        if (catMatch.length > 0) {
            return window.location.href =
                `${SHOP_PAGE_BASE_URL}?cat=${encodeURIComponent(catMatch[0].obj.original)}`;
        }

        // 2. Product Redirect
        const productMatch = fuzzysort.go(q, fuzzysortSearchableItems, { limit: 1 });
        if (productMatch.length > 0) {
            return window.location.href =
                getProductUrl(productMatch[0].obj.original.id);
        }

        // 3. Fallback
        window.location.href = `${SHOP_PAGE_BASE_URL}?cat=${encodeURIComponent(query)}`;
    };

    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch(searchInput.value);
    });
    searchIcon.addEventListener("click", () => performSearch(searchInput.value));
});
