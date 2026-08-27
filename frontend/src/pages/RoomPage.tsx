import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import TvIcon from '@mui/icons-material/Tv';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { createBooking, getRoom } from '../api/client';
import type { Room } from '../api/types';

const dayHours = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export function RoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [date, setDate] = useState(getTomorrowDate());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('15:00');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [bookingComment, setBookingComment] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingError, setBookingError] = useState('');
  const [formWasSubmitted, setFormWasSubmitted] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingSuccessText, setBookingSuccessText] = useState('');

  useEffect(() => {
    if (!roomId) {
      return;
    }

    setIsLoading(true);
    setIsError(false);

    getRoom(roomId)
      .then((loadedRoom) => {
        setRoom(loadedRoom);
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [roomId]);

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ paddingTop: 4, paddingBottom: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Загрузка комнаты...
        </Typography>
      </Container>
    );
  }

  if (isError || !room) {
    return (
      <Container maxWidth="xl" sx={{ paddingTop: 4, paddingBottom: 4 }}>
        <Stack alignItems="center" spacing={2} sx={{ paddingTop: 16, textAlign: 'center' }}>
          <Box className="error-state-icon">
            <WarningAmberIcon fontSize="large" />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            Не удалось загрузить комнату
          </Typography>
          <Typography color="text.secondary">
            Попробуйте вернуться к списку переговорных
          </Typography>
          <Button component={Link} to="/rooms" variant="contained" className="card-book-button">
            К переговорным
          </Button>
        </Stack>
      </Container>
    );
  }

  function openBookingDialog() {
    setBookingStatus('idle');
    setBookingError('');
    setFormWasSubmitted(false);
    setIsBookingOpen(true);
  }

  function submitBooking() {
    if (!room) {
      return;
    }

    setFormWasSubmitted(true);

    const validationErrors = getBookingValidationErrors(bookingTitle, date, bookingStartTime);

    if (validationErrors.title || validationErrors.date) {
      return;
    }

    const startsAt = new Date(`${date}T${bookingStartTime}:00`);
    const endsAt = new Date(startsAt.getTime() + Number(bookingDuration) * 60 * 1000);

    setBookingStatus('loading');
    setBookingError('');

    createBooking({
      roomId: room.id,
      title: bookingTitle,
      comment: bookingComment,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    })
      .then(() => {
        setBookingStatus('success');
        setBookingSuccessText(`${room.name}, ${formatDate(date)}, ${bookingStartTime}-${getBookingEndTime(bookingStartTime, bookingDuration)} MSK`);
        setIsBookingOpen(false);
        setShowBookingSuccess(true);
      })
      .catch((error) => {
        setBookingStatus('error');
        setBookingError(error instanceof Error ? error.message : 'Не удалось создать бронь');
      });
  }

  const validationErrors = formWasSubmitted
    ? getBookingValidationErrors(bookingTitle, date, bookingStartTime)
    : { title: '', date: '' };

  return (
    <Container maxWidth="xl" sx={{ paddingTop: 4, paddingBottom: 4 }}>
      {showBookingSuccess && (
        <Box
          sx={{
            position: 'fixed',
            top: 66,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1400,
            width: 520,
            maxWidth: '90vw',
            backgroundColor: 'white',
            border: '1px solid #0f9d8f',
            borderRadius: 2,
            boxShadow: '0 16px 40px rgba(16, 24, 40, 0.18)',
            padding: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: '#c8f7ec',
                color: '#087f73',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight={700}>Бронирование создано</Typography>
              <Typography color="text.secondary" fontSize={14}>
                Комната {bookingSuccessText}
              </Typography>
            </Box>

            <Button
              color="inherit"
              onClick={() => setShowBookingSuccess(false)}
              sx={{ minWidth: 0, color: '#98a2b3' }}
            >
              <CloseIcon fontSize="small" />
            </Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="center" sx={{ marginBottom: 2 }}>
        <Link className="breadcrumbs-link" to="/rooms">
          Переговорные
        </Link>
        <Typography color="text.secondary">›</Typography>
        <Link className="breadcrumbs-link" to={`/rooms?officeId=${room.office.id}`}>
          {room.office.name}
        </Link>
        <Typography color="text.secondary">›</Typography>
        <Typography fontWeight={700}>Комната '{room.name}'</Typography>
      </Stack>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Card sx={{ width: 360 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700}>
              {room.name}
            </Typography>
            <Typography color="text.secondary" sx={{ marginTop: 1, marginBottom: 3 }}>
              {room.office.name} · {room.office.address}
            </Typography>

            <Divider sx={{ marginBottom: 3 }} />

            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <GroupsIcon className="room-feature-icon" />
                <Typography>Вместимость: до {room.capacity} человек</Typography>
              </Stack>
              {room.features.map((feature) => (
                <Stack key={feature.code} direction="row" spacing={1.5} alignItems="center">
                  {getFeatureIcon(feature.code)}
                  <Typography>{feature.name}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flexGrow: 1 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Расписание на день
                </Typography>
                <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                  {formatDate(date)}
                </Typography>
              </Box>

              <TextField
                size="small"
                label="Выбрать дату"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                sx={{ width: 190 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Box sx={{ marginTop: 4, position: 'relative' }}>
              {dayHours.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    height: 42,
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr',
                    alignItems: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    {hour}
                  </Typography>
                  <Box sx={{ borderTop: '1px solid #dce2ea' }} />
                </Box>
              ))}

              <Box className="schedule-item schedule-item-free">
                Daily Sync / Команда разработки
              </Box>
              <Box className="schedule-item schedule-item-busy">
                Занято
              </Box>
            </Box>

            <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: 4 }}>
              <Button variant="contained" className="card-book-button" onClick={openBookingDialog}>
                Забронировать комнату
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontSize: 24, fontWeight: 700, paddingBottom: 1 }}>
          Новое бронирование
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary" fontSize={14}>
              Переговорная:{' '}
              <Box component="span" sx={{ color: '#0f9d8f', fontWeight: 700 }}>
                {room.name}
              </Box>{' '}
              ({room.office.name}, {room.floor} этаж)
            </Typography>

            <Divider />

            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                Тема встречи *
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Укажите тему встречи"
                value={bookingTitle}
                onChange={(event) => setBookingTitle(event.target.value)}
                error={Boolean(validationErrors.title)}
                helperText={validationErrors.title}
              />
            </Box>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                  Дата
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  error={Boolean(validationErrors.date)}
                  helperText={validationErrors.date}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon
                          fontSize="small"
                          color={validationErrors.date ? 'error' : 'inherit'}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                  Время начала
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="time"
                  value={bookingStartTime}
                  onChange={(event) => setBookingStartTime(event.target.value)}
                  inputProps={{ step: 900 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Stack>

            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                Продолжительность
              </Typography>
              <TextField
                size="small"
                fullWidth
                select
                value={bookingDuration}
                onChange={(event) => setBookingDuration(event.target.value)}
              >
                <MenuItem value="30">30 минут (до {getBookingEndTime(bookingStartTime, '30')})</MenuItem>
                <MenuItem value="60">1 час (до {getBookingEndTime(bookingStartTime, '60')})</MenuItem>
                <MenuItem value="90">1,5 часа (до {getBookingEndTime(bookingStartTime, '90')})</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                Комментарий
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Дополнительная информация для участников встречи..."
                value={bookingComment}
                onChange={(event) => setBookingComment(event.target.value)}
                multiline
                rows={3}
              />
            </Box>

            <Box
              sx={{
                backgroundColor: '#c8f7ec',
                color: '#087f73',
                borderRadius: 1,
                padding: 1.25,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoOutlinedIcon fontSize="small" />
                <span>{formatBookingSummary(date, bookingStartTime, bookingDuration)}</span>
              </Stack>
            </Box>

            {bookingStatus === 'success' && (
              <Alert severity="success">Комната забронирована</Alert>
            )}
            {bookingStatus === 'error' && (
              <Alert severity="error">{bookingError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: 3, paddingTop: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setIsBookingOpen(false)}
            sx={{ color: '#667085', borderColor: '#d0d5dd' }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            className="card-book-button"
            onClick={submitBooking}
            disabled={bookingStatus === 'loading'}
          >
            Забронировать
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00`));
}

function getBookingEndTime(startTime: string, duration: string) {
  const date = new Date(`2026-01-01T${startTime}:00`);
  date.setMinutes(date.getMinutes() + Number(duration));
  return date.toTimeString().slice(0, 5);
}

function formatBookingSummary(date: string, startTime: string, duration: string) {
  const endTime = getBookingEndTime(startTime, duration);

  if (duration === '30') {
    return `Бронирование на ${formatDate(date)}, ${startTime} - ${endTime} (30 минут)`;
  }

  if (duration === '60') {
    return `Бронирование на ${formatDate(date)}, ${startTime} - ${endTime} (1 час)`;
  }

  return `Бронирование на ${formatDate(date)}, ${startTime} - ${endTime} (1,5 часа)`;
}

function getBookingValidationErrors(title: string, date: string, startTime: string) {
  const errors = {
    title: '',
    date: '',
  };

  if (!title.trim()) {
    errors.title = 'Обязательное поле';
  }

  const startsAt = new Date(`${date}T${startTime}:00`);

  if (startsAt.getTime() <= Date.now()) {
    errors.date = 'Нельзя создать бронирование в прошлом';
  }

  return errors;
}

function getFeatureIcon(code: string) {
  if (code === 'display') {
    return <TvIcon className="room-feature-icon" />;
  }

  if (code === 'whiteboard') {
    return <EditIcon className="room-feature-icon" />;
  }

  if (code === 'video') {
    return <OndemandVideoIcon className="room-feature-icon" />;
  }

  return <TvIcon className="room-feature-icon" />;
}
