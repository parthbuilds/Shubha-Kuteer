// // Your raw data, which defines all possible categories and types for search.
// // This is the source of truth for what products exist.
// const rawProductData = [
//     { category: "Bedsheets", type: "bedsheets" },
//     { category: "Honeycomb Towels", type: "towels" },
//     { category: "Dohar and Quilts", type: "dohar" },
//     { category: "Table Range", type: "table-runners" },
//     { category: "More", type: "curtains" },
//     { category: "Gifting", type: "bedcovers" },
//     { category: "Gifting", type: "dohar-bedsheet-combo" },
//     { category: "Gifting", type: "bedsheet-quilts-combo" },
//     { category: "Apparels", type: "kaftans" },
//     { category: "Table Range", type: "table-mats" },
//     { category: "Bags and Kits", type: "tote-bags" },
//     { category: "Bags and Kits", type: "travel-kits" },
//     { category: "Cushions and Pillow Covers", type: "pillow-cover" }
// ];

// // Pre-process the raw data to get unique categories and types.
// // This optimizes search by avoiding redundant checks and ensuring we only match against valid product groupings.
// const uniqueCategories = Array.from(new Set(rawProductData.map(item => item.category)));
// const uniqueTypes = Array.from(new Set(rawProductData.map(item => item.type)));


// /**
//  * Calculates a similarity score between a search term and a target string.
//  * This helps in fuzzy matching, allowing for slight variations in user input.
//  *
//  * @param {string} searchTerm The input from the user's search bar.
//  * @param {string} targetString A category or type name from the product data.
//  * @returns {number} A score indicating how similar the two strings are (higher is better).
//  */
// function getSimilarityScore(searchTerm, targetString) {
//     // Normalize both strings for case-insensitive and trimmed comparison
//     searchTerm = searchTerm.toLowerCase().trim();
//     targetString = targetString.toLowerCase().trim();

//     // 1. Exact Match (highest confidence)
//     if (searchTerm === targetString) {
//         return 100;
//     }

//     // 2. Direct Substring Match
//     // If the search term is directly contained within the target string.
//     if (targetString.includes(searchTerm)) {
//         // Score based on length of match relative to target string,
//         // giving preference to longer matches within the target.
//         return 70 + (searchTerm.length / targetString.length) * 20; // 70-90
//     }
    
//     // 3. Reverse Substring Match
//     // If a significant part of the target string is in the search term (e.g., "towels" in "towel set")
//     if (searchTerm.includes(targetString) && targetString.length > 2) {
//         return 60 + (targetString.length / searchTerm.length) * 10; // 60-70
//     }

//     // 4. Keyword/Word-level Matching
//     // Split both strings into words and count common significant words.
//     const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 2); // Words longer than 2 chars
//     const targetWords = targetString.split(/\s+/).filter(w => w.length > 2);
//     let commonWords = 0;
//     searchWords.forEach(sWord => {
//         if (targetWords.includes(sWord)) {
//             commonWords++;
//         }
//     });

//     if (commonWords > 0) {
//         // Score based on the proportion of common words
//         // More common words means higher similarity.
//         return 40 + (commonWords / Math.min(searchWords.length, targetWords.length)) * 20; // 40-60
//     }

//     // 5. Fallback for very partial or no clear match
//     return 0; // No significant similarity found
// }

// /**
//  * Searches for a product category or type based on user input
//  * and redirects the user to the appropriate shop page with URL parameters.
//  * It uses a fuzzy matching algorithm to handle partial or related search terms.
//  *
//  * @param {string} searchTerm The text entered by the user in the search bar.
//  */
// function searchAndRedirect(searchTerm) {
//     const normalizedSearchTerm = searchTerm.toLowerCase().trim();

//     // If search term is empty, just return or redirect to a default shop page.
//     if (!normalizedSearchTerm) {
//         window.location.href = 'shop.html'; // Redirect to general shop page
//         return;
//     }

//     let bestMatch = null;
//     let highestScore = 0;

//     // Iterate through all unique categories to find the best match
//     for (const category of uniqueCategories) {
//         const score = getSimilarityScore(normalizedSearchTerm, category);
//         if (score > highestScore) {
//             highestScore = score;
//             bestMatch = { paramType: 'cat', paramValue: category };
//         }
//     }

