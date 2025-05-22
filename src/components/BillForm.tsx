"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isValid } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Bill } from '@/types/Bill';
import { enUS, ja } from 'date-fns/locale';

interface BillFormProps {
  billId?: string;
  initialBill?: Bill;
  onSubmit: (data: Omit<Bill, 'id'>, currentBillId?: string) => void;
  isSubmitting?: boolean;
  defaultDate?: Date;
}

const BillForm: React.FC<BillFormProps> = ({ billId, initialBill, onSubmit, isSubmitting, defaultDate }) => {
  const t = useTranslations('bill_form');
  const tMealType = useTranslations('meal_type');
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general');

  const router = useRouter();
  const locale = router.locale as string;

  const [date, setDate] = useState<Date | null>(
    initialBill?.date ? parseISO(initialBill.date) : (defaultDate || new Date())
  );
  const [foodAmount, setFoodAmount] = useState<number | ''>(initialBill?.foodAmount ?? 0);
  const [drinkAmount, setDrinkAmount] = useState<number | ''>(initialBill?.drinkAmount ?? 0);
  const [mealType, setMealType] = useState<Bill['mealType']>(initialBill?.mealType ?? 'lunch');
  const [isOurFood, setIsOurFood] = useState<boolean>(initialBill?.isOurFood ?? true);
  const [numberOfPeopleWorkingDinner, setNumberOfPeopleWorkingDinner] = useState<number | ''>(initialBill?.numberOfPeopleWorkingDinner ?? 1);
  const [comments, setComments] = useState<string>(initialBill?.comments ?? '');
  const [error, setError] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const dateFnsLocale = React.useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  useEffect(() => {
    if (initialBill) {
      setDate(parseISO(initialBill.date));
      setFoodAmount(initialBill.foodAmount);
      setDrinkAmount(initialBill.drinkAmount);
      setMealType(initialBill.mealType);
      setIsOurFood(initialBill.isOurFood);
      setNumberOfPeopleWorkingDinner(initialBill.numberOfPeopleWorkingDinner);
      setComments(initialBill.comments || ''); 
      setFormError(null);
    } else {
      setDate(defaultDate || new Date());
      setFoodAmount(0);
      setDrinkAmount(0);
      setMealType('lunch');
      setIsOurFood(true);
      setNumberOfPeopleWorkingDinner(1);
      setComments('');
      setFormError(null);
    }
  }, [initialBill, defaultDate]);

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

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const finalFoodAmount = foodAmount === '' ? 0 : foodAmount;
    const finalDrinkAmount = drinkAmount === '' ? 0 : drinkAmount;
    const finalNumPeople = numberOfPeopleWorkingDinner === '' ? 1 : numberOfPeopleWorkingDinner;

    if (mealType === 'dinner' && finalNumPeople < 1) {
      setFormError(t('num_people_min'));
      return;
    }

    const dateAsString = date ? format(date, 'yyyy-MM-dd') : '';

    const formDataToSend: Omit<Bill, 'id'> = {
      date: dateAsString,
      mealType,
      foodAmount: finalFoodAmount,
      drinkAmount: finalDrinkAmount,
      isOurFood,
      numberOfPeopleWorkingDinner: finalNumPeople,
      comments: comments,
    };

    await onSubmit(formDataToSend, billId);
  }, [date, foodAmount, drinkAmount, mealType, isOurFood, numberOfPeopleWorkingDinner, comments, onSubmit, billId, t]);

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
      {formError && <Alert severity="error">{formError}</Alert>}

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
        <DatePicker
          label={t('date_label')}
          value={date}
          onChange={(newValue) => setDate(newValue)}
          slotProps={{ textField: { fullWidth: true, required: true, InputLabelProps: { shrink: true } } }}
        />
      </LocalizationProvider>

      <FormControl fullWidth required>
        <InputLabel id="meal-type-label">{t('meal_type_label')}</InputLabel>
        <Select
          labelId="meal-type-label"
          value={mealType}
          label={t('meal_type_label')}
          onChange={(e) => setMealType(e.target.value as Bill['mealType'])}
        >
          <MenuItem value="lunch">{tMealType('lunch')}</MenuItem>
          <MenuItem value="dinner">{tMealType('dinner')}</MenuItem>
        </Select>
      </FormControl>

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

      <TextField
        label={t('comments_label')} // Use the correct translation key
        multiline
        rows={3}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        fullWidth
        InputLabelProps={{ shrink: true }} // CRITICAL FIX: Ensure label shrinks for multiline
      />

      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ mt: 2 }}>
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (billId ? t('save_button') : tGeneral('add'))}
      </Button>
    </Box>
  );
};

export default BillForm;
