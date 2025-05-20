"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import DateRangeFilter from '@/components/DateRangeFilter'; // Updated import
import DailySummaryCard from '@/components/DailySummaryCard';
import BillList from '@/components/BillList';

import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

import { Bill } from '@/types/Bill';
import { calculateRangeSummary } from '@/lib/calculations';

const SummaryPageClient: React.FC = () => {
  const t = useTranslations('summary');
  const tErrors = useTranslations('errors');
  const params = useParams();
  const locale = params.locale as string;

  const initialFromDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const initialToDate = format(new Date(), 'yyyy-MM-dd'); // Default to today

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFromDate, setCurrentFromDate] = useState<string>(initialFromDate); // Renamed to avoid confusion with DateRangeFilter's internal state
  const [currentToDate, setCurrentToDate] = useState<string>(initialToDate); // Renamed to avoid confusion

  // Memoized calculation of range summary
  const rangeSummary = useMemo(() => {
    if (bills.length === 0) return null; // calculateRangeSummary already returns a default empty object
    return calculateRangeSummary(bills);
  }, [bills]);

  // Function to fetch bills based on date range - Wrapped in useCallback
  const fetchBills = useCallback(async (from: string, to: string) => {
    if (!from || !to) {
      setBills([]);
      // setError(tErrors('dates_not_selected_for_fetch')); // Optionally, if you want an error for empty fetch
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/${locale}/api/reports?from=${from}&to=${to}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tErrors('failed_fetch'));
      }
      const data = await res.json();

      const processedBills: Bill[] = data.bills.map((bill: any) => ({
        ...bill,
        date: new Date(bill.date),
        mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: bill.isOurFood ?? true,
        numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));
      setBills(processedBills);

    } catch (err: any) {
      console.error("Summary Page: Error fetching bills:", err);
      setError(err.message || tErrors('failed_fetch'));
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [locale, tErrors]);

  // This is the handler that DateRangeFilter will call when its internal dates change and are valid
  const handleApplyFilter = useCallback((from: string, to: string) => {
    setCurrentFromDate(from);
    setCurrentToDate(to);
    fetchBills(from, to);
  }, [fetchBills]);

  // Initial fetch on component mount with default dates
  useEffect(() => {
    fetchBills(currentFromDate, currentToDate);
  }, [currentFromDate, currentToDate, fetchBills]); // React to changes in currentFromDate/currentToDate

  // Placeholder for edit/delete handlers
  const handleEditBill = (id: number) => {
    console.log("Edit bill from summary:", id);
    // router.push(`/${locale}/edit/${id}`); // Uncomment if you have router here
  };

  const handleDeleteBill = (id: number) => {
    console.log("Delete bill from summary:", id);
    // Implement delete logic or open confirm dialog
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>{t('title')}</Typography>

      <DateRangeFilter
        fromDate={currentFromDate} // Pass current state
        toDate={currentToDate}   // Pass current state
        onApplyFilter={handleApplyFilter} // This is the only handler needed now
      />

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && rangeSummary && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('summary_for_range', {
              fromDate: currentFromDate,
              toDate: currentToDate
            })}
          </Typography>
          <DailySummaryCard summary={rangeSummary} />
        </Box>
      )}

      {!loading && bills.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>{t('entries_in_range', { count: bills.length })}</Typography>
          <BillList bills={bills} onEdit={handleEditBill} onDelete={handleDeleteBill} />
        </Box>
      ) : !loading && !bills.length && ( // Only show "no bills" if there are genuinely no bills after loading
        <Typography sx={{ mt: 2 }}>{t('no_bills_found')}</Typography>
      )}
    </Box>
  );
};

export default SummaryPageClient;
