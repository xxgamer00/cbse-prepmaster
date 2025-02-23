const Result = require('../models/Result');
const Test = require('../models/Test');
const Question = require('../models/Question');

// Submit test
exports.submitTest = async (req, res) => {
    try {
        const { testId, responses } = req.body;
        const test = await Test.findById(testId).populate('questions');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Verify test submission time
        const now = new Date();
        if (now < test.startTime) {
            return res.status(400).json({ message: 'Test has not started yet' });
        }
        if (now > test.endTime) {
            return res.status(400).json({ message: 'Test has already ended' });
        }

        // Calculate scores and analyze responses
        let totalScore = 0;
        const analyzedResponses = [];
        const topicAnalysis = {};

        for (const response of responses) {
            const question = test.questions.find(q => q._id.toString() === response.questionId);
            if (!question) continue;

            const isCorrect = response.answer === question.correctAnswer;
            const marksObtained = isCorrect ? question.marks : 0;
            totalScore += marksObtained;

            // Track topic-wise performance
            if (!topicAnalysis[question.topic]) {
                topicAnalysis[question.topic] = {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    totalMarks: 0,
                    marksObtained: 0
                };
            }
            topicAnalysis[question.topic].totalQuestions++;
            topicAnalysis[question.topic].correctAnswers += isCorrect ? 1 : 0;
            topicAnalysis[question.topic].totalMarks += question.marks;
            topicAnalysis[question.topic].marksObtained += marksObtained;

            analyzedResponses.push({
                question: question._id,
                selectedAnswer: response.answer,
                isCorrect,
                marksObtained
            });
        }

        // Calculate chapter-wise analysis
        const chapterWiseAnalysis = Object.entries(topicAnalysis).map(([topic, data]) => ({
            topic,
            totalQuestions: data.totalQuestions,
            correctAnswers: data.correctAnswers,
            percentageScore: (data.marksObtained / data.totalMarks) * 100
        }));

        // Generate feedback based on performance
        const strengths = [];
        const weaknesses = [];
        const recommendations = [];

        chapterWiseAnalysis.forEach(chapter => {
            if (chapter.percentageScore >= 70) {
                strengths.push(chapter.topic);
            } else if (chapter.percentageScore <= 40) {
                weaknesses.push(chapter.topic);
                recommendations.push(`Focus on improving ${chapter.topic}`);
            }
        });

        // Create result document
        const result = new Result({
            student: req.user._id,
            test: testId,
            responses: analyzedResponses,
            totalScore,
            percentageScore: (totalScore / test.totalMarks) * 100,
            timeTaken: Math.round((now - test.startTime) / (1000 * 60)), // in minutes
            chapterWiseAnalysis,
            status: 'completed',
            feedback: {
                strengths,
                weaknesses,
                recommendations
            }
        });

        await result.save();
        res.status(201).json(result);
    } catch (error) {
        console.error('Test submission error:', error);
        res.status(500).json({ message: 'Error submitting test' });
    }
};

// Get student's results
exports.getStudentResults = async (req, res) => {
    try {
        const results = await Result.find({ student: req.user._id })
            .populate('test', 'title subject class')
            .sort({ submittedAt: -1 });

        res.json(results);
    } catch (error) {
        console.error('Results fetch error:', error);
        res.status(500).json({ message: 'Error fetching results' });
    }
};

// Get result by ID
exports.getResultById = async (req, res) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('test')
            .populate('student', 'name email class');

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        // Check access permission
        if (req.user.role === 'student' && result.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(result);
    } catch (error) {
        console.error('Result fetch error:', error);
        res.status(500).json({ message: 'Error fetching result' });
    }
};

// Get class analytics (admin only)
exports.getClassAnalytics = async (req, res) => {
    try {
        const { class: studentClass, subject, fromDate, toDate } = req.query;
        
        const query = {};
        if (studentClass) query['test.class'] = parseInt(studentClass);
        if (subject) query['test.subject'] = subject;
        if (fromDate || toDate) {
            query.submittedAt = {};
            if (fromDate) query.submittedAt.$gte = new Date(fromDate);
            if (toDate) query.submittedAt.$lte = new Date(toDate);
        }

        const results = await Result.aggregate([
            {
                $lookup: {
                    from: 'tests',
                    localField: 'test',
                    foreignField: '_id',
                    as: 'test'
                }
            },
            { $unwind: '$test' },
            { $match: query },
            {
                $group: {
                    _id: {
                        subject: '$test.subject',
                        topic: '$chapterWiseAnalysis.topic'
                    },
                    averageScore: { $avg: '$percentageScore' },
                    totalStudents: { $sum: 1 },
                    topicPerformance: { $push: '$chapterWiseAnalysis' }
                }
            }
        ]);

        res.json(results);
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};
