"use client";

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import BillForm, { BillFormData } from '@/components/BillForm'; // Import BillFormData
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
import { format } from 'date-fns'; // Import format for date formatting

import { Bill } from '@/types/Bill'; // Assuming Bill interface is here


export default function EditBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const billId = params.id as string; // Get the bill ID from dynamic route params

  const [billData, setBillData] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const t = useTranslations('edit');
  const tGeneral = useTranslations();


  // Function to fetch the specific bill data
  const fetchBillData = useCallback(async () => {
     if (status !== 'authenticated') {
        console.log("Edit Page: Not authenticated, skipping fetch.");
        return;
     }

    setLoading(true);
    setError(null);
    setBillData(null);

     console.log(`Edit Page: Fetching bill with ID: ${billId}`);

    try {
      const res = await fetch(`/${locale}/api/bills/${billId}`);
       if (!res.ok) {
           const err = await res.json();
            console.error("Edit Page: API Error fetching bill:", err);
           throw new Error(err.error || tGeneral('errors.failed_fetch'));
       }
      const data: Bill = await res.json(); // Assuming API returns Bill type
       console.log("Edit Page: Fetched bill data:", data);
      setBillData(data);

    } catch (err: any) {
      console.error("Edit Page: Error fetching bill:", billId, err);
      setError(err.message || tGeneral('errors.failed_fetch'));
    } finally {
      setLoading(false);
    }
  }, [status, locale, billId, tGeneral]);


  // Effect to redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log("Edit Page: User unauthenticated, redirecting to login.");
      router.push(`/${locale}`);
    }
  }, [status, router, locale]);

  // Effect to fetch bill data on initial load and when authentication status or locale changes
  useEffect(() => {
    if (status === 'authenticated' && billId) {
       console.log("Edit Page: Status authenticated and billId available, triggering fetch.");
      fetchBillData();
    }
  }, [status, locale, billId, fetchBillData]);


  const handleFormSubmit = async (formData: BillFormData) => {
     console.log("Edit Page: Submitting updated bill:", formData);
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
          console.error("Edit Page: API Error updating bill:", err);
         throw new Error(err.error || t('update_bill_error', { error: '' }));
      }

       console.log("Edit Page: Bill updated successfully.");
      // Redirect back to dashboard or summary page after successful update
      router.push(`/${locale}/dashboard`); // Or /${locale}/summary
    } catch (err: any) {
      console.error("Edit Page: Error updating bill:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleOpenConfirmDelete = () => {
        console.log("Edit Page: Opening delete confirm for bill ID:", billId);
       setOpenConfirmDelete(true);
   };

   const handleCloseConfirmDelete = () => {
        console.log("Edit Page: Closing delete confirm.");
       setOpenConfirmDelete(false);
   };

   const handleDeleteBill = async () => {
        console.log("Edit Page: Deleting bill with ID:", billId);
        setOpenConfirmDelete(false); // Close dialog immediately
        setIsDeleting(true);
        setError(null);

        try {
            const res = await fetch(`/${locale}/api/bills/${billId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                 console.error("Edit Page: API Error deleting bill:", err);
                throw new Error(err.error || t('delete_bill_error', { error: '' }));
            }

             console.log("Edit Page: Bill deleted successfully.");
             // Redirect back to dashboard or summary after deletion
             router.push(`/${locale}/dashboard`); // Or /${locale}/summary

        } catch (err: any) {
             console.error("Edit Page: Error during delete fetch:", err);
             setError(err.message || tGeneral('errors.failed_fetch'));
        } finally {
            setIsDeleting(false);
        }
   };


    // --- Conditional Rendering ---

    if (status === 'loading' || loading) {
        return (
            <Layout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    if (error) {
        return (
             <Layout>
                 <Alert severity="error">{error}</Alert>
                 <Button onClick={() => fetchBillData()} sx={{mt: 2}}>{tGeneral('retry')}</Button>
             </Layout>
        );
    }

    if (!billData) {
         return (
             <Layout>
                 <Alert severity="warning">{t('bill_not_found')}</Alert>
             </Layout>
         );
    }

    // If authenticated, not loading, no error, and billData is available
    // Map billData to BillFormData format for the form
    const initialFormData: BillFormData = {
        // Ensure date is formatted to 'yyyy-MM-dd' string
        date: billData.date instanceof Date ? format(billData.date, 'yyyy-MM-dd') : format(new Date(billData.date), 'yyyy-MM-dd'),
        mealType: billData.mealType.toString().toLowerCase() as 'lunch' | 'dinner', // Ensure lowercase string
        foodAmount: billData.foodAmount,
        drinkAmount: billData.drinkAmount,
         // Ensure isOurFood is boolean, default to true if null/undefined
        isOurFood: billData.isOurFood ?? true,
         // Ensure numberOfPeopleWorkingDinner is number, default to 1
        numberOfPeopleWorkingDinner: billData.numberOfPeopleWorkingDinner ?? 1,
    };


    return (
       <Layout>
            <Typography variant="h4" gutterBottom>
              {t('edit_bill_title', { id: billId })}
            </Typography>

            {isDeleting && <Alert severity="info" sx={{ mb: 2 }}>{tGeneral('edit.deleting')}</Alert>}

            {/* BillForm for editing */}
            <BillForm
              initialData={initialFormData} // Pass the mapped and formatted data
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />

             <Box sx={{ mt: 3 }}>
                 <Button
                     variant="outlined"
                     color="error"
                     onClick={handleOpenConfirmDelete}
                     disabled={isSubmitting || isDeleting}
                 >
                     {tGeneral('edit.delete')}
                 </Button>
             </Box>

             <Dialog
                 open={openConfirmDelete}
                 onClose={handleCloseConfirmDelete}
                 aria-labelledby="alert-dialog-title"
                 aria-describedby="alert-dialog-description"
             >
                 <DialogTitle id="alert-dialog-title">{tGeneral('edit.delete_confirm_title')}</DialogTitle>
                 <DialogContent>
                 <DialogContentText id="alert-dialog-description">
                     {/* Use billId directly as it's a string */}
                     {tGeneral('edit.delete_confirm_message', { id: billId })}
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
  }
