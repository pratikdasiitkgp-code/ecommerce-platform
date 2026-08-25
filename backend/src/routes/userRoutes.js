const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, created_at
             FROM users
             WHERE id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;