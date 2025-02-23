import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Timer as TimerIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL, APP_ROUTES } from '../../config/constants';

const TakeTest = () => {
  const theme = useTheme();
  const { id: testId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Load test data
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/tests/${testId}`);
        setTest(response.data);
        setTimeLeft(response.data.duration * 60); // Convert minutes to seconds
        
        // Initialize responses
        const initialResponses = {};
        response.data.questions.forEach((q) => {
          initialResponses[q._id] = '';
        });
        setResponses(initialResponses);

        // Load saved responses if any
        const savedResponses = localStorage.getItem(`test_${testId}_responses`);
        if (savedResponses) {
          setResponses(JSON.parse(savedResponses));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // Timer countdown
  useEffect(() => {
    if (!timeLeft || loading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  // Auto-save responses
  useEffect(() => {
    if (!test) return;

    const autoSave = async () => {
      setAutoSaving(true);
      localStorage.setItem(`test_${testId}_responses`, JSON.stringify(responses));
      setAutoSaving(false);
    };

    const autoSaveTimer = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(autoSaveTimer);
  }, [test, responses, testId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const progress = (currentQuestionIndex + 1) / totalQuestions * 100;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResponseChange = (value) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion._id]: value,
    }));
  };

  const handleNavigate = (direction) => {
    if (direction === 'next' && currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const formattedResponses = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer: answer || '', // Ensure empty string if no answer
      }));

      await axios.post(`${API_BASE_URL}/results/submit`, {
        testId,
        responses: formattedResponses,
      });

      // Clear saved responses
      localStorage.removeItem(`test_${testId}_responses`);
      
      // Navigate to results page
      navigate(APP_ROUTES.RESULTS);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit test');
      setShowConfirmSubmit(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">{test.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimerIcon sx={{ mr: 1 }} />
            <Typography
              sx={{
                color: timeLeft < 300 ? 'error.main' : 'inherit',
                fontWeight: timeLeft < 300 ? 'bold' : 'normal',
              }}
            >
              {formatTime(timeLeft)}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 2 }}
        />
      </Paper>

      {/* Question */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          {currentQuestion.text}
        </Typography>

        {currentQuestion.imageUrl && (
          <Box sx={{ my: 2 }}>
            <img
              src={currentQuestion.imageUrl}
              alt="Question"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
              }}
            />
          </Box>
        )}

        {currentQuestion.type === 'MCQ' ? (
          <RadioGroup
            value={responses[currentQuestion._id] || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
          >
            {currentQuestion.options.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={option.text}
              />
            ))}
          </RadioGroup>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={responses[currentQuestion._id] || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
            sx={{ mt: 2 }}
          />
        )}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          startIcon={<PrevIcon />}
          onClick={() => handleNavigate('prev')}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex === totalQuestions - 1 ? (
          <Button
            variant="contained"
            color="primary"
            endIcon={<FlagIcon />}
            onClick={() => setShowConfirmSubmit(true)}
            disabled={submitting}
          >
            Submit Test
          </Button>
        ) : (
          <Button
            endIcon={<NextIcon />}
            onClick={() => handleNavigate('next')}
            disabled={currentQuestionIndex === totalQuestions - 1}
          >
            Next
          </Button>
        )}
      </Box>

      {/* Auto-save indicator */}
      {autoSaving && (
        <Typography
          variant="caption"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          Saving...
        </Typography>
      )}

      {/* Confirm Submit Dialog */}
      <Dialog open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)}>
        <DialogTitle>Submit Test?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your test? You cannot change your answers after submission.
          </Typography>
          <Typography variant="subtitle2" color="error" sx={{ mt: 2 }}>
            Unanswered Questions: {
              Object.values(responses).filter(r => !r).length
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmSubmit(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeTest;
