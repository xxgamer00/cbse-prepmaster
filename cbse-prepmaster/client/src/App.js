import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import store from './store';
import MainLayout from './components/layout/MainLayout';
import { STORAGE_KEYS, APP_ROUTES } from './config/constants';

// Lazy load components
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Tests = React.lazy(() => import('./pages/student/Tests'));
const TestDetails = React.lazy(() => import('./pages/student/TestDetails'));
const TakeTest = React.lazy(() => import('./pages/student/TakeTest'));
const Results = React.lazy(() => import('./pages/student/Results'));
const ResultDetails = React.lazy(() => import('./pages/student/ResultDetails'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminTests = React.lazy(() => import('./pages/admin/Tests'));
const AdminQuestions = React.lazy(() => import('./pages/admin/Questions'));
const AdminStudents = React.lazy(() => import('./pages/admin/Students'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));

// Loading component
const Loading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    Loading...
  </div>
);

const App = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem(STORAGE_KEYS.THEME_MODE) === 'dark'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Router>
          <React.Suspense fallback={<Loading />}>
            <Routes>
              {/* Public Routes */}
              <Route path={APP_ROUTES.LOGIN} element={<Login />} />
              <Route path={APP_ROUTES.REGISTER} element={<Register />} />

              {/* Protected Student Routes */}
              <Route
                path={APP_ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <StudentDashboard toggleTheme={toggleTheme} darkMode={darkMode} />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.TESTS}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Tests />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.TEST_DETAILS}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TestDetails />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.TAKE_TEST}
                element={
                  <ProtectedRoute>
                    <TakeTest />
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.RESULTS}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Results />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.RESULT_DETAILS}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ResultDetails />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.PROFILE}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile toggleTheme={toggleTheme} darkMode={darkMode} />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path={APP_ROUTES.ADMIN.DASHBOARD}
                element={
                  <ProtectedRoute adminOnly>
                    <MainLayout>
                      <AdminDashboard toggleTheme={toggleTheme} darkMode={darkMode} />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.ADMIN.TESTS}
                element={
                  <ProtectedRoute adminOnly>
                    <MainLayout>
                      <AdminTests />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.ADMIN.QUESTIONS}
                element={
                  <ProtectedRoute adminOnly>
                    <MainLayout>
                      <AdminQuestions />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.ADMIN.STUDENTS}
                element={
                  <ProtectedRoute adminOnly>
                    <MainLayout>
                      <AdminStudents />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_ROUTES.ADMIN.ANALYTICS}
                element={
                  <ProtectedRoute adminOnly>
                    <MainLayout>
                      <AdminAnalytics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Default Route */}
              <Route
                path="/"
                element={
                  <Navigate
                    to={store.getState().auth.user?.role === 'admin' ? APP_ROUTES.ADMIN.DASHBOARD : APP_ROUTES.DASHBOARD}
                    replace
                  />
                }
              />
            </Routes>
          </React.Suspense>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const auth = store.getState().auth;
  const isAuthenticated = auth.isAuthenticated;
  const isAdmin = auth.user?.role === 'admin';

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  return children;
};

export default App;
