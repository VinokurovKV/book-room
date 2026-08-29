import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
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
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import TvIcon from '@mui/icons-material/Tv';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { ApiError, createBooking, getRoom, getRoomBookings } from '../api/client';
import type { Booking, Room } from '../api/types';
import { DatePickerButton, getTodayDate } from '../components/DatePickerButton';

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

const durationOptions = ['15', '30', '45', '60', '75', '90', '105', '120'];
const timeOptions = createTimeOptions();
const WS_URL = 'ws://localhost:3000/api/v1/ws';

type RealtimeEvent = {
  type: string;
  data: {
    booking?: Booking;
    roomId?: string;
    startsAt?: string;
    endsAt?: string;
  };
};

type BookingRouteState = {
  openBooking?: boolean;
  date?: string;
  time?: string;
  duration?: string;
};

export function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingRouteState = (location.state as BookingRouteState | null) || {};
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pageDate, setPageDate] = useState(
    bookingRouteState.date || searchParams.get('date') || getTodayDate(),
  );
  const [scheduleBookings, setScheduleBookings] = useState<Booking[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isScheduleError, setIsScheduleError] = useState(false);
  const [scheduleReload, setScheduleReload] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingDate, setBookingDate] = useState(
    bookingRouteState.date || searchParams.get('date') || getTodayDate(),
  );
  const [bookingStartTime, setBookingStartTime] = useState(
    bookingRouteState.time || searchParams.get('time') || '15:00',
  );
  const [bookingStartTimeAnchor, setBookingStartTimeAnchor] = useState<null | HTMLElement>(null);
  const [bookingDuration, setBookingDuration] = useState(
    bookingRouteState.duration || searchParams.get('duration') || '60',
  );
  const [bookingDurationAnchor, setBookingDurationAnchor] = useState<null | HTMLElement>(null);
  const [bookingComment, setBookingComment] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingError, setBookingError] = useState('');
  const [formWasSubmitted, setFormWasSubmitted] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [showBookingConflict, setShowBookingConflict] = useState(false);
  const [bookingSuccessText, setBookingSuccessText] = useState('');
  const hasOpenedBookingForm = useRef(false);

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

  useEffect(() => {
    const shouldOpenBooking = bookingRouteState.openBooking || searchParams.get('booking') === '1';

    if (!isLoading && shouldOpenBooking && !hasOpenedBookingForm.current) {
      hasOpenedBookingForm.current = true;
      openBookingDialog();
    }
  }, [bookingRouteState.openBooking, isLoading, searchParams]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let isActual = true;

    setIsScheduleLoading(true);
    setIsScheduleError(false);
    setScheduleBookings([]);

    getRoomBookings(roomId, getDayStartIso(pageDate), getNextDayStartIso(pageDate))
      .then((loadedBookings) => {
        if (isActual) {
          setScheduleBookings(loadedBookings);
        }
      })
      .catch(() => {
        if (isActual) {
          setScheduleBookings([]);
          setIsScheduleError(true);
        }
      })
      .finally(() => {
        if (isActual) {
          setIsScheduleLoading(false);
        }
      });

    return () => {
      isActual = false;
    };
  }, [roomId, pageDate, scheduleReload]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const socket = new WebSocket(WS_URL);

    socket.onmessage = (message) => {
      let event: RealtimeEvent;

      try {
        event = JSON.parse(message.data) as RealtimeEvent;
      } catch {
        return;
      }

      if (shouldReloadSchedule(event, roomId, pageDate)) {
        setScheduleReload((value) => value + 1);
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId, pageDate]);

  if (isLoading) {
    return <RoomDetailLoadingPage />;
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
    setBookingDate(pageDate);
    setIsBookingOpen(true);
  }

  function submitBooking() {
    if (!room) {
      return;
    }

    setFormWasSubmitted(true);

    const validationErrors = getBookingValidationErrors(bookingTitle, bookingDate, bookingStartTime);

    if (validationErrors.title || validationErrors.date) {
      return;
    }

    const startsAt = new Date(`${bookingDate}T${bookingStartTime}:00`);
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
        setPageDate(bookingDate);
        setScheduleReload((value) => value + 1);
        setBookingSuccessText(`${room.name}, ${formatDate(bookingDate)}, ${bookingStartTime}-${getBookingEndTime(bookingStartTime, bookingDuration)} MSK`);
        setIsBookingOpen(false);
        setShowBookingSuccess(true);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 409) {
          setBookingStatus('idle');
          setPageDate(bookingDate);
          setScheduleReload((value) => value + 1);
          setIsBookingOpen(false);
          setShowBookingConflict(true);
          return;
        }

        setBookingStatus('error');
        setBookingError(error instanceof Error ? error.message : 'Не удалось создать бронь');
      });
  }

  function selectBookingDuration(nextDuration: string) {
    setBookingDuration(nextDuration);
    setBookingDurationAnchor(null);
  }

  function selectBookingStartTime(nextTime: string) {
    setBookingStartTime(nextTime);
    setBookingStartTimeAnchor(null);
  }

  const validationErrors = formWasSubmitted
    ? getBookingValidationErrors(bookingTitle, bookingDate, bookingStartTime)
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

      <Dialog
        open={showBookingConflict}
        onClose={() => setShowBookingConflict(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, padding: 2 } }}
      >
        <DialogContent>
          <Stack alignItems="center" spacing={2.5} sx={{ textAlign: 'center', paddingTop: 2 }}>
            <Box className="error-state-icon" sx={{ width: 84, height: 84 }}>
              <WarningAmberIcon fontSize="large" />
            </Box>

            <Typography variant="h4" fontWeight={700}>
              Время уже занято
            </Typography>

            <Typography color="text.secondary" fontSize={18}>
              Выбранный интервал был забронирован другим сотрудником. Расписание обновлено.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              className="card-book-button"
              onClick={() => {
                setShowBookingConflict(false);
                setIsBookingOpen(true);
              }}
              sx={{ marginTop: 2 }}
            >
              Выбрать другое время
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

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
            {isScheduleError ? (
              <ScheduleErrorState onReload={() => setScheduleReload((value) => value + 1)} />
            ) : (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      Расписание на день
                    </Typography>
                    <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                      {formatDate(pageDate)}
                    </Typography>
                  </Box>

                  <DatePickerButton value={pageDate} onChange={setPageDate} placeholder="Выбрать дату" />
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

                  {!isScheduleLoading && scheduleBookings.map((booking) => (
                    <Box
                      key={booking.id}
                      className="schedule-item schedule-item-busy"
                      sx={getScheduleItemSx(booking.startsAt, booking.endsAt)}
                    >
                      {booking.title}
                    </Box>
                  ))}
                </Box>

                <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: 4 }}>
                  <Button variant="contained" className="card-book-button" onClick={openBookingDialog}>
                    Забронировать комнату
                  </Button>
                </Stack>
              </>
            )}
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
                <DatePickerButton
                  value={bookingDate}
                  onChange={setBookingDate}
                  error={Boolean(validationErrors.date)}
                  helperText={validationErrors.date}
                  fullWidth
                  smallCalendar
                  allowPast
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                  Время начала
                </Typography>
                <Button
                  variant="outlined"
                  onClick={(event) => setBookingStartTimeAnchor(event.currentTarget)}
                  sx={{
                    width: '100%',
                    height: 40,
                    color: '#344054',
                    borderColor: '#d0d5dd',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    '&:hover': {
                      borderColor: '#0f9d8f',
                    },
                    '&.Mui-focusVisible': {
                      borderColor: '#0f9d8f',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5 }}>
                    <AccessTimeIcon fontSize="small" />
                    <span>{bookingStartTime}</span>
                    <KeyboardArrowDownIcon sx={{ marginLeft: 'auto' }} />
                  </Box>
                </Button>
                <Menu
                  anchorEl={bookingStartTimeAnchor}
                  open={Boolean(bookingStartTimeAnchor)}
                  onClose={() => setBookingStartTimeAnchor(null)}
                  variant="menu"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      width: bookingStartTimeAnchor?.clientWidth,
                      maxHeight: getMenuMaxHeight(bookingStartTimeAnchor),
                    },
                  }}
                >
                  {timeOptions.map((option) => (
                    <MenuItem
                      key={option}
                      onClick={() => selectBookingStartTime(option)}
                      sx={{
                        padding: 0.5,
                        fontSize: 14,
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          borderRadius: 1,
                          padding: 0.75,
                          backgroundColor: option === bookingStartTime ? '#c8f7ec' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <span>{option}</span>
                        {option === bookingStartTime && <CheckIcon fontSize="small" />}
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </Stack>

            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ marginBottom: 0.75 }}>
                Продолжительность
              </Typography>
              <Button
                variant="outlined"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(event) => setBookingDurationAnchor(event.currentTarget)}
                sx={{
                  width: '100%',
                  height: 40,
                  color: '#344054',
                  borderColor: '#d0d5dd',
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  '&:hover': {
                    borderColor: '#0f9d8f',
                  },
                  '&.Mui-focusVisible': {
                    borderColor: '#0f9d8f',
                  },
                }}
              >
                {getDurationLabel(bookingDuration)} (до {getBookingEndTime(bookingStartTime, bookingDuration)})
              </Button>
              <Menu
                anchorEl={bookingDurationAnchor}
                open={Boolean(bookingDurationAnchor)}
                onClose={() => setBookingDurationAnchor(null)}
                variant="menu"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    width: bookingDurationAnchor?.clientWidth,
                    maxHeight: getMenuMaxHeight(bookingDurationAnchor),
                  },
                }}
              >
                {durationOptions.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => selectBookingDuration(option)}
                    sx={{
                      padding: 0.5,
                      fontSize: 14,
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        borderRadius: 1,
                        padding: 0.75,
                        backgroundColor: option === bookingDuration ? '#c8f7ec' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <span>{getDurationLabel(option)} (до {getBookingEndTime(bookingStartTime, option)})</span>
                      {option === bookingDuration && <CheckIcon fontSize="small" />}
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
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
                <span>{formatBookingSummary(bookingDate, bookingStartTime, bookingDuration)}</span>
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

function RoomDetailLoadingPage() {
  return (
    <Container maxWidth="xl" sx={{ paddingTop: 4, paddingBottom: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ marginBottom: 2 }}>
        <Skeleton variant="rounded" width={120} height={18} />
        <Typography color="text.secondary">›</Typography>
        <Skeleton variant="rounded" width={120} height={18} />
        <Typography color="text.secondary">›</Typography>
        <Skeleton variant="rounded" width={150} height={18} />
      </Stack>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Card sx={{ width: 360 }}>
          <CardContent>
            <Skeleton variant="rounded" width={180} height={34} />
            <Skeleton variant="rounded" width={250} height={24} sx={{ marginTop: 2 }} />

            <Divider sx={{ marginTop: 3, marginBottom: 3 }} />

            <Stack spacing={2}>
              <Skeleton variant="rounded" height={24} />
              <Skeleton variant="rounded" height={24} />
              <Skeleton variant="rounded" height={24} />
              <Skeleton variant="rounded" height={24} />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flexGrow: 1 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Skeleton variant="rounded" width={220} height={34} />
                <Skeleton variant="rounded" width={150} height={24} sx={{ marginTop: 2 }} />
              </Box>
              <Skeleton variant="rounded" width={180} height={40} />
            </Stack>

            <Box sx={{ marginTop: 4 }}>
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
            </Box>

            <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: 4 }}>
              <Skeleton variant="rounded" width={220} height={40} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

function ScheduleErrorState({ onReload }: { onReload: () => void }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 430, textAlign: 'center' }}>
      <Box className="error-state-icon">
        <WarningAmberIcon fontSize="large" />
      </Box>
      <Typography variant="h4" fontWeight={700}>
        Не удалось загрузить расписание
      </Typography>
      <Typography color="text.secondary">
        Произошла ошибка при загрузке расписания переговорной
      </Typography>
      <Button variant="contained" className="card-book-button" onClick={onReload}>
        Попробовать снова
      </Button>
    </Stack>
  );
}

