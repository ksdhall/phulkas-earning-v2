"use client";

import React, { useMemo } from 'react'; // CRITICAL FIX: Ensure useMemo is imported
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';

import { DailySummary, MealSummary } from '@/lib/calculations';

interface DailyBillSummaryProps {
  date: string; // The selected date in 'yyyy-MM-dd' format
  dailySummary: DailySummary; // Now expects a DailySummary object
  locale: string;
  onClose: () => void; // Function to close the summary
}

const MealSummaryDisplay: React.FC<{
  title: string;
  summary: MealSummary;
  locale: string;
  tGeneral: (key: string) => string;
}> = ({ title, summary, locale, tGeneral }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6" component="h3" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2">
      {tGeneral('summary.raw_food_total')}: ¥{summary.rawFoodTotal.toLocaleString(locale)}
    </Typography>
    <Typography variant="body2">
      {tGeneral('summary.raw_drink_total')}: ¥{summary.rawDrinkTotal.toLocaleString(locale)}
    </Typography>
    <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
      {tGeneral('summary.phulkas_earnings')}: ¥{summary.phulkasEarnings.toLocaleString(locale)}
    </Typography>
    {summary.isOurFood !== undefined && (
      <Typography variant="body2">
        {tGeneral('summary.is_our_food_label')}: {summary.isOurFood ? tGeneral('general.yes') : tGeneral('general.no')}
      </Typography>
    )}
    {summary.numberOfPeopleWorkingDinner !== undefined && (
      <Typography variant="body2">
        {tGeneral('summary.num_people_working_label')}: {summary.numberOfPeopleWorkingDinner}
      </Typography>
    )}
  </Box>
);


const DailyBillSummary: React.FC<DailyBillSummaryProps> = ({ date, dailySummary, locale, onClose }) => {
  const t = useTranslations('summary');
  const tGeneral = useTranslations();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  const formattedDate = format(parseISO(date), 'PPP', { locale: dateFnsLocale });

  return (
    <Card sx={{ mt: 4, mb: 4, borderRadius: 3, boxShadow: 3, width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {t('daily_summary_for', { date: formattedDate })}
          </Typography>
          <Button onClick={onClose} variant="outlined" size="small">
            {tGeneral('general.close')}
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />

        {dailySummary.lunch.phulkasEarnings > 0 || dailySummary.lunch.rawFoodTotal > 0 || dailySummary.lunch.rawDrinkTotal > 0 ? (
          <MealSummaryDisplay
            title={tGeneral('summary.lunch_summary_title')}
            summary={dailySummary.lunch}
            locale={locale}
            tGeneral={tGeneral}
          />
        ) : (
          <Typography variant="body2" sx={{ mb: 2 }}>{tGeneral('summary.no_lunch_entries')}</Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {dailySummary.dinner.phulkasEarnings > 0 || dailySummary.dinner.rawFoodTotal > 0 || dailySummary.dinner.rawDrinkTotal > 0 ? (
          <MealSummaryDisplay
            title={tGeneral('summary.dinner_summary_title')}
            summary={dailySummary.dinner}
            locale={locale}
            tGeneral={tGeneral}
          />
        ) : (
          <Typography variant="body2" sx={{ mb: 2 }}>{tGeneral('summary.no_dinner_entries')}</Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mt: 2 }}>
          {t('total_daily_earnings', { amount: dailySummary.dayTotalEarnings.toLocaleString(locale) })}
        </Typography>

      </CardContent>
    </Card>
  );
};

export default DailyBillSummary;
