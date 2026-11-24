import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Building,
  UploadCloud,
  FileText,
  Package,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';

export const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState(location.state?.orderData?.order || null);
  const [storeBank, setStoreBank] = useState(location.state?.orderData?.storeBankDetails || null);
  const [loading, setLoading] = useState(!order);

  // Payment Submission State
  const [transactionRef, setTransactionRef] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [proofImageFile, setProofImageFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  useEffect(() => {
    if (!order) {
      setLoading(true);
      orderService.getOrderById(orderNumber)
        .then((res) => {
          if (res.success && res.data) {
            setOrder(res.data);
            setStoreBank(res.data.storeBankDetails);
            if (res.data.transaction_reference) {
              setTransactionRef(res.data.transaction_reference);
            }
            if (res.data.payment_status === 'confirmed') {
              setPaymentSubmitted(true);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          showToast('Could not load order details.', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [orderNumber, order, showToast]);

  const handleProofFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofImageFile(e.target.files[0]);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      showToast('Please provide your bank transaction reference code.', 'warning');
      return;
    }

    try {
      setSubmittingPayment(true);
      let proofUrl = null;

      // Upload proof file if selected
      if (proofImageFile) {
        setUploadingProof(true);
        const formData = new FormData();
        formData.append('image', proofImageFile);
        const uploadRes = await orderService.uploadProof(formData);
        if (uploadRes.success && uploadRes.url) {
          proofUrl = uploadRes.url;
        }
      }

      const paymentData = {
        transactionReference: transactionRef.trim(),
        senderName: senderName.trim() || null,
        senderAccount: senderAccount.trim() || null,
        bankName: bankName.trim() || null,
        paymentNotes: paymentNotes.trim() || null,
        proofImageUrl: proofUrl,
      };

      const res = await orderService.submitPayment(order.id, paymentData);
      if (res.success) {
        showToast('Payment proof submitted successfully! Awaiting administrator verification.', 'success');
        setPaymentSubmitted(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit payment details.', 'error');
    } finally {
      setSubmittingPayment(false);
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Loading order confirmation...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="empty-state">
          <h2 className="empty-state-title">Order Not Found</h2>
          <p className="empty-state-desc">We couldn't locate details for this order number.</p>
          <Link to="/" className="btn btn-primary">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Success Hero Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Thank You! Your Order Has Been Placed.
        </h1>

        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '580px', margin: '0 auto 1.5rem' }}>
          Order reference: <strong style={{ color: 'var(--color-accent)', fontFamily: 'monospace', fontSize: '1.125rem' }}>{order.order_number}</strong>
          <br />
          Total Amount Due:{' '}
          <strong style={{ color: 'var(--color-primary)', fontSize: '1.125rem' }}>
            ${parseFloat(order.total_amount).toFixed(2)}
          </strong>
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/orders/${order.order_number}`} className="btn btn-primary">
            <Package size={16} /> Track Order Timeline
          </Link>
          <Link to={`/orders/${order.order_number}/invoice`} target="_blank" className="btn btn-outline">
            <FileText size={16} /> Download Official Invoice
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Official Bank Details Instruction Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} color="var(--color-accent)" /> Official Bank Wire Credentials
            </h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Please initiate a domestic wire or ACH transfer to our commercial account using the exact specifications below:
            </p>

            {storeBank && (
              <div className="bank-transfer-card" style={{ padding: '1.25rem', margin: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="bank-detail-item">
                    <span className="bank-detail-label">Beneficiary Commercial Bank</span>
                    <span className="bank-detail-val" style={{ fontSize: '1rem' }}>{storeBank.bank_name}</span>
                  </div>
                  <div className="bank-detail-item">
                    <span className="bank-detail-label">Account Name</span>
                    <span className="bank-detail-val" style={{ fontSize: '1rem' }}>{storeBank.bank_account_name}</span>
                  </div>
                  <div className="bank-detail-item">
                    <span className="bank-detail-label">Account Number</span>
                    <span className="bank-detail-val" style={{ color: 'var(--color-accent)' }}>
                      {storeBank.bank_account_number}
                    </span>
                  </div>
                  <div className="bank-detail-item">
                    <span className="bank-detail-label">ABA / Routing Transit Code</span>
                    <span className="bank-detail-val">{storeBank.bank_routing_code}</span>
                  </div>
                  <div className="bank-detail-item">
                    <span className="bank-detail-label">SWIFT / BIC Code</span>
                    <span className="bank-detail-val">{storeBank.bank_swift_code}</span>
                  </div>
                  <div className="bank-detail-item" style={{ borderTop: '1px dashed #c7d2fe', paddingTop: '0.75rem' }}>
                    <span className="bank-detail-label">Payment Memo / Wire Reference</span>
                    <span className="bank-detail-val" style={{ color: 'var(--color-gold)' }}>
                      {order.order_number}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Payment Reference Submission Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--color-accent)" /> Submit Transfer Reference
            </h3>
          </div>
          <div className="card-body">
            {paymentSubmitted ? (
              <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Clock size={28} />
                </div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-success-text)', marginBottom: '0.5rem' }}>
                  Payment Details Submitted!
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Our financial administrator will verify your reference (<strong>{transactionRef}</strong>) and confirm your order promptly.
                </p>
                <Link to={`/orders/${order.order_number}`} className="btn btn-primary btn-sm">
                  View Live Status Timeline &rarr;
                </Link>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                  After initiating your transfer, enter your wire reference number or sender account details to expedite immediate order dispatch.
                </p>

                <div className="form-group">
                  <label className="form-label">Wire / Transaction Reference Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TRX-CHASE-98421"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                  />
                  <span className="form-helper">Found on your bank's wire transfer receipt or confirmation statement.</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sender Account Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Elena Rostova"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Originating Bank Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. JPMorgan Chase"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Transfer Receipt / Proof (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    style={{ padding: '0.45rem' }}
                    onChange={handleProofFileChange}
                  />
                  <span className="form-helper">PNG, JPG, or WEBP screenshot of your transfer confirmation.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Payment Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Sent via domestic wire at 10:30 AM"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={submittingPayment || uploadingProof}
                >
                  {submittingPayment ? 'Submitting Reference...' : 'Submit Payment Reference'}
                  {!submittingPayment && <ArrowRight size={18} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
