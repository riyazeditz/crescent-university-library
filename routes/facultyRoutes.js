const express = require("express");
const Faculty = require("../models/Faculty");
const Admin = require("../models/Admin");
const crypto = require("crypto");

const router = express.Router();


// =====================================
// GET ALL FACULTY
// =====================================

router.get("/", async (req, res) => {

    try {

        const faculty = await Faculty.find();

        res.json(faculty);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// =====================================
// ADD FACULTY + CREATE LOGIN ACCOUNT
// =====================================

router.post("/", async (req, res) => {

    let createdAccount = null;

    try {

        const {
            name,
            email,
            phone,
            facultyId,
            department
        } = req.body;


        // Check required fields

        if (
            !name ||
            !email ||
            !phone ||
            !facultyId ||
            !department
        ) {

            return res.status(400).json({
                message: "All faculty fields are required"
            });

        }


        // Check existing login account

        const existingAccount =
            await Admin.findOne({
                username: facultyId
            });


        if (existingAccount) {

            return res.status(400).json({
                message:
                    "A login account already exists for this Faculty ID."
            });

        }


        // =====================================
        // GENERATE PASSWORD
        // =====================================

        const generatedPassword =
            "CU@" +
            crypto.randomBytes(4).toString("hex");


        // =====================================
        // CREATE FACULTY LOGIN
        // =====================================

        const facultyAccount = new Admin({

            username: facultyId,

            password: generatedPassword,

            role: "faculty"

        });


        createdAccount =
            await facultyAccount.save();


        // =====================================
        // CREATE FACULTY
        // =====================================

        const faculty = new Faculty({

            name: name,

            email: email,

            phone: phone,

            facultyId: facultyId,

            department: department

        });


        const savedFaculty =
            await faculty.save();


        // =====================================
        // SUCCESS
        // =====================================

        res.status(201).json({

            message:
                "Faculty and faculty login account created successfully",

            faculty: savedFaculty,

            account: {

                username: facultyId,

                password: generatedPassword,

                role: "faculty"

            }

        });


    } catch (error) {


        // Remove login if faculty creation failed

        if (createdAccount) {

            await Admin.deleteOne({
                _id: createdAccount._id
            });

        }


        res.status(400).json({

            message: error.message

        });

    }

});


// =====================================
// DELETE FACULTY + DELETE LOGIN
// =====================================

router.delete("/:id", async (req, res) => {

    try {

        const faculty =
            await Faculty.findById(req.params.id);


        if (!faculty) {

            return res.status(404).json({
                message: "Faculty not found"
            });

        }


        // Delete faculty

        await Faculty.findByIdAndDelete(
            req.params.id
        );


        // Delete corresponding login

        await Admin.deleteOne({

            username: faculty.facultyId

        });


        res.json({

            message:
                "Faculty and faculty login account deleted successfully"

        });


    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

});


module.exports = router;