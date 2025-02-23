const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const {
    submitTest,
    getStudentResults,
    getResultById,
    getClassAnalytics
} = require('../controllers/resultController');

// Validation rules
const submitTestValidation = [
    body('testId').notEmpty().withMessage('Test ID is required'),
    body('responses').isArray().withMessage('Responses must be an array'),
    body('responses.*.questionId').notEmpty().withMessage('Question ID is required for each response'),
    body('responses.*.answer').notEmpty().withMessage('Answer is required for each response')
];

// Routes
router.post('/submit', [verifyToken, submitTestValidation], submitTest);
router.get('/student', verifyToken, getStudentResults);
router.get('/analytics', [verifyToken, isAdmin], getClassAnalytics);
router.get('/:id', verifyToken, getResultById);

module.exports = router;
