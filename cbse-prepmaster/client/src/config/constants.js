export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const SUBJECTS = {
    CLASS_8: ['Maths', 'Science', 'Social Science', 'English', 'Hindi'],
    CLASS_9: ['Maths', 'Science', 'Social Science', 'English', 'Hindi']
};

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

export const QUESTION_TYPES = ['MCQ', 'short_answer'];

export const TEST_STATUS = {
    UPCOMING: 'upcoming',
    ONGOING: 'ongoing',
    COMPLETED: 'completed'
};

export const USER_ROLES = {
    ADMIN: 'admin',
    STUDENT: 'student'
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME_MODE: 'theme_mode'
};

export const THEME = {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3'
};

export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    TESTS: '/tests',
    TEST_DETAILS: '/tests/:id',
    TAKE_TEST: '/tests/:id/take',
    RESULTS: '/results',
    RESULT_DETAILS: '/results/:id',
    PROFILE: '/profile',
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        TESTS: '/admin/tests',
        QUESTIONS: '/admin/questions',
        STUDENTS: '/admin/students',
        ANALYTICS: '/admin/analytics'
    }
};
