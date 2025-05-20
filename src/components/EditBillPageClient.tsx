    "use client";

    import React, { useState, useEffect } from 'react';
    import { Box, Typography, CircularProgress, Alert } from '@mui/material';
    import BillForm from '@/components/BillForm'; // Assuming your BillForm component exists
    import { useTranslations } from 'next-intl';
    import { useParams, useRouter } from 'next/navigation';
    import { Bill } from '@/types/Bill'; // Assuming your Bill type exists

    interface EditBillPageClientProps {
      billId: string; // Pass the ID as a prop from the server component
    }

    const EditBillPageClient: React.FC<EditBillPageClientProps> = ({ billId }) => {
      const t = useTranslations('bill_form');
      const tErrors = useTranslations('errors');
      const params = useParams();
      const router = useRouter();
      const locale = params.locale as string;

      const [bill, setBill] = useState<Bill | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        const fetchBill = async () => {
          try {
            const res = await fetch(`/${locale}/api/bills/${billId}`);
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || tErrors('failed_fetch'));
            }
            const data = await res.json();
            // Ensure the date is formatted correctly for the input type="date"
            setBill({
              ...data,
              date: new Date(data.date), // Convert string to Date object
              mealType: data.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
            });
          } catch (err: any) {
            console.error("Error fetching bill for edit:", err);
            setError(err.message || tErrors('failed_fetch'));
          } finally {
            setLoading(false);
          }
        };

        fetchBill();
      }, [billId, locale, tErrors]);

      const handleSave = async (updatedBill: Omit<Bill, 'id'>) => {
        try {
          const res = await fetch(`/${locale}/api/bills/${billId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updatedBill,
              date: updatedBill.date.toISOString().split('T')[0], // Ensure date is YYYY-MM-DD string
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || tErrors('edit_error', { error: 'Unknown error' }));
          }

          alert(t('edit_success'));
          router.push(`/${locale}/dashboard`); // Redirect after successful save
        } catch (err: any) {
          console.error("Error saving bill:", err);
          setError(err.message || tErrors('edit_error', { error: err.message }));
        }
      };

      const handleCancel = () => {
        router.back(); // Go back to the previous page (e.g., dashboard)
      };

      if (loading) {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        );
      }

      if (error) {
        return (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
            <Button onClick={handleCancel} sx={{ mt: 2 }}>{t('cancel_button')}</Button>
          </Box>
        );
      }

      if (!bill) {
        return (
          <Box sx={{ p: 3 }}>
            <Alert severity="warning">{t('bill_not_found')}</Alert> {/* Add this translation key */}
            <Button onClick={handleCancel} sx={{ mt: 2 }}>{t('cancel_button')}</Button>
          </Box>
        );
      }

      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>{t('edit_title')}</Typography>
          <BillForm initialBill={bill} onSave={handleSave} onCancel={handleCancel} />
        </Box>
      );
    };

    export default EditBillPageClient;
    