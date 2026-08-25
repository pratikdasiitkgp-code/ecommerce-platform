# ShopEasy - Full-Stack E-Commerce Platform

ShopEasy is a full-stack e-commerce web application built with React, Node.js, Express.js, and PostgreSQL.

The application supports user authentication, product browsing, shopping cart management, checkout, order creation, inventory management, and order history.

## Features

### User Authentication
- User registration
- Secure password hashing using bcrypt
- User login and logout
- JWT-based authentication
- Protected user-specific routes

### Product Management
- Fetch products from PostgreSQL
- Display product name, description, price, stock, category, and image
- Real-time stock availability

### Shopping Cart
- Add products to cart
- View cart items
- Update product quantity
- Remove products from cart
- Calculate cart subtotal and total
- Cart is associated with the authenticated user

### Checkout & Orders
- Shipping address validation
- Create orders from cart items
- Validate product stock before placing an order
- Transaction-based order creation
- Automatically reduce product inventory
- Automatically clear cart after successful order

### Order History
- View previously placed orders
- Display order status
- Display ordered products and quantities
- Display order totals
- Orders are restricted to the authenticated user

## Tech Stack

### Frontend
- React
- Vite
- Axios
- CSS

### Backend
- Node.js
- Express.js
- JWT
- bcrypt
- PostgreSQL
- node-postgres (`pg`)

### Database
PostgreSQL relational database with tables for:

- Users
- Products
- Cart
- Cart Items
- Addresses
- Orders
- Order Items

## Project Structure

```text
ecommerce-platform-app/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   ├── productController.js
│   │   │   ├── cartController.js
│   │   │   └── orderController.js
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   │
│   │   ├── routes/
│   │   │   ├── userRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   └── orderRoutes.js
│   │   │
│   │   └── server.js
│   │
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   └── package.json
│
└── README.md