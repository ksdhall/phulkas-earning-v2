"use client";

import React from 'react'; // Removed useState as internal dialog states are gone
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
} from '@mui/material'; // Removed Dialog, DialogActions, etc.
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle, Close } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { Bill } from '@/types/Bill';
import { format } from 'date-fns';

interface BillListProps {
  bills: Bill[];
  onEdit: (billId: string) => void; // Callback for edit action
  onDelete: (billId: number) => void; // Callback for delete action (now directly triggers parent's dialog)
  showDateColumn?: boolean; // To hide date column if already in a date-grouped context
}

const BillList: React.FC<BillListProps> = ({ bills, onEdit, onDelete, showDateColumn = true }) => {
  const t = useTranslations('bill_list');
  const tMealType = useTranslations('meal_type');
  const tEdit = useTranslations('edit'); // For edit/delete button labels
  const tErrors = useTranslations('errors'); // For fallback message
  const tGeneral = useTranslations('general'); // For Yes/No translations

  // Helper for formatting currency
  const formatCurrency = (amount: number | string) => {
    let numericAmount: number;

    if (typeof amount === 'string') {
      const cleanedString = amount.replace(/[¥,]/g, '');
      numericAmount = Number(cleanedString);
    } else {
      numericAmount = amount;
    }

    if (isNaN(numericAmount)) {
      numericAmount = 0;
    }

    return `¥${numericAmount.toLocaleString()}`;
  };

  // The handleDeleteClick now directly calls the onDelete prop
  const handleDeleteClick = (billId: number) => {
    onDelete(billId);
  };

  if (!bills || bills.length === 0) {
    // This message should ideally be handled by the parent component (DashboardPageClient)
    // to avoid redundancy and ensure consistent messaging.
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="body1">{tErrors('bill_not_found')}</Typography> {/* Using errors.bill_not_found */}
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
            <TableCell align="center">{t('is_our_food')}</TableCell>
            <TableCell align="right">{t('num_people_working')}</TableCell>
            <TableCell align="center">{t('actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              {showDateColumn && (
                <TableCell component="th" scope="row">
                  {format(new Date(bill.date), 'yyyy-MM-dd')}
                </TableCell>
              )}
              <TableCell>
                {bill.mealType === 'lunch' ? t('time_lunch') : t('time_dinner')}
              </TableCell>
              <TableCell>{tMealType(bill.mealType)}</TableCell>
              <TableCell align="right">{formatCurrency(bill.foodAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(bill.drinkAmount)}</TableCell>
              <TableCell align="center">
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
                <IconButton onClick={() => onEdit(bill.id.toString())} color="primary" aria-label={tEdit('edit')}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(bill.id)} color="error" aria-label={tEdit('delete')}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Removed the internal Delete Confirmation Dialog from here */}
    </TableContainer>
  );
};

export default BillList;
