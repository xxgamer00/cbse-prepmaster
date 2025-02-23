const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
    createTest,
    getTests,
    getTestById,
    updateTest,
    deleteTest,
    addQuestionsFromAPI
} = require('../controllers/testController');

// Routes
router.post('/', verifyToken, isAdmin, createTest);
router.get('/', verifyToken, getTests);
router.get('/:id', verifyToken, getTestById);
router.put('/:id', verifyToken, isAdmin, updateTest);
router.delete('/:id', verifyToken, isAdmin, deleteTest);
router.post('/add-questions', verifyToken, isAdmin, addQuestionsFromAPI);

module.exports = router;
