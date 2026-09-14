const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Book = require("../models/Book");
const Transaction = require("../models/Transaction");

const router = express.Router();


// ===============================
// PDF UPLOAD SETTINGS
// ===============================

const uploadDir = path.join(__dirname, "../uploads/books");

let upload;

if (process.env.VERCEL) {

    // Vercel: keep uploaded PDF in memory
    const storage = multer.memoryStorage();

    upload = multer({
        storage: storage,

        fileFilter: function (req, file, cb) {
            if (file.mimetype === "application/pdf") {
                cb(null, true);
            } else {
                cb(new Error("Only PDF files are allowed."));
            }
        },

        limits: {
            fileSize: 20 * 1024 * 1024
        }
    });

} else {

    // Local computer: save PDFs to uploads/books
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({

        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },

        filename: function (req, file, cb) {

            const safeName = file.originalname.replace(
                /[^a-zA-Z0-9.-]/g,
                "_"
            );

            cb(
                null,
                Date.now() + "-" + safeName
            );
        }
    });

    upload = multer({

        storage: storage,

        fileFilter: function (req, file, cb) {

            if (file.mimetype === "application/pdf") {
                cb(null, true);
            } else {
                cb(new Error("Only PDF files are allowed."));
            }
        },

        limits: {
            fileSize: 20 * 1024 * 1024
        }
    });
}


// ===============================
// GET ALL BOOKS
// ===============================

router.get("/", async (req, res) => {

    try {

        const books = await Book.find();

        res.json(books);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
});


// ===============================
// ADD BOOK + PDF
// ===============================

router.post(
    "/",
    upload.single("document"),
    async (req, res) => {

        try {

            let documentUrl = "";
            let documentName = "";

            if (req.file) {

                documentName =
                    req.file.originalname;

                if (process.env.VERCEL) {

                    // PDF storage on Vercel will be handled later
                    documentUrl = "";

                } else {

                    documentUrl =
                        "/uploads/books/" +
                        req.file.filename;
                }
            }

            const book = new Book({

                title: req.body.title,

                author: req.body.author,

                category: req.body.category,

                isbn: req.body.isbn,

                quantity: Number(
                    req.body.quantity
                ),

                available: Number(
                    req.body.quantity
                ),

                documentUrl: documentUrl,

                documentName: documentName
            });

            const savedBook =
                await book.save();

            res.status(201).json(savedBook);

        } catch (error) {

            // Delete local uploaded file if database save fails
            if (
                req.file &&
                !process.env.VERCEL &&
                req.file.filename
            ) {

                const uploadedFile =
                    path.join(
                        uploadDir,
                        req.file.filename
                    );

                if (fs.existsSync(uploadedFile)) {

                    fs.unlinkSync(
                        uploadedFile
                    );

                }
            }

            res.status(400).json({
                message: error.message
            });

        }
    }
);


// ===============================
// UPDATE BOOK
// ===============================

router.put("/:id", async (req, res) => {

    try {

        const updatedBook =
            await Book.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedBook) {

            return res.status(404).json({
                message: "Book not found"
            });

        }

        res.json(updatedBook);

    } catch (error) {

        res.status(400).json({
            message: error.message
        });

    }
});


// ===============================
// DELETE BOOK
// ===============================

router.delete("/:id", async (req, res) => {

    try {

        const activeTransaction =
            await Transaction.findOne({
                bookId: req.params.id,
                status: "Issued"
            });

        if (activeTransaction) {

            return res.status(400).json({
                message:
                    "This book cannot be deleted because it is currently issued. Please return the book first."
            });

        }

        const deletedBook =
            await Book.findByIdAndDelete(
                req.params.id
            );

        if (!deletedBook) {

            return res.status(404).json({
                message: "Book not found"
            });

        }

        res.json({
            message:
                "Book deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
});


module.exports = router;