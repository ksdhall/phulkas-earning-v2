"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // CRITICAL FIX: Ensure useMemo is imported
import { useTranslations } from 'next-intl';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, isValid, addDays } from 'date-fns';
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
import { calculateDailySummariesForRange, DailySummary } from '@/lib/calculations';

// Define the Bill type to match what's passed from summary/page.tsx and calculations.ts expects
interface Bill {
  id: string;
  date: string; // ISO string 'yyyy-MM-dd'
  foodAmount: number; // Now explicitly foodAmount
  drinkAmount: number; // Now explicitly drinkAmount
  mealType: 'lunch' | 'dinner';
  isOurFood: boolean;
  numberOfPeopleWorkingDinner: number;
  comments?: string | null;
}

interface SummaryPageClientProps {
  locale: string;
  initialBills: Bill[];
  initialFromDate?: string;
  initialToDate?: string;
  initialError?: string | null;
}

// Define colors for the pie chart
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

  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);

  const [fromDate, setFromDate] = useState<Date | null>(
    initialFromDate ? parseISO(initialFromDate) : null
  );
  const [toDate, setToDate] = useState<Date | null>(
    initialToDate ? parseISO(initialToDate) : null
  );
  const [mealTypeFilter, setMealTypeFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  
  const [selectedDailySummaryEntry, setSelectedDailySummaryEntry] = useState<{ date: string; summary: DailySummary } | null>(null);

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  const dailySummariesForRange = useMemo(() => {
    const calculatedSummaries = calculateDailySummariesForRange(bills);
    return calculatedSummaries;
  }, [bills]);

  useEffect(() => {
    setBills(initialBills);
    setError(initialError);
    setFromDate(initialFromDate && isValid(parseISO(initialFromDate)) ? parseISO(initialFromDate) : null);
    setToDate(initialToDate && isValid(parseISO(initialToDate)) ? parseISO(initialToDate) : null);
    setSelectedDailySummaryEntry(null); 
  }, [initialBills, initialError, initialFromDate, initialToDate]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);

    let fromDateStr = fromDate && isValid(fromDate) ? format(fromDate, 'yyyy-MM-dd') : '';
    let toDateStr = toDate && isValid(toDate) ? format(toDate, 'yyyy-MM-dd') : '';

    if (!fromDate || !isValid(fromDate) || !toDate || !isValid(toDate)) {
      setError(t('errors.invalid_date_range') || 'Invalid date range selected.');
      setLoading(false);
      return;
    }
    if (fromDate > toDate) {
      setError(t('errors.date_range_order') || 'From date cannot be after To date.');
      setLoading(false);
      return;
    }

    const queryParams = new URLSearchParams();
    queryParams.append('from', fromDateStr);
    queryParams.append('to', toDateStr);

    const apiUrl = `/api/reports?${queryParams.toString()}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bills');
      }
      const data: Bill[] = await response.json();
      setBills(data);
    } catch (err: any) {
      console.error('SummaryPageClient: Error fetching bills (client-side):', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, t]);

  const handleApplyFilter = useCallback(() => {
    const currentPath = pathname.replace(`/${locale}`, '');
    const query = new URLSearchParams();
    if (fromDate && isValid(fromDate)) {
      query.append('from', format(fromDate, 'yyyy-MM-dd'));
    }
    if (toDate && isValid(toDate)) {
      query.append('to', format(toDate, 'yyyy-MM-dd'));
    }
    
    router.push(`/${locale}${currentPath}?${query.toString()}`);
  }, [fromDate, toDate, pathname, router, locale]);

  const handleBarClick = useCallback((data: { date: string; fullDate: string; earnings: number }) => {
    const clickedFullDate = data.fullDate;
    const foundSummary = dailySummariesForRange.find(entry => entry.date === clickedFullDate);
    if (foundSummary) {
      setSelectedDailySummaryEntry(foundSummary);
    } else {
      setSelectedDailySummaryEntry(null);
      console.error('No daily summary found for clicked date:', clickedFullDate);
    }
  }, [dailySummariesForRange]);

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      if (mealTypeFilter === 'all') return true;
      return bill.mealType === mealTypeFilter;
    });
  }, [bills, mealTypeFilter]);

  const dailyEarningsData = useMemo(() => {
    const chartData = dailySummariesForRange
      .map(entry => {
        const parsedDate = parseISO(entry.date);
        if (!isValid(parsedDate)) {
          console.error('SummaryPageClient: Invalid date encountered:', entry.date);
        }
        const formattedDate = isValid(parsedDate) ? format(parsedDate, 'MMM dd', { locale: dateFnsLocale }) : 'Invalid Date';
        return {
          date: formattedDate,
          fullDate: entry.date,
          earnings: entry.summary.dayTotalEarnings,
        };
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    return chartData;
  }, [dailySummariesForRange, dateFnsLocale]);

  const mealTypeDistributionData = useMemo(() => {
    const mealTypeMap: { [key: string]: number } = {
      lunch: 0,
      dinner: 0,
    };
    filteredBills.forEach(bill => {
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
  }, [filteredBills, tMealType]);

  const totalEarnings = useMemo(() => {
    return dailySummariesForRange.reduce((sum, entry) => sum + entry.summary.dayTotalEarnings, 0);
  }, [dailySummariesForRange]);

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

      {/* Filter controls */}
      <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
            <DatePicker
              label={t('from_date')}
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small', sx: { borderRadius: 2 } } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
            <DatePicker
              label={t('to_date')}
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small', sx: { borderRadius: 2 } } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ borderRadius: 2 }}>
            <InputLabel>{t('meal_type_filter')}</InputLabel>
            <Select
              value={mealTypeFilter}
              label={t('meal_type_filter')}
              onChange={(e) => setMealTypeFilter(e.target.value as 'all' | 'lunch' | 'dinner')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">{tGeneral('all')}</MenuItem>
              <MenuItem value="lunch">{tMealType('lunch')}</MenuItem>
              <MenuItem value="dinner">{tMealType('dinner')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilter}
            disabled={loading}
            fullWidth
            sx={{ height: '40px', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('apply_filter')}
          </Button>
        </Grid>
      </Grid>

      {/* Total Earnings Card */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {t('total_earnings')}
          </Typography>
          <Typography variant="h4" color="primary">
            ¥{totalEarnings.toLocaleString(locale)}
          </Typography>
        </CardContent>
      </Card>

      {/* Charts Grid Container */}
      <Grid container spacing={4} sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }, gap: theme.spacing(4) }}>
        {/* Bar Chart Grid Item */}
        <Grid sx={{
          gridColumn: { xs: 'span 1', md: 'span 1' },
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '400px',
        }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>{t('daily_earnings_chart')}</Typography>
              <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyEarningsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
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
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart Grid Item */}
        <Grid sx={{
          gridColumn: { xs: 'span 1', md: 'span 1' },
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '400px',
        }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>{t('meal_type_distribution_chart')}</Typography>
              <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
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
                    >
                      {mealTypeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString(locale)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {selectedDailySummaryEntry && (
        <DailyBillSummary
          date={selectedDailySummaryEntry.date}
          dailySummary={selectedDailySummaryEntry.summary}
          locale={locale}
          onClose={() => setSelectedDailySummaryEntry(null)}
        />
      )}
    </Container>
  );
};

export default SummaryPageClient;
