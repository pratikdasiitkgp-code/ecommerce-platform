const express = require("express");

const {
    createOrder,
    getMyOrders
} = require("../controllers/orderController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in user's orders
router.get(
    "/",
    authenticateToken,
    getMyOrders
);

// Create new order
router.post(
    "/",
    authenticateToken,
    createOrder
);

module.exports = router;