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
import { useRouter } from 'next/navigation';
import { Bill } from '@/types/Bill'; // Assuming this path is correct
import { format } from 'date-fns';

interface BillFormProps {
  billId?: string; // Optional: for editing existing bills
}

const BillForm: React.FC<BillFormProps> = ({ billId }) => {
  const t = useTranslations('bill_form');
  const tMealType = useTranslations('meal_type'); // For meal type options
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general'); // For 'Add' button

  const router = useRouter();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [foodAmount, setFoodAmount] = useState<number | ''>(0); // Initialize with 0 for better UX, or '' for truly empty
  const [drinkAmount, setDrinkAmount] = useState<number | ''>(0); // Initialize with 0 or ''
  const [isOurFood, setIsOurFood] = useState<boolean>(true);
  const [numberOfPeopleWorkingDinner, setNumberOfPeopleWorkingDinner] = useState<number | ''>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (billId) {
      setLoading(true);
      const fetchBill = async () => {
        try {
          const response = await fetch(`/api/bills/${billId}`);
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          const data: Bill = await response.json();
          setDate(format(new Date(data.date), 'yyyy-MM-dd'));
          setMealType(data.mealType);
          setFoodAmount(data.foodAmount);
          setDrinkAmount(data.drinkAmount);
          setIsOurFood(data.isOurFood ?? true); // Default to true
          setNumberOfPeopleWorkingDinner(data.numberOfPeopleWorkingDinner ?? 1); // Default to 1
        } catch (err: any) {
          setError(tErrors('failed_fetch') + `: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchBill();
    }
  }, [billId, tErrors]);

  const handleFoodAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFoodAmount(''); // Allow empty string
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
      setDrinkAmount(''); // Allow empty string
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
      setNumberOfPeopleWorkingDinner(''); // Allow empty string
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setNumberOfPeopleWorkingDinner(numValue);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    // FoodAmount and DrinkAmount are now non-mandatory, default to 0 if empty string
    const finalFoodAmount = foodAmount === '' ? 0 : foodAmount;
    const finalDrinkAmount = drinkAmount === '' ? 0 : drinkAmount;
    const finalNumPeople = numberOfPeopleWorkingDinner === '' ? 1 : numberOfPeopleWorkingDinner; // Default to 1 if empty

    if (mealType === 'dinner' && finalNumPeople < 1) {
      setError(t('num_people_min'));
      setLoading(false);
      return;
    }

    const billData = {
      date: new Date(date),
      mealType,
      foodAmount: finalFoodAmount,
      drinkAmount: finalDrinkAmount,
      isOurFood,
      numberOfPeopleWorkingDinner: finalNumPeople,
    };

    const method = billId ? 'PUT' : 'POST';
    const url = billId ? `/api/bills/${billId}` : '/api/bills';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      if (billId) {
        setSuccess(t('edit_success'));
      } else {
        setSuccess(t('add_success'));
        // Clear form for new entry
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setMealType('lunch');
        setFoodAmount(0);
        setDrinkAmount(0);
        setIsOurFood(true);
        setNumberOfPeopleWorkingDinner(1);
      }
      router.push('/en/dashboard'); // Redirect to dashboard after success
    } catch (err: any) {
      setError((billId ? t('edit_error') : t('add_error')) + `: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && billId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        marginTop: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 500,
        margin: '0 auto',
        padding: 3,
        border: '1px solid #ccc',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        {billId ? t('edit_title') : t('add_title')}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

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
        value={foodAmount} // Use number or ''
        onChange={handleFoodAmountChange}
        fullWidth
        inputProps={{ min: 0 }}
        // Removed `required`
      />

      <TextField
        label={t('drink_amount_label')}
        type="number"
        value={drinkAmount} // Use number or ''
        onChange={handleDrinkAmountChange}
        fullWidth
        inputProps={{ min: 0 }}
        // Removed `required`
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
            value={numberOfPeopleWorkingDinner} // Use number or ''
            onChange={handleNumberOfPeopleChange}
            fullWidth
            inputProps={{ min: 1 }}
            // No longer required, but validated to be >= 1 if it's dinner
            error={mealType === 'dinner' && (numberOfPeopleWorkingDinner === '' || numberOfPeopleWorkingDinner < 1)}
            helperText={
              mealType === 'dinner' && (numberOfPeopleWorkingDinner === '' || numberOfPeopleWorkingDinner < 1)
                ? t('num_people_min')
                : ''
            }
          />
        </>
      )}

      <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : (billId ? t('save_button') : tGeneral('add'))}
      </Button>
      <Button type="button" variant="outlined" onClick={() => router.push('/en/dashboard')} disabled={loading}>
        {t('cancel_button')}
      </Button>
    </Box>
  );
};

export default BillForm;