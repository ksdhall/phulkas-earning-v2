"use client";

import React from 'react';
import { Box, Typography, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { useTranslations } from 'next-intl';
import { DailySummary, MealSummary } from '@/lib/calculations';
import { AppConfig } from '@/config/app';

interface DailySummaryCardProps {
  date?: string;
  summary: DailySummary | null;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ date, summary }) => {
  const t = useTranslations('dashboard');
  const tEarnings = useTranslations('earnings_details');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!summary) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="body1">{t('no_summary_data')}</Typography>
      </Paper>
    );
  }

  const { lunch, dinner, dayTotalEarnings } = summary;

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

  const renderMealDetails = (meal: 'lunch' | 'dinner', mealSummary: MealSummary) => {
    const isLunch = meal === 'lunch';
    
    const isOurFood = mealSummary.isOurFood ?? true;
    const numberOfPeopleWorkingDinner = mealSummary.numberOfPeopleWorkingDinner ?? 1;
    const effectiveWorkers = Math.max(1, numberOfPeopleWorkingDinner);

    let directFoodEarningsDisplay = 0;
    let commonPoolFoodContributionDisplay = 0;
    let commonPoolDrinkContributionDisplay = 0;
    let totalCommonPoolDisplay = 0;
    let ourShareFromCommonPoolDisplay = 0;

    if (!isLunch) {
      if (isOurFood) {
        directFoodEarningsDisplay = mealSummary.rawFoodTotal * AppConfig.DINNER_FOOD_OUR_SHARE_PERCENT;
      } else {
        directFoodEarningsDisplay = 0;
      }
      
      commonPoolFoodContributionDisplay = mealSummary.rawFoodTotal * AppConfig.DINNER_FOOD_COMMON_POOL_PERCENT;
      commonPoolDrinkContributionDisplay = mealSummary.rawDrinkTotal * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT;
      
      totalCommonPoolDisplay = commonPoolFoodContributionDisplay + commonPoolDrinkContributionDisplay;
      ourShareFromCommonPoolDisplay = totalCommonPoolDisplay / effectiveWorkers;
    }

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{t(`${meal}_summary`)}</Typography>

        <Typography variant="body2">{t('food_bills_total', { amount: formatCurrency(mealSummary.rawFoodTotal) })}</Typography>
        <Typography variant="body2">{t('drink_bills_total', { amount: formatCurrency(mealSummary.rawDrinkTotal) })}</Typography>

        {isLunch ? (
          <>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {tEarnings('lunch_food_base_income', { base: formatCurrency(AppConfig.LUNCH_FOOD_BASE_INCOME) })}
            </Typography>
            {mealSummary.rawFoodTotal > AppConfig.LUNCH_FOOD_BASE_INCOME && (
              <Typography variant="caption" display="block">
                {tEarnings('lunch_food_overage', {
                  overage: formatCurrency(Math.max(0, mealSummary.rawFoodTotal - AppConfig.LUNCH_FOOD_BASE_INCOME)),
                  overageHalf: formatCurrency(Math.max(0, mealSummary.rawFoodTotal - AppConfig.LUNCH_FOOD_BASE_INCOME) * AppConfig.LUNCH_FOOD_OVERAGE_SHARE_PERCENT)
                })}
              </Typography>
            )}
            <Typography variant="caption" display="block">
              {tEarnings('total_lunch_food_income_share', { amount: formatCurrency(mealSummary.foodEarnings) })}
            </Typography>
            <Typography variant="caption" display="block">
              {tEarnings('drink_calc_lunch', {
                total: formatCurrency(mealSummary.rawDrinkTotal),
                percentage: AppConfig.LUNCH_DRINK_SHARE_PERCENT * 100,
                share: formatCurrency(mealSummary.drinkEarnings)
              })}
            </Typography>
          </>
        ) : (
          <>
            {isOurFood && directFoodEarningsDisplay > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {tEarnings('dinner_food_direct_share', {
                  total: formatCurrency(mealSummary.rawFoodTotal),
                  share: formatCurrency(directFoodEarningsDisplay)
                })}
              </Typography>
            )}

            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {tEarnings('dinner_common_pool_contrib_food', { amount: formatCurrency(commonPoolFoodContributionDisplay) })}
            </Typography>
            <Typography variant="caption" display="block">
              {tEarnings('dinner_common_pool_contrib_drinks', { amount: formatCurrency(commonPoolDrinkContributionDisplay) })}
            </Typography>
            <Typography variant="caption" display="block">
              {tEarnings('total_common_pool', { amount: formatCurrency(totalCommonPoolDisplay) })}
            </Typography>
            <Typography variant="caption" display="block">
              {tEarnings('our_common_pool_share', {
                amount: formatCurrency(ourShareFromCommonPoolDisplay),
                workers: effectiveWorkers
              })}
            </Typography>
          </>
        )}

        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
          {t(`phulkas_${meal}_earnings`, { amount: formatCurrency(mealSummary.phulkasEarnings) })}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: isMobile ? 2 : 3,
        mx: isMobile ? 1 : 'auto',
      }}
    >
      {date && (
        <Typography variant="h6" gutterBottom>
          {t('summary_for_date', { date: date })}
        </Typography>
      )}

      <Grid container spacing={isMobile ? 1 : 3}>
        <Grid xs={12} sm={6}>
          {renderMealDetails('lunch', lunch)}
        </Grid>

        <Grid xs={12} sm={6}>
          {renderMealDetails('dinner', dinner)}
        </Grid>

        <Grid xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" color="secondary" sx={{ fontWeight: 'bold', borderTop: '1px solid #eee', pt: 1 }}>
            {t('day_total_earnings_header')}: {formatCurrency(dayTotalEarnings)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DailySummaryCard;
