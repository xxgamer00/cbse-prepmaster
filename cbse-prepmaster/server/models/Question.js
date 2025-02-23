const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['MCQ', 'short_answer'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    options: [{
        id: String,
        text: String,
        isCorrect: Boolean
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: false
    },
    marks: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
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
    topic: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    source: {
        type: String,
        enum: ['custom', 'opentdb'],
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
    lastModified: {
        type: Date,
        default: Date.now
    }
});

// Update lastModified on save
questionSchema.pre('save', function(next) {
    this.lastModified = Date.now();
    next();
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
