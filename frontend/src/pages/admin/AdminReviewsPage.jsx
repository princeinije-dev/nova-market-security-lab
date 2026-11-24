import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { StarRating } from '../../components/common/StarRating';

export const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getReviews();
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load reviews.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await adminService.updateReviewStatus(id, status);
      if (res.success) {
        showToast(res.message, 'success');
        fetchReviews();
      }
    } catch (err) {
      showToast('Failed to update review status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer review?')) return;
    try {
      const res = await adminService.deleteReview(id);
      if (res.success) {
        showToast('Review deleted.', 'info');
        fetchReviews();
      }
    } catch (err) {
      showToast('Failed to delete review.', 'error');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="card-header">
          <h3 className="card-title">Customer Reviews & Moderation ({reviews.length})</h3>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading reviews...</p>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <MessageSquare size={36} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontWeight: 700 }}>No reviews found</h4>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id}>
                    <td style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      {rev.product_name}
                    </td>

                    <td>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rev.user_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{rev.user_email}</p>
                    </td>

                    <td>
                      <StarRating rating={rev.rating} showCount={false} size={14} />
                    </td>

                    <td style={{ maxWidth: '350px' }}>
                      {rev.title && (
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.2rem', color: 'var(--color-primary)' }}>
                          {rev.title}
                        </p>
                      )}
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                        {rev.comment}
                      </p>
                    </td>

                    <td>
                      <span className={`badge ${rev.status === 'approved' ? 'badge-success' : rev.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {rev.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {rev.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(rev.id, 'approved')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-success)', padding: '0.4rem' }}
                            title="Approve Review"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {rev.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-warning)', padding: '0.4rem' }}
                            title="Reject Review"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '0.4rem' }}
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
