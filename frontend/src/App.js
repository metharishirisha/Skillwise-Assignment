import React, { useState, useEffect } from 'react';
import { productService } from './services/api';
import SearchAndFilters from './components/SearchAndFilters';
import ImportExport from './components/ImportExport';
import ProductTable from './components/ProductTable';
import AddProductModal from './components/AddProductModal';
import InventoryHistory from './components/InventoryHistory';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search or category changes
  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts();
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
  };

  const handleAddProduct = async (productData) => {
    try {
      await productService.createProduct(productData);
      await loadProducts(); // Reload products
      setShowAddModal(false);
    } catch (err) {
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      await productService.updateProduct(id, productData);
      await loadProducts(); // Reload products
    } catch (err) {
      throw err; // Re-throw to let table handle the error
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await productService.deleteProduct(id);
      await loadProducts(); // Reload products
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleViewHistory = (id) => {
    const product = products.find((p) => p.id === id);
    setSelectedProductId(id);
    setSelectedProductName(product?.name || '');
  };

  const handleCloseHistory = () => {
    setSelectedProductId(null);
    setSelectedProductName(null);
  };

  const handleImport = async (file) => {
    setIsImporting(true);
    try {
      const response = await productService.importProducts(file);
      alert(
        `Import completed!\nAdded: ${response.data.added}\nSkipped: ${response.data.skipped}`
      );
      await loadProducts(); // Reload products
    } catch (err) {
      console.error('Error importing products:', err);
      alert(
        err.response?.data?.error ||
          'Failed to import products. Please check the CSV file format.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await productService.exportProducts();
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting products:', err);
      alert('Failed to export products. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Inventory Management System</h1>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="toolbar">
            <div className="toolbar-left">
              <SearchAndFilters
                onSearch={handleSearch}
                onCategoryFilter={handleCategoryFilter}
                onAddProduct={() => setShowAddModal(true)}
              />
            </div>
            <div className="toolbar-right">
              <ImportExport
                onImport={handleImport}
                onExport={handleExport}
                isImporting={isImporting}
                isExporting={isExporting}
              />
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={loadProducts} className="btn-retry">
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="loading">
              <p>Loading products...</p>
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              onUpdate={handleUpdateProduct}
              onDelete={handleDeleteProduct}
              onViewHistory={handleViewHistory}
            />
          )}

          {showAddModal && (
            <AddProductModal
              onClose={() => setShowAddModal(false)}
              onAdd={handleAddProduct}
            />
          )}

          {selectedProductId && (
            <InventoryHistory
              productId={selectedProductId}
              productName={selectedProductName}
              onClose={handleCloseHistory}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
