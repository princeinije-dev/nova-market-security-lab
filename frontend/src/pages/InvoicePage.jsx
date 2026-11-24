import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Download, ChevronLeft, ShoppingBag } from 'lucide-react';
import { orderService } from '../services/orderService';

export const InvoicePage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getInvoiceData(id)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Generating commercial invoice...</p>
      </div>
    );
  }

  if (!data || !data.order) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Invoice Not Available</h2>
        <p>The requested order receipt could not be retrieved.</p>
      </div>
    );
  }

  const { order, items, store } = data;
  const shippingAddr = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address || {};

  return (
    <div style={{ padding: '2rem 1rem' }}>
      {/* Top action bar (hidden when printed) */}
      <div className="invoice-actions">
        <Link to={`/orders/${order.order_number}`} className="btn btn-outline btn-sm">
          <ChevronLeft size={16} /> Back to Order
        </Link>
        <button
          onClick={() => window.print()}
          className="btn btn-primary btn-sm"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* Official Invoice Sheet */}
      <div className="invoice-wrapper">
        <div className="invoice-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShoppingBag size={28} color="#0f172a" />
              <h2 className="invoice-brand-title" style={{ margin: 0 }}>
                {store?.store_name || 'NovaMarket Global LLC'}
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '300px', lineHeight: 1.4 }}>
              {store?.store_address || '100 Commerce Way, Suite 400, New York, NY 10001'}<br />
              {store?.store_email || 'orders@novamarket.com'} • {store?.store_phone || '+1 (800) 555-0199'}
            </p>
          </div>

          <div className="invoice-meta-box">
            <h1 className="invoice-number-title">INVOICE</h1>
            <p style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', color: '#0f172a' }}>
              #{order.order_number}
            </p>
            <div className="invoice-dates" style={{ marginTop: '0.5rem' }}>
              <p>Invoice Date: {new Date(order.created_at).toLocaleDateString()}</p>
              <p>Payment Status: <strong>{order.payment_status?.toUpperCase() || 'PENDING'}</strong></p>
              {order.transaction_reference && (
                <p>Wire Reference: <strong>{order.transaction_reference}</strong></p>
              )}
            </div>
          </div>
        </div>

        <div className="invoice-parties">
          <div>
            <span className="invoice-party-title">Billed & Shipped To:</span>
            <h3 className="invoice-party-name">{shippingAddr.full_name}</h3>
            <p className="invoice-party-details">
              {shippingAddr.street_address}<br />
              {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}<br />
              {shippingAddr.country}<br />
              Phone: {shippingAddr.phone}
            </p>
          </div>

          <div>
            <span className="invoice-party-title">Payment Settlement Method:</span>
            <h3 className="invoice-party-name">Direct Commercial Wire / ACH</h3>
            <p className="invoice-party-details">
              Bank: {store?.bank_name || 'Chase Manhattan Commercial Bank'}<br />
              Beneficiary: {store?.bank_account_name || 'NovaMarket Global LLC'}<br />
              Wire Memo: {order.order_number}
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Description</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items && items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>${parseFloat(item.product_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>${parseFloat(item.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="invoice-totals-box">
          <div className="invoice-total-row">
            <span>Subtotal:</span>
            <span>${parseFloat(order.subtotal).toFixed(2)}</span>
          </div>

          <div className="invoice-total-row">
            <span>Insured Shipping:</span>
            <span>{parseFloat(order.shipping_fee) === 0 ? 'FREE' : `$${parseFloat(order.shipping_fee).toFixed(2)}`}</span>
          </div>

          {parseFloat(order.discount_amount) > 0 && (
            <div className="invoice-total-row" style={{ color: '#059669' }}>
              <span>Discount ({order.coupon_code}):</span>
              <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
            </div>
          )}

          <div className="invoice-total-row grand-total">
            <span>Total Balance:</span>
            <span>${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Bank Wire Settlement Footnote */}
        <div className="invoice-bank-info">
          <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a' }}>
            Direct Bank Wire Transfer Instructions
          </p>
          <p style={{ color: '#64748b', lineHeight: 1.5 }}>
            Please settle payment to: Account #{store?.bank_account_number || '9876-5432-1001'}, Routing #{store?.bank_routing_code || '021000021'}. Include Order #{order.order_number} as wire reference. Thank you for choosing NovaMarket.
          </p>
        </div>
      </div>
    </div>
  );
};
