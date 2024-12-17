const mongoose = require('mongoose');

// Section Schema
const SectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    videoLink: {
        type: String,
        required: false
    },
    example:{
        type:String,
        required:false
    },
    image:{
        type:String,
        required:false
    },
    Time:{
        type:Number,
        deafult:5,
        required:true
    }
    
});

// Submodule Schema
const SubmoduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    totalSections: {
        type: Number,
        default: 0
    },
    sectionTime:{
        type:Number,
        default:5
    },
    sections: [SectionSchema]
});

// Module Schema
const ModuleSchema = new mongoose.Schema({
    moduleId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description:{
        type:String,
        required:true
    },
    totalSubmodules: {
        type: Number,
        default: 0
    },
    totalTime:{
        type:Number,
        required:true,
    },
    submodules: [SubmoduleSchema],
    bannerImage:{
        type:String,
        required:false
    }
});

module.exports = mongoose.model('Module', ModuleSchema);
