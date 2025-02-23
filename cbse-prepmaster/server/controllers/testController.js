const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const axios = require('axios');

// Create a new test
exports.createTest = async (req, res) => {
    try {
        const {
            title,
            subject,
            class: studentClass,
            topics,
            duration,
            totalMarks,
            startTime,
            endTime,
            assignedTo
        } = req.body;

        const test = new Test({
            title,
            subject,
            class: studentClass,
            topics,
            duration,
            totalMarks,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            assignedTo,
            createdBy: req.user._id
        });

        await test.save();
        res.status(201).json(test);
    } catch (error) {
        console.error('Test creation error:', error);
        res.status(500).json({ message: 'Error creating test' });
    }
};

// Get all tests (with filters for admin/student)
exports.getTests = async (req, res) => {
    try {
        const { subject, class: studentClass, status } = req.query;
        const query = {};

        // Apply filters
        if (subject) query.subject = subject;
        if (studentClass) query.class = studentClass;

        // For students, only show assigned tests
        if (req.user.role === 'student') {
            query.assignedTo = req.user._id;
            query.class = req.user.class;
        }

        // Status filter (upcoming, ongoing, completed)
        if (status) {
            const now = new Date();
            switch (status) {
                case 'upcoming':
                    query.startTime = { $gt: now };
                    break;
                case 'ongoing':
                    query.startTime = { $lte: now };
                    query.endTime = { $gte: now };
                    break;
                case 'completed':
                    query.endTime = { $lt: now };
                    break;
            }
        }

        const tests = await Test.find(query)
            .populate('createdBy', 'name')
            .populate('questions')
            .sort({ startTime: 1 });

        res.json(tests);
    } catch (error) {
        console.error('Tests fetch error:', error);
        res.status(500).json({ message: 'Error fetching tests' });
    }
};

// Get test by ID
exports.getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('questions')
            .populate('createdBy', 'name')
            .populate('assignedTo', 'name email');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        res.json(test);
    } catch (error) {
        console.error('Test fetch error:', error);
        res.status(500).json({ message: 'Error fetching test' });
    }
};

// Update test
exports.updateTest = async (req, res) => {
    try {
        const {
            title,
            subject,
            topics,
            duration,
            totalMarks,
            startTime,
            endTime,
            assignedTo
        } = req.body;

        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Only allow updates if test hasn't started
        if (new Date(test.startTime) < new Date()) {
            return res.status(400).json({ message: 'Cannot update an ongoing or completed test' });
        }

        const updatedTest = await Test.findByIdAndUpdate(
            req.params.id,
            {
                title,
                subject,
                topics,
                duration,
                totalMarks,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                assignedTo
            },
            { new: true }
        );

        res.json(updatedTest);
    } catch (error) {
        console.error('Test update error:', error);
        res.status(500).json({ message: 'Error updating test' });
    }
};

// Delete test
exports.deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Only allow deletion if test hasn't started
        if (new Date(test.startTime) < new Date()) {
            return res.status(400).json({ message: 'Cannot delete an ongoing or completed test' });
        }

        await test.remove();
        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        console.error('Test deletion error:', error);
        res.status(500).json({ message: 'Error deleting test' });
    }
};

// Add questions from Open Trivia DB
exports.addQuestionsFromAPI = async (req, res) => {
    try {
        const { amount, difficulty, category } = req.query;
        const response = await axios.get(`${process.env.OPENTDB_API_URL}`, {
            params: { amount, difficulty, category }
        });

        const questions = response.data.results.map(q => ({
            type: 'MCQ',
            text: q.question,
            options: [
                { id: 'a', text: q.correct_answer, isCorrect: true },
                ...q.incorrect_answers.map((ans, idx) => ({
                    id: String.fromCharCode(98 + idx),
                    text: ans,
                    isCorrect: false
                }))
            ],
            correctAnswer: 'a',
            marks: 1,
            difficulty: q.difficulty,
            source: 'opentdb',
            createdBy: req.user._id
        }));

        const savedQuestions = await Question.insertMany(questions);
        res.json(savedQuestions);
    } catch (error) {
        console.error('API questions fetch error:', error);
        res.status(500).json({ message: 'Error fetching questions from API' });
    }
};
