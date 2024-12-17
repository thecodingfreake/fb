const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const Module = require("../models/Module");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { bannerImage, title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Course title and description are required." });
    }

    if (!bannerImage) {
      return res.status(400).json({ message: "Banner image is required." });
    }

    // Parse Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Map data to MongoDB schema
    const moduleData = {
      moduleId: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      description,
      totalSubmodules: 0,
      totalTime: 0,
      submodules: [],
      bannerImage,
    };

    const submodulesMap = {};
    data.forEach((row) => {
      const {
        "Submodule Title": submoduleTitle,
        "Section Title": sectionTitle,
        "Section Content": sectionContent,
        "Video Link": videoLink,
        "Section Time (minutes)": sectionTime,
        "Example": example,
        "Image Link": image,
      } = row;

      if (!submoduleTitle || !sectionTitle) {
        console.error("Missing data in row:", row); // Log missing fields for debugging
        return; // Skip rows with missing mandatory fields
      }

      if (!submodulesMap[submoduleTitle]) {
        submodulesMap[submoduleTitle] = {
          title: submoduleTitle,
          totalSections: 0,
          totalTime: 0, // Initialize total time for each submodule
          sections: [],
        };
        moduleData.submodules.push(submodulesMap[submoduleTitle]);
        moduleData.totalSubmodules += 1;
      }

      const submodule = submodulesMap[submoduleTitle];
      const sectionTimeInt = parseInt(sectionTime) || 0;

      submodule.sections.push({
        title: sectionTitle,
        content: sectionContent || "No content available",
        videoLink: videoLink || "",
        example: example || "No example provided",
        image: image || "No image provided",
        Time: sectionTimeInt, // Add section time (default to 0 if not provided)
      });

      submodule.totalSections += 1;
      submodule.totalTime += sectionTimeInt; // Add section time to submodule total time
      moduleData.totalTime += sectionTimeInt; // Add section time to module total time
    });

    // Save or update the module in MongoDB
    await Module.findOneAndUpdate(
      { moduleId: moduleData.moduleId }, // Find by unique moduleId
      { $set: moduleData }, // Replace document with new data
      { upsert: true, new: true } // Insert if not found, return the new document
    );

    // Delete the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete the file:", err);
        return res.status(500).json({ message: "Data saved, but failed to delete the file." });
      }
    });

    // Response with course data
    res.status(200).json({
      message: "File uploaded, data saved, and file deleted successfully.",
      module: {
        title: moduleData.title,
        totalSubmodules: moduleData.totalSubmodules,
        totalTime: moduleData.totalTime,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to process the file." });
  }
});

// Route to get course details
router.get("/courses", async (req, res) => {
  try {
    // Fetch all modules and their course details
    const modules = await Module.find();

    // Map the required data
    const courseDetails = modules.map((module) => ({
      title: module.title,
      id: module._id,
      description: module.description,
      chapters: module.totalSubmodules,
      time: module.totalTime,
      image: module.bannerImage,
    }));

    res.status(200).json({
      message: "Course details fetched successfully.",
      courses: courseDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch course details." });
  }
});

module.exports = router;
