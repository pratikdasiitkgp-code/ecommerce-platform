const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

// Get all products - Public
router.get("/", getProducts);

// Get single product - Public
router.get("/:id", getProductById);

// Create product - Admin only
router.post(
    "/",
    authenticateToken,
    authorizeAdmin,
    createProduct
);

// Update product - Admin only
router.put(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    updateProduct
);

// Delete product - Admin only
router.delete(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    deleteProduct
);

module.exports = router;