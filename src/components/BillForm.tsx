"use client";

import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Checkbox from '@mui/material/Checkbox'; // Import Checkbox
import FormControlLabel from '@mui/material/FormControlLabel'; // Import FormControlLabel
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress
import { useTranslations } from 'next-intl';
import { format, parseISO, isValid } from 'date-fns';

// Import the updated Bill interface
import { Bill } from '@/types/Bill';

interface BillFormProps {
  initialData?: Bill; // Optional initial data for editing
  onSubmit: (data: Omit<Bill, 'id'>) => void; // Form submits data without id
  isSubmitting?: boolean;
  error?: string | null;
}

const BillForm: React.FC<BillFormProps> = ({ initialData, onSubmit, isSubmitting, error }) => {
  const t = useTranslations('bill_form'); // Translations for the form
   // Use dashboard translations for meal type labels
   const tDashboard = useTranslations('dashboard');
   // Use general translations for 'Our Food' label if needed
   const tGeneral = useTranslations(); // Assuming general translations are accessible


  // State for form fields, using default values for new entry
  const [date, setDate] = useState(initialData?.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [foodAmount, setFoodAmount] = useState(initialData?.foodAmount?.toString() || '');
  const [drinkAmount, setDrinkAmount] = useState(initialData?.drinkAmount?.toString() || '');
  // FIX: Correctly initialize mealType from initialData (map Enum to string) or default to 'lunch'
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>(initialData?.mealType?.toLowerCase() as 'lunch' | 'dinner' || 'lunch');
  // State for isOurFood, default to true for dinner or based on initialData
  const [isOurFood, setIsOurFood] = useState(initialData?.isOurFood ?? true); // Default to true if not specified
  // State for number of people, default to 1 if dinner or based on initialData
  const [numberOfPeopleWorkingDinner, setNumberOfPeopleWorkingDinner] = useState(initialData?.numberOfPeopleWorkingDinner?.toString() || '1');


  // Effect to update form state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setDate(format(new Date(initialData.date), 'yyyy-MM-dd'));
      setFoodAmount(initialData.foodAmount?.toString() || '');
      setDrinkAmount(initialData.drinkAmount?.toString() || '');
      // FIX: Correctly update mealType state from initialData Enum
      setMealType(initialData.mealType?.toLowerCase() as 'lunch' | 'dinner' || 'lunch');
      setIsOurFood(initialData.isOurFood ?? true); // Update isOurFood state
      setNumberOfPeopleWorkingDinner(initialData.numberOfPeopleWorkingDinner?.toString() || '1');
    } else {
       // Reset to default values for a new entry
       setDate(format(new Date(), 'yyyy-MM-dd'));
       setFoodAmount('');
       setDrinkAmount('');
       setMealType('lunch'); // Default to lunch for new entry
       setIsOurFood(true); // Default isOurFood to true for new entry
       setNumberOfPeopleWorkingDinner('1'); // Default number of people to 1
    }
  }, [initialData]);


   // Handle meal type toggle change
   const handleMealTypeChange = (event: React.MouseEvent<HTMLElement>, newMealType: 'lunch' | 'dinner' | null) => {
       if (newMealType !== null) {
           setMealType(newMealType);
           // Reset number of people and isOurFood if switching to lunch (optional but good practice)
           if (newMealType === 'lunch') {
               setNumberOfPeopleWorkingDinner('1');
               setIsOurFood(true); // Assuming isOurFood is only relevant for dinner breakdown
           }
       }
   };

   // Handle isOurFood checkbox change
   const handleIsOurFoodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       setIsOurFood(event.target.checked);
   };


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!date) {
      alert(t('error_date_required'));
      return;
    }

    const parsedFoodAmount = parseFloat(foodAmount);
    if (isNaN(parsedFoodAmount) || parsedFoodAmount < 0) {
      alert(t('error_invalid_number', { field: t('food_amount') }));
      return;
    }

    const parsedDrinkAmount = parseFloat(drinkAmount);
     if (isNaN(parsedDrinkAmount) || parsedDrinkAmount < 0) {
      alert(t('error_invalid_number', { field: t('drink_amount') }));
      return;
    }

     let parsedNumberOfPeopleWorkingDinner = 1; // Default to 1

    // Validate number of people only if meal type is dinner
     if (mealType === 'dinner') {
         parsedNumberOfPeopleWorkingDinner = parseInt(numberOfPeopleWorkingDinner, 10);
         if (isNaN(parsedNumberOfPeopleWorkingDinner) || parsedNumberOfPeopleWorkingDinner < 1) {
             // Use translation key for this error message
             alert(tGeneral('errors.invalid_number_format', { field: tDashboard('number_of_people_working_dinner') })); // Use translation key
             return;
         }
     }


    // Prepare data for submission (omit id)
    const formData: Omit<Bill, 'id'> = {
      date: date, // Keep as 'yyyy-MM-dd' string for submission
      foodAmount: parsedFoodAmount,
      drinkAmount: parsedDrinkAmount,
      mealType: mealType, // Send the string 'lunch' or 'dinner'
      isOurFood: isOurFood, // Include isOurFood
      // Include numberOfPeopleWorkingDinner only if relevant (dinner)
      ...(mealType === 'dinner' && { numberOfPeopleWorkingDinner: parsedNumberOfPeopleWorkingDinner })
    };

    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {/* FIX: Correctly determine form title */}
      <Typography variant="h6" gutterBottom>
        {initialData ? t('edit_bill_entry') : t('add_bill_entry')}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="date"
            label={t('date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Meal Type Toggle */}
           <Box sx={{ mt: 1, mb: 2 }}> {/* Add some margin around toggle */}
                <Typography variant="caption" display="block" gutterBottom>{tDashboard('meal_type')}</Typography> {/* Add translation key */}
               <ToggleButtonGroup
                   value={mealType}
                   exclusive
                   onChange={handleMealTypeChange}
                   aria-label="meal type"
                   fullWidth
               >
                   {/* Use tDashboard for Lunch/Dinner labels */}
                   <ToggleButton value="lunch" aria-label="lunch">{tDashboard('lunch')}</ToggleButton>
                   <ToggleButton value="dinner" aria-label="dinner">{tDashboard('dinner')}</ToggleButton>
               </ToggleButtonGroup>
           </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="foodAmount"
            label={t('food_amount')}
            type="number"
            value={foodAmount}
            onChange={(e) => setFoodAmount(e.target.value)}
            inputProps={{ min: "0", step: "0.01" }} // Allow decimal and non-negative
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="drinkAmount"
            label={t('drink_amount')}
            type="number"
            value={drinkAmount}
            onChange={(e) => setDrinkAmount(e.target.value)}
             inputProps={{ min: "0", step: "0.01" }} // Allow decimal and non-negative
            required
          />
        </Grid>

        {/* Conditional Number of People Input */}
        {mealType === 'dinner' && (
             <> {/* Use Fragment to group multiple elements */}
                 <Grid item xs={12} md={6}>
                     <TextField
                        fullWidth
                        id="numberOfPeopleWorkingDinner"
                        label={tDashboard('number_of_people_working_dinner')} // Use translation key
                        type="number"
                        value={numberOfPeopleWorkingDinner}
                        onChange={(e) => setNumberOfPeopleWorkingDinner(e.target.value)}
                        inputProps={{ min: "1" }} // Ensure at least 1 person
                        required // Make required when visible
                     />
                 </Grid>
                 {/* Conditional Is Our Food Checkbox */}
                 <Grid item xs={12} md={6}>
                     <FormControlLabel
                         control={
                             <Checkbox
                                 checked={isOurFood}
                                 onChange={handleIsOurFoodChange}
                                 name="isOurFood"
                                 color="primary"
                             />
                         }
                         label="Is Our Food?" // Use translation key
                     />
                 </Grid>
             </>
        )}

      </Grid>

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <CircularProgress size={24} />
        ) : initialData ? t('update_bill') : t('add_bill')}
      </Button>
    </Box>
  );
};

export default BillForm;
