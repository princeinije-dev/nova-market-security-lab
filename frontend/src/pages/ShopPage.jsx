import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import { productService } from '../services/productService';
import { ProductCard } from '../components/product/ProductCard';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter state synced with searchParams
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(searchParam);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load categories
  useEffect(() => {
    productService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Sync search input if query param changes externally
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Load products whenever query params change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = {
          page: pageParam,
          limit: 12,
          sort: sortParam,
        };

        if (categoryParam) queryParams.category = categoryParam;
        if (searchParam) queryParams.search = searchParam;
        if (minPriceParam) queryParams.minPrice = minPriceParam;
        if (maxPriceParam) queryParams.maxPrice = maxPriceParam;
        if (inStockParam) queryParams.inStock = 'true';

        const res = await productService.getProducts(queryParams);
        if (res.success) {
          setProducts(res.data || []);
          setPagination(res.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam, searchParam, sortParam, minPriceParam, maxPriceParam, inStockParam, pageParam]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Reset to page 1 whenever filters change
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (minPriceInput) next.set('minPrice', minPriceInput);
    else next.delete('minPrice');

    if (maxPriceInput) next.set('maxPrice', maxPriceInput);
    else next.delete('maxPrice');

    next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const hasActiveFilters = categoryParam || searchParam || minPriceParam || maxPriceParam || inStockParam;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Explore Catalog</h1>
        <p className="section-subtitle">
          Engineered audio hardware, titanium horology, ergonomic workstations, and bespoke leathercraft.
        </p>
      </div>

      {/* Main Layout */}
      <div className="shop-layout">
        {/* Sidebar Filters */}
        <aside className={`filter-sidebar ${mobileFilterOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} /> Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <h4 className="filter-title">Categories</h4>
            <div className="filter-list">
              <div
                className={`filter-item ${!categoryParam ? 'active' : ''}`}
                onClick={() => updateParam('category', '')}
              >
                <span>All Categories</span>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`filter-item ${categoryParam === cat.slug ? 'active' : ''}`}
                  onClick={() => updateParam('category', cat.slug)}
                >
                  <span>{cat.name}</span>
                  {cat.product_count !== undefined && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{cat.product_count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <h4 className="filter-title">Price Range</h4>
            <form onSubmit={handlePriceApply}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="number"
                  placeholder="Min ($)"
                  className="form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max ($)"
                  className="form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm btn-block">
                Apply Price
              </button>
            </form>
          </div>

          {/* Availability Filter */}
          <div className="filter-group">
            <h4 className="filter-title">Availability</h4>
            <label className="form-check">
              <input
                type="checkbox"
                checked={inStockParam}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Catalog Pane */}
        <div>
          {/* Toolbar */}
          <div className="shop-toolbar">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search products or SKU..."
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" title="Search">
                <Search size={16} />
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="shop-count">
                Showing <strong>{products.length}</strong> of <strong>{pagination.total}</strong> products
              </span>

              <div className="shop-sort-wrap">
                <select
                  className="form-select"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
                  value={sortParam}
                  onChange={(e) => updateParam('sort', e.target.value)}
                >
                  <option value="newest">Sort by: Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="featured">Featured First</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Active filters:</span>
              {searchParam && (
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  "{searchParam}"
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('search', '')} />
                </span>
              )}
              {categoryParam && (
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {categoryParam}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('category', '')} />
                </span>
              )}
              {(minPriceParam || maxPriceParam) && (
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ${minPriceParam || '0'} - ${maxPriceParam || '∞'}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('minPrice');
                    next.delete('maxPrice');
                    setSearchParams(next);
                  }} />
                </span>
              )}
              {inStockParam && (
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  In Stock Only
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('inStock', '')} />
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="loader-container">
              <div className="spinner" />
              <p>Searching inventory...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={32} />
              </div>
              <h3 className="empty-state-title">No matching products found</h3>
              <p className="empty-state-desc">
                We couldn't find any items matching your active criteria. Try broadening your search or resetting filters.
              </p>
              <button onClick={clearAllFilters} className="btn btn-primary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => updateParam('page', String(pagination.page - 1))}
              >
                &larr;
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`page-btn ${pageNum === pagination.page ? 'active' : ''}`}
                  onClick={() => updateParam('page', String(pageNum))}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateParam('page', String(pagination.page + 1))}
              >
                &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
