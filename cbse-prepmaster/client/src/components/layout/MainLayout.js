import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  LibraryBooks as TestIcon,
  Assessment as ResultsIcon,
  Person as ProfileIcon,
  Dashboard as DashboardIcon,
  QuestionAnswer as QuestionsIcon,
  Group as StudentsIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { APP_ROUTES, USER_ROLES } from '../../config/constants';

const drawerWidth = 240;

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigationItems = isAdmin
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: APP_ROUTES.ADMIN.DASHBOARD },
        { text: 'Tests', icon: <TestIcon />, path: APP_ROUTES.ADMIN.TESTS },
        { text: 'Questions', icon: <QuestionsIcon />, path: APP_ROUTES.ADMIN.QUESTIONS },
        { text: 'Students', icon: <StudentsIcon />, path: APP_ROUTES.ADMIN.STUDENTS },
        { text: 'Analytics', icon: <AnalyticsIcon />, path: APP_ROUTES.ADMIN.ANALYTICS },
      ]
    : [
        { text: 'Home', icon: <HomeIcon />, path: APP_ROUTES.DASHBOARD },
        { text: 'Tests', icon: <TestIcon />, path: APP_ROUTES.TESTS },
        { text: 'Results', icon: <ResultsIcon />, path: APP_ROUTES.RESULTS },
        { text: 'Profile', icon: <ProfileIcon />, path: APP_ROUTES.PROFILE },
      ];

  const drawer = (
    <Box>
      <Toolbar />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            CBSE PrepMaster
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Side Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginBottom: { xs: '56px', sm: 0 },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <BottomNavigation
          value={location.pathname}
          onChange={(_, newValue) => navigate(newValue)}
          sx={{
            width: '100%',
            position: 'fixed',
            bottom: 0,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.text}
              label={item.text}
              icon={item.icon}
              value={item.path}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};

export default MainLayout;
