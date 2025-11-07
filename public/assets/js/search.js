async function fetchProducts() {
    const response = await fetch("https://www.shubhakuteer.in/api/products");
    const data = await response.json();
    return data;
  }
  
  function normalize(str) {
    return str.toLowerCase().trim();
  }
  
  function fuzzyMatch(source, query) {
    return normalize(source).includes(normalize(query));
  }
  
  async function handleSearch() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) {
      alert("Please enter something to search.");
      return;
    }
  
    const products = await fetchProducts();
    const categoryMatch = products.find(p => fuzzyMatch(p.category, query));
    const productMatch = products.find(p => fuzzyMatch(p.name, query));
  
    if (categoryMatch) {
      window.location.href = `https://www.shubhakuteer.in/shop.html?cat=${encodeURIComponent(categoryMatch.category)}`;
    } else if (productMatch) {
      window.location.href = `https://www.shubhakuteer.in/product-default.html?id=${productMatch.id}`;
    } else {
      alert("No matching product or category found. Try searching for: Bedsheet, Cushion Cover, Table Range.");
    }
  }
  
  document.getElementById("searchBtn").addEventListener("click", handleSearch);
  document.getElementById("searchInput").addEventListener("keypress", e => {
    if (e.key === "Enter") handleSearch();
  });