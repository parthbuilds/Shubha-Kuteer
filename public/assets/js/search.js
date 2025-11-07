document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");
    const searchIcon = document.querySelector(".ph-magnifying-glass");

    // ✅ Fetches your product data (full HTTPS URLs) correctly
    // Replace with your actual API endpoint that returns an array of product objects
    // Each product object should ideally have a 'name' (for search) and 'url' (for redirection)
    const API_URL = "https://www.shubhakuteer.in/api/admin/products"; 

    let products = [];
    let fuzzysortResults = []; // To store fuzzysort processed data

    // Fetch products once on load
    fetch(API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            products = data;
            // Pre-process products for fuzzysort
            // fuzzysort.go uses objects directly, but we need to tell it which key to search on.
            fuzzysortResults = products.map(p => ({
                target: p.name, // The string to be searched
                original: p    // Keep a reference to the original product object
            }));
            console.log("Products loaded and indexed for fuzzy search.");
        })
        .catch(err => {
            console.error("Failed to fetch products:", err);
            // Optionally, display a user-friendly error message
            suggestionsBox.innerHTML = "<div class='p-2 text-red-500'>Failed to load products. Please try again later.</div>";
            suggestionsBox.classList.remove("hidden");
        });

    // ✅ Shows live suggestions while typing
    const showSuggestions = (query) => {
        const q = query.trim();
        if (!q) {
            suggestionsBox.classList.add("hidden");
            return;
        }

        // ✅ Uses fuzzy search (so “bedshet”, “bedsheetz”, etc. still work)
        // ✅ Matches even if you type partial words (“bed”, “sheet”, “bedsheet”)
        // Fuzzysort search on the 'target' key of our pre-processed objects
        const results = fuzzysort.go(q, fuzzysortResults, {
            key: 'target',
            limit: 5, // Limit to 5 suggestions
            threshold: -1000 // Adjust this for stricter/looser matching. -1000 is quite loose.
        });

        if (results.length === 0) {
            suggestionsBox.classList.add("hidden");
            return;
        }

        const html = results.map(result => {
            const originalProduct = result.obj.original; // Get the original product object
            // Highlight matching parts, if desired, using fuzzysort.highlight
            const highlightedName = fuzzysort.highlight(result, '<b class="text-blue-600">', '</b>');
            return `
                <div class="p-2 hover:bg-gray-100 cursor-pointer text-gray-800" data-url="${originalProduct.url}">
                    ${highlightedName || originalProduct.name}
                </div>
            `;
        }).join("");

        suggestionsBox.innerHTML = html;
        suggestionsBox.classList.remove("hidden");
    };

    // Handle typing in the search input
    searchInput.addEventListener("input", (e) => {
        showSuggestions(e.target.value);
    });

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
            suggestionsBox.classList.add("hidden");
        }
    });

    // ✅ Redirects on click or Enter (for suggestions)
    suggestionsBox.addEventListener("click", (e) => {
        const url = e.target.closest("[data-url]")?.dataset.url;
        if (url) {
            window.location.href = url;
        }
    });

    // Main search logic for Enter key in input or icon click
    const performSearch = (query) => {
        const q = query.trim();
        if (!q) {
            // Optionally redirect to a general shop page or do nothing if query is empty
            window.location.href = 'shop.html'; 
            return;
        }

        const results = fuzzysort.go(q, fuzzysortResults, {
            key: 'target',
            limit: 1, // Only need the best match for a direct search
            threshold: -500 // A bit stricter for direct navigation
        });

        if (results.length > 0) {
            const bestMatchProduct = results[0].obj.original;
            window.location.href = bestMatchProduct.url;
        } else {
            alert(`No close match found for "${query}". Please try a different term.`);
            // Optionally redirect to a general shop page or search results page with the query
            // window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
    };

    // Handle Enter key in the main search input
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default form submission
            performSearch(searchInput.value);
        }
    });

    // Handle click on the magnifying glass icon
    searchIcon.addEventListener("click", () => {
        performSearch(searchInput.value);
    });
});