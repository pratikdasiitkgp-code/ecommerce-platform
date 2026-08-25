const pool = require("../config/database");

// Create Order
const createOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        // Support both possible JWT property names
        const userId = Number(req.user?.userId || req.user?.id);

        const shippingAddressId = Number(
            req.body?.shipping_address_id
        );

        console.log("CREATE ORDER");
        console.log("User ID:", userId);
        console.log("Shipping Address ID:", shippingAddressId);

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user authentication"
            });
        }

        if (!shippingAddressId) {
            return res.status(400).json({
                message: "Shipping address is required"
            });
        }

        await client.query("BEGIN");

        // --------------------------------------------------
        // 1. Verify shipping address belongs to this user
        // --------------------------------------------------
        const addressResult = await client.query(
            `SELECT id, user_id, address_line, city, state, postal_code, country
             FROM addresses
             WHERE id = $1
             AND user_id = $2`,
            [shippingAddressId, userId]
        );

        console.log("Address found:", addressResult.rows);

        if (addressResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Invalid shipping address",
                user_id: userId,
                shipping_address_id: shippingAddressId
            });
        }

        // --------------------------------------------------
        // 2. Find user's cart
        // --------------------------------------------------
        const cartResult = await client.query(
            `SELECT id
             FROM cart
             WHERE user_id = $1`,
            [userId]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Cart not found"
            });
        }

        const cartId = cartResult.rows[0].id;

        // --------------------------------------------------
        // 3. Get cart items
        // --------------------------------------------------
        const itemsResult = await client.query(
            `SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock_quantity
             FROM cart_items ci
             JOIN products p
                ON p.id = ci.product_id
             WHERE ci.cart_id = $1
             FOR UPDATE OF p`,
            [cartId]
        );

        if (itemsResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Cart is empty"
            });
        }

        // --------------------------------------------------
        // 4. Validate stock and calculate total
        // --------------------------------------------------
        let totalAmount = 0;

        for (const item of itemsResult.rows) {

            if (item.quantity > item.stock_quantity) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: `Insufficient stock for ${item.name}`,
                    available_stock: item.stock_quantity,
                    requested_quantity: item.quantity
                });
            }

            totalAmount +=
                Number(item.price) * Number(item.quantity);
        }

        // --------------------------------------------------
        // 5. Create order
        // --------------------------------------------------
        const orderResult = await client.query(
            `INSERT INTO orders
                (user_id, shipping_address_id, total_amount, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING
                id,
                user_id,
                shipping_address_id,
                total_amount,
                status,
                created_at,
                updated_at`,
            [
                userId,
                shippingAddressId,
                totalAmount.toFixed(2)
            ]
        );

        const order = orderResult.rows[0];

        // --------------------------------------------------
        // 6. Create order items + reduce stock
        // --------------------------------------------------
        for (const item of itemsResult.rows) {

            await client.query(
                `INSERT INTO order_items
                    (order_id, product_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, $4)`,
                [
                    order.id,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );

            await client.query(
                `UPDATE products
                 SET stock_quantity = stock_quantity - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [
                    item.quantity,
                    item.product_id
                ]
            );
        }

        // --------------------------------------------------
        // 7. Clear cart
        // --------------------------------------------------
        await client.query(
            `DELETE FROM cart_items
             WHERE cart_id = $1`,
            [cartId]
        );

        // --------------------------------------------------
        // 8. Commit transaction
        // --------------------------------------------------
        await client.query("COMMIT");

        res.status(201).json({
            message: "Order created successfully",
            order: {
                id: order.id,
                user_id: order.user_id,
                shipping_address_id: order.shipping_address_id,
                total_amount: order.total_amount,
                status: order.status,
                created_at: order.created_at
            }
        });

    } catch (error) {

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
        }

        console.error("Create order error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    } finally {
        client.release();
    }
};


// Get logged-in user's orders
const getMyOrders = async (req, res) => {
    try {

        const userId = Number(
            req.user?.userId || req.user?.id
        );

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user authentication"
            });
        }

        const result = await pool.query(
            `SELECT
                o.id,
                o.total_amount,
                o.status,
                o.shipping_address_id,
                o.created_at,
                o.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'product_id', oi.product_id,
                            'product_name', p.name,
                            'quantity', oi.quantity,
                            'price_at_purchase', oi.price_at_purchase
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
             FROM orders o
             LEFT JOIN order_items oi
                ON o.id = oi.order_id
             LEFT JOIN products p
                ON oi.product_id = p.id
             WHERE o.user_id = $1
             GROUP BY
                o.id,
                o.total_amount,
                o.status,
                o.shipping_address_id,
                o.created_at,
                o.updated_at
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            count: result.rows.length,
            orders: result.rows
        });

    } catch (error) {

        console.error("Get orders error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createOrder,
    getMyOrders
};