const express = require("express");
const Admin = require("../models/Admin");

const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username and password are provided
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        // Find admin by username
        const admin = await Admin.findOne({ username });
        console.log("LOGIN USER:", admin);

        if (!admin) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        // Check password
        if (admin.password !== password) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        // Login successful
        res.json({
            message: "Login successful",
            admin: {
                id: admin._id,
                username: admin.username,
        role: admin.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;