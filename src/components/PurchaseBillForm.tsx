"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useCallback
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isValid } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { enUS, ja } from 'date-fns/locale';

interface PurchaseBill {
  id?: string;
  date: string;
  amount: number;
  description: string;
  comments?: string | null;
}

interface PurchaseBillFormProps {
  initialPurchaseBill?: PurchaseBill;
  onSubmit: (data: Omit<PurchaseBill, 'id'>, currentBillId?: string) => void;
  isSubmitting?: boolean;
  defaultDate?: Date;
  onCancel: () => void;
}

const PurchaseBillForm: React.FC<PurchaseBillFormProps> = ({
  initialPurchaseBill,
  onSubmit,
  isSubmitting,
  defaultDate,
  onCancel,
}) => {
  const t = useTranslations('purchase_bill_form');
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general');

  const router = useRouter();
  const locale = router.locale as string;

  const [date, setDate] = useState<Date | null>(
    initialPurchaseBill?.date ? parseISO(initialPurchaseBill.date) : (defaultDate || new Date())
  );
  const [amount, setAmount] = useState<number | ''>(initialPurchaseBill?.amount ?? 0);
  const [description, setDescription] = useState<string>(initialPurchaseBill?.description ?? '');
  const [comments, setComments] = useState<string>(initialPurchaseBill?.comments ?? '');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  useEffect(() => {
    if (initialPurchaseBill) {
      setDate(parseISO(initialPurchaseBill.date));
      setAmount(initialPurchaseBill.amount);
      setDescription(initialPurchaseBill.description);
      setComments(initialPurchaseBill.comments ?? '');
    } else if (defaultDate) {
      setDate(defaultDate);
      setAmount(0);
      setDescription('');
      setComments('');
    }
    setFormError(null);
    setErrors({});
  }, [initialPurchaseBill, defaultDate]);

  const validateForm = useCallback(() => { // Using useCallback
    const newErrors: { [key: string]: string } = {};

    if (!date || !isValid(date)) {
      newErrors.date = tErrors('invalid_date');
    }

    if (amount === '' || amount < 0) {
      newErrors.amount = tErrors('positive_number');
    }

    if (!description.trim()) {
      newErrors.description = tErrors('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [date, amount, description, tErrors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => { // Using useCallback
    e.preventDefault();

    if (!validateForm()) {
      setFormError(tGeneral('errors.form_validation_failed') || 'Please correct the errors in the form.');
      return;
    }
    setFormError(null);

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';

    const formData: Omit<PurchaseBill, 'id'> = {
      date: formattedDate,
      amount: Number(amount),
      description: description.trim(),
      comments: comments.trim() || null,
    };

    onSubmit(formData, initialPurchaseBill?.id);
  }, [date, amount, description, comments, onSubmit, initialPurchaseBill, validateForm, tGeneral]);

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
          slotProps={{ textField: { fullWidth: true, margin: "normal", error: !!errors.date, helperText: errors.date } }}
          format="yyyy-MM-dd"
        />
      </LocalizationProvider>

      <TextField
        label={t('amount_label')}
        value={amount}
        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
        fullWidth
        margin="normal"
        type="number"
        inputProps={{ min: 0 }}
        error={!!errors.amount}
        helperText={errors.amount}
      />

      <TextField
        label={t('description_label')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
        error={!!errors.description}
        helperText={errors.description}
      />

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
          {tGeneral('cancel')}
        </Button>
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : tGeneral('save')}
        </Button>
      </Box>
    </Box>
  );
};

export default PurchaseBillForm;