function getMenuMaxHeight(anchor: HTMLElement | null) {
  if (!anchor) {
    return 220;
  }

  const spaceBelow = window.innerHeight - anchor.getBoundingClientRect().bottom - 12;
  return Math.max(48, Math.min(220, spaceBelow));
}

function shouldReloadSchedule(event: RealtimeEvent, roomId: string, pageDate: string) {
  if (event.type === 'data.reset') {
    return true;
  }

  if (event.type !== 'booking.created' && event.type !== 'booking.cancelled') {
    return false;
  }

  const booking = event.data.booking;

  if (!booking || booking.roomId !== roomId) {
    return false;
  }

  return isTimeInSelectedDay(booking.startsAt, booking.endsAt, pageDate);
}

function isTimeInSelectedDay(startsAt: string, endsAt: string, pageDate: string) {
  const dayStart = new Date(getDayStartIso(pageDate)).getTime();
  const dayEnd = new Date(getNextDayStartIso(pageDate)).getTime();
  const bookingStart = new Date(startsAt).getTime();
  const bookingEnd = new Date(endsAt).getTime();

  return bookingStart < dayEnd && bookingEnd > dayStart;
}

function getScheduleItemSx(startsAt: string, endsAt: string) {
  const dayStartMinutes = 9 * 60;
  const dayEndMinutes = 20 * 60;
  const rowHeight = 42;
  const firstLineTop = rowHeight / 2;
  const startMinutes = Math.max(dayStartMinutes, getTimeMinutes(startsAt));
  const endMinutes = Math.min(dayEndMinutes, getTimeMinutes(endsAt));
  const top = firstLineTop + ((startMinutes - dayStartMinutes) / 60) * rowHeight;
  const height = Math.max(28, ((endMinutes - startMinutes) / 60) * rowHeight);

  return {
    top,
    height,
  };
}

function getTimeMinutes(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function getDayStartIso(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function getNextDayStartIso(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

function createTimeOptions() {
  const options = [];
  const date = new Date('2026-01-01T09:00:00');
  const endDate = new Date('2026-01-01T20:00:00');

  while (date <= endDate) {
    options.push(date.toTimeString().slice(0, 5));
    date.setMinutes(date.getMinutes() + 15);
  }

  return options;
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

function getDurationLabel(value: string) {
  if (value === '15') return '15 мин';
  if (value === '30') return '30 мин';
  if (value === '45') return '45 мин';
  if (value === '60') return '1 час';
  if (value === '75') return '1 ч 15 мин';
  if (value === '90') return '1 ч 30 мин';
  if (value === '105') return '1 ч 45 мин';
  return '2 часа';
}

function formatBookingSummary(date: string, startTime: string, duration: string) {
  const endTime = getBookingEndTime(startTime, duration);
  return `Бронирование на ${formatDate(date)}, ${startTime} - ${endTime} (${getDurationLabel(duration)})`;
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
