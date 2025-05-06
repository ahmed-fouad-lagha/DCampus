import React from 'react';
import { 
  Box, 
  MenuItem, 
  Select, 
  SelectChangeEvent, 
  FormControl,
  InputLabel,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { profile, updateProfile } = useAuth();
  const theme = useTheme();

  const handleLanguageChange = async (event: SelectChangeEvent) => {
    const language = event.target.value as 'en' | 'fr' | 'ar';
    
    // Change the language in i18next
    await i18n.changeLanguage(language);

    // If user is authenticated, update their language preference in the database
    if (profile) {
      await updateProfile({
        language_preference: language
      });
    }

    // Update document direction for Arabic language (right-to-left)
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="language-select-label">Language</InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={i18n.language}
          label="Language"
          onChange={handleLanguageChange}
          sx={{ 
            '& .MuiSelect-select': { 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <MenuItem value="en">
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🇬🇧 English
            </Box>
          </MenuItem>
          <MenuItem value="fr">
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🇫🇷 Français
            </Box>
          </MenuItem>
          <MenuItem value="ar">
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🇩🇿 العربية
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;