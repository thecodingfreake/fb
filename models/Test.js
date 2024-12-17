const mongoose = require('mongoose');

const assignedSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isAttended: {
        type: Boolean,
        required: true,
        default: false
    },
    marksScored: {
        type: Number,
        required: true,
        default: 0
    },
    timecompleted:{
        type:String
    }
});

const testSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true,
        unique: true
    },
    testDuration: {
        type: String,
        required: true
    },
    totalScore: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    questions: {
        type: Array,
        required: true
    },
    assignedTo: [assignedSchema]  // Array of students assigned to the test
});

module.exports = mongoose.model('Test', testSchema);
