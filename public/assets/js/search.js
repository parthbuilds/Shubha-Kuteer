// This is your raw data, as provided.
        // We'll use this to determine valid categories and types for search.
        const rawProductData = [
            { category: "Bedsheets", type: "bedsheets" },
            { category: "Bedsheets", type: "bedsheets" },
            { category: "Bedsheets", type: "bedsheets" },
            { category: "Bedsheets", type: "bedsheets" },
            { category: "Bedsheets", type: "bedsheets" },
            { category: "Honeycomb Towels", type: "towels" },
            { category: "Honeycomb Towels", type: "towels" },
            { category: "Honeycomb Towels", type: "towels" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Dohar and Quilts", type: "dohar" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "More", type: "curtains" },
            { category: "Gifting", type: "bedcovers" },
            { category: "Gifting", type: "dohar-bedsheet-combo" },
            { category: "Gifting", type: "bedsheet-quilts-combo" },
            { category: "Gifting", type: "dohar-bedsheet-combo" },
            { category: "Gifting", type: "bedsheet-quilts-combo" },
            { category: "Apparels", type: "kaftans" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-runners" },
            { category: "Table Range", type: "table-mats" },
            { category: "Table Range", type: "table-mats" },
            { category: "Table Range", type: "table-mats" },
            { category: "Table Range", type: "table-mats" },
            { category: "Table Range", type: "table-mats" },
            { category: "Table Range", type: "table-mats" },
            { category: "Bags and Kits", type: "tote-bags" },
            { category: "Bags and Kits", type: "tote-bags" },
            { category: "Bags and Kits", type: "tote-bags" },
            { category: "Bags and Kits", type: "tote-bags" },
            { category: "Bags and Kits", type: "tote-bags" },
            { category: "Bags and Kits", type: "tote-bags" },
            { category: "Bags and Kits", type: "travel-kits" },
            { category: "Bags and Kits", type: "travel-kits" },
            { category: "Bags and Kits", type: "travel-kits" },
            { category: "Bags and Kits", type: "travel-kits" },
            { category: "Bags and Kits", type: "travel-kits" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Apparels", type: "kaftans" },
            { category: "Cushions and Pillow Covers", type: "pillow-cover" }
        ];
        
        // Create unique sets of categories and types for efficient searching
        const uniqueCategories = new Set(rawProductData.map(item => item.category));
        const uniqueTypes = new Set(rawProductData.map(item => item.type));
        
        function searchAndRedirect(searchTerm) {
            // Normalize the search term for case-insensitive matching
            const normalizedSearchTerm = searchTerm.toLowerCase().trim();
            let redirectUrl = 'shop.html';
            let foundMatch = false;
        
            // Check if the search term matches any known category
            for (const category of uniqueCategories) {
                if (category.toLowerCase() === normalizedSearchTerm) {
                    redirectUrl += `?cat=${encodeURIComponent(category)}`;
                    foundMatch = true;
                    break; 
                }
            }
        
            // If not found in categories, check if it matches any known type
            if (!foundMatch) {
                for (const type of uniqueTypes) {
                    if (type.toLowerCase() === normalizedSearchTerm) {
                        redirectUrl += `?type=${encodeURIComponent(type)}`;
                        foundMatch = true;
                        break;
                    }
                }
            }
            
            // Perform the redirection or alert the user
            if (foundMatch) {
                window.location.href = redirectUrl;
            } else {
                alert("No items found for your search. Please try a different term like 'Bedsheets', 'Honeycomb Towels', or 'pillow-cover'.");
                // Optionally, you could redirect to a general shop page or do nothing.
                // window.location.href = 'shop.html'; 
            }
        }
        
        // Attach the event listener to the search input field
        document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.querySelector('.form-search input[type="text"]');
            const searchIcon = document.querySelector('.form-search .ph-magnifying-glass'); // Assuming this is your search icon
        
            if (searchInput) {
                // Listen for the 'Enter' key press in the search input
                searchInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent default form submission if input is part of a form
                        searchAndRedirect(searchInput.value);
                    }
                });
            }
        
            if (searchIcon) {
                // Listen for a click on the search icon
                searchIcon.addEventListener('click', () => {
                    if (searchInput) {
                        searchAndRedirect(searchInput.value);
                    }
                });
            }
        });