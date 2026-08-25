const pool = require("../config/database");

// Add product to cart
const addToCart = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Product ID and positive quantity are required"
            });
        }

        await client.query("BEGIN");

        // Check product and stock
        const productResult = await client.query(
            `SELECT id, name, price, stock_quantity
             FROM products
             WHERE id = $1`,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = productResult.rows[0];

        // Get or create user's cart
        let cartResult = await client.query(
            `SELECT id
             FROM cart
             WHERE user_id = $1`,
            [userId]
        );

        let cartId;

        if (cartResult.rows.length === 0) {
            const newCart = await client.query(
                `INSERT INTO cart (user_id)
                 VALUES ($1)
                 RETURNING id`,
                [userId]
            );

            cartId = newCart.rows[0].id;
        } else {
            cartId = cartResult.rows[0].id;
        }

        // Check if product already exists in cart
        const existingItem = await client.query(
            `SELECT quantity
             FROM cart_items
             WHERE cart_id = $1
               AND product_id = $2`,
            [cartId, product_id]
        );

        const currentQuantity =
            existingItem.rows.length > 0
                ? existingItem.rows[0].quantity
                : 0;

        const newQuantity = currentQuantity + quantity;

        // Check available stock
        if (newQuantity > product.stock_quantity) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: `Only ${product.stock_quantity} items available`
            });
        }

        // Update existing item
        if (existingItem.rows.length > 0) {
            await client.query(
                `UPDATE cart_items
                 SET quantity = $1
                 WHERE cart_id = $2
                   AND product_id = $3`,
                [newQuantity, cartId, product_id]
            );
        }

        // Insert new item
        else {
            await client.query(
                `INSERT INTO cart_items
                 (cart_id, product_id, quantity)
                 VALUES ($1, $2, $3)`,
                [cartId, product_id, quantity]
            );
        }

        // Update cart timestamp
        await client.query(
            `UPDATE cart
             SET updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [cartId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Product added to cart",
            product: {
                id: product.id,
                name: product.name,
                price: product.price
            },
            quantity: newQuantity
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Add to cart error:", error);

        res.status(500).json({
            message: "Server error"
        });
    } finally {
        client.release();
    }
};


// Get user's cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                c.id AS cart_id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.description,
                p.price,
                p.stock_quantity,
                p.category,
                p.image_url,
                (p.price * ci.quantity) AS subtotal
             FROM cart c
             LEFT JOIN cart_items ci
                ON c.id = ci.cart_id
             LEFT JOIN products p
                ON ci.product_id = p.id
             WHERE c.user_id = $1
             ORDER BY ci.id`,
            [userId]
        );

        let total = 0;

        const items = result.rows
            .filter(item => item.product_id !== null)
            .map(item => {
                const subtotal = Number(item.subtotal);

                total += subtotal;

                return {
                    product_id: item.product_id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    stock_quantity: item.stock_quantity,
                    category: item.category,
                    image_url: item.image_url,
                    subtotal
                };
            });

        res.status(200).json({
            items,
            total
        });

    } catch (error) {
        console.error("Get cart error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than 0"
            });
        }

        const result = await pool.query(
            `UPDATE cart_items ci
             SET quantity = $1
             FROM cart c, products p
             WHERE ci.cart_id = c.id
               AND ci.product_id = p.id
               AND c.user_id = $2
               AND ci.product_id = $3
               AND $1 <= p.stock_quantity
             RETURNING ci.id, ci.product_id, ci.quantity`,
            [quantity, userId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Cart item not found or insufficient stock"
            });
        }

        await pool.query(
            `UPDATE cart
             SET updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId]
        );

        res.status(200).json({
            message: "Cart updated successfully",
            item: result.rows[0]
        });

    } catch (error) {
        console.error("Update cart error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Remove product from cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;

        const result = await pool.query(
            `DELETE FROM cart_items ci
             USING cart c
             WHERE ci.cart_id = c.id
               AND c.user_id = $1
               AND ci.product_id = $2
             RETURNING ci.id`,
            [userId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        await pool.query(
            `UPDATE cart
             SET updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId]
        );

        res.status(200).json({
            message: "Product removed from cart"
        });

    } catch (error) {
        console.error("Remove from cart error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart
};