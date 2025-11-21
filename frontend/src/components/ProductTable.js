import React, { useState } from 'react';
import './ProductTable.css';

const ProductTable = ({ products, onUpdate, onDelete, onViewHistory }) => {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditFormData({
      name: product.name || '',
      unit: product.unit || '',
      category: product.category || '',
      brand: product.brand || '',
      stock: product.stock || 0,
      status: product.status || '',
      image: product.image || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'stock' ? parseInt(value) || 0 : value,
    });
  };

  const handleSave = async (id) => {
    setIsSaving(true);
    try {
      await onUpdate(id, editFormData);
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { text: 'Out of Stock', className: 'status-out-of-stock' };
    }
    return { text: 'In Stock', className: 'status-in-stock' };
  };

  if (!products || products.length === 0) {
    return (
      <div className="no-products">
        <p>No products found. Add a new product or import from CSV.</p>
      </div>
    );
  }

  return (
    <div className="product-table-container">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isEditing = editingId === product.id;
            const stockStatus = getStockStatus(product.stock);

            return (
              <tr key={product.id} className={isEditing ? 'editing-row' : ''}>
                <td>{product.id}</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className="edit-input"
                      required
                    />
                  ) : (
                    product.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="unit"
                      value={editFormData.unit}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    product.unit || '-'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="category"
                      value={editFormData.category}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    product.category || '-'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="brand"
                      value={editFormData.brand}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    product.brand || '-'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      name="stock"
                      value={editFormData.stock}
                      onChange={handleInputChange}
                      className="edit-input"
                      min="0"
                      required
                    />
                  ) : (
                    product.stock
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="status"
                      value={editFormData.status}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    <span className={`stock-status ${stockStatus.className}`}>
                      {stockStatus.text}
                    </span>
                  )}
                </td>
                <td className="actions-cell">
                  {isEditing ? (
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSave(product.id)}
                        className="btn btn-save"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn btn-cancel"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="btn btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onViewHistory(product.id)}
                        className="btn btn-history"
                      >
                        History
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                            onDelete(product.id);
                          }
                        }}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;

