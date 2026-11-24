import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  Shield,
  LogOut,
  Package,
  Layers,
  Settings,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <>
      {/* Top Notification Bar */}
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="top-bar-left">
            <span>✨ Free express shipping on orders over $150</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>🏦 Bank Wire & Direct Transfers Supported</span>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <Link to="/about" className="top-bar-link">About Us</Link>
            <Link to="/contact" className="top-bar-link">Support</Link>
            {isAdmin && (
              <Link to="/admin" className="top-bar-link" style={{ color: '#60a5fa', fontWeight: 600 }}>
                <Shield size={14} /> Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Mobile hamburger */}
          <button
            className="mobile-nav-toggle nav-action-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="brand-logo">
            <ShoppingBag size={24} />
            <span>NOVAMARKET</span>
            <span className="brand-badge">PRO</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Shop All
            </NavLink>
            <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Categories
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Our Story
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Contact
            </NavLink>
          </nav>

          {/* Action Icons */}
          <div className="nav-actions">
            {/* Search Trigger */}
            <button
              className="nav-action-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search Products"
            >
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="nav-action-btn" title="My Wishlist">
              <Heart size={18} />
              {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="nav-action-btn" title="Shopping Cart">
              <ShoppingBag size={18} />
              {itemCount > 0 && <span className="badge-count">{itemCount}</span>}
            </Link>

            {/* User Dropdown */}
            <div className="user-menu-wrapper" ref={dropdownRef}>
              {isAuthenticated ? (
                <button
                  className="nav-action-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  title="My Account"
                  style={{
                    backgroundColor: isAdmin ? '#eff6ff' : undefined,
                    borderColor: isAdmin ? '#93c5fd' : undefined,
                  }}
                >
                  <User size={18} color={isAdmin ? '#2563eb' : 'currentColor'} />
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm">
                  Sign In
                </Link>
              )}

              {/* User Dropdown Menu */}
              {isAuthenticated && userDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <p className="user-dropdown-name">{user?.name}</p>
                    <p className="user-dropdown-email">{user?.email}</p>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{ color: '#2563eb', fontWeight: 600 }}
                    >
                      <Shield size={16} /> Admin Dashboard
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    className="user-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Layers size={16} /> Customer Dashboard
                  </Link>

                  <Link
                    to="/orders"
                    className="user-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Package size={16} /> My Orders
                  </Link>

                  <Link
                    to="/profile"
                    className="user-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings size={16} /> Profile & Addresses
                  </Link>

                  <button
                    className="user-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {searchOpen && (
          <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '1rem 0' }}>
            <div className="container">
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '680px', margin: '0 auto' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search over premium tech, watches, audio, leather..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSearchOpen(false)}
                >
                  <X size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: 'var(--nav-height)',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 490,
            }}
          >
            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Shop All</Link>
            <Link to="/categories" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Categories</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Our Story</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Contact</Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: '#2563eb', fontWeight: 700 }}>
                🛡️ Admin Dashboard
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
};
