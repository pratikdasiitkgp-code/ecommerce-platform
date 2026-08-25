const pool = require("../config/database");

// Create Product
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock_quantity,
            category,
            image_url
        } = req.body;

        if (!name || price === undefined || !category) {
            return res.status(400).json({
                message: "Name, price and category are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO products
             (name, description, price, stock_quantity, category, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                name,
                description || null,
                price,
                stock_quantity || 0,
                category,
                image_url || null
            ]
        );

        res.status(201).json({
            message: "Product created successfully",
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Create product error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get All Products
const getProducts = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, price,
                    stock_quantity, category, image_url,
                    created_at, updated_at
             FROM products
             ORDER BY created_at DESC`
        );

        res.status(200).json({
            count: result.rows.length,
            products: result.rows
        });

    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get Single Product
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, name, description, price,
                    stock_quantity, category, image_url,
                    created_at, updated_at
             FROM products
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Update Product - Admin
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            price,
            stock_quantity,
            category,
            image_url
        } = req.body;

        if (!name || price === undefined || !category) {
            return res.status(400).json({
                message: "Name, price and category are required"
            });
        }

        const result = await pool.query(
            `UPDATE products
             SET name = $1,
                 description = $2,
                 price = $3,
                 stock_quantity = $4,
                 category = $5,
                 image_url = $6,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [
                name,
                description || null,
                price,
                stock_quantity || 0,
                category,
                image_url || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product updated successfully",
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Update product error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Delete Product - Admin
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM products
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete product error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Export Controllers
module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};