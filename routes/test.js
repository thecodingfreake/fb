const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const Test = require('../models/Test');
const User = require('../models/User');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Route to upload test and assign to students
router.post('/upload', authMiddleware, isAdmin, upload.single('file'), async (req, res) => {
    const { testName, testDuration, totalScore } = req.body;
    const filePath = req.file.path;

    try {
        // Check if testName already exists
        const existingTest = await Test.findOne({ testName });
        if (existingTest) {
            return res.status(400).json({ message: 'Test name already exists' });
        }

        // Read and parse the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const questions = xlsx.utils.sheet_to_json(sheet);

        // Create new test with questions
        const newTest = new Test({
            testName,
            testDuration,
            totalScore,
            filePath,
            questions,  // store parsed questions in the test model
        });

        // Assign test to all non-admin students
        const students = await User.find({ isAdmin: false });
        students.forEach(student => {
            newTest.assignedTo.push({
                studentId: student._id,
                isAttended: false,
                marksScored: 0
            });
        });

        await newTest.save();

        // Delete the file after successful upload
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            } else {
                console.log(`File ${filePath} deleted successfully`);
            }
        });

        res.status(200).json({ message: 'Test uploaded and assigned successfully' });
    } catch (error) {
        console.error('Error uploading test:', error);

        // Attempt to delete the file if there was an error during processing
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file after failure:', err);
            } else {
                console.log(`File ${filePath} deleted after failure`);
            }
        });

        res.status(500).json({ message: 'Error uploading test' });
    }
});
router.get('/assigned-tests', async (req, res) => {
    const email = req.headers.email;  // Extract the email from request headers
    console.log('Email:', email);

    try {
        // Find the user by email to get the userId
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;  // Get the user's ID
        console.log('User ID:', userId);

        // Find tests that are assigned to the user but not yet attended
        const tests = await Test.find({
            assignedTo: {
                $elemMatch: {
                    studentId: userId,
                    isAttended: false  // Only get tests where isAttended is false
                }
            }
        }).select('testId testName testDescription assignedTo');

        // Debugging output to check what's being fetched
        console.log('Fetched Tests:', tests);

        // Send the tests response
        res.status(200).json({ tests });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({ message: 'Error fetching tests' });
    }
});



router.get('/:testId',  async (req, res) => {
    const { testId } = req.params;
    console.log(testId)
    try {
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Send the test questions to the client
        res.status(200).json({ questions: test.questions,duration:test.testDuration });
    } catch (error) {
        console.log(error)
        console.error('Error fetching test questions:', error);
        res.status(500).json({ message: 'Error fetching test questions' });
    }
});
router.get('/:testId/check-attendance', async (req, res) => {
    const { testId } = req.params;
    const email = req.headers.email; // Extract email from request headers
console.log(email,testId)
    try {
        // Find the user by email to get the user ID
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id; // Get the user's ID

        // Find the test by ID
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check if the user (student) is assigned to the test
        const studentTest = test.assignedTo.find(
            (assignment) => assignment.studentId.toString() === userId.toString()
        );

        if (studentTest) {
            return res.status(200).json({ isAttended: studentTest.isAttended });
        } else {
            return res.status(404).json({ message: 'Student assignment not found' });
        }
    } catch (error) {
        console.error('Error checking attendance status:', error);
        res.status(500).json({ message: 'Error checking attendance status' });
    }
});


 // Make sure to import the User model

router.post('/:testId/submit', async (req, res) => {
    const { testId } = req.params;
    const { answers, email } = req.body;

    try {
        // Find the user by emails
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id; // Extract the user's ID

        // Find the test by ID
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Find the student’s test assignment
        const studentTest = test.assignedTo.find(
            (assignment) => assignment.studentId.toString() === userId.toString()
        );

        if (studentTest) {
            studentTest.isAttended = true;

            // Optional: Update answers if required
            // studentTest.answers = answers;

            await test.save();
            res.status(200).json({ message: 'Test submission received' });
        } else {
            return res.status(404).json({ message: 'Student assignment not found' });
        }
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({ message: 'Error submitting test' });
    }
});


 // Make sure to import the User model

router.put('/:testId/update', async (req, res) => {
    const { testId } = req.params;
    const { score, email,timeTaken } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id; // Extract the user's ID

        // Find the test by ID
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Find the student’s test assignment
        const studentTest = test.assignedTo.find(
            (assignment) => assignment.studentId.toString() === userId.toString()
        );
console.log(studentTest)
        if (studentTest) {
            console.log("score",score)
            studentTest.marksScored = score;
            studentTest.timecompleted=timeTaken
            studentTest.isAttended=true
            await test.save();
            res.status(200).json({ message: 'Score updated successfully' });
        } else {
            return res.status(404).json({ message: 'Student assignment not found' });
        }
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ message: 'Error updating score' });
    }
});



module.exports = router;
