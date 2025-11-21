import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productService = {
  // Get all products with optional pagination and filters
  getProducts: (params = {}) => {
    return api.get('/products', { params });
  },

  // Search products by name
  searchProducts: (name) => {
    return api.get('/products/search', { params: { name } });
  },

  // Get single product
  getProduct: (id) => {
    return api.get(`/products/${id}`);
  },

  // Create new product
  createProduct: (productData) => {
    return api.post('/products', productData);
  },

  // Update product
  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  // Delete product
  deleteProduct: (id) => {
    return api.delete(`/products/${id}`);
  },

  // Get categories
  getCategories: () => {
    return api.get('/products/categories');
  },

  // Get inventory history
  getInventoryHistory: (id) => {
    return api.get(`/products/${id}/history`);
  },

  // Import products from CSV
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Export products to CSV
  exportProducts: () => {
    return api.get('/products/export', {
      responseType: 'blob',
    });
  },
};

export default api;

