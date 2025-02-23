const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    bulkImportQuestions
} = require('../controllers/questionController');

// Validation rules
const questionValidation = [
    body('type').isIn(['MCQ', 'short_answer']).withMessage('Invalid question type'),
    body('text').notEmpty().withMessage('Question text is required'),
    body('options').if(body('type').equals('MCQ')).isArray().withMessage('Options must be an array'),
    body('correctAnswer').notEmpty().withMessage('Correct answer is required'),
    body('marks').isNumeric().withMessage('Marks must be a number'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
    body('subject').isIn(['Maths', 'Science', 'Social Science', 'English', 'Hindi'])
        .withMessage('Invalid subject'),
    body('class').isIn([8, 9]).withMessage('Invalid class'),
    body('topic').notEmpty().withMessage('Topic is required')
];

// Bulk import validation
const bulkImportValidation = [
    body('questions').isArray().withMessage('Questions must be an array'),
    body('questions.*.type').isIn(['MCQ', 'short_answer']).withMessage('Invalid question type'),
    body('questions.*.text').notEmpty().withMessage('Question text is required'),
    body('questions.*.correctAnswer').notEmpty().withMessage('Correct answer is required'),
    body('questions.*.marks').isNumeric().withMessage('Marks must be a number'),
    body('questions.*.difficulty').isIn(['easy', 'medium', 'hard'])
        .withMessage('Invalid difficulty level'),
    body('questions.*.subject').isIn(['Maths', 'Science', 'Social Science', 'English', 'Hindi'])
        .withMessage('Invalid subject'),
    body('questions.*.class').isIn([8, 9]).withMessage('Invalid class'),
    body('questions.*.topic').notEmpty().withMessage('Topic is required')
];

// Routes
router.post('/', [verifyToken, isAdmin, questionValidation], createQuestion);
router.get('/', verifyToken, getQuestions);
router.get('/:id', verifyToken, getQuestionById);
router.put('/:id', [verifyToken, isAdmin, questionValidation], updateQuestion);
router.delete('/:id', [verifyToken, isAdmin], deleteQuestion);
router.post('/bulk-import', [verifyToken, isAdmin, bulkImportValidation], bulkImportQuestions);

module.exports = router;
