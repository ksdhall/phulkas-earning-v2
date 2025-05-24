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
import { useTheme, useMediaQuery } from '@mui/material';

import { format, addDays, subDays, parseISO, isValid } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { useTranslations } from 'next-intl';

import { Bill } from '@/types/Bill';
import { calculateDailyEarnings } from '@/lib/calculations';
import { useAppConfig } from '@/context/AppConfigContext'; // Import useAppConfig

interface DashboardPageClientProps {
  locale: string;
  initialBills: Bill[];
  initialDate?: string;
  initialError?: string | null;
}

const DashboardPageClient: React.FC<DashboardPageClientProps> = ({
  locale,
  initialBills,
  initialDate,
  initialError,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const appConfig = useAppConfig(); // CRITICAL: Get app config from context

  const [currentDate, setCurrentDate] = useState<Date>(
    initialDate && isValid(parseISO(initialDate)) ? parseISO(initialDate) : new Date()
  );

  const dateFnsLocale = useMemo(() => {
    return locale === 'ja' ? ja : enUS;
  }, [locale]);

  const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd', { locale: dateFnsLocale });

  const [billsForDate, setBillsForDate] = useState<Bill[]>(initialBills);
  const [loading, setLoading] = useState(false); // This loading is for client-side operations
  const [error, setError] = useState<string | null>(initialError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | undefined>(undefined);
  const [initialBillData, setInitialBillData] = useState<Bill | undefined>(undefined);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [billToDeleteId, setBillToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const t = useTranslations('dashboard');
  const tGeneral = useTranslations();
  const tBillForm = useTranslations('bill_form');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // This is where the summary is calculated from the fetched bills
  const dailySummary = useMemo(() => {
    return calculateDailyEarnings(billsForDate, appConfig); // CRITICAL: Pass appConfig
  }, [billsForDate, appConfig]);

  useEffect(() => {
    setBillsForDate(initialBills);
    setError(initialError);
    setCurrentDate(initialDate && isValid(parseISO(initialDate)) ? parseISO(initialDate) : new Date());
    setDeleteError(null);
  }, [initialBills, initialError, initialDate]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' && pathname !== `/${locale}`) {
      router.push(`/${locale}`);
    }
  }, [status, router, locale, pathname]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingBillId(undefined);
    setInitialBillData(undefined);
    setError(null);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditingBillId(undefined);
    setInitialBillData(undefined);
    setIsModalOpen(true);
    setIsModalLoading(false);
    setError(null);
  }, []);

  const handleOpenEditModal = useCallback(async (billId: string) => {
    setEditingBillId(billId);
    setInitialBillData(undefined);
    setIsModalOpen(true);
    setIsModalLoading(true);
    setError(null);

    try {
      const response = await fetch(`/${locale}/api/bills/${billId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      const data: Bill = await response.json();
      const formattedData = {
        ...data,
        date: format(new Date(data.date), 'yyyy-MM-dd'),
        mealType: data.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: data.isOurFood ?? true,
        numberOfPeopleWorkingDinner: data.numberOfPeopleWorkingDinner ?? 1,
        comments: data.comments ?? '',
      };
      setInitialBillData(formattedData);
    } catch (err: any) {
      console.error("Error fetching bill for edit:", err);
      setError(err.message || tGeneral('errors.failed_fetch'));
      handleCloseModal();
    } finally {
      setIsModalLoading(false);
    }
  }, [locale, tGeneral, handleCloseModal]);

  const handleBillFormSubmit = useCallback(async (formData: Omit<Bill, 'id'>, currentBillId?: string) => {
    setIsModalLoading(true);
    setError(null);

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
        throw new Error(err.error || tGeneral('errors.failed_fetch'));
      }

      handleCloseModal();
      router.push(`/${locale}/dashboard?date=${formattedCurrentDate}`);

    } catch (err: any) {
      console.error("Error submitting bill form:", err);
      setError(err.message || (currentBillId ? tBillForm('edit_error') : tBillForm('add_error')));
    } finally {
      setIsModalLoading(false);
    }
  }, [locale, tGeneral, tBillForm, handleCloseModal, formattedCurrentDate, router]);

  const handleOpenConfirmDelete = useCallback((id: string) => {
    setBillToDeleteId(id);
    setOpenConfirmDelete(true);
    setDeleteError(null);
  }, []);

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setBillToDeleteId(null);
    setDeleteError(null);
  }, []);

  const handleDeleteBill = useCallback(async () => {
    const idToDelete = billToDeleteId;
    if (!idToDelete) return;

    setOpenConfirmDelete(false);
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/${locale}/api/bills/${idToDelete}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tGeneral('edit.delete_bill_error', { error: '' }));
      }

      setBillToDeleteId(null);
      router.push(`/${locale}/dashboard?date=${formattedCurrentDate}`);

    } catch (err: any) {
      console.error("Error deleting bill:", err);
      setDeleteError(err.message || tGeneral('errors.failed_fetch'));
    } finally {
      setIsDeleting(false);
    }
  }, [billToDeleteId, locale, tGeneral, formattedCurrentDate, router]);

  const handlePreviousDay = useCallback(() => {
    const newDate = subDays(currentDate, 1);
    router.push(`/${locale}/dashboard?date=${format(newDate, 'yyyy-MM-dd')}`);
  }, [currentDate, locale, router]);

  const handleNextDay = useCallback(() => {
    const newDate = addDays(currentDate, 1);
    router.push(`/${locale}/dashboard?date=${format(newDate, 'yyyy-MM-dd')}`);
  }, [currentDate, locale, router]);

  let content;

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
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{ flexGrow: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {t('summary_for_date', { date: formattedCurrentDate })}
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
            onEdit={handleOpenEditModal}
            onDelete={handleOpenConfirmDelete}
          />
        ) : !loading && (
          <Typography sx={{ mt: 2 }}>
            {t('no_entries_today')}
          </Typography>
        )}

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
              defaultDate={currentDate}
              onCancel={handleCloseModal}
            />
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
              {tGeneral('edit.delete_confirm_message', { id: billToDeleteId ?? '' })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDelete} disabled={isDeleting}>{tGeneral('general.cancel')}</Button>
            <Button onClick={handleDeleteBill} color="error" autoFocus disabled={isDeleting}>
              {isDeleting ? <CircularProgress size={24} /> : tGeneral('general.delete')}</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  } else {
    content = null;
  }

  return content;
};

export default DashboardPageClient;
