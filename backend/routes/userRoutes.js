const express = require("express");
const bcrypt = require("bcryptjs"); // Secure password hashing
const db = require("../config/db"); // MySQL connection
const router = express.Router();

// Register User (Signup)
router.post("/register", async (req, res) => {
    const { username, fullName, age, gender, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, Email, and Password are required" });
    }

    try {
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (username, fullName, age, gender, email, password) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [username, fullName, age, gender, email, hashedPassword], (err, result) => {
            if (err) {
                console.error("Database Insert Error:", err);
                return res.status(500).json({ message: "Database error", error: err });
            }
            res.status(200).json({ message: "User registered successfully" });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.post("/login", (req, res) => {
    let { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and Password are required" });
    }

    username = username.trim(); // Remove extra spaces

    console.log("\n[LOGIN REQUEST] Received Username:", username); // Debug log

    const sql = "SELECT * FROM users WHERE BINARY username = ?";
    db.query(sql, [username], async (err, result) => {
        if (err) {
            console.error("[DATABASE ERROR]:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        console.log("[DATABASE QUERY RESULT]:", result); // Debug log

        if (result.length === 0) {
            console.log("[USER NOT FOUND] Username:", username);
            return res.status(404).json({ message: "User not found" });
        }

        const user = result[0];
        console.log("[STORED PASSWORD]:", user.password);

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            console.log("[PASSWORD MATCH]:", isMatch);

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            console.log("[LOGIN SUCCESSFUL]:", username);
            res.status(200).json({ message: "Login successful", user: { username: user.username, email: user.email } });
        } catch (error) {
            console.error("[BCRYPT COMPARE ERROR]:", error);
            res.status(500).json({ message: "Error comparing password", error });
        }
    });
});


// ✅ GET USER PROFILE (Load saved profile data)
router.get("/getProfile/:username", (req, res) => {
    const username = req.params.username.trim();

    const sql = "SELECT username, gender, email, phone, place, date, profilePic FROM users WHERE BINARY username = ?";
    db.query(sql, [username], (err, result) => {
        if (err) {
            console.error("[DATABASE ERROR]:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        if (result.length === 0) {
            console.log("[USER NOT FOUND]:", username);
            return res.status(404).json({ message: "User not found" });
        }

        let userProfile = result[0];

        if (userProfile.date) {
            let originalDate = new Date(userProfile.date);
            userProfile.date = `${originalDate.getDate().toString().padStart(2, '0')}-${(originalDate.getMonth() + 1).toString().padStart(2, '0')}-${originalDate.getFullYear()}`;
        }

        console.log("[USER PROFILE FOUND]:", userProfile);
        res.status(200).json(userProfile); // Return all required fields
    });
});
// ✅ SAVE/UPDATE USER PROFILE (Ensure data remains after logout)
router.post("/saveProfile", (req, res) => {
    const { username, phone, email, place, date, profilePic } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    // Check if user exists
    const checkUserSql = "SELECT * FROM users WHERE username = ?";
    db.query(checkUserSql, [username], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        formattedDate = null;
        if (date && date.trim() !== "") {
            // Convert dd-mm-yyyy to YYYY-MM-DD before storing
            const [day, month, year] = date.split("-");
            formattedDate = `${year}-${month}-${day}`;
        }

        // Update all profile fields
        const updateSql = `
            UPDATE users 
            SET phone = ?, email = ?, place = ?, date = ?, profilePic = ? 
            WHERE username = ?`;

        db.query(updateSql, [phone, email, place, formattedDate, profilePic, username], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating profile:", updateErr);
                return res.status(500).json({ error: "Error updating profile" });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(400).json({ error: "No changes were made" });
            }

            res.json({ success: true, message: "Profile updated successfully" });
        });
    });
});



module.exports = router;