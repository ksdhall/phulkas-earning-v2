"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useCallback
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
  onCancel: () => void;
}

const BillForm: React.FC<BillFormProps> = ({ billId, initialBill, onSubmit, isSubmitting, defaultDate, onCancel }) => {
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

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  useEffect(() => {
    if (initialBill) {
      setDate(parseISO(initialBill.date));
      setFoodAmount(initialBill.foodAmount);
      setDrinkAmount(initialBill.drinkAmount);
      setMealType(initialBill.mealType);
      setIsOurFood(initialBill.isOurFood);
      setNumberOfPeopleWorkingDinner(initialBill.numberOfPeopleWorkingDinner ?? 1);
      setComments(initialBill.comments ?? '');
    } else if (defaultDate) {
      setDate(defaultDate);
      setFoodAmount(0);
      setDrinkAmount(0);
      setMealType('lunch');
      setIsOurFood(true);
      setNumberOfPeopleWorkingDinner(1);
      setComments('');
    }
    setFormError(null);
    setError({});
  }, [initialBill, defaultDate]);

  const validateForm = useCallback(() => { // Using useCallback
    const newErrors: { [key: string]: string } = {};

    if (!date || !isValid(date)) {
      newErrors.date = tErrors('invalid_date');
    }

    if (foodAmount === '' || foodAmount < 0) {
      newErrors.foodAmount = tErrors('positive_number');
    }

    if (drinkAmount === '' || drinkAmount < 0) {
      newErrors.drinkAmount = tErrors('positive_number');
    }

    if (mealType === 'dinner' && (numberOfPeopleWorkingDinner === '' || numberOfPeopleWorkingDinner < 1)) {
      newErrors.numberOfPeopleWorkingDinner = t('num_people_min');
    }

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [date, foodAmount, drinkAmount, mealType, numberOfPeopleWorkingDinner, tErrors, t]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => { // Using useCallback
    e.preventDefault();

    if (!validateForm()) {
      setFormError(tGeneral('errors.form_validation_failed') || 'Please correct the errors in the form.');
      return;
    }
    setFormError(null);

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';

    const formData: Omit<Bill, 'id'> = {
      date: formattedDate,
      foodAmount: Number(foodAmount),
      drinkAmount: Number(drinkAmount),
      mealType,
      isOurFood,
      numberOfPeopleWorkingDinner: mealType === 'dinner' ? Number(numberOfPeopleWorkingDinner) : 1,
      comments: comments.trim() || null,
    };

    onSubmit(formData, billId);
  }, [date, foodAmount, drinkAmount, mealType, isOurFood, numberOfPeopleWorkingDinner, comments, onSubmit, billId, validateForm, tGeneral]);

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
        <DatePicker
          label={t('date_label')}
          value={date}
          onChange={(newDate) => setDate(newDate)}
          slotProps={{ textField: { fullWidth: true, margin: "normal", error: !!error.date, helperText: error.date } }}
          format="yyyy-MM-dd"
        />
      </LocalizationProvider>

      <FormControl fullWidth margin="normal" error={!!error.mealType}>
        <InputLabel id="meal-type-label">{t('meal_type_label')}</InputLabel>
        <Select
          labelId="meal-type-label"
          id="meal-type"
          value={mealType}
          label={t('meal_type_label')}
          onChange={(e) => setMealType(e.target.value as Bill['mealType'])}
        >
          <MenuItem value="lunch">{tMealType('lunch')}</MenuItem>
          <MenuItem value="dinner">{tMealType('dinner')}</MenuItem>
        </Select>
        {error.mealType && <FormHelperText>{error.mealType}</FormHelperText>}
      </FormControl>

      <TextField
        label={t('food_amount_label')}
        value={foodAmount}
        onChange={(e) => setFoodAmount(e.target.value === '' ? '' : Number(e.target.value))}
        fullWidth
        margin="normal"
        type="number"
        inputProps={{ min: 0 }}
        error={!!error.foodAmount}
        helperText={error.foodAmount}
      />

      <TextField
        label={t('drink_amount_label')}
        value={drinkAmount}
        onChange={(e) => setDrinkAmount(e.target.value === '' ? '' : Number(e.target.value))}
        fullWidth
        margin="normal"
        type="number"
        inputProps={{ min: 0 }}
        error={!!error.drinkAmount}
        helperText={error.drinkAmount}
      />

      {mealType === 'dinner' && (
        <>
          <FormControlLabel
            control={<Checkbox checked={isOurFood} onChange={(e) => setIsOurFood(e.target.checked)} />}
            label={t('is_our_food_label')}
          />
          <TextField
            label={t('num_people_working_label')}
            value={numberOfPeopleWorkingDinner}
            onChange={(e) => setNumberOfPeopleWorkingDinner(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            margin="normal"
            type="number"
            inputProps={{ min: 1 }}
            error={!!error.numberOfPeopleWorkingDinner}
            helperText={error.numberOfPeopleWorkingDinner}
          />
        </>
      )}

      <TextField
        label={t('comments_label')}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
        sx={{
          '& .MuiInputLabel-root': {
            transform: 'translate(14px, 14px) scale(1)',
          },
          '& .MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
          },
          '& .MuiOutlinedInput-root': {
            paddingTop: '18px',
          },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={onCancel} sx={{ mr: 2 }} disabled={isSubmitting}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : t('save_button')}
        </Button>
      </Box>
    </Box>
  );
};

export default BillForm;
