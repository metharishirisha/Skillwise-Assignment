# Inventory Management Application

A full-stack inventory management system built with Node.js/Express (backend) and React (frontend).

## Project Structure

```
skillwise-assignment/
├── backend/          # Node.js/Express API server
│   ├── server.js     # Main server file
│   ├── uploads/      # CSV upload directory
│   └── package.json
├── frontend/         # React application
│   ├── src/          # React source files
│   └── package.json
└── README.md
```

## Features

- Product CRUD operations
- CSV Import/Export functionality
- Inventory history tracking
- Search and filter products
- Inline editing
- Responsive design

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /api/products` - Get all products
- `PUT /api/products/:id` - Update a product
- `POST /api/products/import` - Import products from CSV
- `GET /api/products/export` - Export products to CSV
- `GET /api/products/:id/history` - Get inventory history for a product

## Technologies Used

### Backend
- Node.js
- Express.js
- SQLite3
- Multer (file uploads)
- CSV Parser
- Express Validator

### Frontend
- React
- Axios
- React Router DOM

