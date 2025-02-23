const constants = require('../config/constants');

/**
 * Validate if the given subject is valid
 * @param {string} subject - Subject to validate
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidSubject = (subject) => {
    return Object.values(constants.SUBJECTS).includes(subject);
};

/**
 * Validate if the given class is valid
 * @param {number} classNum - Class number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidClass = (classNum) => {
    return constants.CLASSES.includes(Number(classNum));
};

/**
 * Calculate percentage score
 * @param {number} obtained - Marks obtained
 * @param {number} total - Total marks
 * @returns {number} - Percentage score rounded to 2 decimal places
 */
exports.calculatePercentage = (obtained, total) => {
    return Math.round((obtained / total) * 100 * 100) / 100;
};

/**
 * Generate chapter-wise analysis from responses
 * @param {Array} responses - Array of question responses
 * @param {Array} questions - Array of questions
 * @returns {Array} - Chapter-wise analysis
 */
exports.generateChapterAnalysis = (responses, questions) => {
    const analysis = {};

    responses.forEach(response => {
        const question = questions.find(q => q._id.toString() === response.question.toString());
        if (!question) return;

        if (!analysis[question.topic]) {
            analysis[question.topic] = {
                totalQuestions: 0,
                correctAnswers: 0,
                totalMarks: 0,
                marksObtained: 0
            };
        }

        analysis[question.topic].totalQuestions++;
        analysis[question.topic].totalMarks += question.marks;
        
        if (response.isCorrect) {
            analysis[question.topic].correctAnswers++;
            analysis[question.topic].marksObtained += question.marks;
        }
    });

    return Object.entries(analysis).map(([topic, data]) => ({
        topic,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        percentageScore: exports.calculatePercentage(data.marksObtained, data.totalMarks)
    }));
};

/**
 * Generate performance feedback based on chapter-wise analysis
 * @param {Array} chapterAnalysis - Chapter-wise analysis array
 * @returns {Object} - Feedback object containing strengths, weaknesses, and recommendations
 */
exports.generateFeedback = (chapterAnalysis) => {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    chapterAnalysis.forEach(chapter => {
        if (chapter.percentageScore >= constants.PERFORMANCE.STRENGTH_THRESHOLD) {
            strengths.push(chapter.topic);
        } else if (chapter.percentageScore <= constants.PERFORMANCE.WEAKNESS_THRESHOLD) {
            weaknesses.push(chapter.topic);
            recommendations.push(`Focus on improving ${chapter.topic} (${chapter.percentageScore}% score)`);
        }
    });

    return { strengths, weaknesses, recommendations };
};

/**
 * Validate test duration
 * @param {number} duration - Test duration in minutes
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidTestDuration = (duration) => {
    return duration >= constants.TIME_LIMITS.MIN_TEST_DURATION && 
           duration <= constants.TIME_LIMITS.MAX_TEST_DURATION;
};

/**
 * Format error messages for validation errors
 * @param {Array} errors - Array of validation errors
 * @returns {Object} - Formatted error object
 */
exports.formatValidationErrors = (errors) => {
    return errors.reduce((acc, error) => {
        acc[error.param] = error.msg;
        return acc;
    }, {});
};

/**
 * Check if a test is currently active
 * @param {Date} startTime - Test start time
 * @param {Date} endTime - Test end time
 * @returns {boolean} - True if test is active, false otherwise
 */
exports.isTestActive = (startTime, endTime) => {
    const now = new Date();
    return now >= startTime && now <= endTime;
};

/**
 * Generate performance metrics
 * @param {Object} result - Test result object
 * @returns {Object} - Performance metrics
 */
exports.generatePerformanceMetrics = (result) => {
    return {
        accuracy: exports.calculatePercentage(
            result.responses.filter(r => r.isCorrect).length,
            result.responses.length
        ),
        timePerQuestion: Math.round(result.timeTaken / result.responses.length),
        completionRate: exports.calculatePercentage(
            result.responses.filter(r => r.selectedAnswer).length,
            result.responses.length
        )
    };
};
