import React, { useState, useEffect, useCallback } from 'react';
import { 
  Autocomplete, TextField, InputAdornment, 
  CircularProgress, Typography, Box, Paper,
  PaperProps, Chip, Avatar, alpha, useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  School as CourseIcon,
  Event as EventIcon,
  Announcement as AnnouncementIcon,
  Person as UserIcon,
  ArrowForward as ArrowIcon,
  HistoryToggleOff as RecentIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import debounce from 'lodash/debounce';

// Import search service and types
import { search as searchService } from '../../services/searchService';
import { SearchResult, SearchOptions } from '../../types/search.types';

// Enhanced styled components
const SearchInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
    backgroundColor: theme.palette.mode === 'light' 
      ? alpha(theme.palette.common.black, 0.04)
      : alpha(theme.palette.common.white, 0.08),
    transition: theme.transitions.create(['background-color', 'box-shadow']),
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light' 
        ? alpha(theme.palette.common.black, 0.06)
        : alpha(theme.palette.common.white, 0.12),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
    },
  },
}));

interface CategoryChipProps {
  color?: string;
}

const CategoryChip = styled(Chip)<CategoryChipProps>(({ theme, color }) => ({
  fontSize: '0.7rem',
  height: 20,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontWeight: 500,
}));

// Get category icon based on type
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'course':
      return <CourseIcon fontSize="small" />;
    case 'event':
      return <EventIcon fontSize="small" />;
    case 'announcement':
      return <AnnouncementIcon fontSize="small" />;
    case 'user':
      return <UserIcon fontSize="small" />;
    default:
      return <SearchIcon fontSize="small" />;
  }
};

// Get recent searches from localStorage
const getRecentSearches = (): SearchResult[] => {
  try {
    const recentSearches = localStorage.getItem('recentSearches');
    return recentSearches ? JSON.parse(recentSearches) : [];
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
};

// Save recent search to localStorage
const saveRecentSearch = (result: SearchResult) => {
  try {
    const recentSearches = getRecentSearches();
    // Remove duplicates and keep latest 5
    const updatedSearches = [
      result,
      ...recentSearches.filter(item => item.id !== result.id)
    ].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  // Add selectedCategories state for filtering
  const [selectedCategories, setSelectedCategories] = useState<Array<'course' | 'event' | 'announcement' | 'user'>>([]);
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Load recent searches on component mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Create a debounced search function that properly manages dependencies
  const performSearch = useCallback(async (query: string) => {
    if (query.length > 1) {
      setLoading(true);
      
      try {
        // Set up search options, including category filters if selected
        const searchOptions: SearchOptions = {
          query,
          limit: 10
        };
        
        if (selectedCategories.length > 0) {
          searchOptions.categories = selectedCategories;
        }
        
        // Call the search service
        const response = await searchService(searchOptions);
        setOptions(response.results);
      } catch (error) {
        console.error('Search error:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setOptions([]);
    }
  }, [selectedCategories]);

  // Use useEffect to create the debounced function instead of useCallback with debounce
  const [debouncedSearchFn] = useState(() => {
    return debounce((query: string) => {
      performSearch(query);
    }, 300);
  });

  // Effect hook to trigger search when input changes
  useEffect(() => {
    if (inputValue.length > 1) {
      debouncedSearchFn(inputValue);
      setOpen(true);
    } else {
      setOptions([]);
      setOpen(false);
    }
    
    // Clean up debounced function on unmount
    return () => {
      debouncedSearchFn.cancel();
    };
  }, [inputValue, debouncedSearchFn, performSearch]);

  // Handle input change
  const handleInputChange = (event: React.SyntheticEvent, value: string) => {
    setInputValue(value);
  };

  // Navigate to selected item page
  const handleSelect = (event: React.SyntheticEvent, value: SearchResult | null) => {
    if (value) {
      saveRecentSearch(value);
      setRecentSearches(getRecentSearches());
      navigate(value.path);
    }
  };

  // Toggle category filter
  const toggleCategoryFilter = (category: 'course' | 'event' | 'announcement' | 'user') => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Get the category display name
  const getCategoryName = (category: string) => {
    return t(`search.categories.${category}`);
  };

  return (
    <>
      <Autocomplete
        id="global-search"
        sx={{ width: '100%' }}
        open={open}
        onOpen={() => inputValue.length > 1 && setOpen(true)}
        onClose={() => setOpen(false)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.title}
        options={options.length > 0 ? options : inputValue.length > 0 ? [] : recentSearches}
        loading={loading}
        loadingText={t('search.searching')}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleSelect}
        filterOptions={(x) => x} // Disable built-in filtering - we handle it in the service
        noOptionsText={
          loading ? t('search.searching') : 
          inputValue.length > 0 ? t('search.noResults') : t('search.startTyping')
        }
        blurOnSelect
        clearOnBlur={false}
        openOnFocus
        popupIcon={null}
        renderInput={(params) => (
          <SearchInput
            {...params}
            placeholder={t('search.placeholder')}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: '100%',
              py: 1,
              px: 0.5
            }}>
              <Avatar 
                sx={{ 
                  width: 28, 
                  height: 28, 
                  mr: 1.5,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              >
                {getCategoryIcon(option.category)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {option.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryChip
                    size="small"
                    label={getCategoryName(option.category)}
                    icon={option.id.startsWith('recent-') ? <RecentIcon fontSize="small" /> : undefined}
                  />
                  {option.description && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              <ArrowIcon 
                fontSize="small" 
                sx={{ 
                  ml: 1, 
                  opacity: 0.5,
                  color: 'primary.main'
                }} 
              />
            </Box>
          </li>
        )}
        groupBy={(option) => {
          if (recentSearches.some(recent => recent.id === option.id) && options.length === 0) {
            return 'recent';
          }
          return option.category;
        }}
        renderGroup={(params) => (
          <div key={params.key}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ 
                px: 2, 
                py: 1, 
                fontWeight: 500, 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {params.group === 'recent' ? (
                <RecentIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              ) : (
                getCategoryIcon(params.group)
              )}
              {params.group === 'recent' ? t('search.recentSearches') : getCategoryName(params.group)}
              {params.group !== 'recent' && (
                <Chip 
                  size="small"
                  icon={<FilterIcon fontSize="small" />}
                  label={selectedCategories.includes(params.group as any) ? 
                    t('search.filterActive') : 
                    t('search.filterInactive')}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryFilter(params.group as any);
                  }}
                  color={selectedCategories.includes(params.group as any) ? "primary" : "default"}
                  sx={{ ml: 1, cursor: 'pointer' }}
                />
              )}
            </Typography>
            {params.children}
          </div>
        )}
        PaperComponent={(props: PaperProps) => (
          <Paper 
            elevation={6} 
            {...props} 
            sx={{ 
              maxHeight: '60vh',
              mt: 1,
              overflow: 'hidden',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              ...(props.sx || {})
            }} 
          />
        )}
      />
      {/* Display active filters if any */}
      {selectedCategories.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedCategories.map(category => (
            <Chip
              key={category}
              size="small"
              label={t(`search.categories.${category}`)}
              icon={getCategoryIcon(category)}
              onDelete={() => toggleCategoryFilter(category)}
              color="primary"
              variant="outlined"
            />
          ))}
          <Chip
            size="small"
            label={t('search.clearFilters')}
            onClick={() => setSelectedCategories([])}
            color="default"
          />
        </Box>
      )}
    </>
  );
};

export default GlobalSearch;