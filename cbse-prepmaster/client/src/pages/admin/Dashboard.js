import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  People as StudentsIcon,
  Assignment as TestsIcon,
  QuestionAnswer as QuestionsIcon,
  Assessment as ResultsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';
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
import { Bar } from 'react-chartjs-2';

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

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = ({ toggleTheme, darkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    totalQuestions: 0,
    totalResults: 0,
    subjectPerformance: {
      labels: [],
      data: [],
    },
    recentActivity: [],
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, testsRes, questionsRes, resultsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/auth/students/count`),
          axios.get(`${API_BASE_URL}/tests/count`),
          axios.get(`${API_BASE_URL}/questions/count`),
          axios.get(`${API_BASE_URL}/results/analytics`),
        ]);

        // Process subject performance data
        const subjectData = resultsRes.data.reduce((acc, item) => {
          acc.labels.push(item._id.subject);
          acc.data.push(item.averageScore);
          return acc;
        }, { labels: [], data: [] });

        setStats({
          totalStudents: studentsRes.data.count,
          totalTests: testsRes.data.count,
          totalQuestions: questionsRes.data.count,
          totalResults: resultsRes.data.totalResults,
          subjectPerformance: subjectData,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
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
    labels: stats.subjectPerformance.labels,
    datasets: [
      {
        label: 'Average Score (%)',
        data: stats.subjectPerformance.data,
        backgroundColor: theme.palette.primary.main,
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
          Admin Dashboard
        </Typography>
        <IconButton onClick={toggleTheme} color="inherit">
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(APP_ROUTES.ADMIN.TESTS + '/create')}
            >
              Create Test
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(APP_ROUTES.ADMIN.QUESTIONS + '/create')}
            >
              Add Questions
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<StudentsIcon sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tests"
            value={stats.totalTests}
            icon={<TestsIcon sx={{ color: theme.palette.secondary.main }} />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Questions Bank"
            value={stats.totalQuestions}
            icon={<QuestionsIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tests Taken"
            value={stats.totalResults}
            icon={<ResultsIcon sx={{ color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Subject-wise Performance
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar
                data={performanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Average Score (%)',
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: 'Average Performance by Subject',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
