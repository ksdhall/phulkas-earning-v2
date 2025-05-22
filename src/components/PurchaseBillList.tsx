"use client";

import React, { useCallback } from 'react'; // Added useCallback
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';

interface PurchaseBill {
  id: string;
  date: string;
  amount: number;
  description: string;
  comments?: string | null;
}

interface PurchaseBillListProps {
  purchaseBills: PurchaseBill[];
  onEdit: (purchaseBillId: string) => void;
  onDelete: (purchaseBillId: string) => void;
}

const PurchaseBillList: React.FC<PurchaseBillListProps> = ({ purchaseBills, onEdit, onDelete }) => {
  const t = useTranslations('purchase_bill_list');
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatCurrency = useCallback((amount: number | string) => { // Using useCallback
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
  }, []);

  const handleDeleteClick = useCallback((billId: string) => { // Using useCallback
    onDelete(billId);
  }, [onDelete]);

  if (!purchaseBills || purchaseBills.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="body1">{tErrors('no_purchase_bills_found')}</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {isMobile ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {purchaseBills.map((pb) => (
            <Paper key={pb.id} elevation={2} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('date')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {format(parseISO(pb.date), 'yyyy-MM-dd')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('amount')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {formatCurrency(pb.amount)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('description')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium', textAlign: 'right', flexGrow: 1, ml: 1 }}>
                  {pb.description}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('comments')}:</Typography>
                <Typography component="span" variant="body1" color="text.primary" sx={{ fontWeight: 'medium', textAlign: 'right', flexGrow: 1, ml: 1 }}>
                  {pb.comments || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                <IconButton onClick={() => onEdit(pb.id.toString())} color="primary" aria-label={tGeneral('edit_button')}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(pb.id.toString())} color="error" aria-label={tGeneral('delete')}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </List>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="purchase bill list">
            <TableHead>
              <TableRow>
                <TableCell>{t('date')}</TableCell>
                <TableCell align="right">{t('amount')}</TableCell>
                <TableCell>{t('description')}</TableCell>
                <TableCell>{t('comments')}</TableCell>
                <TableCell align="center">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseBills.map((pb) => (
                <TableRow key={pb.id}>
                  <TableCell component="th" scope="row">
                    {format(parseISO(pb.date), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(pb.amount)}</TableCell>
                  <TableCell>{pb.description}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pb.comments || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => onEdit(pb.id.toString())} color="primary" aria-label={tGeneral('edit_button')}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(pb.id.toString())} color="error" aria-label={tGeneral('delete')}>
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

export default PurchaseBillList;
