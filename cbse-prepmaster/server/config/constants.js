module.exports = {
    // Subjects available in the system
    SUBJECTS: {
        MATHS: 'Maths',
        SCIENCE: 'Science',
        SOCIAL_SCIENCE: 'Social Science',
        ENGLISH: 'English',
        HINDI: 'Hindi'
    },

    // Available classes
    CLASSES: [8, 9],

    // Question types
    QUESTION_TYPES: {
        MCQ: 'MCQ',
        SHORT_ANSWER: 'short_answer'
    },

    // Difficulty levels
    DIFFICULTY_LEVELS: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    },

    // User roles
    ROLES: {
        ADMIN: 'admin',
        STUDENT: 'student'
    },

    // Test status
    TEST_STATUS: {
        UPCOMING: 'upcoming',
        ONGOING: 'ongoing',
        COMPLETED: 'completed'
    },

    // Result status
    RESULT_STATUS: {
        COMPLETED: 'completed',
        PARTIAL: 'partial',
        EXPIRED: 'expired'
    },

    // Question sources
    QUESTION_SOURCES: {
        CUSTOM: 'custom',
        OPENTDB: 'opentdb'
    },

    // OpenTriviaDB API categories mapping
    OPENTDB_CATEGORIES: {
        SCIENCE: 17, // Science & Nature
        MATHS: 19,   // Mathematics
        ENGLISH: 10, // Books & Literature
        SOCIAL_SCIENCE: [23, 22], // History & Geography
    },

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    // Token expiration
    JWT_EXPIRY: '24h',

    // Performance thresholds
    PERFORMANCE: {
        STRENGTH_THRESHOLD: 70, // Score >= 70% considered as strength
        WEAKNESS_THRESHOLD: 40  // Score <= 40% considered as weakness
    },

    // Time limits
    TIME_LIMITS: {
        MIN_TEST_DURATION: 15,  // minutes
        MAX_TEST_DURATION: 180  // minutes
    },

    // File upload limits
    UPLOAD_LIMITS: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png']
    }
};
