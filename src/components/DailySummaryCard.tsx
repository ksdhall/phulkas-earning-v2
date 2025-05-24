"use client"; // This directive is crucial for client-side components using hooks and JSX

import React from 'react'; // React must be imported to use JSX
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  useTheme, 
  useMediaQuery 
} from '@mui/material'; // Ensure all MUI components are correctly imported
import { useTranslations } from 'next-intl';
import { DailySummary, MealSummary } from '@/lib/calculations';
import { useAppConfig } from '@/context/AppConfigContext'; // Import useAppConfig

interface DailySummaryCardProps {
  date?: string;
  summary: DailySummary | null;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ date, summary }) => {
  const t = useTranslations('dashboard');
  const tEarnings = useTranslations('earnings_details');
  const tGeneral = useTranslations('general');
  const appConfig = useAppConfig(); // Get app config from context

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

  const formatCurrency = (amount: number | string | null | undefined) => {
    let numericAmount: number;

    if (typeof amount === 'string') {
      const cleanedString = amount.replace(/[¥,]/g, '');
      numericAmount = Number(cleanedString);
    } else {
      numericAmount = amount ?? 0;
    }

    if (isNaN(numericAmount)) {
      numericAmount = 0;
    }

    return `¥${numericAmount.toLocaleString('en-US')}`;
  };

  const renderMealDetails = (meal: 'lunch' | 'dinner', mealSummary: MealSummary) => {
    const isLunch = meal === 'lunch';
    
    const isOurFood = mealSummary.isOurFood;
    const numberOfPeopleWorkingDinner = mealSummary.numberOfPeopleWorkingDinner;
    const effectiveWorkers = Math.max(1, numberOfPeopleWorkingDinner);

    let directFoodEarningsDisplay = 0;
    let commonPoolFoodContributionDisplay = 0;
    let commonPoolDrinkContributionDisplay = 0;
    let totalCommonPoolDisplay = 0;
    let ourShareFromCommonPoolDisplay = 0;

    if (!isLunch) {
      if (isOurFood) {
        directFoodEarningsDisplay = mealSummary.rawFoodTotal * appConfig.DINNER_FOOD_OUR_SHARE_PERCENT;
      } else {
        directFoodEarningsDisplay = 0;
      }
      
      commonPoolFoodContributionDisplay = mealSummary.rawFoodTotal * appConfig.DINNER_FOOD_COMMON_POOL_PERCENT;
      commonPoolDrinkContributionDisplay = mealSummary.rawDrinkTotal * appConfig.DINNER_DRINK_COMMON_POOL_PERCENT;
      
      totalCommonPoolDisplay = commonPoolFoodContributionDisplay + commonPoolDrinkContributionDisplay;
      ourShareFromCommonPoolDisplay = totalCommonPoolDisplay / effectiveWorkers;
    }

    return (
      <Box sx={{ mt: 1 }}> {/* Line 78 as per your error message */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          {t(`${meal}_summary`)}
        </Typography>

        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{t('food_bills_total', { amount: formatCurrency(mealSummary.rawFoodTotal) })}</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{t('drink_bills_total', { amount: formatCurrency(mealSummary.rawDrinkTotal) })}</Typography>

        {isLunch ? (
          <>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: theme.palette.text.secondary }}>
              {tEarnings('lunch_food_base_income', { base: formatCurrency(appConfig.LUNCH_FOOD_BASE_INCOME) })}
            </Typography>
            {mealSummary.rawFoodTotal > appConfig.LUNCH_FOOD_BASE_INCOME && (
              <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
                {tEarnings('lunch_food_overage', {
                  overage: formatCurrency(Math.max(0, mealSummary.rawFoodTotal - appConfig.LUNCH_FOOD_BASE_INCOME)),
                  overageHalf: formatCurrency(Math.max(0, mealSummary.rawFoodTotal - appConfig.LUNCH_FOOD_BASE_INCOME) * appConfig.LUNCH_FOOD_OVERAGE_SHARE_PERCENT)
                })}
              </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
              {tEarnings('total_lunch_food_income_share', { amount: formatCurrency(mealSummary.foodEarnings) })}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
              {tEarnings('drink_calc_lunch', {
                total: formatCurrency(mealSummary.rawDrinkTotal),
                percentage: appConfig.LUNCH_DRINK_SHARE_PERCENT * 100,
                share: formatCurrency(mealSummary.drinkEarnings)
              })}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {t('is_our_food_label')}: {isOurFood ? tGeneral('yes') : tGeneral('no')}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {t('num_people_working_label')}: {numberOfPeopleWorkingDinner}
            </Typography>

            {isOurFood && directFoodEarningsDisplay > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                {tEarnings('dinner_food_direct_share', {
                  total: formatCurrency(mealSummary.rawFoodTotal),
                  share: formatCurrency(directFoodEarningsDisplay)
                })}
              </Typography>
            )}

            <Typography variant="caption" display="block" sx={{ mt: 1, color: theme.palette.text.secondary }}>
              {tEarnings('dinner_common_pool_contrib_food', { amount: formatCurrency(commonPoolFoodContributionDisplay) })}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
              {tEarnings('dinner_common_pool_contrib_drinks', { amount: formatCurrency(commonPoolDrinkContributionDisplay) })}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
              {tEarnings('total_common_pool', { amount: formatCurrency(totalCommonPoolDisplay) })}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
              {tEarnings('our_common_pool_share', {
                amount: formatCurrency(ourShareFromCommonPoolDisplay),
                workers: effectiveWorkers
              })}
            </Typography>
          </>
        )}

        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mt: 1, color: theme.palette.text.primary }}>
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
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          {t('summary_for_date', { date: date })}
        </Typography>
      )}

      <Grid container spacing={isMobile ? 1 : 3}>
        <Grid item xs={12} sm={6}>
          {renderMealDetails('lunch', lunch)}
        </Grid>

        <Grid item xs={12} sm={6}>
          {renderMealDetails('dinner', dinner)}
        </Grid>

        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', borderTop: '1px solid', borderColor: theme.palette.divider, pt: 1, color: theme.palette.text.primary }}>
            {t('day_total_earnings_header')}: {formatCurrency(dayTotalEarnings)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DailySummaryCard;
