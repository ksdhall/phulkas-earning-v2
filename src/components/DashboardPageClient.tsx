"use client";

import { useSession } from 'next-auth/react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';

import { format, addDays, subDays } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Bill } from '@/types/Bill';
import { calculateDailyEarnings } from '@/lib/calculations';


const DashboardPageClient: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();

  const [currentDate, setCurrentDate] = useState(new Date());
  const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd');

  const [billsForDate, setBillsForDate] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false); // For main content loading (e.g., initial fetch, date change)
  const [error, setError] = useState<string | null>(null); // For errors on the main dashboard page

  // Modal specific states
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls Add/Edit Bill Dialog visibility
  const [editingBillId, setEditingBillId] = useState<string | undefined>(undefined); // Stores ID of bill being edited
  const [initialBillData, setInitialBillData] = useState<Bill | undefined>(undefined); // Stores data to pre-populate form for editing
  const [isModalLoading, setIsModalLoading] = useState(false); // For loading state *within* the modal (e.g., fetching bill for edit or during form submission)


  // Delete confirmation states (centralized here)
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [billToDeleteId, setBillToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // For delete alert/spinner on main page
  const [deleteError, setDeleteError] = useState<string | null>(null); // For delete specific errors

  const t = useTranslations('dashboard');
  const tGeneral = useTranslations();
  const tBillForm = useTranslations('bill_form');


  // Memoize the daily earnings calculation
  const dailySummary = useMemo(() => {
       return calculateDailyEarnings(billsForDate);
  }, [billsForDate]);


  // Function to fetch bills for the current date - Wrapped in useCallback
  const fetchBillsForDate = useCallback(async (dateToFetch: Date) => {
     if (status !== 'authenticated') {
        console.log("Dashboard Page: Not authenticated, skipping fetch.");
        return;
     }

    setLoading(true); // Set main content loading
    setError(null); // Clear main page errors before fetching

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
      
      const processedBills: Bill[] = data.bills.map((bill: any) => ({
          ...bill,
          date: format(new Date(bill.date), 'yyyy-MM-dd'), // Keep date as string for BillForm consistency
          mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
          isOurFood: bill.isOurFood ?? true,
          numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));
      setBillsForDate(processedBills);

    } catch (err: any) {
      console.error("Dashboard Page: Error fetching bills for date:", formattedDateToFetch, err);
      setError(err.message || tGeneral('errors.failed_fetch')); // Set error on main page
      setBillsForDate([]);
    } finally {
      setLoading(false); // End main content loading
    }
  }, [status, locale, tGeneral]);


  // Effect to redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (
      status === 'unauthenticated' &&
      pathname !== `/${locale}`
    ) {
      router.push(`/${locale}`);
    }
  }, [status, router, locale, pathname]);

  // Effect to fetch bills on initial load and when authentication status, locale, or currentDate changes
  useEffect(() => {
    if (status === 'authenticated') {
       console.log("Dashboard Page: Status authenticated, triggering fetch.");
      fetchBillsForDate(currentDate);
    }
  }, [status, locale, currentDate, fetchBillsForDate]);


  // --- Modal and Form Management ---

  // Define handleCloseModal first as it's a dependency for others
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingBillId(undefined); // Clear editing ID on close
    setInitialBillData(undefined); // Clear initial data on close
    setError(null); // Clear any main page error that might have been set by form submission
  }, []); // No dependencies for handleCloseModal itself, as it only sets state


  const handleOpenAddModal = () => {
    setEditingBillId(undefined); // Crucial: No bill ID means 'add' mode
    setInitialBillData(undefined); // Crucial: No initial data for a new form
    setIsModalOpen(true);
    setIsModalLoading(false); // Ensure modal loader is off initially for add
  };

  const handleOpenEditModal = useCallback(async (billId: string) => {
    setEditingBillId(billId); // Set the bill ID for editing
    setInitialBillData(undefined); // Clear previous initial data until new is fetched
    setIsModalOpen(true); // Open the modal
    setIsModalLoading(true); // Show loader *within* the modal while fetching

    try {
      const response = await fetch(`/${locale}/api/bills/${billId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      const data: Bill = await response.json();
      // Format date to ISO string for TextField type="date" and ensure consistency
      const formattedData = {
        ...data,
        date: format(new Date(data.date), 'yyyy-MM-dd'), // Ensure it's YYYY-MM-DD string
        mealType: data.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: data.isOurFood ?? true,
        numberOfPeopleWorkingDinner: data.numberOfPeopleWorkingDinner ?? 1,
      };
      setInitialBillData(formattedData); // Set initial data for the form
    } catch (err: any) {
      console.error("Dashboard Page: Error fetching bill for edit modal:", err);
      setError(err.message || tGeneral('errors.failed_fetch')); // Set error on main page
      handleCloseModal(); // Close modal if fetch fails
    } finally {
      setIsModalLoading(false); // End modal loading
    }
  }, [locale, tGeneral, handleCloseModal]); // handleCloseModal is now defined


  // This function is now called by BillForm's onSubmit
  const handleBillFormSubmit = useCallback(async (formData: Omit<Bill, 'id'>, currentBillId?: string) => {
    setIsModalLoading(true); // Show loader within the modal during submission
    setError(null); // Clear main page error before new submission

    const method = currentBillId ? 'PUT' : 'POST';
    const url = currentBillId ? `/${locale}/api/bills/${currentBillId}` : `/${locale}/api/bills`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
         const err = await res.json();
          console.error("Dashboard Page: API Error submitting bill:", err);
         throw new Error(err.error || tGeneral('errors.failed_fetch'));
      }

       console.log("Dashboard Page: Bill submitted successfully.");
      handleCloseModal(); // Close the dialog
      fetchBillsForDate(currentDate); // Refresh the list

    } catch (err: any) {
      console.error("Dashboard Page: Error submitting bill:", err);
      // Display error from API or general fetch error
      setError(err.message || (currentBillId ? tBillForm('edit_error') : tBillForm('add_error')));
    } finally {
      setIsModalLoading(false); // End modal loading
    }
  }, [locale, tGeneral, tBillForm, handleCloseModal, fetchBillsForDate, currentDate]); // Added all dependencies


   // --- Delete Confirmation --- (Centralized)
   const handleOpenConfirmDelete = (id: number) => {
        console.log("Dashboard Page: Opening delete confirm for bill ID:", id);
       setBillToDeleteId(id);
       setOpenConfirmDelete(true);
       setDeleteError(null); // Clear any previous delete errors
   };

   const handleCloseConfirmDelete = () => {
        console.log("Dashboard Page: Closing delete confirm.");
       setOpenConfirmDelete(false);
       setBillToDeleteId(null);
       setDeleteError(null); // Clear error on close
   };

   const handleDeleteBill = useCallback(async () => {
        if (billToDeleteId === null) return;

         console.log("Dashboard Page: Deleting bill with ID:", billToDeleteId);
        setOpenConfirmDelete(false); // Close dialog immediately
        setIsDeleting(true); // Set deleting state for main page loader/alert
        setDeleteError(null); // Clear previous delete errors

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
             setBillToDeleteId(null);
             fetchBillsForDate(currentDate); // Refresh the list

        } catch (err: any) {
             console.error("Dashboard Page: Error during delete fetch:", err);
             setDeleteError(err.message || tGeneral('errors.failed_fetch'));
        } finally {
            setIsDeleting(false); // End deleting state
        }
   }, [billToDeleteId, locale, tGeneral, fetchBillsForDate, currentDate]); // Added dependencies


   // --- Date Navigation ---
   const handlePreviousDay = () => {
       console.log("Dashboard Page: Navigating to previous day.");
       setCurrentDate(prevDate => subDays(prevDate, 1));
   };

   const handleNextDay = () => {
        console.log("Dashboard Page: Navigating to next day.");
       setCurrentDate(prevDate => addDays(prevDate, 1));
   };


    // --- Render Logic ---
    let content;

    // Show full-page loader for initial auth or main content loading
    if (status === 'loading' || (loading && !isModalOpen && !isDeleting)) {
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

               {/* Main page errors and info messages */}
               {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
               {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
               {isDeleting && <Alert severity="info" sx={{ mb: 2 }}>{tGeneral('edit.deleting')}</Alert>}

               <Box sx={{ mb: 3 }}>
                 <Button variant="contained" onClick={handleOpenAddModal}>
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
                      {t('summary_for_date', { date: formattedCurrentDate })}
                    </Typography>
                    <IconButton onClick={handleNextDay} aria-label="next day"
                         sx={{ color: 'inherit' }}
                    >
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>


               {loading && ( // Only show loader for main content, not when modal is open for editing/adding
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
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenConfirmDelete}
                  />
               ) : !loading && (
                 <Typography sx={{mt: 2}}>
                   {t('no_entries_today')}
                 </Typography>
               )}

               {/* Add/Edit Bill Dialog */}
               <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
                 <DialogTitle>
                   {editingBillId ? tBillForm('edit_title') : tBillForm('add_title')}
                   <IconButton
                     aria-label="close"
                     onClick={handleCloseModal}
                     sx={{
                       position: 'absolute',
                       right: 8,
                       top: 8,
                       color: (theme) => theme.palette.grey[500],
                     }}
                   >
                     <CloseIcon />
                   </IconButton>
                 </DialogTitle>
                 <DialogContent dividers>
                   <BillForm
                     key={editingBillId || 'add-bill-form'}
                     billId={editingBillId}
                     initialBill={initialBillData}
                     onSubmit={handleBillFormSubmit}
                     isSubmitting={isModalLoading}
                   />
                 </DialogContent>
               </Dialog>

                   {/* Delete Confirmation Dialog - Centralized here */}
                   <Dialog
                       open={openConfirmDelete}
                       onClose={handleCloseConfirmDelete}
                       aria-labelledby="alert-dialog-title"
                       aria-describedby="alert-dialog-description"
                   >
                       <DialogTitle id="alert-dialog-title">{tGeneral('edit.delete_confirm_title')}</DialogTitle>
                       <DialogContent>
                       <DialogContentText id="alert-dialog-description">
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
           content
    );
};

export default DashboardPageClient;
