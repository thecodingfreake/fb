const express = require('express');
const router = express.Router();
const Module = require('../models/Module');
const Completion = require('../models/Completeion'); // Ensure correct model path

router.post('/enrollcourse', async (req, res) => {
    const { email, moduleId } = req.body;

    console.log("Email:", email, "Module _id:", moduleId);

    if (!email) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    try {
        // Find the module by _id
        const module = await Module.findById(moduleId).lean(); // Use `lean()` for a plain JS object

        if (!module) {
            console.error("Module not found with _id:", moduleId);
            return res.status(404).json({ message: 'Module not found' });
        }

        // Fetch or create a completion record for the user
        let userCompletion = await Completion.findOne({ email });

        if (!userCompletion) {
            userCompletion = new Completion({
                email,
                course_list: []
            });
        }

        // Check if the user is already enrolled in the course
        const isAlreadyEnrolled = userCompletion.course_list.some(
            c => c.courseId.toString() === moduleId
        );

        if (isAlreadyEnrolled) {
            console.warn("User already enrolled:", email, moduleId);
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }
        // Prepare submodules and sections for enrollment
        const newSubmodules = module.submodules.map((submodule, index) => ({
            moduleId: submodule._id.toString(), // Assuming submodule._id exists
            title: submodule.title,
            locked: index !== 0, // Unlock the first submodule
            completion:false
        }));
        // Add module to the user's course list
        userCompletion.course_list.push({
            courseId: module._id.toString(), // Save module _id in the course list
            title: module.title,
            image:module.bannerImage,
            modules: newSubmodules
        });

        await userCompletion.save();
        console.log("User enrolled successfully:", email, moduleId);

        res.status(200).json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Add a route to fetch enrolled coursess
router.get('/getenrolledcourses', async (req, res) => {
    const { email } = req.query;
console.log(email)
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Find the user's enrollment and completion data
        const userCompletion = await Completion.findOne({ email }).lean();

        if (!userCompletion || !userCompletion.course_list.length) {
            return res.status(404).json({ message: 'No enrolled courses found',enrolledCourses:[] });
        }

        const enrolledCourses = userCompletion.course_list.map(course => ({
            courseId: course.courseId,
            title: course.title,
            image:course.image,
            modules: course.modules,
        }));

        return res.status(200).json({ enrolledCourses });
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

  
module.exports = router;
