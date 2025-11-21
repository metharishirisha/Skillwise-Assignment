const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = new sqlite3.Database('./inventory.db');

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    unit TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER NOT NULL,
    status TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    old_quantity INTEGER,
    new_quantity INTEGER,
    change_date TEXT,
    user_info TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Helper function to handle database errors
const handleDbError = (err, res) => {
  if (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', message: err.message });
    return true;
  }
  return false;
};

// ==================== API ROUTES ====================

// GET /api/products - Get all products with pagination and sorting
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 100, sort = 'id', order = 'asc', category } = req.query;
  const offset = (page - 1) * limit;
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  
  // Validate sort column to prevent SQL injection
  const allowedSortColumns = ['id', 'name', 'category', 'brand', 'stock', 'status'];
  const sortColumn = allowedSortColumns.includes(sort) ? sort : 'id';

  let query = `SELECT * FROM products`;
  const params = [];

  if (category) {
    query += ` WHERE category = ?`;
    params.push(category);
  }

  query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, products) => {
    if (handleDbError(err, res)) return;
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM products`;
    const countParams = [];
    
    if (category) {
      countQuery += ` WHERE category = ?`;
      countParams.push(category);
    }

    db.get(countQuery, countParams, (err, result) => {
      if (handleDbError(err, res)) return;
      
      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    });
  });
});

// GET /api/products/search - Search products by name
app.get('/api/products/search', (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: 'Name query parameter is required' });
  }

  const query = `SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC`;
  const searchTerm = `%${name}%`;

  db.all(query, [searchTerm], (err, products) => {
    if (handleDbError(err, res)) return;
    res.json({ products });
  });
});

// GET /api/products/categories - Get all unique categories
app.get('/api/products/categories', (req, res) => {
  const query = `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`;

  db.all(query, [], (err, rows) => {
    if (handleDbError(err, res)) return;
    const categories = rows.map(row => row.category);
    res.json({ categories });
  });
});

// GET /api/products/:id - Get single product
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (handleDbError(err, res)) return;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  });
});

// POST /api/products - Create new product
app.post('/api/products', [
  body('name').notEmpty().withMessage('Name is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, unit, category, brand, stock, status, image } = req.body;

  const query = `INSERT INTO products (name, unit, category, brand, stock, status, image) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [name, unit || null, category || null, brand || null, stock || 0, status || null, image || null], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Product with this name already exists' });
      }
      return handleDbError(err, res);
    }

    // Fetch the created product
    db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, product) => {
      if (handleDbError(err, res)) return;
      res.status(201).json(product);
    });
  });
});

// PUT /api/products/:id - Update product and track inventory history
app.put('/api/products/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, unit, category, brand, stock, status, image } = req.body;

  // First, fetch the current product data
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, currentProduct) => {
    if (handleDbError(err, res)) return;
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if name is being changed and if it conflicts with another product
    if (name && name !== currentProduct.name) {
      db.get('SELECT id FROM products WHERE name = ? AND id != ?', [name, id], (err, existing) => {
        if (err) return handleDbError(err, res);
        if (existing) {
          return res.status(400).json({ error: 'Product with this name already exists' });
        }
        updateProduct();
      });
    } else {
      updateProduct();
    }

    function updateProduct() {
      // Build update query dynamically
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (unit !== undefined) {
        updates.push('unit = ?');
        values.push(unit);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
      }
      if (brand !== undefined) {
        updates.push('brand = ?');
        values.push(brand);
      }
      if (stock !== undefined) {
        updates.push('stock = ?');
        values.push(stock);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (image !== undefined) {
        updates.push('image = ?');
        values.push(image);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, values, function(err) {
        if (handleDbError(err, res)) return;

        // Track inventory history if stock changed
        if (stock !== undefined && stock !== currentProduct.stock) {
          const historyQuery = `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date, user_info) 
                               VALUES (?, ?, ?, ?, ?)`;
          db.run(historyQuery, [
            id,
            currentProduct.stock,
            stock,
            new Date().toISOString(),
            req.headers['user-agent'] || 'Unknown'
          ], (err) => {
            if (err) console.error('Error tracking inventory history:', err);
          });
        }

        // Fetch updated product
        db.get('SELECT * FROM products WHERE id = ?', [id], (err, updatedProduct) => {
          if (handleDbError(err, res)) return;
          res.json(updatedProduct);
        });
      });
    }
  });
});

