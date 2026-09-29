import { useEffect, useState } from "react";
import "./App.css";
import shoppingBag from "./assets/shoppingbag.png";

export default function App() {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [category, setCategory] = useState("");

  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();

        params.append("page", page);
        params.append("limit", limit);
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);

        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        if (category) {
          params.append("category", category);
        }

        const response = await fetch(
          `http://localhost:3000/api/products?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const result = await response.json();

        if (!cancelled) {
          setProducts(result.data);
          setPagination(result.pagination);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load products");
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [page, limit, sortBy, sortOrder, category, searchQuery]);

  // Search button
  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchQuery("");
    setCategory("");
    setSortBy("created_at");
    setSortOrder("DESC");
    setPage(1);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Product Store</h1>
        <p>Browse and manage products</p>
      </header>

      <main className="container">
        {/* Search and filters */}
        <section className="filter-box">
          {/* Search */}
          <div className="filter-group search-group">
            <label>Search Product</label>

            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search by product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />

              <button onClick={handleSearch}>Search</button>
            </div>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label>Category</label>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              <option value="fruit">Fruit</option>
              <option value="vegetable">Vegetable</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="filter-group">
            <label>Sort By</label>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="created_at">Created Date</option>
              <option value="id">ID</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="filter-group">
            <label>Order</label>

            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>

          {/* Products per page */}
          <div className="filter-group">
            <label>Products Per Page</label>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          {/* Clear */}
          <button className="clear-btn" onClick={clearFilters}>
            Clear
          </button>
        </section>

        {/* Result information */}
        <div className="result-info">
          <div>
            <strong>{pagination.totalItems}</strong> products found
          </div>

          <div>
            Page {pagination.currentPage} of {pagination.totalPages || 1}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="message">
            <p>Loading products...</p>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Products */}
        {!loading && !error && (
          <>
            {products.length === 0 ? (
              <div className="message">
                <h2>No products found</h2>
                <p>Try changing your search or filters.</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <div className="product-card" key={product.id}>
                    <div className="product-image">
                      <img
                        className="object-contain"
                        src={shoppingBag}
                        alt="shopping bag"
                      />
                    </div>

                    <div className="product-content">
                      <div className="product-id">ID: {product.id}</div>

                      <h2>{product.name}</h2>

                      <span className="category">{product.category}</span>

                      <h3>Rs.{Number(product.price).toFixed(2)}</h3>

                      <p>
                        Created:{" "}
                        {new Date(product.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && !error && products.length > 0 && (
          <div className="pagination">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((prev) => prev - 1)}
            >
              ← Previous
            </button>

            <div className="page-number">{pagination.currentPage}</div>

            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
