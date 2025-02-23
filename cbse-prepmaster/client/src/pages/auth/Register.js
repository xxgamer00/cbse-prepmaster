import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  Typography,
  Link,
  Paper,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { register } from '../../store/slices/authSlice';
import FormField from '../../components/common/FormField';
import { APP_ROUTES, USER_ROLES } from '../../config/constants';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string()
    .oneOf(['admin', 'student'], 'Invalid role')
    .required('Role is required'),
  class: Yup.number()
    .when('role', {
      is: 'student',
      then: () => Yup.number()
        .oneOf([8, 9], 'Please select a valid class')
        .required('Class is required for students'),
      otherwise: () => Yup.number().nullable(),
    }),
});

const Register = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { confirmPassword, ...registerData } = values;
      const result = await dispatch(register(registerData)).unwrap();
      if (result.user.role === 'admin') {
        navigate(APP_ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(APP_ROUTES.DASHBOARD);
      }
    } catch (err) {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: '400px',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography component="h1" variant="h4" gutterBottom>
              CBSE PrepMaster
            </Typography>
            <Typography component="h2" variant="h5">
              Create Account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'student',
              class: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting }) => (
              <Form>
                <Field
                  component={FormField}
                  name="name"
                  label="Full Name"
                  autoComplete="name"
                  disabled={loading}
                />

                <Field
                  component={FormField}
                  name="email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  disabled={loading}
                />

                <Field
                  component={FormField}
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <Field
                  component={FormField}
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <Field
                  component={FormField}
                  name="role"
                  type="select"
                  label="Role"
                  disabled={loading}
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'admin', label: 'Administrator' },
                  ]}
                />

                {values.role === 'student' && (
                  <Field
                    component={FormField}
                    name="class"
                    type="select"
                    label="Class"
                    disabled={loading}
                    options={[
                      { value: 8, label: 'Class 8' },
                      { value: 9, label: 'Class 9' },
                    ]}
                  />
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to={APP_ROUTES.LOGIN}
                    variant="body2"
                    sx={{
                      textDecoration: 'none',
                      color: theme.palette.primary.main,
                    }}
                  >
                    {'Already have an account? Sign In'}
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>

        {!isMobile && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 4 }}
          >
            {'© '}
            {new Date().getFullYear()}
            {' CBSE PrepMaster. All rights reserved.'}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default Register;
