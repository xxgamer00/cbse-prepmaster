const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        enum: ['Maths', 'Science', 'Social Science', 'English', 'Hindi'],
        required: true
    },
    class: {
        type: Number,
        enum: [8, 9],
        required: true
    },
    topics: [{
        type: String,
        required: true
    }],
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    duration: {
        type: Number, // Duration in minutes
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    }
});

const Test = mongoose.model('Test', testSchema);
module.exports = Test;
