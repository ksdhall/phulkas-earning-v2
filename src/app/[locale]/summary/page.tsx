"use client";

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
// Import DateRangeFilter and its props type
import DateRangeFilter, { DateRangeFilterProps } from '@/components/DateRangeFilter';
import BillList from '@/components/BillList';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


import { format, parseISO, eachDayOfInterval, isValid } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Bill } from '@/types/Bill';
import { calculateDailyEarnings, calculateRangeSummary, DailyEarningsSummary } from '@/lib/calculations';


interface RangeSummary {
    totalFood: number;
    totalDrinks: number;
    totalLunchFood: number;
    totalLunchDrinks: number;
    totalDinnerFood: number;
    totalDinnerDrinks: number;
    totalPhulkasEarnings: number;
}


interface RangeReportData {
    type: 'range';
    fromDate: string;
    toDate: string;
    bills: Bill[];
    summary: RangeSummary;
}

interface DailySummaryRow {
    date: string;
    summary: DailyEarningsSummary;
}


export default function SummaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const today = format(new Date(), 'yyyy-MM-dd');
  // Use state for fromDate and toDate to be passed to DateRangeFilter
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [rangeData, setRangeData] = useState<RangeReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRange, setCurrentRange] = useState<{ from: string; to: string } | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [billToDeleteId, setBillToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
   const [dateFilterError, setDateFilterError] = useState<string | null>(null); // State for date filter validation error


  const t = useTranslations('summary');
  const tGeneral = useTranslations();
  const tDashboard = useTranslations('dashboard');
  const tsEarnings = useTranslations('earnings_details');
  const tDateFilter = useTranslations('date_range_filter'); // Translations for date filter


  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log("Summary Page: User unauthenticated, redirecting to login.");
      router.push(`/${locale}`);
    }
  }, [status, router, locale]);

  // Fetch data based on current fromDate and toDate state
  const fetchRangeData = useCallback(async (start: string, end: string) => {
     if (status !== 'authenticated') {
         console.log("Summary Page: Not authenticated, skipping fetch.");
         return;
     }

    setLoading(true);
    setError(null);
    setRangeData(null);
    setCurrentRange({ from: start, to: end });

     console.log(`Summary Page: Fetching data for range: ${start} to ${end}`);

    try {
      const res = await fetch(`/${locale}/api/reports?from=${start}&to=${end}`);
       if (!res.ok) {
           const err = await res.json();
           console.error("Summary Page: API Error fetching reports:", err);
           throw new Error(err.error || tGeneral('errors.failed_fetch'));
       }
      const data = await res.json();
       console.log("Summary Page: Fetched range data:", data);
      const processedBills: Bill[] = data.bills.map((bill: any) => ({
          ...bill,
          date: new Date(bill.date),
          mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
          isOurFood: bill.isOurFood ?? true,
          numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));

      const calculatedRangeSummary = calculateRangeSummary(processedBills);

      setRangeData({...data, bills: processedBills, summary: calculatedRangeSummary});

    } catch (err: any) {
      setError(err.message);
       console.error("Summary Page: Error fetching range data:", err);
    } finally {
      setLoading(false);
    }
  }, [status, locale, tGeneral]);


  // Fetch initial data when authenticated
  useEffect(() => {
     if (status === 'authenticated') {
         console.log("Summary Page: Status authenticated, triggering initial fetch.");
         fetchRangeData(fromDate, toDate); // Use initial state values
     }
  }, [status, locale, fetchRangeData]); // Depend only on status, locale, and fetchRangeData itself


  // Function to handle applying the filter (called by the button)
  const handleApplyFilter = () => {
      const from = parseISO(fromDate);
      const to = parseISO(toDate);

      // Add validation before applying filter
      if (!isValid(from) || !isValid(to)) {
          setDateFilterError(tDateFilter('invalid_date_range'));
          return;
      }

      if (from > to) {
          setDateFilterError(tDateFilter('from_date_after_to_date'));
          return;
      }

      setDateFilterError(null); // Clear previous errors
      console.log(`Summary Page: Applying filter from ${fromDate} to ${toDate}`);
      fetchRangeData(fromDate, toDate); // Fetch data with current state values
  };


   const handleEditBill = (id: number) => {
     console.log("Summary Page: Editing bill with ID:", id);
    router.push(`/${locale}/edit/${id}`);
  };

   const handleOpenConfirmDelete = (id: number) => {
        console.log("Summary Page: Opening delete confirm for bill ID:", id);
       setBillToDeleteId(id);
       setOpenConfirmDelete(true);
   };

   const handleCloseConfirmDelete = () => {
        console.log("Summary Page: Closing delete confirm.");
       setOpenConfirmDelete(false);
       setBillToDeleteId(null);
   };

   const handleDeleteBill = async () => {
        if (billToDeleteId === null) return;

         console.log("Summary Page: Deleting bill with ID:", billToDeleteId);
        setOpenConfirmDelete(false);
        setIsDeleting(true);
        setError(null);

        try {
            const res = await fetch(`/${locale}/api/bills/${billToDeleteId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                 console.error("Summary Page: API Error deleting bill:", err);
                throw new Error(err.error || tGeneral('edit.delete_bill_error', { error: '' }));
            }

             console.log("Summary Page: Bill deleted successfully.");
             setBillToDeleteId(null);

             // Re-fetch data for the current range after deletion
            if (currentRange) {
                fetchRangeData(currentRange.from, currentRange.to);
            } else {
                 const today = format(new Date(), 'yyyy-MM-dd');
                 fetchRangeData(today, today);
            }

        } catch (err: any) {
             console.error("Summary Page: Error during delete fetch:", err);
             setError(err.message || tGeneral('errors.failed_fetch'));
        } finally {
            setIsDeleting(false);
        }
   };


   const dailySummaries = useMemo(() => {
       if (!rangeData?.bills || rangeData.bills.length === 0) {
           return [];
       }

       const bills = rangeData.bills;
       const dailyReports: DailySummaryRow[] = [];

       const billsByDate: { [key: string]: Bill[] } = {};
       bills.forEach(bill => {
           const dateKey = format(bill.date instanceof Date ? bill.date : new Date(bill.date), 'yyyy-MM-dd');
           if (!billsByDate[dateKey]) {
               billsByDate[dateKey] = [];
           }
           billsByDate[dateKey].push(bill);
       });

       const startDate = parseISO(fromDate);
       const endDate = parseISO(toDate);
       const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

        datesInRange.sort((a, b) => b.getTime() - a.getTime());


       datesInRange.forEach(date => {
           const dateKey = format(date, 'yyyy-MM-dd');
           const billsForDay = billsByDate[dateKey] || [];

           const dailySummary: DailyEarningsSummary = calculateDailyEarnings(billsForDay);

           if (billsForDay.length > 0) {
               dailyReports.push({
                   date: dateKey,
                   summary: dailySummary,
               });
           }
       });

       return dailyReports;

   }, [rangeData?.bills, fromDate, toDate]);


    if (status === 'loading') {
        return (
            <Layout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                </Box>
            </Layout>
        );
    } else if (status === 'authenticated') {
        const bills = rangeData?.bills || [];
        const summary = rangeData?.summary; // summary can be undefined

        return (
            <Layout>
               <Typography variant="h4" gutterBottom>
                 {t('title')}
               </Typography>

               {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {isDeleting && <Alert severity="info" sx={{ mb: 2 }}>{tGeneral('edit.deleting')}</Alert>}

               {/* Use the updated DateRangeFilter API */}
               <DateRangeFilter
                  fromDate={fromDate} // Pass state down
                  toDate={toDate} // Pass state down
                  onFromDateChange={setFromDate} // Pass state setter up
                  onToDateChange={setToDate} // Pass state setter up
               />
                {/* Add an Apply Filter button */}
                <Box sx={{ mt: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleApplyFilter}
                        disabled={loading || isDeleting} // Disable while loading or deleting
                    >
                        {tDateFilter('apply_filter')} {/* Use translation */}
                    </Button>
                     {dateFilterError && (
                         <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                             {dateFilterError} {/* Display date filter validation error */}
                         </Typography>
                      )}
                </Box>


               {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                     <CircularProgress />
                    </Box>
               )}

               {summary && currentRange && (
                  <Card sx={{ mt: 3, mb: 3 }}>
                     <CardContent>
                         <Typography variant="h6" gutterBottom>
                             {t('summary_for_range', { fromDate: currentRange.from, toDate: currentRange.to })}
                         </Typography>
                          <Grid container spacing={2}>
                              {/* Using size prop with responsive object - trying to bypass type error */}
                              <Grid size={{ xs: 12, sm: 6 }}>
                                  <Typography variant="body1">
                                      {/* Use optional chaining for summary access */}
                                      {t('total_food', { amount: summary?.totalFood?.toFixed(2) ?? 'N/A' })}
                                           {summary?.totalLunchFood !== undefined && summary?.totalDinnerFood !== undefined && (
                                               <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                   (Lunch: {summary?.totalLunchFood?.toFixed(2) ?? 'N/A'}, Dinner: {summary?.totalDinnerFood?.toFixed(2) ?? 'N/A'})
                                               </Typography>
                                           )}
                                      </Typography>
                                     <Typography variant="body1">
                                          {/* Use optional chaining for summary access */}
                                         {t('total_drinks', { amount: summary?.totalDrinks?.toFixed(2) ?? 'N/A' })}
                                          {summary?.totalLunchDrinks !== undefined && summary?.totalDinnerDrinks !== undefined && (
                                               <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                   (Lunch: {summary?.totalLunchDrinks?.toFixed(2) ?? 'N/A'}, Dinner: {summary?.totalDinnerDrinks?.toFixed(2) ?? 'N/A'})
                                               </Typography>
                                           )}
                                     </Typography>
                                  </Grid>
                                  {/* Using size prop with responsive object - trying to bypass type error */}
                                  <Grid size={{ xs: 12, sm: 6 }}>
                                      <Typography variant="h6" color="primary">
                                           {/* Use optional chaining for summary access */}
                                          {t('phulkas_total_earnings', { amount: summary?.totalPhulkasEarnings !== undefined ? summary.totalPhulkasEarnings.toFixed(2) : 'N/A' })}
                                      </Typography>
                                  </Grid>
                              </Grid>
                         </CardContent>
                      </Card>
                   )}

                     {dailySummaries.length > 0 ? (
                          <TableContainer component={Paper} sx={{ mt: 3, mb: 3 }}>
                              <Table size="small">
                                  <TableHead>
                                      <TableRow>
                                          <TableCell sx={{ verticalAlign: 'top' }}>{tGeneral('bill_list.date')}</TableCell>
                                          <TableCell sx={{ verticalAlign: 'top' }}>{tDashboard('lunch_summary')}</TableCell>
                                          <TableCell sx={{ verticalAlign: 'top' }}>{tDashboard('dinner_summary')}</TableCell>
                                          <TableCell sx={{ verticalAlign: 'top' }}>{tDashboard('day_total_earnings_header')}</TableCell>
                                      </TableRow>
                                  </TableHead>
                                  <TableBody>
                                      {dailySummaries.map((dailyReport) => (
                                          <TableRow key={dailyReport.date}>
                                              <TableCell sx={{ verticalAlign: 'top' }}>{dailyReport.date}</TableCell>
                                              <TableCell sx={{ verticalAlign: 'top' }}>
                                                  {/* Access dailyReport.summary directly as it's typed in DailySummaryRow */}
                                                  {dailyReport.summary.lunch.foodTotal > 0 || dailyReport.summary.lunch.drinkTotal > 0 ? (
                                                      <Box sx={{ fontSize: '0.8rem' }}>
                                                          <Typography variant="caption" display="block">{tDashboard('food_total', { amount: dailyReport.summary.lunch.foodTotal.toFixed(2) })}</Typography>
                                                          {dailyReport.summary.lunch.foodTotal > 0 && (
                                                              <Box sx={{ ml: 1, fontSize: '0.7rem', color: 'text.secondary' }}>
                                                                  <Typography variant="caption" display="block">
                                                                      {tsEarnings('lunch_food_base', { base: dailyReport.summary.lunch.foodBreakdown.base.toFixed(2) })}
                                                                      {dailyReport.summary.lunch.foodBreakdown.overage > 0 && (
                                                                          tsEarnings('lunch_food_overage', {
                                                                              overage: dailyReport.summary.lunch.foodBreakdown.overage.toFixed(2),
                                                                              overageHalf: dailyReport.summary.lunch.foodBreakdown.overageHalf.toFixed(2)
                                                                          })
                                                                      )}
                                                                       = ¥{dailyReport.summary.lunch.foodEarnings.toFixed(2)}
                                                                  </Typography>
                                                              </Box>
                                                           )}
                                                          <Typography variant="caption" display="block">{tDashboard('drink_total', { amount: dailyReport.summary.lunch.drinkTotal.toFixed(2) })}</Typography>
                                                           {dailyReport.summary.lunch.drinkTotal > 0 && (
                                                               <Box sx={{ ml: 1, fontSize: '0.7rem', color: 'text.secondary' }}>
                                                                    <Typography variant="caption" display="block">
                                                                         {tsEarnings('lunch_drink_calc', {
                                                                            total: dailyReport.summary.lunch.drinkBreakdown.total.toFixed(2),
                                                                            share: dailyReport.summary.lunch.drinkBreakdown.share.toFixed(2)
                                                                        })}
                                                                    </Typography>
                                                               </Box>
                                                            )}
                                                          <Typography variant="body2" color="primary" sx={{mt: 0.5}}>
                                                             {tDashboard('phulkas_lunch_earnings', { amount: dailyReport.summary.lunch.totalEarnings.toFixed(2) })}
                                                          </Typography>
                                                      </Box>
                                                  ) : (
                                                      <Typography variant="caption" color="text.secondary">No Lunch Entries</Typography>
                                                   )}
                                              </TableCell>
                                              <TableCell sx={{ verticalAlign: 'top' }}>
                                                   {dailyReport.summary.dinner.foodTotal > 0 || dailyReport.summary.dinner.drinkTotal > 0 ? (
                                                      <Box sx={{ fontSize: '0.8rem' }}>
                                                         <Typography variant="caption" display="block">{tDashboard('food_total', { amount: dailyReport.summary.dinner.foodTotal.toFixed(2) })}</Typography>
                                                            {dailyReport.summary.dinner.foodTotal > 0 && (
                                                               <Box sx={{ ml: 1, fontSize: '0.7rem', color: 'text.secondary' }}>
                                                                    <Typography variant="caption" display="block">
                                                                         Total Dinner Food: ¥{dailyReport.summary.dinner.foodBreakdown.totalDinnerFood.toFixed(2)}
                                                                    </Typography>
                                                                     {dailyReport.summary.dinner.foodBreakdown.ourDinnerFoodSales > 0 && (
                                                                         <Typography variant="caption" display="block">
                                                                             Our Sales (75%): ¥{dailyReport.summary.dinner.foodBreakdown.ourDinnerFoodSales.toFixed(2)} * 0.75 = ¥{dailyReport.summary.dinner.foodBreakdown.ourFoodSalesShare.toFixed(2)}
                                                                         </Typography>
                                                                     )}
                                                                     {dailyReport.summary.dinner.foodBreakdown.totalFoodShiftSharePool > 0 && (
                                                                          <Typography variant="caption" display="block">
                                                                              Shift Pool (25%): ¥{dailyReport.summary.dinner.foodBreakdown.totalFoodShiftSharePool.toFixed(2)} / {dailyReport.summary.dinner.foodBreakdown.numberOfPeopleWorking} = ¥{dailyReport.summary.dinner.foodBreakdown.ourShiftShare.toFixed(2)} (Our Share)
                                                                      </Typography>
                                                                     )}
                                                               </Box>
                                                            )}
                                                         <Typography variant="caption" display="block">{tDashboard('drink_total', { amount: dailyReport.summary.dinner.drinkTotal.toFixed(2) })}</Typography>
                                                          {dailyReport.summary.dinner.drinkTotal > 0 && (
                                                              <Box sx={{ ml: 1, fontSize: '0.7rem', color: 'text.secondary' }}>
                                                                   <Typography variant="caption" display="block">
                                                                        {tsEarnings('dinner_drink_calc', {
                                                                           total: dailyReport.summary.dinner.drinkBreakdown.total.toFixed(2),
                                                                           share: dailyReport.summary.dinner.drinkBreakdown.share.toFixed(2)
                                                                       })}
                                                                   </Typography>
                                                               </Box>
                                                            )}
                                                         <Typography variant="body2" color="primary" sx={{mt: 0.5}}>
                                                            {tDashboard('phulkas_dinner_earnings', { amount: dailyReport.summary.dinner.totalEarnings.toFixed(2) })}
                                                         </Typography>
                                                     </Box>
                                                   ) : (
                                                       <Typography variant="caption" color="text.secondary">No Dinner Entries</Typography>
                                                   )}
                                              </TableCell>
                                              <TableCell sx={{ verticalAlign: 'top' }}>
                                                  <Typography variant="body1" color="secondary">
                                                       ¥{dailyReport.summary.dayTotalEarnings.toFixed(2)}
                                                  </Typography>
                                              </TableCell>
                                           </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </TableContainer>
                     ) : (
                         <Typography sx={{mt: 3}}>
                            {t('no_bills_found')}
                         </Typography>
                     )}


               {rangeData && bills.length > 0 && (
                   <>
                     <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                         {t('entries_in_range', { count: bills.length })}
                     </Typography>
                      <BillList
                         bills={bills}
                         onEdit={handleEditBill}
                         onDelete={handleOpenConfirmDelete}
                       />
                   </>
               )}

                 <Dialog
                     open={openConfirmDelete}
                     onClose={handleCloseConfirmDelete}
                     aria-labelledby="alert-dialog-title"
                     aria-describedby="alert-dialog-description"
                 >
                     <DialogTitle id="alert-dialog-title">{tGeneral('edit.delete_confirm_title')}</DialogTitle>
                     <DialogContent>
                     <DialogContentText id="alert-dialog-description">
                          {/* Fix: Provide a fallback value for billToDeleteId if it's null */}
                          {tGeneral('edit.delete_confirm_message', { id: billToDeleteId ?? '' })}
                       </DialogContentText>
                       </DialogContent>
                       <DialogActions>
                           <Button onClick={handleCloseConfirmDelete} disabled={isDeleting}>{tGeneral('edit.cancel')}</Button>
                           <Button onClick={handleDeleteBill} color="error" autoFocus disabled={isDeleting}>
                               {isDeleting ? <CircularProgress size={24} /> : tGeneral('edit.delete')}
                           </Button>
                       </DialogActions>
                 </Dialog>

            </Layout>
        );
    } else {
         return null;
     }
  }