// DELETE /api/products/:id - Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (handleDbError(err, res)) return;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete inventory history first (due to foreign key)
    db.run('DELETE FROM inventory_history WHERE product_id = ?', [id], (err) => {
      if (handleDbError(err, res)) return;

      // Delete product
      db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
        if (handleDbError(err, res)) return;
        res.json({ message: 'Product deleted successfully' });
      });
    });
  });
});

// GET /api/products/:id/history - Get inventory history for a product
app.get('/api/products/:id/history', (req, res) => {
  const { id } = req.params;

  const query = `SELECT * FROM inventory_history 
                 WHERE product_id = ? 
                 ORDER BY change_date DESC`;

  db.all(query, [id], (err, history) => {
    if (handleDbError(err, res)) return;
    res.json({ history });
  });
});

// POST /api/products/import - Import products from CSV
app.post('/api/products/import', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const results = [];
  const errors = [];
  let addedCount = 0;
  let skippedCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      let processed = 0;

      if (results.length === 0) {
        // Clean up file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      results.forEach((row, index) => {
        const name = row.name || row.Name || row.NAME;
        const unit = row.unit || row.Unit || row.UNIT || null;
        const category = row.category || row.Category || row.CATEGORY || null;
        const brand = row.brand || row.Brand || row.BRAND || null;
        const stock = parseInt(row.stock || row.Stock || row.STOCK || 0);
        const status = row.status || row.Status || row.STATUS || null;
        const image = row.image || row.Image || row.IMAGE || null;

        if (!name) {
          errors.push({ row: index + 2, error: 'Name is required' });
          skippedCount++;
          processed++;
          if (processed === results.length) {
            finishImport();
          }
          return;
        }

        // Check for duplicate name
        db.get('SELECT id FROM products WHERE name = ?', [name], (err, existing) => {
          if (err) {
            errors.push({ row: index + 2, name, error: err.message });
            skippedCount++;
          } else if (existing) {
            errors.push({ row: index + 2, name, error: 'Duplicate name' });
            skippedCount++;
          } else {
            // Insert new product
            const query = `INSERT INTO products (name, unit, category, brand, stock, status, image) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(query, [name, unit, category, brand, stock, status, image], (err) => {
              if (err) {
                errors.push({ row: index + 2, name, error: err.message });
                skippedCount++;
              } else {
                addedCount++;
              }
              
              processed++;
              if (processed === results.length) {
                finishImport();
              }
            });
          }
        });
      });

      function finishImport() {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          message: 'Import completed',
          added: addedCount,
          skipped: skippedCount,
          errors: errors.length > 0 ? errors : undefined
        });
      }
    })
    .on('error', (err) => {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ error: 'Error parsing CSV file', message: err.message });
    });
});

// GET /api/products/export - Export products to CSV
app.get('/api/products/export', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id ASC', [], (err, products) => {
    if (handleDbError(err, res)) return;

    // Create CSV header
    const headers = ['id', 'name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    let csvData = headers.join(',') + '\n';

    // Add product data
    products.forEach(product => {
      const row = [
        product.id,
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.unit || '').replace(/"/g, '""')}"`,
        `"${(product.category || '').replace(/"/g, '""')}"`,
        `"${(product.brand || '').replace(/"/g, '""')}"`,
        product.stock,
        `"${(product.status || '').replace(/"/g, '""')}"`,
        `"${(product.image || '').replace(/"/g, '""')}"`
      ];
      csvData += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csvData);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
