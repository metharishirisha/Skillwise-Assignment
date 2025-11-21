import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import './InventoryHistory.css';

const InventoryHistory = ({ productId, productName, onClose }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      loadHistory();
    }
  }, [productId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getInventoryHistory(productId);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Error loading inventory history:', err);
      setError('Failed to load inventory history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuantityChange = (oldQty, newQty) => {
    const change = newQty - oldQty;
    if (change > 0) {
      return { text: `+${change}`, className: 'change-positive' };
    } else if (change < 0) {
      return { text: `${change}`, className: 'change-negative' };
    }
    return { text: '0', className: 'change-neutral' };
  };

  return (
    <div className="history-sidebar-overlay" onClick={onClose}>
      <div className="history-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>Inventory History</h2>
          {productName && <p className="product-name">{productName}</p>}
          <button onClick={onClose} className="close-btn" aria-label="Close">
            ×
          </button>
        </div>

        <div className="history-content">
          {isLoading ? (
            <div className="loading">Loading history...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : history.length === 0 ? (
            <div className="no-history">
              <p>No inventory history available for this product.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((record) => {
                const change = getQuantityChange(record.old_quantity, record.new_quantity);
                return (
                  <div key={record.id} className="history-item">
                    <div className="history-item-header">
                      <span className="history-date">{formatDate(record.change_date)}</span>
                      <span className={`quantity-change ${change.className}`}>
                        {change.text}
                      </span>
                    </div>
                    <div className="history-item-details">
                      <div className="quantity-info">
                        <span className="quantity-label">Old Quantity:</span>
                        <span className="quantity-value">{record.old_quantity}</span>
                      </div>
                      <div className="quantity-arrow">→</div>
                      <div className="quantity-info">
                        <span className="quantity-label">New Quantity:</span>
                        <span className="quantity-value">{record.new_quantity}</span>
                      </div>
                    </div>
                    {record.user_info && (
                      <div className="history-user-info">
                        <small>{record.user_info}</small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryHistory;

