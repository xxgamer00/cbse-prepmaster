import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudDownload as ImportIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { API_BASE_URL, SUBJECTS } from '../../config/constants';
import FormField from '../../components/common/FormField';

const validationSchema = Yup.object({
  text: Yup.string().required('Question text is required'),
  type: Yup.string().required('Question type is required'),
  subject: Yup.string().required('Subject is required'),
  class: Yup.number().required('Class is required'),
  topic: Yup.string().required('Topic is required'),
  difficulty: Yup.string().required('Difficulty level is required'),
  marks: Yup.number()
    .required('Marks are required')
    .min(1, 'Minimum 1 mark')
    .max(10, 'Maximum 10 marks'),
  options: Yup.array().when('type', {
    is: 'MCQ',
    then: Yup.array()
      .of(
        Yup.object({
          text: Yup.string().required('Option text is required'),
          isCorrect: Yup.boolean(),
        })
      )
      .min(2, 'At least 2 options are required'),
  }),
  correctAnswer: Yup.string().required('Correct answer is required'),
  explanation: Yup.string(),
});

const Questions = () => {
  const theme = useTheme();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    difficulty: '',
    type: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API_BASE_URL}/questions`, { params });
      setQuestions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (values, { resetForm }) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/questions`, values);
      resetForm();
      setOpenDialog(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (values) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/questions/${editQuestion._id}`, values);
      setEditQuestion(null);
      setOpenDialog(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/questions/${questionId}`);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  const handleImportQuestions = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/questions/import`);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Question Bank</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<ImportIcon />}
            onClick={handleImportQuestions}
            sx={{ mr: 2 }}
          >
            Import Questions
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditQuestion(null);
              setOpenDialog(true);
            }}
          >
            Add Question
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {SUBJECTS.CLASS_8.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={8}>Class 8</MenuItem>
                <MenuItem value={9}>Class 9</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchQuestions()}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={fetchQuestions}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Questions List */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {questions.map((question) => (
            <Grid item xs={12} key={question._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {question.text}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={question.subject} color="primary" />
                    <Chip label={`Class ${question.class}`} />
                    <Chip
                      label={question.difficulty}
                      color={
                        question.difficulty === 'easy'
                          ? 'success'
                          : question.difficulty === 'medium'
                          ? 'warning'
                          : 'error'
                      }
                    />
                    <Chip label={`${question.marks} marks`} variant="outlined" />
                  </Box>
                  {question.type === 'MCQ' && (
                    <Box sx={{ ml: 2 }}>
                      {question.options.map((option, index) => (
                        <Typography
                          key={index}
                          sx={{
                            color: option.isCorrect ? 'success.main' : 'text.primary',
                          }}
                        >
                          {String.fromCharCode(65 + index)}. {option.text}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditQuestion(question);
                      setOpenDialog(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleDeleteQuestion(question._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Question Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditQuestion(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editQuestion ? 'Edit Question' : 'Create New Question'}
        </DialogTitle>
        <Formik
          initialValues={
            editQuestion || {
              text: '',
              type: 'MCQ',
              subject: '',
              class: '',
              topic: '',
              difficulty: '',
              marks: 1,
              options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
              ],
              correctAnswer: '',
              explanation: '',
            }
          }
          validationSchema={validationSchema}
          onSubmit={editQuestion ? handleUpdateQuestion : handleCreateQuestion}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      component={FormField}
                      name="text"
                      label="Question Text"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormField}
                      name="type"
                      label="Question Type"
                      type="select"
                      options={[
                        { value: 'MCQ', label: 'Multiple Choice' },
                        { value: 'short_answer', label: 'Short Answer' },
                      ]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormField}
                      name="subject"
                      label="Subject"
                      type="select"
                      options={SUBJECTS.CLASS_8.map((subject) => ({
                        value: subject,
                        label: subject,
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormField}
                      name="difficulty"
                      label="Difficulty"
                      type="select"
                      options={[
                        { value: 'easy', label: 'Easy' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'hard', label: 'Hard' },
                      ]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormField}
                      name="marks"
                      label="Marks"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormField}
                      name="topic"
                      label="Topic"
                    />
                  </Grid>

                  {values.type === 'MCQ' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Options
                      </Typography>
                      {values.options.map((option, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={10}>
                              <Field
                                component={FormField}
                                name={`options.${index}.text`}
                                label={`Option ${String.fromCharCode(65 + index)}`}
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <FormControl>
                                <Field
                                  type="radio"
                                  name="correctAnswer"
                                  value={String.fromCharCode(65 + index)}
                                  checked={values.correctAnswer === String.fromCharCode(65 + index)}
                                  onChange={() => {
                                    setFieldValue('correctAnswer', String.fromCharCode(65 + index));
                                    const newOptions = values.options.map((opt, i) => ({
                                      ...opt,
                                      isCorrect: i === index,
                                    }));
                                    setFieldValue('options', newOptions);
                                  }}
                                />
                              </FormControl>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                      {values.options.length < 4 && (
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() =>
                            setFieldValue('options', [
                              ...values.options,
                              { text: '', isCorrect: false },
                            ])
                          }
                        >
                          Add Option
                        </Button>
                      )}
                    </Grid>
                  )}

                  {values.type === 'short_answer' && (
                    <Grid item xs={12}>
                      <Field
                        component={FormField}
                        name="correctAnswer"
                        label="Correct Answer"
                        multiline
                        rows={2}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Field
                      component={FormField}
                      name="explanation"
                      label="Explanation"
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setOpenDialog(false);
                    setEditQuestion(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading
                    ? 'Saving...'
                    : editQuestion
                    ? 'Update Question'
                    : 'Create Question'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default Questions;
