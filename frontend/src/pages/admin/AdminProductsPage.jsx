import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const { showToast } = useToast();

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
      };
      const res = await adminService.getProducts(params);
      if (res.success) {
        setProducts(res.data || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminService.deleteProduct(id);
      if (res.success) {
        showToast(`Product "${name}" deleted successfully.`, 'success');
        fetchProducts(pagination.page);
      }
    } catch (err) {
      showToast('Failed to delete product.', 'error');
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const res = await adminService.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      if (res.success) {
        showToast(`Product ${!product.is_active ? 'activated' : 'deactivated'}.`, 'success');
        fetchProducts(pagination.page);
      }
    } catch (err) {
      showToast('Failed to toggle product status.', 'error');
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const res = await adminService.updateProduct(product.id, {
        is_featured: !product.is_featured,
      });
      if (res.success) {
        showToast(`Product ${!product.is_featured ? 'marked as featured' : 'unmarked from featured'}.`, 'success');
        fetchProducts(pagination.page);
      }
    } catch (err) {
      showToast('Failed to update featured flag.', 'error');
    }
  };

  return (
    <div>
      {/* Top Controls Toolbar */}
      <div className="table-card">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} className="table-search" style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input
              type="text"
              placeholder="Search by name, SKU, or description..."
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={16} />
            </button>
          </form>

          <div className="table-filters">
            <select
              className="form-select"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>

            <Link to="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus size={16} /> Add Product
            </Link>
          </div>
        </div>

        {/* Products Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading catalog items...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Package size={36} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontWeight: 700 }}>No products found</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Try clearing filters or add your first product.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock_quantity <= 5;
                  const isOut = p.stock_quantity <= 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={p.primary_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                            alt=""
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                          />
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                              {p.name}
                            </p>
                            <Link
                              to={`/products/${p.slug}`}
                              target="_blank"
                              style={{ fontSize: '0.75rem', color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                            >
                              View in store <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {p.sku || 'N/A'}
                      </td>

                      <td>
                        <span className="badge badge-secondary" style={{ textTransform: 'none' }}>
                          {p.category_name || 'Unassigned'}
                        </span>
                      </td>

                      <td style={{ fontWeight: 700 }}>
                        ${parseFloat(p.price).toFixed(2)}
                      </td>

                      <td>
                        {p.discount_price ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                            ${parseFloat(p.discount_price).toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>—</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-text-main)' }}>
                            {p.stock_quantity}
                          </span>
                          {isOut && <span className="badge badge-danger">Out</span>}
                          {isLow && !isOut && <span className="badge badge-warning">Low</span>}
                        </div>
                      </td>

                      <td>
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          className={`badge ${p.is_featured ? 'badge-gold' : 'badge-secondary'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {p.is_featured ? '★ Featured' : 'Normal'}
                        </button>
                      </td>

                      <td>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`badge ${p.is_active ? 'badge-success' : 'badge-secondary'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {p.is_active ? 'Active' : 'Draft'}
                        </button>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            to={`/admin/products/edit/${p.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.4rem' }}
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.4rem', color: 'var(--color-danger)' }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <div className="pagination" style={{ margin: 0 }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                  onClick={() => fetchProducts(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
