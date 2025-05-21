"use client";

import React, { useState } from 'react';
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
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Grid, // Still useful for the overall card structure, but less for internal elements
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle, Close } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { Bill } from '@/types/Bill';
import { format } from 'date-fns';

interface BillListProps {
  bills: Bill[];
  onEdit: (billId: string) => void;
  onDelete: (billId: number) => void;
  showDateColumn?: boolean;
}

const BillList: React.FC<BillListProps> = ({ bills, onEdit, onDelete, showDateColumn = true }) => {
  const t = useTranslations('bill_list');
  const tMealType = useTranslations('meal_type');
  const tEdit = useTranslations('edit');
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // True for screens smaller than 'sm'

  // Delete confirmation states (BillList handles its own dialog for confirmation)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [billToDeleteId, setBillToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteClick = (billId: number) => {
    setBillToDeleteId(billId);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setBillToDeleteId(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (billToDeleteId === null) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(billToDeleteId);
      handleCloseDeleteConfirm();
    } catch (err: any) {
      console.error('BillList: Error during delete confirmation:', err);
      setDeleteError(err.message || tErrors('failed_fetch'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!bills || bills.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="body1">{tErrors('bill_not_found')}</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {isMobile ? (
        // Mobile View: Render as a list of cards
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {bills.map((bill) => (
            <Paper key={bill.id} elevation={2} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
              {showDateColumn && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{t('date')}:</Typography>
                  <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                    {format(new Date(bill.date), 'yyyy-MM-dd')}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('meal_type')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {tMealType(bill.mealType)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('food_amount')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {formatCurrency(bill.foodAmount)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('drink_amount')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {formatCurrency(bill.drinkAmount)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('is_our_food')}:</Typography>
                {bill.isOurFood ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Close color="error" fontSize="small" />
                )}
              </Box>

              {bill.mealType === 'dinner' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{t('num_people_working')}:</Typography>
                  <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                    {bill.numberOfPeopleWorkingDinner || '-'}
                  </Typography>
                </Box>
              )}
              
              {/* Actions row, always at the bottom, consistently aligned */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                <IconButton onClick={() => onEdit(bill.id.toString())} color="primary" aria-label={tEdit('edit')}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(bill.id)} color="error" aria-label={tEdit('delete')}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </List>
      ) : (
        // Desktop View: Render as a traditional table
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }} aria-label="bill list">
            <TableHead>
              <TableRow>
                {showDateColumn && <TableCell>{t('date')}</TableCell>}
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
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog - Centralized here */}
      <Dialog
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{tEdit('delete_confirm_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {tEdit('delete_confirm_message', { id: billToDeleteId ?? '' })}
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} disabled={isDeleting}>{tEdit('cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : tEdit('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillList;
