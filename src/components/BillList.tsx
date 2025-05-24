"use client";

import React from 'react'; // Removed useState as it's no longer needed for internal dialog
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
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Grid,
  // Removed Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, CircularProgress, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle, Close } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { Bill } from '@/types/Bill';
import { format, parseISO } from 'date-fns';

interface BillListProps {
  bills: Bill[];
  onEdit: (billId: string) => void;
  onDelete: (billId: string) => void; // This will now directly trigger the parent's dialog
  showDateColumn?: boolean;
}

const BillList: React.FC<BillListProps> = ({ bills, onEdit, onDelete, showDateColumn = true }) => {
  const t = useTranslations('bill_list');
  const tMealType = useTranslations('meal_type');
  // Removed tEdit, tErrors, tGeneral as they are no longer needed here for the dialog
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Removed internal state for delete confirmation dialog
  // const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  // const [billToDeleteId, setBillToDeleteId] = useState<string | null>(null);
  // const [isDeleting, setIsDeleting] = useState(false);
  // const [deleteError, setDeleteError] = useState<string | null>(null);

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
  const handleDeleteClick = (billId: string) => {
    onDelete(billId); // This will trigger the parent's (DashboardPageClient's) dialog
  };

  // Removed confirmDelete function as it's no longer needed

  if (!bills || bills.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="body1">{/* tErrors('bill_not_found') - Removed, parent handles */}</Typography>
        <Typography variant="body1">No bills found.</Typography> {/* Placeholder if parent doesn't handle */}
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {isMobile ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {bills.map((bill) => (
            <Paper key={bill.id} elevation={2} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
              {showDateColumn && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{t('date')}:</Typography>
                  <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                    {format(parseISO(bill.date), 'yyyy-MM-dd')}
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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('comments')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium', textAlign: 'right', flexGrow: 1, ml: 1 }}>
                  {bill.comments || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                <IconButton onClick={() => onEdit(bill.id.toString())} color="primary" aria-label={t('edit')}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(bill.id.toString())} color="error" aria-label={t('delete')}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </List>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="bill list">
            <TableHead>
              <TableRow>
                {showDateColumn && <TableCell>{t('date')}</TableCell>}
                <TableCell>{t('meal_type')}</TableCell>
                <TableCell align="right">{t('food_amount')}</TableCell>
                <TableCell align="right">{t('drink_amount')}</TableCell>
                <TableCell align="center">{t('is_our_food')}</TableCell>
                <TableCell align="right">{t('num_people_working')}</TableCell>
                <TableCell>{t('comments')}</TableCell>
                <TableCell align="center">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  {showDateColumn && (
                    <TableCell component="th" scope="row">
                      {format(parseISO(bill.date), 'yyyy-MM-dd')}
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
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bill.comments || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => onEdit(bill.id.toString())} color="primary" aria-label={t('edit')}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(bill.id.toString())} color="error" aria-label={t('delete')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BillList;
