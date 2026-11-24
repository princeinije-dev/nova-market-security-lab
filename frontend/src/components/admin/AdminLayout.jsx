import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Users,
  Grid,
  Tag,
  Star,
  Settings,
  BarChart3,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard Overview';
    if (path === '/admin/products') return 'Product Inventory';
    if (path === '/admin/products/new') return 'Add New Product';
    if (path.startsWith('/admin/products/edit')) return 'Edit Product';
    if (path.startsWith('/admin/orders')) return 'Order & Payment Management';
    if (path === '/admin/customers') return 'Customer Directory';
    if (path === '/admin/categories') return 'Category Management';
    if (path === '/admin/coupons') return 'Coupons & Discounts';
    if (path === '/admin/reviews') return 'Customer Reviews Moderation';
    if (path === '/admin/settings') return 'Store & Payment Settings';
    if (path === '/admin/reports') return 'Sales & Inventory Reports';
    return 'Admin Console';
  };

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <Link to="/admin" className="admin-brand-logo">
            <ShieldCheck size={22} color="#38bdf8" />
            <span>NOVAMARKET</span>
          </Link>
          <button
            className="mobile-nav-toggle"
            style={{ color: '#fff' }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-heading">Main Navigation</div>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <div className="admin-nav-heading">Catalog & Inventory</div>
          <NavLink
            to="/admin/products"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Package size={18} />
            <span>Products</span>
          </NavLink>
          <NavLink
            to="/admin/products/new"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Grid size={18} />
            <span>Categories</span>
          </NavLink>

          <div className="admin-nav-heading">Sales & Customers</div>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <ShoppingCart size={18} />
            <span>Orders & Payments</span>
          </NavLink>
          <NavLink
            to="/admin/customers"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} />
            <span>Customers</span>
          </NavLink>
          <NavLink
            to="/admin/coupons"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Tag size={18} />
            <span>Coupons</span>
          </NavLink>
          <NavLink
            to="/admin/reviews"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Star size={18} />
            <span>Reviews</span>
          </NavLink>

          <div className="admin-nav-heading">Management & Analytics</div>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <BarChart3 size={18} />
            <span>Reports</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={18} />
            <span>Store & Bank Info</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name || 'Administrator'}</span>
            <span className="admin-user-role">{user?.role} • Operations</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Log Out"
            style={{ padding: '0.4rem', color: '#f87171' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="mobile-nav-toggle btn btn-secondary btn-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h1 className="admin-topbar-title">{getPageTitle()}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Live Storefront</span>
              <ExternalLink size={14} />
            </Link>

            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              System Online
            </span>
          </div>
        </header>

        {/* Dynamic Nested Route View */}
        <div className="admin-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
