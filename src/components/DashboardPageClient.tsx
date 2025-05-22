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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | undefined>(undefined);
  const [initialBillData, setInitialBillData] = useState<Bill | undefined>(undefined);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [billToDeleteId, setBillToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const t = useTranslations('dashboard');
  const tGeneral = useTranslations();
  const tBillForm = useTranslations('bill_form');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const dailySummary = useMemo(() => {
    return calculateDailyEarnings(billsForDate);
  }, [billsForDate]);

  const fetchBillsForDate = useCallback(async (dateToFetch: Date) => {
    if (status !== 'authenticated') {
      return;
    }

    setLoading(true);
    setError(null);

    const formattedDateToFetch = format(dateToFetch, 'yyyy-MM-dd');

    try {
      const res = await fetch(`/${locale}/api/reports?from=${formattedDateToFetch}&to=${formattedDateToFetch}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tGeneral('errors.failed_fetch'));
      }
      const data = await res.json();

      const processedBills: Bill[] = data.bills.map((bill: any) => ({
        ...bill,
        date: format(new Date(bill.date), 'yyyy-MM-dd'),
        mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: bill.isOurFood ?? true,
        numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));
      setBillsForDate(processedBills);

    } catch (err: any) {
      setError(err.message || tGeneral('errors.failed_fetch'));
      setBillsForDate([]);
    } finally {
      setLoading(false);
    }
  }, [status, locale, tGeneral]);

  useEffect(() => {
    if (status === 'loading') return;
    if (
      status === 'unauthenticated' &&
      pathname !== `/${locale}`
    ) {
      router.push(`/${locale}`);
    }
  }, [status, router, locale, pathname]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBillsForDate(currentDate);
    }
  }, [status, locale, currentDate, fetchBillsForDate]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingBillId(undefined);
    setInitialBillData(undefined);
    setError(null);
  }, []);

  const handleOpenAddModal = () => {
    setEditingBillId(undefined);
    setInitialBillData(undefined);
    setIsModalOpen(true);
    setIsModalLoading(false);
  };

  const handleOpenEditModal = useCallback(async (billId: string) => {
    setEditingBillId(billId);
    setInitialBillData(undefined);
    setIsModalOpen(true);
    setIsModalLoading(true);

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
      };
      setInitialBillData(formattedData);
    } catch (err: any) {
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
      fetchBillsForDate(currentDate);

    } catch (err: any) {
      setError(err.message || (currentBillId ? tBillForm('edit_error') : tBillForm('add_error')));
    } finally {
      setIsModalLoading(false);
    }
  }, [locale, tGeneral, tBillForm, handleCloseModal, fetchBillsForDate, currentDate]);

  const handleOpenConfirmDelete = (id: number) => {
    setBillToDeleteId(id);
    setOpenConfirmDelete(true);
    setDeleteError(null);
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setBillToDeleteId(null);
    setDeleteError(null);
  };

  const handleDeleteBill = useCallback(async () => {
    if (billToDeleteId === null) return;

    setOpenConfirmDelete(false);
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/${locale}/api/bills/${billToDeleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tGeneral('edit.delete_bill_error', { error: '' }));
      }

      setBillToDeleteId(null);
      fetchBillsForDate(currentDate);

    } catch (err: any) {
      setDeleteError(err.message || tGeneral('errors.failed_fetch'));
    } finally {
      setIsDeleting(false);
    }
  }, [billToDeleteId, locale, tGeneral, fetchBillsForDate, currentDate]);

  const handlePreviousDay = () => {
    setCurrentDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };

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
