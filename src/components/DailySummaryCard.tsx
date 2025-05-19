// src/components/DailySummaryCard.tsx
"use client";

import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useTranslations } from 'next-intl';

// Assuming the structure of the daily summary object
interface DailyEarningsSummary {
  lunch: {
    foodTotal: number;
    drinkTotal: number;
    foodEarnings: number;
    drinkEarnings: number;
    totalEarnings: number;
    foodBreakdown: {
      base: number;
      overage: number;
      overageHalf: number;
    };
    drinkBreakdown: {
        total: number;
        share: number;
    };
  };
  dinner: {
    foodTotal: number; // Total food sales for dinner shift
    drinkTotal: number; // Total drink sales for dinner shift
    foodEarnings: number; // Our total earnings from dinner food (our sales share + shift share)
    drinkEarnings: number; // Earnings from dinner drinks (25% share)
    totalEarnings: number; // Total dinner earnings
     // New breakdown for dinner food earnings
     foodBreakdown: {
        totalDinnerFood: number;
        ourDinnerFoodSales: number; // Dinner food sales specifically marked as 'ours'
        ourFoodSalesShare: number; // 75% of ourDinnerFoodSales
        totalFoodShiftSharePool: number; // 25% of totalDinnerFood
        ourShiftShare: number; // Our share of the 25% pool
        numberOfPeopleWorking: number; // Number of people used for shift share calculation
     };
    drinkBreakdown: {
        total: number;
        share: number;
      };
  };
  dayTotalEarnings: number;
}

interface DailySummaryCardProps {
  date: string;
  summary: DailyEarningsSummary;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ date, summary }) => {
   const t = useTranslations('dashboard'); // Translations for dashboard labels
   const tsEarnings = useTranslations('earnings_details'); // Translations for earnings details

  return (
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('summary_for_day', { date: date })} {/* Use translation with date */}
        </Typography>
        <Grid container spacing={2}>
          {/* Lunch Summary */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('lunch_summary')} {/* Use translation */}
            </Typography>
            <Box sx={{ fontSize: '0.9rem' }}> {/* Adjusted font size */}
              <Typography variant="body2" display="block">{t('food_total', { amount: summary.lunch.foodTotal })}</Typography> {/* Use translation */}
                {/* Display Lunch Food Breakdown */}
               {summary.lunch.foodTotal > 0 && (
                   <Box sx={{ ml: 1, fontSize: '0.8rem', color: 'text.secondary' }}> {/* Adjusted font size */}
                       <Typography variant="caption" display="block">
                           {tsEarnings('lunch_food_base', { base: summary.lunch.foodBreakdown.base })}
                           {summary.lunch.foodBreakdown.overage > 0 && (
                               tsEarnings('lunch_food_overage', {
                                   overage: summary.lunch.foodBreakdown.overage,
                                   overageHalf: summary.lunch.foodBreakdown.overageHalf.toFixed(2)
                               })
                           )}
                            = ¥{summary.lunch.foodEarnings.toFixed(2)}
                       </Typography>
                   </Box>
                )}
              <Typography variant="body2" display="block">{t('drink_total', { amount: summary.lunch.drinkTotal })}</Typography> {/* Use translation */}
               {/* Display Lunch Drink Breakdown */}
               {summary.lunch.drinkTotal > 0 && (
                   <Box sx={{ ml: 1, fontSize: '0.8rem', color: 'text.secondary' }}> {/* Adjusted font size */}
                        <Typography variant="caption" display="block">
                             {tsEarnings('lunch_drink_calc', {
                                total: summary.lunch.drinkBreakdown.total,
                                share: summary.lunch.drinkBreakdown.share.toFixed(2) // FIX: Corrected variable name here
                             })}
                        </Typography>
                   </Box>
                )}
              <Typography variant="body1" color="primary" sx={{mt: 0.5}}> {/* Adjusted margin */}
                {t('phulkas_lunch_earnings', { amount: summary.lunch.totalEarnings.toFixed(2) })} {/* Use translation */}
              </Typography>
            </Box>
          </Grid>

          {/* Dinner Summary */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('dinner_summary')} {/* Use translation */}
            </Typography>
            <Box sx={{ fontSize: '0.9rem' }}> {/* Adjusted font size */}
              <Typography variant="body2" display="block">{t('food_total', { amount: summary.dinner.foodTotal })}</Typography> {/* Use translation */}
               {/* Display New Dinner Food Breakdown */}
                {summary.dinner.foodTotal > 0 && (
                   <Box sx={{ ml: 1, fontSize: '0.8rem', color: 'text.secondary' }}> {/* Adjusted font size */}
                        <Typography variant="caption" display="block">
                             Total Dinner Food: ¥{summary.dinner.foodBreakdown.totalDinnerFood.toFixed(2)}
                        </Typography>
                         {/* Conditionally display Our Sales if there were any */}
                         {summary.dinner.foodBreakdown.ourDinnerFoodSales > 0 && (
                             <Typography variant="caption" display="block">
                                 Our Sales (75%): ¥{summary.dinner.foodBreakdown.ourDinnerFoodSales.toFixed(2)} * 0.75 = ¥{summary.dinner.foodBreakdown.ourFoodSalesShare.toFixed(2)}
                             </Typography>
                         )}
                         {/* Conditionally display Shift Pool if there was any total dinner food */}
                         {summary.dinner.foodBreakdown.totalFoodShiftSharePool > 0 && (
                              <Typography variant="caption" display="block">
                                  Shift Pool (25%): ¥{summary.dinner.foodBreakdown.totalFoodShiftSharePool.toFixed(2)} / {summary.dinner.foodBreakdown.numberOfPeopleWorking} = ¥{summary.dinner.foodBreakdown.ourShiftShare.toFixed(2)} (Our Share)
                              </Typography>
                         )}
                   </Box>
                )}
              <Typography variant="body2" display="block">{t('drink_total', { amount: summary.dinner.drinkTotal })}</Typography> {/* Use translation */}
               {/* Display Dinner Drink Breakdown */}
               {summary.dinner.drinkTotal > 0 && (
                   <Box sx={{ ml: 1, fontSize: '0.8rem', color: 'text.secondary' }}> {/* Adjusted font size */}
                        <Typography variant="caption" display="block">
                             {tsEarnings('dinner_drink_calc', {
                                total: summary.dinner.drinkBreakdown.total,
                                share: summary.dinner.drinkBreakdown.share.toFixed(2)
                             })}
                        </Typography>
                   </Box>
                )}
              <Typography variant="body1" color="primary" sx={{mt: 0.5}}> {/* Adjusted margin */}
                {t('phulkas_dinner_earnings', { amount: summary.dinner.totalEarnings.toFixed(2) })} {/* Use translation */}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h5" color="secondary" sx={{ mt: 3 }}> {/* Adjusted margin */}
          {t('day_total_earnings', { amount: summary.dayTotalEarnings.toFixed(2) })} {/* Use translation */}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DailySummaryCard;
