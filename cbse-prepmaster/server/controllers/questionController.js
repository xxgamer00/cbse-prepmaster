const Question = require('../models/Question');
const Test = require('../models/Test');

// Create a new question
exports.createQuestion = async (req, res) => {
    try {
        const {
            type,
            text,
            options,
            correctAnswer,
            explanation,
            marks,
            difficulty,
            subject,
            class: studentClass,
            topic,
            imageUrl
        } = req.body;

        const question = new Question({
            type,
            text,
            options,
            correctAnswer,
            explanation,
            marks,
            difficulty,
            subject,
            class: studentClass,
            topic,
            imageUrl,
            source: 'custom',
            createdBy: req.user._id
        });

        await question.save();
        res.status(201).json(question);
    } catch (error) {
        console.error('Question creation error:', error);
        res.status(500).json({ message: 'Error creating question' });
    }
};

// Get questions with filters
exports.getQuestions = async (req, res) => {
    try {
        const {
            subject,
            class: studentClass,
            topic,
            difficulty,
            type,
            source
        } = req.query;

        const query = {};

        // Apply filters
        if (subject) query.subject = subject;
        if (studentClass) query.class = studentClass;
        if (topic) query.topic = topic;
        if (difficulty) query.difficulty = difficulty;
        if (type) query.type = type;
        if (source) query.source = source;

        const questions = await Question.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        console.error('Questions fetch error:', error);
        res.status(500).json({ message: 'Error fetching questions' });
    }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json(question);
    } catch (error) {
        console.error('Question fetch error:', error);
        res.status(500).json({ message: 'Error fetching question' });
    }
};

// Update question
exports.updateQuestion = async (req, res) => {
    try {
        const {
            type,
            text,
            options,
            correctAnswer,
            explanation,
            marks,
            difficulty,
            subject,
            topic,
            imageUrl
        } = req.body;

        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check if question is being used in any ongoing tests
        const ongoingTests = await Test.find({
            questions: question._id,
            startTime: { $lte: new Date() },
            endTime: { $gte: new Date() }
        });

        if (ongoingTests.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot update question while it is being used in ongoing tests' 
            });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            {
                type,
                text,
                options,
                correctAnswer,
                explanation,
                marks,
                difficulty,
                subject,
                topic,
                imageUrl,
                lastModified: Date.now()
            },
            { new: true }
        );

        res.json(updatedQuestion);
    } catch (error) {
        console.error('Question update error:', error);
        res.status(500).json({ message: 'Error updating question' });
    }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check if question is being used in any tests
        const tests = await Test.find({ questions: question._id });

        if (tests.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete question as it is being used in tests' 
            });
        }

        await question.remove();
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Question deletion error:', error);
        res.status(500).json({ message: 'Error deleting question' });
    }
};

// Bulk import questions
exports.bulkImportQuestions = async (req, res) => {
    try {
        const questions = req.body.questions.map(q => ({
            ...q,
            source: 'custom',
            createdBy: req.user._id
        }));

        const savedQuestions = await Question.insertMany(questions);
        res.status(201).json(savedQuestions);
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ message: 'Error importing questions' });
    }
};