//     // Iterate through all unique types to find the best match.
//     // A type might sometimes be a better match than a category (e.g., searching "dohar" vs "Dohar and Quilts").
//     for (const type of uniqueTypes) {
//         const score = getSimilarityScore(normalizedSearchTerm, type);
//         // We check if this score is strictly better. If it's equal, we might prefer category,
//         // but for now, the first 'best' found is kept.
//         if (score > highestScore) {
//             highestScore = score;
//             bestMatch = { paramType: 'type', paramValue: type };
//         }
//     }

//     // Define a minimum score required for a valid redirection.
//     // Adjust this threshold to make the search more or less strict.
//     // For example, 30 means some keyword overlap is sufficient. 60 means a strong substring/keyword match.
//     const MIN_SCORE_FOR_REDIRECT = 40; 

//     if (bestMatch && highestScore >= MIN_SCORE_FOR_REDIRECT) {
//         // Construct the redirect URL with the best match.
//         // encodeURIComponent ensures spaces are converted to %20 and other special characters are handled.
//         const redirectUrl = `shop.html?${bestMatch.paramType}=${encodeURIComponent(bestMatch.paramValue)}`;
//         window.location.href = redirectUrl;
//     } else {
//         // If no sufficient match, provide feedback to the user.
//         alert(`No close match found for "${searchTerm}". Please try a different term. Examples: 'towels', 'bedsheets', 'cushions', 'table mats'.`);
//         // Optionally, redirect to a general shop page or display other UI feedback.
//         // window.location.href = 'shop.html';
//     }
// }

// // --- Event Listener Setup ---

// // Ensure the DOM is fully loaded before trying to access HTML elements.
// document.addEventListener('DOMContentLoaded', () => {
//     const searchInput = document.querySelector('.form-search input[type="text"]');
//     const searchIcon = document.querySelector('.form-search .ph-magnifying-glass'); // Assuming your search icon has this class

//     // If the search input element exists, attach an event listener for the 'Enter' key.
//     if (searchInput) {
//         searchInput.addEventListener('keypress', function (e) {
//             if (e.key === 'Enter') {
//                 e.preventDefault(); // Prevent default form submission behavior (page reload)
//                 searchAndRedirect(searchInput.value);
//             }
//         });
//     }

//     // If the search icon element exists, attach an event listener for clicks.
//     if (searchIcon) {
//         searchIcon.addEventListener('click', () => {
//             if (searchInput) { // Ensure searchInput is available before trying to get its value
//                 searchAndRedirect(searchInput.value);
//             }
//         });
//     }
// });


// Your raw data, which defines all possible categories and types for search.
// This is the source of truth for what products exist,
// with a direct mapping to a URL-friendly slug.
const rawProductData = [
    // Categories and their primary types/slugs
    { category: "Bedsheets", slug: "bedsheets", type: "bedsheets" },
    { category: "Honeycomb Towels", slug: "towels", type: "towels" },
    { category: "Dohar and Quilts", slug: "dohar", type: "dohar" },
    { category: "Table Range", slug: "table-range", type: "table-runners" }, // category slug
    { category: "More", slug: "curtains", type: "curtains" },
    { category: "Gifting", slug: "gifting", type: "bedcovers" }, // category slug
    { category: "Apparels", slug: "kaftans", type: "kaftans" },
    { category: "Bags and Kits", slug: "bags-kits", type: "tote-bags" }, // category slug
    { category: "Cushions and Pillow Covers", slug: "cushions-pillow-covers", type: "pillow-cover" }, // category slug

    // Specific product types that might be searched directly
    { type: "bedsheets", slug: "bedsheets" },
    { type: "towels", slug: "towels" },
    { type: "dohar", slug: "dohar" },
    { type: "quilts", slug: "dohar" }, // "quilts" maps to "dohar" slug
    { type: "table runners", slug: "table-runners" },
    { type: "curtains", slug: "curtains" },
    { type: "bedcovers", slug: "bedcovers" },
    { type: "dohar-bedsheet-combo", slug: "dohar-bedsheet-combo" },
    { type: "bedsheet-quilts-combo", slug: "bedsheet-quilts-combo" },
    { type: "kaftans", slug: "kaftans" },
    { type: "table-mats", slug: "table-mats" },
    { type: "tote-bags", slug: "tote-bags" },
    { type: "travel-kits", slug: "travel-kits" },
    { type: "pillow-cover", slug: "pillow-cover" },
    { type: "pillow covers", slug: "pillow-cover" }, // common plural search
];

