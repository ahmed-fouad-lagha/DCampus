import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  Stack,
  TextField,
  Select,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Pagination,
  SelectChangeEvent
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { UserRole, Profile } from '../../types/database.types';
import { fetchUsers, deleteUser, FetchUsersOptions } from '../../services/userManagementService';
import LoadingSpinner from '../layout/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserListProps {
  onEditUser: (user: Profile) => void;
  onCreateUser: () => void;
}

const UserList: React.FC<UserListProps> = ({ onEditUser, onCreateUser }) => {
  // State variables
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [sortBy, setSortBy] = useState<{ column: keyof Profile; order: 'asc' | 'desc' }>({
    column: 'created_at',
    order: 'desc'
  });

  // Delete confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  const { profile } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin access
  useEffect(() => {
    if (profile && profile.role !== 'administrator') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  // Load users function defined with useCallback to avoid dependency issues
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const options: FetchUsersOptions = {
        page: currentPage,
        limit: pageSize,
        orderBy: sortBy,
        search: searchTerm || undefined
      };

      if (roleFilter) {
        options.role = roleFilter as UserRole;
      }

      const response = await fetchUsers(options);

      if (response.error) {
        setError(response.error.message);
      } else {
        setUsers(response.data || []);
        setTotalUsers(response.count);
      }
    } catch (err) {
      setError('An error occurred while fetching users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, roleFilter, sortBy]);

  // Load users when dependencies change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSort = (column: keyof Profile) => {
    setSortBy(prev => ({
      column,
      order: prev.column === column && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const result = await deleteUser(userToDelete.user_id);
      
      if (result.success) {
        console.log('User deleted successfully');
        // Refresh user list
        loadUsers();
      } else {
        console.error('Delete failed:', result.error?.message);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const confirmDelete = (user: Profile) => {
    setUserToDelete(user);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setUserToDelete(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    setRoleFilter(event.target.value as UserRole | '');
  };

  // Handle page size change
  const handlePageSizeChange = (event: SelectChangeEvent) => {
    setPageSize(Number(event.target.value));
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalUsers);

  // Render role badge
  const renderRoleBadge = (role: UserRole) => {
    let color;
    switch (role) {
      case 'administrator':
        color = 'error';
        break;
      case 'faculty':
        color = 'secondary';
        break;
      case 'student':
        color = 'success';
        break;
      default:
        color = 'default';
    }
    return <Chip label={role} color={color as any} size="small" />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={4} alignItems="center">
        <Typography variant="h5" fontWeight="bold">User Management</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          color="primary"
          onClick={onCreateUser}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: '2' }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                loadUsers();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={loadUsers} edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box sx={{ flex: '1' }}>
          <FormControl fullWidth>
            <InputLabel id="role-filter-label">Role</InputLabel>
            <Select
              labelId="role-filter-label"
              value={roleFilter}
              label="Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="">All roles</MenuItem>
              <MenuItem value="administrator">Administrator</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ flex: '1' }}>
          <FormControl fullWidth>
            <InputLabel id="page-size-label">Display</InputLabel>
            <Select
              labelId="page-size-label"
              value={pageSize.toString()}
              label="Display"
              onChange={handlePageSizeChange}
            >
              <MenuItem value="5">5 per page</MenuItem>
              <MenuItem value="10">10 per page</MenuItem>
              <MenuItem value="25">25 per page</MenuItem>
              <MenuItem value="50">50 per page</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Typography color="error" mb={2}>
          Error: {error}
        </Typography>
      )}

      {/* User table */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <LoadingSpinner />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('first_name')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Name {sortBy.column === 'first_name' && (sortBy.order === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell 
                    onClick={() => handleSort('department')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Department {sortBy.column === 'department' && (sortBy.order === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('created_at')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Joined {sortBy.column === 'created_at' && (sortBy.order === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No users found</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{renderRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => onEditUser(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDelete(user)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalUsers > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <Typography variant="body2">
                Showing {startIndex} to {endIndex} of {totalUsers} users
              </Typography>
              <Pagination 
                count={totalPages} 
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;