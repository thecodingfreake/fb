const mongoose = require('mongoose');

const CompletionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    course_list: [
        {
            courseId: { type: String },
            title:{type:String},
            image:{type:String},
            modules: [
                {
                    moduleId: { type: String },
                    title:{type:String},
                    moduleName: { type: String },
                    locked: { type:Boolean,default: false },
                    completion: { type: Boolean, default: false },
                },
            ],
        },
    ],
});

module.exports = mongoose.model('Completion', CompletionSchema);
