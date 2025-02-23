const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    responses: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedAnswer: String,
        isCorrect: Boolean,
        marksObtained: Number
    }],
    totalScore: {
        type: Number,
        required: true
    },
    percentageScore: {
        type: Number,
        required: true
    },
    timeTaken: {
        type: Number, // in minutes
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    chapterWiseAnalysis: [{
        topic: String,
        totalQuestions: Number,
        correctAnswers: Number,
        percentageScore: Number
    }],
    status: {
        type: String,
        enum: ['completed', 'partial', 'expired'],
        required: true
    },
    feedback: {
        strengths: [String],
        weaknesses: [String],
        recommendations: [String]
    }
});

// Virtual for calculating performance metrics
resultSchema.virtual('performanceMetrics').get(function() {
    return {
        accuracy: (this.totalScore / (this.responses.length * this.test.totalMarks)) * 100,
        timePerQuestion: this.timeTaken / this.responses.length,
        completionRate: (this.responses.filter(r => r.selectedAnswer).length / this.responses.length) * 100
    };
});

// Index for efficient querying
resultSchema.index({ student: 1, test: 1 });
resultSchema.index({ submittedAt: -1 });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
