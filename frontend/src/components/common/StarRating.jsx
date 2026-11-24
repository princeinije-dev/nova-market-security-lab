import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, count, showCount = true, size = 16 }) => {
  const numRating = parseFloat(rating) || 0;
  const rounded = Math.round(numRating);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rounded ? '#fbbf24' : 'none'}
          color={star <= rounded ? '#fbbf24' : '#cbd5e1'}
        />
      ))}
      <span className="star-num">{numRating > 0 ? numRating.toFixed(1) : '0.0'}</span>
      {showCount && count !== undefined && (
        <span className="star-count">({count})</span>
      )}
    </div>
  );
};
