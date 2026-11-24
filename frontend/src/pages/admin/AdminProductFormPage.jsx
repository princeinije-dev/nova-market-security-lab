import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, Star, Check } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    price: '',
    discount_price: '',
    stock_quantity: 10,
    short_description: '',
    description: '',
    is_featured: false,
    is_active: true,
  });

  // Images list
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    adminService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));

    if (isEditing) {
      setLoading(true);
      productService.getProduct(id)
        .then((res) => {
          if (res.success && res.data) {
            const p = res.data;
            setFormData({
              name: p.name,
              sku: p.sku || '',
              category_id: p.category_id || '',
              price: p.price,
              discount_price: p.discount_price || '',
              stock_quantity: p.stock_quantity,
              short_description: p.short_description || '',
              description: p.description,
              is_featured: p.is_featured,
              is_active: p.is_active,
            });

            if (p.images && p.images.length > 0) {
              setImages(p.images.map((img) => ({
                url: img.image_url,
                is_primary: img.is_primary,
              })));
            }
          }
        })
        .catch((err) => {
          console.error(err);
          showToast('Failed to load product data.', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    setImages((prev) => [
      ...prev,
      { url: newImageUrl.trim(), is_primary: prev.length === 0 },
    ]);
    setNewImageUrl('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await adminService.uploadImage(fd);
      if (res.success && res.url) {
        setImages((prev) => [
          ...prev,
          { url: res.url, is_primary: prev.length === 0 },
        ]);
        showToast('Image uploaded successfully.', 'success');
      }
    } catch (err) {
      showToast('Image upload failed.', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSetPrimary = (index) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.description.trim()) {
      showToast('Name, price, and description are required.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        stock_quantity: parseInt(formData.stock_quantity, 10),
        images,
      };

      if (isEditing) {
        const res = await adminService.updateProduct(id, payload);
        if (res.success) {
          showToast('Product updated successfully.', 'success');
          navigate('/admin/products');
        }
      } else {
        const res = await adminService.createProduct(payload);
        if (res.success) {
          showToast('Product created successfully.', 'success');
          navigate('/admin/products');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Loading product record...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/admin/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
          {isEditing ? `Edit: ${formData.name}` : 'Add New Catalog Product'}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">General Information</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Apex Minimalist Wireless Mechanical Keyboard"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CMP-KB-003 (auto-generated if empty)"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Regular Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="199.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sale / Discounted Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="Leave empty if no sale discount"
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inventory Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Tagline / Teaser</label>
              <input
                type="text"
                className="form-input"
                placeholder="CNC aluminum frame, factory-lubed linear switches."
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Product Description & Specifications *</label>
              <textarea
                className="form-textarea"
                rows={6}
                placeholder="Comprehensive technical breakdown, material details, and warranty terms..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <span><strong>Featured Showcase</strong> (Displays on homepage carousel)</span>
              </label>

              <label className="form-check">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span><strong>Active Listing</strong> (Visible in store)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Images Management */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">Product Image Gallery</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                type="url"
                placeholder="Paste high-res image URL (e.g. Unsplash or CDN)..."
                className="form-input"
                style={{ flex: 1, minWidth: '240px' }}
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} /> Add URL
              </button>

              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={16} />
                {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: img.is_primary ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: '100%', height: '110px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        style={{ fontSize: '0.6875rem', fontWeight: 700, color: img.is_primary ? 'var(--color-accent)' : 'var(--color-text-light)', cursor: 'pointer' }}
                      >
                        {img.is_primary ? '★ Primary' : 'Set Primary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{ color: 'var(--color-danger)', cursor: 'pointer' }}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                No product images added yet. Add an image URL or upload files above.
              </p>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
          >
            <Save size={18} />
            {submitting ? 'Saving to Database...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="btn btn-secondary btn-lg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
