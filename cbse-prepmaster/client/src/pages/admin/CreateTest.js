import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  CloudDownload as FetchIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL, APP_ROUTES, SUBJECTS } from '../../config/constants';
import FormField from '../../components/common/FormField';

const steps = ['Basic Details', 'Questions', 'Assign Students'];

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  subject: Yup.string().required('Subject is required'),
  class: Yup.number().required('Class is required'),
  duration: Yup.number()
    .required('Duration is required')
    .min(10, 'Duration must be at least 10 minutes')
    .max(180, 'Duration cannot exceed 180 minutes'),
  totalMarks: Yup.number()
    .required('Total marks is required')
    .min(10, 'Total marks must be at least 10'),
  startTime: Yup.date()
    .required('Start time is required')
    .min(new Date(), 'Start time must be in the future'),
  endTime: Yup.date()
    .required('End time is required')
    .min(Yup.ref('startTime'), 'End time must be after start time'),
});

const CreateTest = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFetchDialog, setShowFetchDialog] = useState(false);

  // Fetch available questions and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [questionsRes, studentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/questions`),
          axios.get(`${API_BASE_URL}/auth/students`),
        ]);
        setAvailableQuestions(questionsRes.data);
        setStudents(studentsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (activeStep === 1) {
      fetchData();
    }
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleQuestionSelect = (question) => {
    if (selectedQuestions.find(q => q._id === question._id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q._id !== question._id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleStudentSelect = (student) => {
    if (selectedStudents.find(s => s._id === student._id)) {
      setSelectedStudents(selectedStudents.filter(s => s._id !== student._id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const handleFetchQuestions = async (subject, difficulty) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/questions/fetch`, {
        params: { subject, difficulty },
      });
      setAvailableQuestions([...availableQuestions, ...response.data]);
      setShowFetchDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const testData = {
        ...values,
        questions: selectedQuestions.map(q => q._id),
        assignedTo: selectedStudents.map(s => s._id),
      };

      await axios.post(`${API_BASE_URL}/tests`, testData);
      navigate(APP_ROUTES.ADMIN.TESTS);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test');
      setLoading(false);
    }
  };

  const renderStepContent = (step, values) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Field
              component={FormField}
              name="title"
              label="Test Title"
              fullWidth
            />
            <Field
              component={FormField}
              name="subject"
              label="Subject"
              type="select"
              options={SUBJECTS.CLASS_8.map(subject => ({
                value: subject,
                label: subject,
              }))}
            />
            <Field
              component={FormField}
              name="class"
              label="Class"
              type="select"
              options={[
                { value: 8, label: 'Class 8' },
                { value: 9, label: 'Class 9' },
              ]}
            />
            <Field
              component={FormField}
              name="duration"
              label="Duration (minutes)"
              type="number"
            />
            <Field
              component={FormField}
              name="totalMarks"
              label="Total Marks"
              type="number"
            />
            <Field
              component={FormField}
              name="startTime"
              label="Start Time"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
            />
            <Field
              component={FormField}
              name="endTime"
              label="End Time"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                Selected Questions: {selectedQuestions.length}
              </Typography>
              <Button
                startIcon={<FetchIcon />}
                onClick={() => setShowFetchDialog(true)}
              >
                Fetch Questions
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {availableQuestions
                .filter(q => q.subject === values.subject && q.class === values.class)
                .map((question) => (
                  <Grid item xs={12} key={question._id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: selectedQuestions.find(q => q._id === question._id)
                          ? 'action.selected'
                          : 'background.paper',
                      }}
                      onClick={() => handleQuestionSelect(question)}
                    >
                      <Typography gutterBottom>{question.text}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={`${question.marks} marks`}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={question.difficulty}
                          size="small"
                          color={
                            question.difficulty === 'easy'
                              ? 'success'
                              : question.difficulty === 'medium'
                              ? 'warning'
                              : 'error'
                          }
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Selected Students: {selectedStudents.length}
            </Typography>
            <Grid container spacing={2}>
              {students
                .filter(student => student.class === values.class)
                .map((student) => (
                  <Grid item xs={12} sm={6} md={4} key={student._id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: selectedStudents.find(s => s._id === student._id)
                          ? 'action.selected'
                          : 'background.paper',
                      }}
                      onClick={() => handleStudentSelect(student)}
                    >
                      <Typography variant="subtitle1">{student.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {student.email}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Test
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Formik
          initialValues={{
            title: '',
            subject: '',
            class: '',
            duration: 60,
            totalMarks: 100,
            startTime: '',
            endTime: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isValid }) => (
            <Form>
              {renderStepContent(activeStep, values)}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {activeStep > 0 && (
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                )}
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      loading ||
                      !isValid ||
                      selectedQuestions.length === 0 ||
                      selectedStudents.length === 0
                    }
                  >
                    {loading ? 'Creating...' : 'Create Test'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isValid || (activeStep === 1 && selectedQuestions.length === 0)}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>

      {/* Fetch Questions Dialog */}
      <Dialog open={showFetchDialog} onClose={() => setShowFetchDialog(false)}>
        <DialogTitle>Fetch Questions</DialogTitle>
        <DialogContent>
          <Typography>
            Fetch additional questions from the question bank based on subject and difficulty.
          </Typography>
          {/* Add fetch options here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFetchDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleFetchQuestions('Math', 'medium')}
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch Questions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateTest;
