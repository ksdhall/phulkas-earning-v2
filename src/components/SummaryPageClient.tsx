"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Paper,
  Grid
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { calculateRangeSummary, calculateDailySummariesForRange, DailySummary } from '@/lib/calculations';
import DailySummaryCard from './DailySummaryCard';
import BillList from './BillList';

interface SummaryPageClientProps {
  locale: string;
  initialBills: any[];
  initialFromDate?: string;
  initialToDate?: string;
  initialError?: string | null;
}

const SummaryPageClient: React.FC<SummaryPageClientProps> = ({
  locale,
  initialBills,
  initialFromDate,
  initialToDate,
  initialError,
}) => {
  const t = useTranslations('summary');
  const tDateFilter = useTranslations('date_range_filter');
  const tErrors = useTranslations('errors');
  const tGeneral = useTranslations('general');

  const router = useRouter();
  const searchParams = useSearchParams();

  const [bills, setBills] = useState(initialBills);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [fromDate, setFromDate] = useState<string>(initialFromDate || '');
  const [toDate, setToDate] = useState<string>(initialToDate || '');

  const formatCurrency = useCallback((amount: number | string) => {
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
    return `${tGeneral('currency')}${numericAmount.toLocaleString()}`;
  }, [tGeneral]);


  const rangeSummary = useMemo(() => {
    return calculateRangeSummary(bills);
  }, [bills]);

  const dailySummariesForRange = useMemo(() => {
    return calculateDailySummariesForRange(bills);
  }, [bills]);

  useEffect(() => {
    setBills(initialBills);
    setFromDate(initialFromDate || '');
    setToDate(initialToDate || '');
    setError(initialError);
  }, [initialBills, initialFromDate, initialToDate, initialError]);

  const fetchBills = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/reports?from=${from}&to=${to}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tErrors('failed_fetch'));
      }
      const data = await res.json();
      const processedBills = data.bills.map((bill: any) => ({
        ...bill,
        date: format(new Date(bill.date), 'yyyy-MM-dd'),
        mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: bill.isOurFood ?? true,
        numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));
      setBills(processedBills);
    } catch (err: any) {
      console.error("Error fetching bills for summary range:", err);
      setError(err.message || tErrors('failed_fetch'));
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [locale, tErrors]);

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      setError(tDateFilter('dates_not_selected'));
      return;
    }

    const fromDateObj = parseISO(fromDate);
    const toDateObj = parseISO(toDate);

    if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
      setError(tDateFilter('invalid_date_format'));
      return;
    }
    if (fromDateObj > toDateObj) {
      setError(tDateFilter('from_date_after_to_date'));
      return;
    }

    setError(null);
    router.push(`/${locale}/summary?from=${fromDate}&to=${toDate}`);
  };

  const handleDeleteBill = useCallback(async (billId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/bills/${billId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tErrors('failed_fetch'));
      }
      if (fromDate && toDate) {
        await fetchBills(fromDate, toDate);
      } else {
        const defaultToDate = format(new Date(), 'yyyy-MM-dd');
        const defaultFromDate = format(new Date(new Date().setDate(new Date().getDate() - 6)), 'yyyy-MM-dd');
        await fetchBills(defaultFromDate, defaultToDate);
      }
    } catch (err: any) {
      console.error("Error deleting bill from summary:", err);
      setError(err.message || tErrors('failed_fetch'));
    } finally {
      setLoading(false);
    }
  }, [locale, fromDate, toDate, fetchBills, tErrors]);

  const handleEditBill = useCallback((billId: string) => {
     router.push(`/${locale}/dashboard?editBillId=${billId}`);
  }, [router, locale]);


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>{t('title')}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}

      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>{t('filter_title')}</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} sm={5}>
            <TextField
              label={tDateFilter('from_date')}
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid xs={12} sm={5}>
            <TextField
              label={tDateFilter('to_date')}
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid xs={12} sm={2}>
            <Button variant="contained" onClick={handleApplyFilter} fullWidth>
              {tDateFilter('apply_filter')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {!loading && bills.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            {t('summary_for_range', {
              fromDate: fromDate || tGeneral('not_selected'),
              toDate: toDate || tGeneral('not_selected')
            })}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              {t('total_food', { amount: formatCurrency(rangeSummary.lunch.rawFoodTotal) })}
            </Typography>
            <Typography variant="body1">
              {t('total_drinks', { amount: formatCurrency(rangeSummary.lunch.rawDrinkTotal) })}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
              {t('phulkas_total_earnings', { amount: formatCurrency(rangeSummary.dayTotalEarnings) })}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {t('total_lunch_earnings_range', { amount: formatCurrency(rangeSummary.lunch.phulkasEarnings) })}
            </Typography>
            <Typography variant="body1">
              {t('total_dinner_earnings_range', { amount: formatCurrency(rangeSummary.dinner.phulkasEarnings) })}
            </Typography>
          </Box>
        </Paper>
      )}

      {!loading && bills.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            {t('entries_in_range', { count: dailySummariesForRange.length })}
          </Typography>
          {dailySummariesForRange.map((dailyEntry) => (
            <DailySummaryCard
              key={dailyEntry.date}
              date={dailyEntry.date}
              summary={dailyEntry.summary}
            />
          ))}

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            {t('all_bills_in_range')}
          </Typography>
          <BillList
            bills={bills}
            onEdit={handleEditBill}
            onDelete={handleDeleteBill}
            showDateColumn={true}
          />
        </>
      )}

      {!loading && bills.length === 0 && !error && (
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          {t('no_bills_found')}
        </Typography>
      )}
    </Box>
  );
};

export default SummaryPageClient;
