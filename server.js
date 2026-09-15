const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// ===============================
// Import Routes
// ===============================

const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const facultyRoutes = require("./routes/facultyRoutes");


// ===============================
// Create Express App
// ===============================

const app = express();


// ===============================
// Middleware
// ===============================

app.use(cors());

app.use(express.json());


// ===============================
// Serve Frontend
// ===============================

app.use(express.static("public"));
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// ===============================
// API Routes
// ===============================

app.use("/api/books", bookRoutes);

app.use("/api/members", memberRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);


// ===============================
// Home Route
// ===============================

app.get("/", (req, res) => {

    res.sendFile(__dirname + "/public/index.html");

});


// ===============================
// MongoDB Connection
// ===============================

mongoose
    .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
    })

    .then(() => {

        console.log("MongoDB connected successfully!");

    })

    .catch((error) => {

        console.error("MongoDB connection failed");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);

        if (error.reason) {
            console.error(
                "Connection reason:",
                error.reason
            );
        }

    });


// ===============================
// Start Server
// ===============================


const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );
    });
}

module.exports = app;