"use client";

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import BillForm from '@/components/BillForm';
import DailySummaryCard from '@/components/DailySummaryCard';
import BillList from '@/components/BillList';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';


import { format, addDays, subDays } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Bill } from '@/types/Bill';
import { calculateDailyEarnings } from '@/lib/calculations';


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [currentDate, setCurrentDate] = useState(new Date());
  const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd');


  const [billsForDate, setBillsForDate] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [billToDeleteId, setBillToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = useTranslations('dashboard');
  const tGeneral = useTranslations();


  // Memoize the daily earnings calculation using the imported function
  const dailySummary = useMemo(() => {
       return calculateDailyEarnings(billsForDate);
  }, [billsForDate]);


  // Function to fetch bills for the current date - Wrapped in useCallback
  const fetchBillsForDate = useCallback(async (dateToFetch: Date) => {
     if (status !== 'authenticated') {
        console.log("Dashboard Page: Not authenticated, skipping fetch.");
        return;
     }

    setLoading(true);
    setError(null);

    const formattedDateToFetch = format(dateToFetch, 'yyyy-MM-dd');
     console.log(`Dashboard Page: Fetching bills for date: ${formattedDateToFetch}`);


    try {
      const res = await fetch(`/${locale}/api/reports?from=${formattedDateToFetch}&to=${formattedDateToFetch}`);
       if (!res.ok) {
           const err = await res.json();
           console.error("Dashboard Page: API Error fetching reports:", err);
           throw new Error(err.error || tGeneral('errors.failed_fetch'));
       }
      const data = await res.json();
       console.log("Dashboard Page: Fetched bills data:", data);
      // Assuming the API returns mealType as string ('lunch'/'dinner') or Prisma Enum
      // Convert date strings to Date objects for easier processing if needed
       // FIX: Ensure mealType is lowercase string, isOurFood is boolean, numberOfPeopleWorkingDinner is number
       // API reports route now returns processed bills, so this mapping might be redundant but safe to keep
      const processedBills: Bill[] = data.bills.map((bill: any) => ({
          ...bill,
          date: new Date(bill.date),
           // Ensure mealType is lowercase string for consistency if needed
          mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
           // Ensure isOurFood is boolean, default to true if null/undefined from db
          isOurFood: bill.isOurFood ?? true,
           // Ensure numberOfPeopleWorkingDinner is number, default to 1 if null/undefined from db
          numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));
      setBillsForDate(processedBills);

    } catch (err: any) {
      console.error("Dashboard Page: Error fetching bills for date:", formattedDateToFetch, err);
      setError(err.message || tGeneral('errors.failed_fetch'));
      setBillsForDate([]);
    } finally {
      setLoading(false);
    }
  }, [status, locale, tGeneral]); // Dependencies for useCallback


  // Effect to redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log("Dashboard Page: User unauthenticated, redirecting to login.");
      router.push(`/${locale}`);
    }
  }, [status, router, locale]);

  // Effect to fetch bills on initial load and when authentication status, locale, or currentDate changes
  useEffect(() => {
    if (status === 'authenticated') {
       console.log("Dashboard Page: Status authenticated, triggering fetch.");
      fetchBillsForDate(currentDate);
    }
  }, [status, locale, currentDate, fetchBillsForDate]);


  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (formData: Omit<Bill, 'id'>) => {
    setLoading(true);
    setError(null);
     console.log("Dashboard Page: Submitting new bill:", formData);
    try {
      const res = await fetch(`/${locale}/api/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
         const err = await res.json();
          console.error("Dashboard Page: API Error adding bill:", err);
         throw new Error(err.error || tGeneral('dashboard.add_bill_error', { error: '' }));
      }

       console.log("Dashboard Page: Bill added successfully.");
      handleCloseModal();
      fetchBillsForDate(currentDate); // Refresh the list

    } catch (err: any) {
      console.error("Dashboard Page: Error adding bill:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBill = (id: number) => {
     console.log("Dashboard Page: Editing bill with ID:", id);
    router.push(`/${locale}/edit/${id}`);
  };

   const handleOpenConfirmDelete = (id: number) => {
        console.log("Dashboard Page: Opening delete confirm for bill ID:", id);
       setBillToDeleteId(id);
       setOpenConfirmDelete(true);
   };

   const handleCloseConfirmDelete = () => {
        console.log("Dashboard Page: Closing delete confirm.");
       setOpenConfirmDelete(false);
       setBillToDeleteId(null); // Clear the ID when closing
   };

   const handleDeleteBill = async () => {
        if (billToDeleteId === null) return; // Should not happen if dialog is managed correctly

         console.log("Dashboard Page: Deleting bill with ID:", billToDeleteId);
        setOpenConfirmDelete(false); // Close dialog immediately
        setIsDeleting(true);
        setError(null);

        try {
            const res = await fetch(`/${locale}/api/bills/${billToDeleteId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                 console.error("Dashboard Page: API Error deleting bill:", err);
                throw new Error(err.error || tGeneral('edit.delete_bill_error', { error: '' }));
            }

             console.log("Dashboard Page: Bill deleted successfully.");
             setBillToDeleteId(null); // Clear the ID after successful deletion
             fetchBillsForDate(currentDate); // Refresh the list

        } catch (err: any) {
             console.error("Dashboard Page: Error during delete fetch:", err);
             setError(err.message || tGeneral('errors.failed_fetch'));
        } finally {
            setIsDeleting(false);
        }
   };

   const handlePreviousDay = () => {
       console.log("Dashboard Page: Navigating to previous day.");
       setCurrentDate(prevDate => subDays(prevDate, 1));
   };

   const handleNextDay = () => {
        console.log("Dashboard Page: Navigating to next day.");
       setCurrentDate(prevDate => addDays(prevDate, 1));
   };


    let content;

    if (status === 'loading') {
        content = (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    } else if (status === 'authenticated') {
        content = (
            <>
               <Typography variant="h4" gutterBottom>
                 {t('title')}
               </Typography>

               {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {isDeleting && <Alert severity="info" sx={{ mb: 2 }}>{tGeneral('edit.deleting')}</Alert>}

               <Box sx={{ mb: 3 }}>
                 <Button variant="contained" onClick={handleOpenModal}>
                   {t('add_bill_entry')}
                 </Button>
               </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }}>
                    <IconButton onClick={handlePreviousDay} aria-label="previous day"
                        sx={{ color: 'inherit' }}
                    >
                        <ArrowBackIosIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
                      {t('todays_entries', { date: formattedCurrentDate })}
                    </Typography>
                    <IconButton onClick={handleNextDay} aria-label="next day"
                         sx={{ color: 'inherit' }}
                    >
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>


               {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
               )}

                {!loading && dailySummary && (
                    <DailySummaryCard
                        date={formattedCurrentDate}
                        summary={dailySummary}
                     />
                )}


               {!loading && billsForDate.length > 0 ? (
                  <BillList
                    bills={billsForDate}
                    onEdit={handleEditBill}
                    onDelete={handleOpenConfirmDelete}
                  />
               ) : !loading && (
                 <Typography sx={{mt: 2}}>
                   {t('no_entries_today')}
                 </Typography>
               )}

               <Dialog open={isModalOpen} onClose={handleCloseModal}>
                 <DialogContent>
                   <BillForm onSubmit={handleFormSubmit} isSubmitting={loading} />
                 </DialogContent>
               </Dialog>

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

               </>
           );
       } else {
           content = null;
       }


    return (
       <Layout>
           {content}
       </Layout>
    );
  }
