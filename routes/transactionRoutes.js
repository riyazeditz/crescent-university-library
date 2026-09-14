const express = require("express");
const Transaction = require("../models/Transaction");
const Book = require("../models/Book");

const router = express.Router();

// Get all transactions
router.get("/", async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate("bookId")
            .populate("memberId");

        res.json(transactions);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Issue a book
router.post("/issue", async (req, res) => {
    try {
        const { bookId, memberId, dueDate } = req.body;

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        if (book.available <= 0) {
            return res.status(400).json({
                message: "Book is not available"
            });
        }

        const transaction = new Transaction({
            bookId,
            memberId,
            dueDate
        });

        const savedTransaction = await transaction.save();

        book.available = book.available - 1;
        await book.save();

        res.status(201).json(savedTransaction);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// Return a book
router.put("/return/:id", async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        if (transaction.status === "Returned") {
            return res.status(400).json({
                message: "Book already returned"
            });
        }

        const returnDate = new Date();

        let fine = 0;

        if (returnDate > transaction.dueDate) {
            const lateDays = Math.ceil(
                (returnDate - transaction.dueDate) /
                (1000 * 60 * 60 * 24)
            );

            fine = lateDays * 5;
        }

        transaction.returnDate = returnDate;
        transaction.fine = fine;
        transaction.status = "Returned";

        await transaction.save();

        const book = await Book.findById(transaction.bookId);

        if (book) {
            book.available = book.available + 1;
            await book.save();
        }

        res.json(transaction);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;