import React, { useState } from 'react';
import { 
  AppBar, Box, Drawer, Toolbar, Typography, Divider, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Menu, MenuItem, Tooltip,
  Badge, Paper, ListSubheader, Chip, styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import GlobalSearch from './GlobalSearch';

const drawerWidth = 280;

// Styled components for enhanced UI
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backdropFilter: 'blur(8px)',
  backgroundColor: theme.palette.mode === 'light' 
    ? 'rgba(255, 255, 255, 0.85)'
    : 'rgba(18, 18, 18, 0.85)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  boxShadow: 'none',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  }
}));

const ActiveListItem = styled(ListItemButton)(({ theme }) => ({
  position: 'relative',
  '&.active': {
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(63, 81, 181, 0.1)' 
      : 'rgba(117, 125, 232, 0.1)',
    color: theme.palette.primary.main,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.palette.primary.main,
      borderRadius: '0 4px 4px 0',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    }
  },
}));

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
}));

const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { profile, signOut } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseMenuItems = [
      {
        text: t('navigation.dashboard'),
        icon: <DashboardIcon />,
        path: '/dashboard'
      }
    ];

    const roleSpecificMenuItems = profile?.role === 'student' ? [
      {
        text: t('navigation.courses'),
        icon: <SchoolIcon />,
        path: '/courses'
      },
      {
        text: t('navigation.events'),
        icon: <EventIcon />,
        path: '/events'
      }
    ] : profile?.role === 'faculty' ? [
      {
        text: t('navigation.courses'),
        icon: <SchoolIcon />,
        path: '/courses'
      },
      {
        text: t('navigation.courseManagement'),
        icon: <SchoolIcon />,
        path: '/course-management'
      },
      {
        text: t('navigation.events'),
        icon: <EventIcon />,
        path: '/events'
      }
    ] : [
      {
        text: t('navigation.userManagement'),
        icon: <PersonIcon />,
        path: '/users'
      },
      {
        text: t('navigation.courseManagement'),
        icon: <SchoolIcon />,
        path: '/course-management'
      },
      {
        text: t('navigation.eventManagement'),
        icon: <EventIcon />,
        path: '/event-management'
      }
    ];

    return [...baseMenuItems, ...roleSpecificMenuItems];
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LogoContainer>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>
          {t('app.name')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('app.tagline')}
        </Typography>
      </LogoContainer>
      
      {profile && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            sx={{ width: 40, height: 40 }}
            alt={profile?.first_name || 'User'} 
            src={profile?.avatar_url || undefined}
          >
            {profile?.first_name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {`${profile?.first_name || ''} ${profile?.last_name || ''}`}
            </Typography>
            <Chip 
              size="small" 
              label={profile?.role || 'User'} 
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                bgcolor: muiTheme.palette.mode === 'light' ? 'primary.light' : 'primary.dark',
                color: 'primary.contrastText',
                fontWeight: 500,
              }} 
            />
          </Box>
        </Box>
      )}

      <Divider />
      
      <List 
        sx={{ flexGrow: 1, pt: 0 }}
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'transparent', lineHeight: '40px' }}>
            {t('navigation.mainNavigation')}
          </ListSubheader>
        }
      >
        {getMenuItems().map((item, index) => (
          <ListItem key={index} disablePadding>
            <ActiveListItem 
              onClick={() => handleNavigate(item.path)}
              className={isActiveRoute(item.path) ? 'active' : ''}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {isActiveRoute(item.path) && <ChevronRightIcon fontSize="small" />}
            </ActiveListItem>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <MenuItem onClick={() => {
          handleNavigate('/settings');
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('navigation.settings')} />
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary={t('auth.logout')} />
        </MenuItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Global Search */}
            <Box sx={{ 
              display: { xs: 'none', md: 'block' }, 
              width: '320px',
            }}>
              <GlobalSearch />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {/* Theme Toggle */}
            <Tooltip title={mode === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}>
              <IconButton color="inherit" onClick={toggleTheme} size="small">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Language Selector */}
            <LanguageSelector />

            {/* Notifications */}
            <Tooltip title={t('navigation.notifications')}>
              <IconButton color="inherit" size="small">
                <NotificationBadge badgeContent={3} max={99}>
                  <NotificationsIcon />
                </NotificationBadge>
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Box>
              <Tooltip title={t('navigation.profile')}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    alt={profile?.first_name || 'User'} 
                    src={profile?.avatar_url || undefined}
                    sx={{ 
                      width: 36, 
                      height: 36,
                      border: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {profile?.first_name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    borderRadius: 2,
                    minWidth: 200,
                    overflow: 'visible',
                    mt: 1.5,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                {profile && (
                  <>
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                        {profile?.first_name} {profile?.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('user.role', { role: profile?.role || 'User' })}
                      </Typography>
                    </Box>
                    <Divider />
                  </>
                )}
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  navigate('/profile');
                }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('navigation.profile')}</Typography>
                </MenuItem>
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  navigate('/settings');
                }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('navigation.settings')}</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  handleLogout();
                }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('auth.logout')}</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </StyledAppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 3,
            backgroundColor: 'background.paper',
            minHeight: 'calc(100vh - 148px)', // Account for toolbar and padding
          }}
        >
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
};

export default AppLayout;