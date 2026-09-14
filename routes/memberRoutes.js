const express = require("express");
const crypto = require("crypto");
const Member = require("../models/Member");
const Faculty = require("../models/Faculty");
const Admin = require("../models/Admin");
const Transaction = require("../models/Transaction");

const router = express.Router();


// =====================================
// GET ALL MEMBERS
// =====================================

router.get("/", async (req, res) => {
    try {
        const members = await Member.find();
const faculty = await Faculty.find();

const allMembers = [
    ...members.map(member => ({
        ...member.toObject(),
        userType: "Student"
    })),

    ...faculty.map(person => ({
        ...person.toObject(),
        studentId: person.facultyId,
        userType: "Faculty"
    }))
];
        res.json(allMembers);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
});


// =====================================
// ADD NEW MEMBER + CREATE STUDENT ACCOUNT
// =====================================

router.post("/", async (req, res) => {

    let createdAccount = null;

    try {

        const {
            name,
            email,
            phone,
            studentId,
            department
        } = req.body;


        // Check required fields

        if (
            !name ||
            !email ||
            !phone ||
            !studentId ||
            !department
        ) {

            return res.status(400).json({
                message: "All member fields are required"
            });

        }


        // Check whether student ID already has
        // a login account

        const existingAccount =
            await Admin.findOne({
                username: studentId
            });


        if (existingAccount) {

            return res.status(400).json({
                message:
                    "A login account already exists for this Student ID."
            });

        }


        // =====================================
        // CREATE STUDENT LOGIN ACCOUNT
        // =====================================

        const generatedPassword =
    "CU@" +
    crypto.randomBytes(4).toString("hex");

const studentAccount = new Admin({

    username: studentId,

    password: generatedPassword,

    role: "student"

});


        createdAccount =
            await studentAccount.save();


        // =====================================
        // CREATE MEMBER
        // =====================================

        const member = new Member({

            name: name,

            email: email,

            phone: phone,

            studentId: studentId,

            department: department

        });


        const savedMember =
            await member.save();


        // =====================================
        // SUCCESS
        // =====================================

        res.status(201).json({

            message:
                "Member and student login account created successfully",

            member: savedMember,

            account: {

                username: studentId,

                password: generatedPassword,

                role: "student"

            }

        });


    } catch (error) {


        // If member creation failed after
        // account was created, remove the account

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
// UPDATE MEMBER
// =====================================

router.put("/:id", async (req, res) => {

    try {

        const oldMember =
            await Member.findById(req.params.id);


        if (!oldMember) {

            return res.status(404).json({
                message: "Member not found"
            });

        }


        const oldStudentId =
            oldMember.studentId;


        const newStudentId =
            req.body.studentId;


        // If Student ID is changed,
        // update the login username too

        if (
            newStudentId &&
            newStudentId !== oldStudentId
        ) {

            const existingAccount =
                await Admin.findOne({
                    username: newStudentId
                });


            if (existingAccount) {

                return res.status(400).json({
                    message:
                        "This Student ID is already used by another login account."
                });

            }


            await Admin.findOneAndUpdate(

                {
                    username: oldStudentId
                },

                {
                    username: newStudentId
                }

            );

        }


        const updatedMember =
            await Member.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true,
                    runValidators: true
                }

            );


        res.json(updatedMember);


    } catch (error) {

        res.status(400).json({

            message: error.message

        });

    }

});


// =====================================
// DELETE MEMBER + DELETE LOGIN ACCOUNT
// =====================================

router.delete("/:id", async (req, res) => {

    try {

        // Find member first

        const member =
            await Member.findById(req.params.id);


        if (!member) {

            return res.status(404).json({
                message: "Member not found"
            });

        }


        // Check active transactions

        const activeTransaction =
            await Transaction.findOne({

                memberId: req.params.id,

                status: "Issued"

            });


        if (activeTransaction) {

            return res.status(400).json({

                message:
                    "This member cannot be deleted because they currently have a book issued. Please return the book first."

            });

        }


        // Delete member

        await Member.findByIdAndDelete(
            req.params.id
        );


        // Delete corresponding student login

        await Admin.deleteOne({

            username: member.studentId

        });


        res.json({

            message:
                "Member and student login account deleted successfully"

        });


    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

});


module.exports = router;