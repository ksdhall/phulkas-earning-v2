"use client";

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Bill } from '@/types/Bill';
import { format } from 'date-fns';

interface BillFormProps {
  billId?: string; // Optional: for editing existing bills
  initialBill?: Bill; // Data to pre-populate form when editing
  onSubmit: (formData: Omit<Bill, 'id'>, billId?: string) => Promise<void>; // Callback to parent
  isSubmitting: boolean; // Loading state from parent (for submit button)
}

const BillForm: React.FC<BillFormProps> = ({ billId, initialBill, onSubmit, isSubmitting }) => {
  const t = useTranslations('bill_form');
  const tMealType = useTranslations('meal_type');
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general');

  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [foodAmount, setFoodAmount] = useState<number | ''>(0);
  const [drinkAmount, setDrinkAmount] = useState<number | ''>(0);
  const [isOurFood, setIsOurFood] = useState<boolean>(true);
  const [numberOfPeopleWorkingDinner, setNumberOfPeopleWorkingDinner] = useState<number | ''>(1);

  const [formError, setFormError] = useState<string | null>(null); // Internal form validation error

  // Effect to populate form when initialBill data is provided (for editing)
  useEffect(() => {
    if (initialBill) {
      setDate(initialBill.date); // initialBill.date is already 'YYYY-MM-DD' string from parent
      setMealType(initialBill.mealType);
      setFoodAmount(initialBill.foodAmount);
      setDrinkAmount(initialBill.drinkAmount);
      setIsOurFood(initialBill.isOurFood ?? true);
      setNumberOfPeopleWorkingDinner(initialBill.numberOfPeopleWorkingDinner ?? 1);
    } else {
      // Reset form for adding new bill when initialBill is undefined
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setMealType('lunch');
      setFoodAmount(0);
      setDrinkAmount(0);
      setIsOurFood(true);
      setNumberOfPeopleWorkingDinner(1);
    }
    setFormError(null); // Clear errors on initial load/reset
  }, [initialBill]);


  const handleFoodAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFoodAmount('');
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setFoodAmount(numValue);
      }
    }
  };

  const handleDrinkAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDrinkAmount('');
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setDrinkAmount(numValue);
      }
    }
  };

  const handleNumberOfPeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setNumberOfPeopleWorkingDinner('');
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setNumberOfPeopleWorkingDinner(numValue);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); // Clear previous form errors

    const finalFoodAmount = foodAmount === '' ? 0 : foodAmount;
    const finalDrinkAmount = drinkAmount === '' ? 0 : drinkAmount;
    const finalNumPeople = numberOfPeopleWorkingDinner === '' ? 1 : numberOfPeopleWorkingDinner;

    if (mealType === 'dinner' && finalNumPeople < 1) {
      setFormError(t('num_people_min'));
      return;
    }

    // Convert date to a consistent ISO 8601 string (e.g., "2025-05-20T00:00:00.000Z")
    const dateAsISOString = new Date(`${date}T00:00:00`).toISOString();

    const formDataToSend: Omit<Bill, 'id'> = {
      date: dateAsISOString,
      mealType,
      foodAmount: finalFoodAmount,
      drinkAmount: finalDrinkAmount,
      isOurFood,
      numberOfPeopleWorkingDinner: finalNumPeople,
    };

    // Call the onSubmit prop passed from the parent
    // The parent (DashboardPageClient) is responsible for handling the API call (POST/PUT)
    await onSubmit(formDataToSend, billId);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        marginTop: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 500,
        margin: '0 auto',
        padding: 0,
        border: 'none',
        boxShadow: 'none',
      }}
    >
      {/* Title is now handled by parent DialogTitle */}
      {formError && <Alert severity="error">{formError}</Alert>}

      <TextField
        label={t('date_label')}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        fullWidth
        required
        InputLabelProps={{
          shrink: true,
        }}
      />

      <TextField
        select
        label={t('meal_type_label')}
        value={mealType}
        onChange={(e) => setMealType(e.target.value as 'lunch' | 'dinner')}
        fullWidth
        required
      >
        <MenuItem value="lunch">{tMealType('lunch')}</MenuItem>
        <MenuItem value="dinner">{tMealType('dinner')}</MenuItem>
      </TextField>

      <TextField
        label={t('food_amount_label')}
        type="number"
        value={foodAmount}
        onChange={handleFoodAmountChange}
        fullWidth
        inputProps={{ min: 0 }}
      />

      <TextField
        label={t('drink_amount_label')}
        type="number"
        value={drinkAmount}
        onChange={handleDrinkAmountChange}
        fullWidth
        inputProps={{ min: 0 }}
      />

      {mealType === 'dinner' && (
        <>
          <FormControlLabel
            control={
              <Checkbox
                checked={isOurFood}
                onChange={(e) => setIsOurFood(e.target.checked)}
                name="isOurFood"
                color="primary"
              />
            }
            label={t('is_our_food_label')}
          />
          <TextField
            label={t('num_people_working_label')}
            type="number"
            value={numberOfPeopleWorkingDinner}
            onChange={handleNumberOfPeopleChange}
            fullWidth
            inputProps={{ min: 1 }}
            error={mealType === 'dinner' && (numberOfPeopleWorkingDinner === '' || numberOfPeopleWorkingDinner < 1)}
            helperText={
              mealType === 'dinner' && (numberOfPeopleWorkingDinner === '' || numberOfPeopleWorkingDinner < 1)
                ? t('num_people_min')
                : ''
            }
          />
        </>
      )}

      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ mt: 2 }}>
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (billId ? t('save_button') : tGeneral('add'))}
      </Button>
      {/* Cancel button now just closes the modal, handled by parent's Dialog */}
      <Button type="button" variant="outlined" onClick={() => {
        // This button is typically for navigating back if BillForm was a standalone page.
        // In a modal context, the modal's onClose handles the "cancel" action.
        // If you want a specific "cancel" action here that is different from modal close,
        // you might need an additional prop for a cancel callback.
        // For now, it will navigate to dashboard, which will effectively close the modal.
        router.push(`/${locale}/dashboard`);
      }} disabled={isSubmitting}>
        {t('cancel_button')}
      </Button>
    </Box>
  );
};

export default BillForm;
