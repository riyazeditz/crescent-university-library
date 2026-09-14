const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true,
            enum: [
                "admin",
                "principal",
                "library_manager",
                "librarian",
                "faculty",
                "student"
            ]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Admin", adminSchema);