// Prepare all searchable terms (categories and types) with their corresponding slugs
// for efficient lookup and redirection.
const searchableItems = [];
rawProductData.forEach(item => {
    if (item.category && item.slug) {
        searchableItems.push({ term: item.category, slug: item.slug });
    }
    if (item.type && item.slug && item.type !== item.category) { // Avoid duplicating if type is same as category
        searchableItems.push({ term: item.type, slug: item.slug });
    }
});

// Remove duplicates in case a type and category have the same term but lead to the same slug,
// or if there are multiple entries for the same term leading to the same slug.
const uniqueSearchableItems = Array.from(new Set(searchableItems.map(item => JSON.stringify(item))))
    .map(item => JSON.parse(item));


/**
 * Calculates a similarity score between a search term and a target string.
 * This helps in fuzzy matching, allowing for slight variations in user input.
 *
 * @param {string} searchTerm The input from the user's search bar.
 * @param {string} targetString A category or type name from the product data.
 * @returns {number} A score indicating how similar the two strings are (higher is better).
 */
function getSimilarityScore(searchTerm, targetString) {
    // Normalize both strings for case-insensitive and trimmed comparison
    searchTerm = searchTerm.toLowerCase().trim();
    targetString = targetString.toLowerCase().trim();

    // 1. Exact Match (highest confidence)
    if (searchTerm === targetString) {
        return 100;
    }

    // 2. Direct Substring Match
    if (targetString.includes(searchTerm)) {
        return 70 + (searchTerm.length / targetString.length) * 20; // 70-90
    }

    // 3. Reverse Substring Match
    if (searchTerm.includes(targetString) && targetString.length > 2) {
        return 60 + (targetString.length / searchTerm.length) * 10; // 60-70
    }

    // 4. Keyword/Word-level Matching
    const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 2);
    const targetWords = targetString.split(/\s+/).filter(w => w.length > 2);
    let commonWords = 0;
    searchWords.forEach(sWord => {
        if (targetWords.includes(sWord)) {
            commonWords++;
        }
    });

    if (commonWords > 0) {
        return 40 + (commonWords / Math.min(searchWords.length, targetWords.length)) * 20; // 40-60
    }

    // 5. Fallback for very partial or no clear match
    return 0;
}

/**
 * Searches for a product category or type based on user input
 * and redirects the user to the appropriate shop page with a URL parameter.
 * It uses a fuzzy matching algorithm to handle partial or related search terms.
 *
 * @param {string} searchTerm The text entered by the user in the search bar.
 */
function searchAndRedirect(searchTerm) {
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    if (!normalizedSearchTerm) {
        window.location.href = 'shop.html'; // Redirect to general shop page if search is empty
        return;
    }

    let bestMatch = null;
    let highestScore = 0;

    // Iterate through all prepared searchable terms (categories and types)
    for (const item of uniqueSearchableItems) {
        const score = getSimilarityScore(normalizedSearchTerm, item.term);
        if (score > highestScore) {
            highestScore = score;
            bestMatch = item; // Store the item (which contains both term and slug)
        }
    }

    // Define a minimum score required for a valid redirection.
    // Adjust this threshold to make the search more or less strict.
    const MIN_SCORE_FOR_REDIRECT = 40;

    if (bestMatch && highestScore >= MIN_SCORE_FOR_REDIRECT) {
        // Construct the redirect URL using the slug of the best match.
        // The URL format is `shop.html?search=SLUG`
        const redirectUrl = `shop.html?search=${encodeURIComponent(bestMatch.slug)}`;
        window.location.href = redirectUrl;
    } else {
        // If no sufficient match, provide feedback to the user.
        alert(`No close match found for "${searchTerm}". Please try a different term. Examples: 'towels', 'bedsheets', 'cushions', 'table mats'.`);
        // Optionally, redirect to a general shop page or display other UI feedback.
        // window.location.href = 'shop.html';
    }
}

// --- Event Listener Setup ---

// Ensure the DOM is fully loaded before trying to access HTML elements.
document.addEventListener('DOMContentLoaded', () => {
    // Assuming your search input field has the class 'search-input'
    const searchInput = document.querySelector('.search-input');
    // Assuming your search icon or button has the class 'search-icon'
    const searchIcon = document.querySelector('.search-icon');

    // If the search input element exists, attach an event listener for the 'Enter' key.
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default form submission behavior (page reload)
                searchAndRedirect(searchInput.value);
            }
        });
    }

    // If the search icon element exists, attach an event listener for clicks.
    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            if (searchInput) { // Ensure searchInput is available before trying to get its value
                searchAndRedirect(searchInput.value);
            }
        });
    }
});