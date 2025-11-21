import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import './SearchAndFilters.css';

const SearchAndFilters = ({ onSearch, onCategoryFilter, onAddProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await productService.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    onCategoryFilter(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    onSearch('');
    onCategoryFilter('');
  };

  return (
    <div className="search-filters-container">
      <div className="search-filters-left">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-box">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-select"
            disabled={isLoadingCategories}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedCategory) && (
          <button onClick={handleClearFilters} className="btn btn-clear-filters">
            Clear Filters
          </button>
        )}

        <button onClick={onAddProduct} className="btn btn-add-product">
          + Add New Product
        </button>
      </div>
    </div>
  );
};

export default SearchAndFilters;

