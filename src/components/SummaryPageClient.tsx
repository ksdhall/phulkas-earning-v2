"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, isValid, subDays } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';

import { useRouter, usePathname } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import DailyBillSummary from './DailyBillSummary';
import { calculateDailySummariesForRange, DailySummary, calculateRangeSummary } from '@/lib/calculations'; // Import calculateRangeSummary
import { Bill } from '@/types/bill';
import { useAppConfig } from '@/context/AppConfigContext'; // Import useAppConfig

interface SummaryPageClientProps {
  locale: string;
  initialBills: Bill[];
  initialFromDate?: string;
  initialToDate?: string;
  initialError?: string | null;
}

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const SummaryPageClient: React.FC<SummaryPageClientProps> = ({
  locale,
  initialBills,
  initialFromDate,
  initialToDate,
  initialError,
}) => {
  const t = useTranslations('summary');
  const tGeneral = useTranslations('general');
  const tMealType = useTranslations('meal_type');
  const appConfig = useAppConfig(); // CRITICAL: Get app config from context

  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);

  const [fromDate, setFromDate] = useState<Date | null>(
    initialFromDate ? parseISO(initialFromDate) : subDays(new Date(), 6)
  );
  const [toDate, setToDate] = useState<Date | null>(
    initialToDate ? parseISO(initialToDate) : new Date()
  );
  
  const [selectedDailySummaryEntry, setSelectedDailySummaryEntry] = useState<{ date: string; summary: DailySummary } | null>(null);

  const dailyBillSummaryRef = useRef<HTMLDivElement>(null);

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  const dailySummariesForRange = useMemo(() => {
    return calculateDailySummariesForRange(bills, appConfig); // CRITICAL: Pass appConfig
  }, [bills, appConfig]);

  const totalEarningsForRange = useMemo(() => {
    const summary = calculateRangeSummary(bills, appConfig); // CRITICAL: Pass appConfig
    return summary.dayTotalEarnings;
  }, [bills, appConfig]);

  useEffect(() => {
    setBills(initialBills);
    setError(initialError);
    if (initialFromDate && isValid(parseISO(initialFromDate))) {
      setFromDate(parseISO(initialFromDate));
    } else {
      setFromDate(subDays(new Date(), 6));
    }
    if (initialToDate && isValid(parseISO(initialToDate))) {
      setToDate(parseISO(initialToDate));
    } else {
      setToDate(new Date());
    }
    setSelectedDailySummaryEntry(null); 
  }, [initialBills, initialError, initialFromDate, initialToDate]);


  const handleApplyFilter = useCallback(() => {
    setError(null);

    if (!fromDate || !isValid(fromDate) || !toDate || !isValid(toDate)) {
      setError(tGeneral('date_range_filter.dates_not_selected') || 'Please select both From and To dates.');
      return;
    }
    if (fromDate > toDate) {
      setError(tGeneral('date_range_filter.from_date_after_to_date') || 'From date cannot be after To date.');
      return;
    }

    const currentPath = pathname.replace(`/${locale}`, '');
    const query = new URLSearchParams();
    query.append('from', format(fromDate, 'yyyy-MM-dd'));
    query.append('to', format(toDate, 'yyyy-MM-dd'));
    
    router.push(`/${locale}${currentPath}?${query.toString()}`);
  }, [fromDate, toDate, pathname, router, locale, tGeneral]);

  const handleBarClick = useCallback((data: { date: string; fullDate: string; earnings: number }) => {
    const clickedFullDate = data.fullDate;
    const foundSummary = dailySummariesForRange.find(entry => entry.date === clickedFullDate);
    if (foundSummary) {
      setSelectedDailySummaryEntry(foundSummary);
      if (isMobile && dailyBillSummaryRef.current) {
        dailyBillSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setSelectedDailySummaryEntry(null);
      console.error('No daily summary found for clicked date:', clickedFullDate);
    }
  }, [dailySummariesForRange, isMobile]);

  const dailyEarningsData = useMemo(() => {
    const chartData = dailySummariesForRange
      .map(entry => {
        const parsedDate = parseISO(entry.date);
        if (!isValid(parsedDate)) {
          console.error('SummaryPageClient: Invalid date encountered:', entry.date);
          return null;
        }
        const formattedDate = format(parsedDate, 'MMM dd', { locale: dateFnsLocale });
        return {
          date: formattedDate,
          fullDate: entry.date,
          earnings: entry.summary.dayTotalEarnings,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    return chartData;
  }, [dailySummariesForRange, dateFnsLocale]);

  const mealTypeDistributionData = useMemo(() => {
    const mealTypeMap: { [key: string]: number } = {
      lunch: 0,
      dinner: 0,
    };
    bills.forEach(bill => {
      mealTypeMap[bill.mealType] += (bill.foodAmount + bill.drinkAmount);
    });

    const data = [];
    if (mealTypeMap.lunch > 0) {
      data.push({ name: tMealType('lunch'), value: mealTypeMap.lunch });
    }
    if (mealTypeMap.dinner > 0) {
      data.push({ name: tMealType('dinner'), value: mealTypeMap.dinner });
    }
    return data;
  }, [bills, tMealType]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('summary_title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
            <DatePicker
              label={tGeneral('from_date')}
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small', sx: { borderRadius: 2 } } }}
              format="yyyy-MM-dd"
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
            <DatePicker
              label={tGeneral('to_date')}
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small', sx: { borderRadius: 2 } } }}
              format="yyyy-MM-dd"
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilter}
            disabled={loading}
            fullWidth
            sx={{ height: '40px', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : tGeneral('apply_filter')}
          </Button>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {t('total_earnings')}
          </Typography>
          <Typography variant="h4" color="primary">
            ¥{totalEarningsForRange.toLocaleString(locale)}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={4} sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }, gap: theme.spacing(4) }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              width: '100%',
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>{t('daily_earnings_chart')}</Typography>
              <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
                {dailyEarningsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyEarningsData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" style={{ fontSize: '0.75rem' }} />
                      <YAxis tickFormatter={(value) => `¥${value.toLocaleString(locale)}`} style={{ fontSize: '0.75rem' }} />
                      <Tooltip formatter={(value: number) => `¥${value.toLocaleString(locale)}`} />
                      <Legend />
                      <Bar
                        dataKey="earnings"
                        name={t('earnings')}
                        fill="#8884d8"
                        radius={[10, 10, 0, 0]}
                        onClick={handleBarClick}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2">{t('no_bills_found')}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              width: '100%',
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>{t('meal_type_distribution_chart')}</Typography>
              <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
                {mealTypeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mealTypeDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={isMobile ? 80 : 120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        activeShape={false}
                      >
                        {mealTypeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `¥${value.toLocaleString(locale)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2">{t('no_bills_found')}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {selectedDailySummaryEntry && (
        <Box ref={dailyBillSummaryRef} sx={{ mt: 4 }}>
          <DailyBillSummary
            date={selectedDailySummaryEntry.date}
            dailySummary={selectedDailySummaryEntry.summary}
            locale={locale}
            onClose={() => setSelectedDailySummaryEntry(null)}
          />
        </Box>
      )}

      {!loading && !bills.length && (
        <Typography sx={{ mt: 2 }}>
          {t('no_bills_found')}
        </Typography>
      )}
    </Container>
  );
};

export default SummaryPageClient;
