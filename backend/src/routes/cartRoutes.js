const express = require("express");

const {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart
} = require("../controllers/cartController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// All cart operations require login
router.get("/", authenticateToken, getCart);

router.post("/", authenticateToken, addToCart);

router.put(
    "/:productId",
    authenticateToken,
    updateCartItem
);

router.delete(
    "/:productId",
    authenticateToken,
    removeFromCart
);

module.exports = router;