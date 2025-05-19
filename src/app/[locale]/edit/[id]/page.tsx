// src/app/[locale]/edit/[id]/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import BillForm from '@/components/BillForm';
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

import { useTranslations } from 'next-intl';

// Import the updated Bill interface
import { Bill } from '@/types/Bill';


export default function EditBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string; // Ensure locale is a string
  const billId = params.id as string; // Get the bill ID from the URL params

  const [billData, setBillData] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true); // Start loading immediately
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for form submission
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = useTranslations('edit'); // Translations for the edit page
   const tGeneral = useTranslations(); // General translations for errors, etc.
   const tDashboard = useTranslations('dashboard'); // For adding bill back button


  // Effect to redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}`);
    }
  }, [status, router, locale]);

  // Effect to fetch the bill data when the component mounts or billId/locale changes
  useEffect(() => {
    const fetchBill = async () => {
      if (status !== 'authenticated' || !billId) {
           setLoading(false); // Stop loading if not authenticated or no ID
           setError(t('bill_not_found')); // Indicate bill not found if no ID
           return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/${locale}/api/bills/${billId}`);

        if (!res.ok) {
          const err = await res.json();
           // Use specific error message from API if available, fallback to translation
          throw new Error(err.error || tGeneral('errors.failed_fetch'));
        }

        const data: Bill = await res.json();
         // Process fetched data to ensure correct types for form state
         // mealType from DB will be Enum ('LUNCH'/'DINNER'), form expects string ('lunch'/'dinner')
         // date from DB will be Date object, form expects 'yyyy-MM-dd' string
         // isOurFood and numberOfPeopleWorkingDinner might be null from DB, form expects boolean/number with defaults
        const processedData: Bill = {
            ...data,
            date: data.date instanceof Date ? data.date : new Date(data.date), // Ensure date is Date object
            mealType: data.mealType.toString().toLowerCase() as 'lunch' | 'dinner', // Map Enum to string
            isOurFood: data.isOurFood ?? true, // Default to true if null/undefined
            numberOfPeopleWorkingDinner: data.numberOfPeopleWorkingDinner ?? 1, // Default to 1 if null/undefined
        };
        setBillData(processedData);

      } catch (err: any) {
         console.error("Error fetching bill:", err);
         // Use translation for error message
         setError(err.message || t('bill_not_found')); // Use bill not found translation as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId, locale, status]); // Dependencies: billId, locale, status


  // Handler for form submission (Update Bill)
  const handleFormSubmit = async (formData: Omit<Bill, 'id'>) => {
      if (!billId) return; // Cannot submit if no bill ID

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
         // Use specific error message from API if available, fallback to translation
        throw new Error(err.error || t('update_bill_error', { error: '' })); // Use translation with potential error detail
      }

      // If successful, navigate back to dashboard or summary
       // Using router.back() might be simplest
       router.back();
       // Or redirect to dashboard: router.push(`/${locale}/dashboard`);

    } catch (err: any) {
       console.error("Error updating bill:", err);
       setError(err.message || t('update_bill_error', { error: '' })); // Use translation
    } finally {
      setIsSubmitting(false);
    }
  };

   // Handlers for Delete Confirmation Dialog
   const handleOpenConfirmDelete = () => {
       setOpenConfirmDelete(true);
   };

   const handleCloseConfirmDelete = () => {
       setOpenConfirmDelete(false);
   };

   // Handler for Deleting Bill
   const handleDeleteBill = async () => {
        if (!billId) return;

        setOpenConfirmDelete(false);
        setIsDeleting(true);
        setError(null);

        try {
            const res = await fetch(`/${locale}/api/bills/${billId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                 // Use specific error message from API if available, fallback to translation
                throw new Error(err.error || t('delete_bill_error', { error: '' })); // Use translation
            }

             // If successful, navigate back to dashboard or summary
             // Using router.back() might be simplest
             router.back();
             // Or redirect to dashboard: router.push(`/${locale}/dashboard`);

        } catch (err: any) {
             console.error("Error deleting bill:", err);
             setError(err.message || t('delete_bill_error', { error: '' })); // Use translation
        } finally {
            setIsDeleting(false);
        }
   };


  // Render loading state while fetching bill data
  if (loading || status === 'loading') {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Render error message if fetching failed or bill not found
  if (error || !billData) {
      return (
           <Layout>
               <Typography variant="h5" color="error" sx={{mt: 3}}>
                  {error || t('bill_not_found')} {/* Display error or bill not found message */}
               </Typography>
                {/* Optional: Button to go back to dashboard */}
               <Box sx={{mt: 2}}>
                   <Button variant="contained" onClick={() => router.push(`/${locale}/dashboard`)}>
                       {tDashboard('dashboard')} {/* Button to go back to Dashboard */}
                   </Button>
               </Box>
           </Layout>
      );
  }


  // Render the form when bill data is loaded and authenticated
  if (status === 'authenticated' && billData) {
    return (
      <Layout>
        <Typography variant="h4" gutterBottom>
          {t('title')} {/* Use translation for page title */}
        </Typography>

        {/* BillForm for editing */}
        <BillForm
          initialData={billData} // Pass the fetched bill data to the form
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />

         {/* Delete Bill Button */}
         <Box sx={{mt: 3}}>
             <Button variant="outlined" color="error" onClick={handleOpenConfirmDelete}>
                 {t('delete_bill')} {/* Use translation */}
             </Button>
         </Box>


         {/* Confirmation Dialog for Deletion */}
            <Dialog
                open={openConfirmDelete}
                onClose={handleCloseConfirmDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{t('delete_confirm_title')}</DialogTitle> {/* Use translation */}
                <DialogContent>
                <DialogContentText id="alert-dialog-description">
                   {t('delete_confirm_message', { id: billId })} {/* Use translation with bill ID */}
                </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDelete} disabled={isDeleting}>{tGeneral('edit.cancel')}</Button> {/* Use general translation */}
                    <Button onClick={handleDeleteBill} color="error" autoFocus disabled={isDeleting}>
                        {isDeleting ? <CircularProgress size={24} /> : t('delete')} {/* Use translation */}
                    </Button>
                </DialogActions>
            </Dialog>

      </Layout>
    );
  }

  return null; // Should ideally not reach here if auth status is handled
}
