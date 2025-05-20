"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle, Close } from '@mui/icons-material'; // Import icons
import { useTranslations } from 'next-intl';
import { Bill } from '@/types/Bill';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface BillListProps {
  bills: Bill[];
  fetchBills?: () => Promise<void>;
  showDateColumn?: boolean;
}

const BillList: React.FC<BillListProps> = ({ bills, fetchBills, showDateColumn = true }) => {
  const t = useTranslations('bill_list');
  const tMealType = useTranslations('meal_type');
  const tEdit = useTranslations('edit');
  const tErrors = useTranslations('errors');

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  const formatCurrency = (amount: number) => {
    const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `¥${numericAmount.toLocaleString()}`;
  };

  const handleDeleteClick = (bill: Bill) => {
    setBillToDelete(bill);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setBillToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bills/${billToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(tEdit('delete_bill_error', { error: response.statusText }));
      }

      if (fetchBills) {
        await fetchBills();
      }
      handleCloseDeleteConfirm();
    } catch (err: any) {
      console.error('Failed to delete bill:', err);
      setError(err.message || tErrors('failed_fetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (billId: string) => {
    router.push(`/en/edit/${billId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!bills || bills.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="body1">{tEdit('bill_not_found')}</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} elevation={3}>
      <Table sx={{ minWidth: 650 }} aria-label="bill list">
        <TableHead>
          <TableRow>
            {showDateColumn && <TableCell>{t('date')}</TableCell>}
            <TableCell>{t('column_time')}</TableCell>
            <TableCell>{t('meal_type')}</TableCell>
            <TableCell align="right">{t('food_amount')}</TableCell>
            <TableCell align="right">{t('drink_amount')}</TableCell>
            <TableCell align="center">{t('is_our_food')}</TableCell> {/* Centered "Our Food" */}
            <TableCell align="right">{t('num_people_working')}</TableCell>
            <TableCell align="center">{t('actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              {showDateColumn && (
                <TableCell component="th" scope="row">
                  {format(bill.date, 'yyyy-MM-dd')}
                </TableCell>
              )}
              <TableCell>
                {bill.mealType === 'lunch' ? t('time_lunch') : t('time_dinner')}
              </TableCell>
              <TableCell>{tMealType(bill.mealType)}</TableCell>
              <TableCell align="right">{formatCurrency(bill.foodAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(bill.drinkAmount)}</TableCell>
              <TableCell align="center"> {/* Centered "Our Food" */}
                {bill.isOurFood ? (
                  <CheckCircle color="success" />
                ) : (
                  <Close color="error" />
                )}
              </TableCell>
              <TableCell align="right">
                {bill.mealType === 'dinner' ? (bill.numberOfPeopleWorkingDinner || '-') : '-'}
              </TableCell>
              <TableCell align="center">
                <IconButton onClick={() => handleEditClick(bill.id)} color="primary"> {/* Blue Edit */}
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(bill)} color="error"> {/* Red Delete */}
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{tEdit('delete_confirm_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {tEdit('delete_confirm_message', { id: billToDelete?.id || 'N/A' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} color="primary" disabled={loading}>
            {tEdit('cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : tEdit('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

export default BillList;
