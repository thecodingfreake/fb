const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const User = require('../models/user');

// Route to fetch leaderboard
router.get('/', async (req, res) => {
    try {
        // Fetch all tests with assigned students
        console.log("first")
        const tests = await Test.find()
            .populate({
                path: 'assignedTo.studentId',
                model: 'User',
                select: 'email department year'
            });
            console.log(tests)

        // Filter and map data for the leaderboard
        const leaderboard = tests.flatMap(test => 
            test.assignedTo
                .filter(student => student.isAttended)  // Only include attended tests
                .map(student => ({
                    email: student.studentId.email,
                    department: student.studentId.department,
                    year: student.studentId.year,
                    testName: test.testName,
                    totalScore: test.totalScore,
                    marksScored: student.marksScored,
                    timeCompleted: student.timecompleted // fixed to camelCase
                }))
        );

        res.status(200).json(leaderboard);
    } catch (error) {
        console.log("2334")
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

module.exports = router;
