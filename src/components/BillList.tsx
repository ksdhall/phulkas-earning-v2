// src/components/BillList.tsx
"use client";

import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper'; // Correct import
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';


import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Bill } from '@/types/Bill';


interface BillListProps {
  bills: Bill[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const BillList: React.FC<BillListProps> = ({ bills, onEdit, onDelete }) => {
  const tBillList = useTranslations('bill_list');


  return (
    <Box sx={{ overflowX: 'auto', width: '100%' }}>
      <TableContainer component={Paper}> {/* Corrected casing */}
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '100px' }}>{tBillList('date')}</TableCell>
              <TableCell sx={{ width: '80px' }}>{tBillList('column_time')}</TableCell>
              <TableCell align="right" sx={{ width: '80px' }}>{tBillList('food_amount')}</TableCell>
              <TableCell align="right" sx={{ width: '80px' }}>{tBillList('drink_amount')}</TableCell>
               <TableCell sx={{ width: '80px', textAlign: 'center' }}>{tBillList('is_our_food')}</TableCell>
               <TableCell align="right" sx={{ width: '80px' }}>{tBillList('people_working')}</TableCell>
              <TableCell align="right" sx={{ width: '100px' }}>{tBillList('total_amount')}</TableCell>
              <TableCell align="center" sx={{ width: '100px' }}>{tBillList('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>{format(bill.date instanceof Date ? bill.date : new Date(bill.date), 'yyyy-MM-dd')}</TableCell>
                <TableCell>
                   {bill.mealType === 'lunch' ? tBillList('time.lunch') : tBillList('time.dinner')}
                </TableCell>
                <TableCell align="right">¥{bill.foodAmount.toFixed(2)}</TableCell>
                <TableCell align="right">¥{bill.drinkAmount.toFixed(2)}</TableCell>
                 <TableCell sx={{ textAlign: 'center' }}>
                     {bill.mealType === 'dinner' ? (
                         bill.isOurFood ? (
                             <CheckCircleOutlineIcon color="success" fontSize="small" />
                         ) : (
                             <HighlightOffIcon color="error" fontSize="small" />
                         )
                     ) : (
                         '-'
                     )}
                 </TableCell>
                 <TableCell align="right">
                    {bill.mealType === 'dinner' ? (bill.numberOfPeopleWorkingDinner ?? 1) : '-'}
                 </TableCell>
                <TableCell align="right">¥{(bill.foodAmount + bill.drinkAmount).toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => onEdit(bill.id)} aria-label={tBillList('edit')}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(bill.id)} aria-label={tBillList('delete')}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BillList;
