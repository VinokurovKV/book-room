import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { cancelBooking, getBookings, getOffices } from '../api/client';
import type { Booking, Office } from '../api/types';
import { DatePickerButton } from '../components/DatePickerButton';

type BookingsStatus = 'loading' | 'success' | 'error';
type BookingsScope = 'upcoming' | 'past';

export function BookingsPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<BookingsStatus>('loading');
  const [scope, setScope] = useState<BookingsScope>('upcoming');
  const [officeId, setOfficeId] = useState('');
  const [date, setDate] = useState('');
  const [officeMenuAnchor, setOfficeMenuAnchor] = useState<null | HTMLElement>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [cancelError, setCancelError] = useState('');
  const selectedOffice = offices.find((office) => office.id === officeId);
  const visibleBookings = date
    ? bookings.filter((booking) => isSameDate(booking.startsAt, date))
    : bookings;

  useEffect(() => {
    getOffices()
      .then((loadedOffices) => {
        setOffices(loadedOffices);
      })
      .catch(() => {
        setOffices([]);
      });
  }, []);

  useEffect(() => {
    setStatus('loading');

    getBookings(scope, officeId)
      .then((loadedBookings) => {
        setBookings(loadedBookings);
        setStatus('success');
      })
      .catch(() => {
        setBookings([]);
        setStatus('error');
      });
  }, [officeId, scope]);

  function reloadBookings() {
    setStatus('loading');

    getBookings(scope, officeId)
      .then((loadedBookings) => {
        setBookings(loadedBookings);
        setStatus('success');
      })
      .catch(() => {
        setBookings([]);
        setStatus('error');
      });
  }

  function selectOffice(nextOfficeId: string) {
    setOfficeId(nextOfficeId);
    setOfficeMenuAnchor(null);
  }

  function openCancelDialog(booking: Booking) {
    setBookingToCancel(booking);
    setCancelStatus('idle');
    setCancelError('');
  }

  function closeCancelDialog() {
    if (cancelStatus === 'loading') {
      return;
    }

    setBookingToCancel(null);
  }

  function confirmCancelBooking() {
    if (!bookingToCancel) {
      return;
    }

    setCancelStatus('loading');
    setCancelError('');

    cancelBooking(bookingToCancel.id)
      .then(() => {
        setBookings((currentBookings) =>
          currentBookings.filter((booking) => booking.id !== bookingToCancel.id),
        );
        setBookingToCancel(null);
      })
      .catch((error) => {
        setCancelStatus('error');
        setCancelError(error instanceof Error ? error.message : 'Не удалось отменить бронирование');
      });
  }

  if (status === 'loading') {
    return <BookingsLoadingPage />;
  }

  return (
    <Container maxWidth="xl" sx={{ paddingTop: 5, paddingBottom: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" fontWeight={700}>
          Мои бронирования
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={(event) => setOfficeMenuAnchor(event.currentTarget)}
            sx={{ color: '#344054', borderColor: '#d0d5dd' }}
          >
            {selectedOffice ? selectedOffice.name : 'Все офисы'}
          </Button>
          <Menu
            anchorEl={officeMenuAnchor}
            open={Boolean(officeMenuAnchor)}
            onClose={() => setOfficeMenuAnchor(null)}
          >
            <MenuItem onClick={() => selectOffice('')}>Все офисы</MenuItem>
            {offices.map((office) => (
              <MenuItem key={office.id} onClick={() => selectOffice(office.id)}>
                {office.name}
              </MenuItem>
            ))}
          </Menu>

          <DatePickerButton value={date} onChange={setDate} placeholder="За все время" allowPast />
          {date && (
            <Button
              variant="outlined"
              onClick={() => setDate('')}
              sx={{ color: '#344054', borderColor: '#d0d5dd' }}
            >
              За все время
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={3} sx={{ marginTop: 4, borderBottom: '1px solid #dce2ea' }}>
        <Button
          onClick={() => setScope('upcoming')}
          className={scope === 'upcoming' ? 'bookings-tab active' : 'bookings-tab'}
        >
          Предстоящие {scope === 'upcoming' ? `(${visibleBookings.length})` : ''}
        </Button>
        <Button
          onClick={() => setScope('past')}
          className={scope === 'past' ? 'bookings-tab active' : 'bookings-tab'}
        >
          Прошедшие {scope === 'past' ? `(${visibleBookings.length})` : ''}
        </Button>
      </Stack>

      {status === 'error' && <BookingsErrorState onReload={reloadBookings} />}

      {status === 'success' && visibleBookings.length === 0 && <BookingsEmptyState scope={scope} />}

      {status === 'success' && visibleBookings.length > 0 && (
        <Stack spacing={2.5} sx={{ marginTop: 4 }}>
          {visibleBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              canCancel={scope === 'upcoming'}
              onCancel={openCancelDialog}
            />
          ))}
        </Stack>
      )}

      <CancelBookingDialog
        booking={bookingToCancel}
        status={cancelStatus}
        error={cancelError}
        onClose={closeCancelDialog}
        onConfirm={confirmCancelBooking}
      />
    </Container>
  );
}

function BookingCard({
  booking,
  canCancel,
  onCancel,
}: {
  booking: Booking;
  canCancel: boolean;
  onCancel: (booking: Booking) => void;
}) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ padding: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              backgroundColor: '#f2f5f9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary" fontSize={12} fontWeight={700}>
              {getMonth(booking.startsAt)}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {getDay(booking.startsAt)}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {booking.title}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ marginTop: 1 }}>
              <MeetingRoomIcon fontSize="small" color="action" />
              <Typography fontWeight={700} sx={{ color: '#0f9d8f' }}>
                {booking.room.name}
              </Typography>
              <Typography color="text.secondary">·</Typography>
              <Typography color="text.secondary">{booking.room.floor} этаж</Typography>
              <Typography color="text.secondary">·</Typography>
              <Typography color="text.secondary">{formatTimeRange(booking.startsAt, booking.endsAt)} MSK</Typography>
            </Stack>
          </Box>

          {canCancel && (
            <Button variant="outlined" color="error" onClick={() => onCancel(booking)}>
              Отменить
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function CancelBookingDialog({
  booking,
  status,
  error,
  onClose,
  onConfirm,
}: {
  booking: Booking | null;
  status: 'idle' | 'loading' | 'error';
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!booking) {
    return null;
  }

  return (
    <Dialog
      open={Boolean(booking)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontSize: 24, fontWeight: 700, paddingBottom: 1 }}>
        Отменить бронирование?
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Typography color="text.secondary">
            Это действие нельзя будет отменить. Освободившееся время станет доступно другим сотрудникам.
          </Typography>

          <Box sx={{ backgroundColor: '#f4f6f8', borderRadius: 2, padding: 2 }}>
            <Typography fontWeight={700} sx={{ marginBottom: 1.5 }}>
              {booking.title}
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MeetingRoomIcon fontSize="small" color="action" />
                <Typography color="text.secondary">
                  Комната '{booking.room.name}', {booking.room.floor} этаж
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography color="text.secondary">
                  {formatDate(booking.startsAt)}, {formatTimeRange(booking.startsAt, booking.endsAt)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {status === 'error' && (
            <Typography color="error" fontWeight={700}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ padding: 3, paddingTop: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{ color: '#667085', borderColor: '#d0d5dd' }}
        >
          Нет, оставить
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={status === 'loading'}
        >
          Да, отменить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BookingSkeleton() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ padding: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Skeleton variant="rounded" width={80} height={80} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width={380} height={32} />
            <Skeleton width={420} height={28} />
          </Box>
          <Skeleton variant="rounded" width={110} height={42} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function BookingsLoadingPage() {
  return (
    <Container maxWidth="xl" sx={{ paddingTop: 5, paddingBottom: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton width={320} height={56} />
        <Stack direction="row" spacing={1.5}>
          <Skeleton variant="rounded" width={170} height={40} />
          <Skeleton variant="rounded" width={180} height={40} />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={3} sx={{ marginTop: 4, borderBottom: '1px solid #dce2ea', paddingBottom: 1.75 }}>
        <Skeleton width={170} height={32} />
        <Skeleton width={130} height={32} />
      </Stack>

      <Stack spacing={2.5} sx={{ marginTop: 4 }}>
        <BookingSkeleton />
        <BookingSkeleton />
      </Stack>
    </Container>
  );
}

function BookingsEmptyState({ scope }: { scope: BookingsScope }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ paddingTop: 18, textAlign: 'center' }}>
      <Box className="no-office-state-icon">
        <EventBusyIcon fontSize="large" />
      </Box>
      <Typography variant="h4" fontWeight={700}>
        Нет бронирований
      </Typography>
      <Typography color="text.secondary">
        {scope === 'upcoming'
          ? 'У вас пока нет предстоящих бронирований.'
          : 'У вас пока нет прошедших бронирований.'}
        <br />
        Перейдите в раздел переговорных, чтобы забронировать комнату.
      </Typography>
      <Button component={Link} to="/rooms" variant="contained" className="card-book-button">
        Перейти к переговорным
      </Button>
    </Stack>
  );
}

function BookingsErrorState({ onReload }: { onReload: () => void }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ paddingTop: 18, textAlign: 'center' }}>
      <Box className="error-state-icon">
        <WarningAmberIcon fontSize="large" />
      </Box>
      <Typography variant="h4" fontWeight={700}>
        Не удалось загрузить данные
      </Typography>
      <Typography color="text.secondary">
        Произошла ошибка при загрузке ваших бронирований
      </Typography>
      <Button variant="contained" className="card-book-button" onClick={onReload}>
        Попробовать снова
      </Button>
    </Stack>
  );
}

function getMonth(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long' })
    .format(new Date(value))
    .toUpperCase();
}

function getDay(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric' }).format(new Date(value));
}

function isSameDate(dateTime: string, date: string) {
  return new Date(dateTime).toISOString().slice(0, 10) === date;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(value));
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}
