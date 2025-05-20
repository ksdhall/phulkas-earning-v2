"use client";

import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { Box, TextField, Grid, Typography, Alert } from '@mui/material'; // Removed Button
import { useTranslations } from 'next-intl';
import { format, isValid, parseISO, isAfter } from 'date-fns';

export interface DateRangeFilterProps {
  onApplyFilter: (fromDate: string, toDate: string) => void; // Only onApplyFilter
  fromDate: string;
  toDate: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onApplyFilter,
  fromDate,
  toDate
}) => {
  const t = useTranslations('date_range_filter');
  const tSummary = useTranslations('summary');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Internal state for the text fields, so validation can happen on change
  const [internalFromDate, setInternalFromDate] = useState(fromDate);
  const [internalToDate, setInternalToDate] = useState(toDate);

  // Keep internal state in sync with external props
  useEffect(() => {
    setInternalFromDate(fromDate);
    setInternalToDate(toDate);
  }, [fromDate, toDate]);

  // Effect to apply filter whenever internalFromDate or internalToDate changes
  useEffect(() => {
    setErrorMessage(null); // Clear previous errors

    // Only attempt to apply if both dates are selected
    if (!internalFromDate || !internalToDate) {
        // setErrorMessage(t('dates_not_selected')); // Optionally show this error if not selected
        return; // Don't apply filter if dates are not fully selected
    }

    const parsedFromDate = parseISO(internalFromDate);
    const parsedToDate = parseISO(internalToDate);

    if (!isValid(parsedFromDate) || !isValid(parsedToDate)) {
      setErrorMessage(t('invalid_date_format'));
      return;
    }

    if (isAfter(parsedFromDate, parsedToDate)) {
      setErrorMessage(t('from_date_after_to_date'));
      return;
    }

    // If validation passes, immediately apply filter
    onApplyFilter(internalFromDate, internalToDate);
  }, [internalFromDate, internalToDate, onApplyFilter, t]); // Add t as dependency

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>{tSummary('filter_title')}</Typography>
      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      <Grid
        container
        spacing={2}
        alignItems="center"
      >
        <Grid item xs={12} sm={6}> {/* Allocate space for From Date */}
          <TextField
            label={t('from_date')}
            type="date"
            value={internalFromDate}
            onChange={(e) => setInternalFromDate(e.target.value)} // Update internal state
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}> {/* Allocate space for To Date */}
          <TextField
            label={t('to_date')}
            type="date"
            value={internalToDate}
            onChange={(e) => setInternalToDate(e.target.value)} // Update internal state
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DateRangeFilter;
