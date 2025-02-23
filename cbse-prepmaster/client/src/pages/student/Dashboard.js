import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccessTime as TimeIcon,
  School as SubjectIcon,
  Assignment as TestIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { API_BASE_URL, APP_ROUTES } from '../../config/constants';
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ toggleTheme, darkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    upcomingTests: [],
    recentResults: [],
    performanceData: {
      subjects: [],
      scores: [],
    },
    strengthsWeaknesses: {
      strengths: [],
      weaknesses: [],
    },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [testsRes, resultsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/tests?status=upcoming`),
          axios.get(`${API_BASE_URL}/results`),
        ]);

        // Process performance data
        const subjectScores = {};
        resultsRes.data.forEach((result) => {
          if (!subjectScores[result.test.subject]) {
            subjectScores[result.test.subject] = [];
          }
          subjectScores[result.test.subject].push(result.percentageScore);
        });

        const subjects = Object.keys(subjectScores);
        const scores = subjects.map(
          (subject) =>
            subjectScores[subject].reduce((a, b) => a + b, 0) /
            subjectScores[subject].length
        );

        // Identify strengths and weaknesses
        const strengthsWeaknesses = {
          strengths: [],
          weaknesses: [],
        };

        subjects.forEach((subject, index) => {
          if (scores[index] >= 70) {
            strengthsWeaknesses.strengths.push(subject);
          } else if (scores[index] <= 40) {
            strengthsWeaknesses.weaknesses.push(subject);
          }
        });

        setDashboardData({
          upcomingTests: testsRes.data.slice(0, 3),
          recentResults: resultsRes.data.slice(0, 3),
          performanceData: {
            subjects,
            scores,
          },
          strengthsWeaknesses,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const performanceChartData = {
    labels: dashboardData.performanceData.subjects,
    datasets: [
      {
        label: 'Average Score (%)',
        data: dashboardData.performanceData.scores,
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
      },
    ],
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Welcome, {user.name}!
        </Typography>
        <IconButton onClick={toggleTheme} color="inherit">
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Upcoming Tests */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tests
            </Typography>
            {dashboardData.upcomingTests.length === 0 ? (
              <Typography color="textSecondary">No upcoming tests</Typography>
            ) : (
              dashboardData.upcomingTests.map((test) => (
                <Card key={test._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{test.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <SubjectIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">{test.subject}</Typography>
                      <TimeIcon sx={{ ml: 2, mr: 1 }} />
                      <Typography variant="body2">
                        {format(new Date(test.startTime), 'PPp')}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/tests/${test._id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        {/* Performance Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance Overview
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={performanceChartData}
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

        {/* Strengths & Weaknesses */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Strengths & Weaknesses
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Strengths
                </Typography>
                {dashboardData.strengthsWeaknesses.strengths.length === 0 ? (
                  <Typography color="textSecondary">
                    Keep practicing to identify your strengths!
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dashboardData.strengthsWeaknesses.strengths.map((subject) => (
                      <Chip
                        key={subject}
                        label={subject}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Areas for Improvement
                </Typography>
                {dashboardData.strengthsWeaknesses.weaknesses.length === 0 ? (
                  <Typography color="textSecondary">
                    Great job! Keep up the good work!
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dashboardData.strengthsWeaknesses.weaknesses.map(
                      (subject) => (
                        <Chip
                          key={subject}
                          label={subject}
                          color="error"
                          variant="outlined"
                        />
                      )
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
