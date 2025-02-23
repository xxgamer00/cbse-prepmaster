import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Check as CorrectIcon,
  Close as WrongIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ResultDetails = () => {
  const theme = useTheme();
  const { id: resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/results/${resultId}`);
        setResult(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

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

  const pieChartData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [
          result.responses.filter(r => r.isCorrect).length,
          result.responses.filter(r => !r.isCorrect).length,
        ],
        backgroundColor: [theme.palette.success.main, theme.palette.error.main],
      },
    ],
  };

  const chapterAnalysisData = {
    labels: result.chapterWiseAnalysis.map(c => c.topic),
    datasets: [
      {
        label: 'Score (%)',
        data: result.chapterWiseAnalysis.map(c => c.percentageScore),
        backgroundColor: theme.palette.primary.main,
      },
    ],
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {result.test.title}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Subject: {result.test.subject} | Class: {result.test.class}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'flex-start', md: 'flex-end' },
              }}
            >
              <Typography variant="h3" color="primary">
                {result.percentageScore.toFixed(1)}%
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Score: {result.totalScore} / {result.test.totalMarks}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Time Taken: {result.timeTaken} minutes
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Chapter-wise Analysis
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={chapterAnalysisData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Strengths & Weaknesses */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Performance Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'success.main' }} />
              Strengths
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {result.feedback.strengths.map((strength, index) => (
                <Chip
                  key={index}
                  label={strength}
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              <TrendingDownIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
              Areas for Improvement
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {result.feedback.weaknesses.map((weakness, index) => (
                <Chip
                  key={index}
                  label={weakness}
                  color="error"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Responses */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Question-wise Analysis
        </Typography>
        {result.responses.map((response, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography sx={{ flexGrow: 1 }}>
                  Question {index + 1}
                </Typography>
                {response.isCorrect ? (
                  <Chip
                    icon={<CorrectIcon />}
                    label="Correct"
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<WrongIcon />}
                    label="Incorrect"
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography gutterBottom>
                {response.question.text}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography color="textSecondary" gutterBottom>
                Your Answer: {response.selectedAnswer || 'Not answered'}
              </Typography>
              <Typography color="success.main" gutterBottom>
                Correct Answer: {response.question.correctAnswer}
              </Typography>
              {response.question.explanation && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Explanation:
                  </Typography>
                  <Typography>
                    {response.question.explanation}
                  </Typography>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
};

export default ResultDetails;
