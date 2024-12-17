const express = require('express');
const router = express.Router();
const Module = require('../models/Module'); // Import Module schema
const Completion = require('../models/Completeion'); // Import Completion schema

// Get course details and enrollment + completion status
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { email } = req.query;

    try {
        // Fetch the course details (Module)
        const course = await Module.findById(id).lean();
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check user enrollment and fetch completion data
        const userCompletion = await Completion.findOne({ email }).lean();

        let isEnrolled = false;
        let courseData = {};
        if (userCompletion) {
            // Find course in user's completion list
            courseData = userCompletion.course_list.find(c => c.courseId === id);
            if (courseData) {
                isEnrolled = true;
            }
        }

        return res.status(200).json({ course, isEnrolled, courseData });
    } catch (error) {
        console.error('Error fetching course:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Import Completion schema

// Get specific module details with enrollment check
router.get('/:courseId/module/:moduleId', async (req, res) => {
    const { courseId, moduleId } = req.params;
    const { email } = req.query; // Get user email from query
    // console.log(courseId,moduleId)
    try {
        // Check if user is enrolled in the course
        const userCompletion = await Completion.findOne({ email }).lean();
        // console.log(userCompletion)
        if (!userCompletion) {
            return res.status(403).json({ message: 'User not enrolled in any courses' });
        }

        // Check if the user is enrolled in the specific course
        const enrolledCourse = userCompletion.course_list.find(c => c.courseId === courseId);
        // console.log(enrolledCourse)
        if (!enrolledCourse) {
            return res.status(403).json({ message: 'User not enrolled in this course' });
        }

        // Check if the module is accessible (not locked)
        const enrolledModule = enrolledCourse.modules.find(m => m.moduleId === moduleId);
        // console.log("enrolled",enrolledModule)
        if (!enrolledModule) {
            return res.status(404).json({ message: 'Module not found in user data' });
        }
        if (enrolledModule.locked) {
            return res.status(403).json({ message: 'Module is locked' });
        }

        // Fetch the module details from the `Module` schema
        const module = await Module.findOne({ "submodules._id": moduleId }).lean();


        if (!module) {
            return res.status(404).json({ message: 'Module not found in course' });
        }

        const submodule = module.submodules.find(sub => sub._id.equals(moduleId));

        console.log(submodule)
        if (!submodule) {
            return res.status(404).json({ message: 'Submodule not found' });
        }

        // console.log(enrolledModule)
        // Send module details along with sections and their completion status
        return res.json({ submodule, enrolledModule });
    } catch (error) {
        console.error('Error fetching module:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});



// API to mark a section as completed and unlock the next submodule
// router.post('/:courseId/module/:moduleId/complete', async (req, res) => {
//     const { courseId, moduleId } = req.params;
//     const { sectionId, submoduleId, email } = req.body;
// console.log(sectionId,submoduleId,email)
//     try {
//         // Fetch the course data
//         const course = await Module.findById(courseId);
//         console.log(course)
//         if (!course) return res.status(404).json({ message: 'Course not found' });

//         // Find the specific module and submodule
//         const module = course.submodules.find(mod => mod.moduleId === moduleId);
//         console.log(module)
//         if (!module) return res.status(404).json({ message: 'Module not found' });

//         const submodule = module.submodules.find(sub => sub.submoduleId === submoduleId);
//         if (!submodule) return res.status(404).json({ message: 'Submodule not found' });

//         // Find the section within the submodule
//         const section = submodule.sections.find(sec => sec._id.toString() === sectionId);
//         if (!section) return res.status(404).json({ message: 'Section not found' });

//         // Mark the section as completed
//         section.completed = true;
//         await course.save();

//         // Check if all sections in the submodule are completed
//         const allSectionsCompleted = submodule.sections.every(sec => sec.completed);

//         // If all sections in the submodule are completed, unlock the next submodule
//         if (allSectionsCompleted) {
//             const nextSubmoduleIndex = course.submodules.findIndex(sm => sm.submoduleId === submoduleId) + 1;
//             if (nextSubmoduleIndex < course.submodules.length) {
//                 const nextSubmodule = course.submodules[nextSubmoduleIndex];
//                 nextSubmodule.locked = false;  // Unlock the next submodule
//                 await course.save();
//             }
//         }

//         // Update user completion data
//         const userCompletion = await Completion.findOne({ email });
//         if (userCompletion) {
//             const userCourse = userCompletion.course_list.find(c => c.courseId === courseId);
//             if (userCourse) {
//                 userCourse.modulesCompleted.push(moduleId);
//                 await userCompletion.save();
//             }
//         }

//         // Return updated course data
//         return res.status(200).json(course);
//     } catch (error) {
//         console.error('Error completing section:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// });
// router.post('/:courseId/module/:moduleId/complete', async (req, res) => {
//     try {
//         const { courseId, moduleId } = req.params;
//         const { email, moduleName, courseTitle } = req.body;

//         // Validate input
//         if (!email || !courseId || !moduleId) {
//             return res.status(400).json({ message: 'Invalid request data' });
//         }

//         // Find the user's completion record
//         let userCompletion = await Completion.findOne({ email });

//         // If user doesn't exist, create a new record
//         if (!userCompletion) {
//             userCompletion = new Completion({
//                 email,
//                 course_list: [],
//             });
//         }

//         // Find the course in the user's course list
//         let course = userCompletion.course_list.find((c) => c.courseId === courseId);

//         // If the course doesn't exist, add it
//         if (!course) {
//             course = {
//                 courseId,
//                 title: courseTitle,
//                 modules: [],
//             };
//             userCompletion.course_list.push(course);
//         }

//         // Find the module in the course
//         let module = course.modules.find((m) => m.moduleId === moduleId);

//         // If the module doesn't exist, add it
//         if (!module) {
//             module = {
//                 moduleId,
//                 moduleName,
//                 title: moduleName,
//                 locked: false,
//                 completion: false,
//             };
//             course.modules.push(module);
//         }

//         // Update the module completion status
//         module.completion = true;

//         // Save the updated record
//         await userCompletion.save();

//         res.status(200).json({
//             message: 'Module completion updated successfully',
//             completion: userCompletion,
//         });
//     } catch (error) {
//         console.error('Error updating module completion:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });
router.post('/:courseId/module/:moduleId/complete', async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { email, moduleName, courseTitle } = req.body;

        // Validate input
        if (!email || !courseId || !moduleId) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        // Find the user's completion record
        let userCompletion = await Completion.findOne({ email });

        // If user doesn't exist, create a new record
        if (!userCompletion) {
            userCompletion = new Completion({
                email,
                course_list: [],
            });
        }

        // Find the course in the user's course list
        let course = userCompletion.course_list.find((c) => c.courseId === courseId);

        // If the course doesn't exist, add it
        if (!course) {
            course = {
                courseId,
                title: courseTitle,
                modules: [],
            };
            userCompletion.course_list.push(course);
        }

        // Find the module in the course
        let module = course.modules.find((m) => m.moduleId === moduleId);

        // If the module doesn't exist, add it
        if (!module) {
            module = {
                moduleId,
                moduleName,
                title: moduleName,
                locked: false,
                completion: false,
            };
            course.modules.push(module);
        }

        // Update the current module completion status
        module.completion = true;

        // Unlock the next module if it exists
        const currentIndex = course.modules.findIndex((m) => m.moduleId === moduleId);
        if (currentIndex !== -1 && currentIndex + 1 < course.modules.length) {
            course.modules[currentIndex + 1].locked = false;
        }

        // Save the updated record
        await userCompletion.save();

        res.status(200).json({
            message: 'Module completion updated successfully and next module unlocked',
            completion: userCompletion,
        });
    } catch (error) {
        console.error('Error updating module completion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
module.exports = router;

