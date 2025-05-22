"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react'; // Added useCallback
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, IconButton, DialogActions, DialogContentText, Paper,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PurchaseBillForm from '@/components/PurchaseBillForm';
import PurchaseBillList from '@/components/PurchaseBillList';
import { useTranslations } from 'next-intl';
import { format, parseISO, isValid, startOfMonth, endOfMonth } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS, ja } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface PurchaseBill {
  id: string;
  date: string;
  amount: number;
  description: string;
  comments?: string | null;
}

const PurchasesPageClient: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const t = useTranslations('purchases_page');
  const tGeneral = useTranslations('general');
  const tPurchaseBillForm = useTranslations('purchase_bill_form');
  const tEdit = useTranslations('edit');
  const tErrors = useTranslations('errors');

  const theme = useTheme();

  const [allPurchaseBills, setAllPurchaseBills] = useState<PurchaseBill[]>([]);
  const [filteredPurchaseBills, setFilteredPurchaseBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchaseBill, setEditingPurchaseBill] = useState<PurchaseBill | undefined>(undefined);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [purchaseBillToDeleteId, setPurchaseBillToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  const fetchPurchaseBills = useCallback(async (from?: Date | null, to?: Date | null) => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let url = `/${locale}/api/purchase-bills`;
    const queryParams = new URLSearchParams();

    if (from && isValid(from)) {
      queryParams.append('from', format(from, 'yyyy-MM-dd'));
    }
    if (to && isValid(to)) {
      queryParams.append('to', format(to, 'yyyy-MM-dd'));
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tErrors('failed_fetch'));
      }
      const data: PurchaseBill[] = await res.json();
      const processedData = data.map(pb => ({
        ...pb,
        date: format(new Date(pb.date), 'yyyy-MM-dd'),
        amount: parseFloat(pb.amount.toString()),
        comments: pb.comments ?? null
      }));
      setAllPurchaseBills(processedData);
      setFilteredPurchaseBills(processedData);
    } catch (err: any) {
      setError(err.message || tErrors('failed_fetch'));
      setAllPurchaseBills([]);
      setFilteredPurchaseBills([]);
    } finally {
      setLoading(false);
    }
  }, [status, locale, tErrors]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push(`/${locale}`);
    } else {
      fetchPurchaseBills(startDate, endDate);
    }
  }, [status, router, locale, fetchPurchaseBills, startDate, endDate]);

  const totalPurchaseAmount = useMemo(() => {
    return filteredPurchaseBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [filteredPurchaseBills]);

  const chartData = useMemo(() => {
    const groupedData: { [key: string]: number } = {};
    filteredPurchaseBills.forEach(bill => {
      const dateKey = format(parseISO(bill.date), 'yyyy-MM-dd');
      groupedData[dateKey] = (groupedData[dateKey] || 0) + bill.amount;
    });

    const dataArray = Object.keys(groupedData).sort().map(date => ({
      date,
      amount: groupedData[date],
    }));
    return dataArray;
  }, [filteredPurchaseBills]);


  const handleCloseModal = useCallback(() => { // Using useCallback
    setIsModalOpen(false);
    setEditingPurchaseBill(undefined);
    setError(null);
  }, []);

  const handleOpenAddModal = useCallback(() => { // Using useCallback
    setEditingPurchaseBill(undefined);
    setIsModalOpen(true);
    setIsModalLoading(false);
  }, []);

  const handleOpenEditModal = useCallback(async (purchaseBillId: string) => { // Using useCallback
    setIsModalOpen(true);
    setIsModalLoading(true);
    try {
      const response = await fetch(`/${locale}/api/purchase-bills/${purchaseBillId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || tErrors('failed_fetch'));
      }
      const data: PurchaseBill = await response.json();
      const formattedData = {
        ...data,
        date: format(new Date(data.date), 'yyyy-MM-dd'),
        amount: parseFloat(data.amount.toString()),
        comments: data.comments ?? null
      };
      setEditingPurchaseBill(formattedData);
    } catch (err: any) {
      setError(err.message || tErrors('failed_fetch'));
      handleCloseModal();
    } finally {
      setIsModalLoading(false);
    }
  }, [locale, tErrors, handleCloseModal]);

  const handlePurchaseBillFormSubmit = useCallback(async (formData: Omit<PurchaseBill, 'id'>, currentId?: string) => { // Using useCallback
    setIsModalLoading(true);
    setError(null);

    const method = currentId ? 'PUT' : 'POST';
    const url = currentId ? `/${locale}/api/purchase-bills/${currentId}` : `/${locale}/api/purchase-bills`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tErrors('failed_fetch'));
      }

      handleCloseModal();
      fetchPurchaseBills(startDate, endDate);

    } catch (err: any) {
      setError(err.message || (currentId ? tPurchaseBillForm('edit_error') : tPurchaseBillForm('add_error')));
    } finally {
      setIsModalLoading(false);
    }
  }, [locale, tErrors, tPurchaseBillForm, handleCloseModal, fetchPurchaseBills, startDate, endDate]);

  const handleOpenConfirmDelete = useCallback((id: string) => { // Using useCallback
    setPurchaseBillToDeleteId(id);
    setOpenConfirmDelete(true);
    setDeleteError(null);
  }, []);

  const handleCloseConfirmDelete = useCallback(() => { // Using useCallback
    setOpenConfirmDelete(false);
    setPurchaseBillToDeleteId(null);
    setDeleteError(null);
  }, []);

  const handleDeletePurchaseBill = useCallback(async () => { // Using useCallback
    if (purchaseBillToDeleteId === null) return;

    setOpenConfirmDelete(false);
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/${locale}/api/purchase-bills/${purchaseBillToDeleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tEdit('delete_bill_error', { error: '' }));
      }

      setPurchaseBillToDeleteId(null);
      fetchPurchaseBills(startDate, endDate);

    } catch (err: any) {
      setDeleteError(err.message || tErrors('failed_fetch'));
    } finally {
      setIsDeleting(false);
    }
  }, [purchaseBillToDeleteId, locale, tEdit, tErrors, fetchPurchaseBills, startDate, endDate]);

  const handleDateChange = useCallback((newStartDate: Date | null, newEndDate: Date | null) => { // Using useCallback
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      setError(tErrors('date_range_order'));
      return;
    }
    setError(null);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [tErrors]);


  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        {tGeneral('auth.unauthenticated')}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
      {isDeleting && <Alert severity="info" sx={{ mb: 2 }}>{tEdit('deleting')}</Alert>}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="contained" onClick={handleOpenAddModal}>
          {t('add_purchase_bill')}
        </Button>

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
          <DatePicker
            label={tGeneral('from_date')}
            value={startDate}
            onChange={(date) => handleDateChange(date, endDate)}
            slotProps={{ textField: { size: "small", error: !!error, helperText: error } }}
            format="yyyy-MM-dd"
          />
          <DatePicker
            label={tGeneral('to_date')}
            value={endDate}
            onChange={(date) => handleDateChange(startDate, date)}
            slotProps={{ textField: { size: "small", error: !!error, helperText: error } }}
            format="yyyy-MM-dd"
          />
        </LocalizationProvider>
      </Box>

      {/* Total Purchase Amount Display */}
      {!loading && (
        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('total_purchase_amount')}
          </Typography>
          <Typography variant="body1" color="primary">
            {tGeneral('currency')}{totalPurchaseAmount.toLocaleString()}
          </Typography>
        </Paper>
      )}

      {/* Bar Chart for Trend */}
      {!loading && chartData.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('daily_purchase_trend')}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${tGeneral('currency')}${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {filteredPurchaseBills.length > 0 ? (
        <PurchaseBillList
          purchaseBills={filteredPurchaseBills}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenConfirmDelete}
        />
      ) : (
        <Typography sx={{ mt: 2 }}>
          {t('no_purchase_bills')}
        </Typography>
      )}

      {/* Purchase Bill Form Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingPurchaseBill ? tPurchaseBillForm('edit_title') : tPurchaseBillForm('add_title')}
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PurchaseBillForm
            key={editingPurchaseBill?.id || 'add-purchase-bill-form'}
            initialPurchaseBill={editingPurchaseBill}
            onSubmit={handlePurchaseBillFormSubmit}
            isSubmitting={isModalLoading}
            defaultDate={startDate || new Date()}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog for Purchase Bills */}
      <Dialog
        open={openConfirmDelete}
        onClose={handleCloseConfirmDelete}
        aria-labelledby="purchase-delete-dialog-title"
        aria-describedby="purchase-delete-dialog-description"
      >
        <DialogTitle id="purchase-delete-dialog-title">{tEdit('delete_confirm_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="purchase-delete-dialog-description">
            {tEdit('delete_confirm_message', { id: purchaseBillToDeleteId ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDelete} disabled={isDeleting}>{tGeneral('cancel')}</Button>
          <Button onClick={handleDeletePurchaseBill} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={24} /> : tGeneral('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchasesPageClient;
