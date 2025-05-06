import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar } from '@mui/material';

const ProfilePage: React.FC = () => {
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [avatar, setAvatar] = useState('');

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Avatar src={avatar} sx={{ width: 100, height: 100, mb: 2 }} />
        <Button variant="contained" component="label">
          Upload Avatar
          <input type="file" hidden onChange={handleAvatarChange} />
        </Button>

        <Box sx={{ mt: 3 }}>
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Box>

        <Button variant="contained" color="primary">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default ProfilePage;