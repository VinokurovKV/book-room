import { useEffect, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getOffices, getRooms } from '../api/client';
import type { Office, Room } from '../api/types';
import { DatePickerButton, getTodayDate } from '../components/DatePickerButton';

const fallbackOffices: Office[] = [
  {
    id: 'office-moscow',
    name: 'Офис Москва',
    address: 'ул. Лесная, 7',
    timezone: 'Europe/Moscow',
  },
  {
    id: 'office-saint-petersburg',
    name: 'Офис Санкт-Петербург',
    address: 'ул. Морская, 8',
    timezone: 'Europe/Moscow',
  },
];

const durationOptions = ['15', '30', '45', '60', '75', '90', '105', '120'];
const capacityOptions = ['2', '4', '6', '8', '10', '12'];

const filterButtonSx = {
  color: '#344054',
  borderColor: '#d0d5dd',
  justifyContent: 'space-between',
  minWidth: 0,
  height: 40,
  textTransform: 'none',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
};

type RoomsStatus = 'loading' | 'success' | 'error';

export function RoomsPage({
  onConnectionErrorChange,
}: {
  onConnectionErrorChange: (hasError: boolean) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offices, setOffices] = useState(fallbackOffices);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<RoomsStatus>('loading');
  const [officeId, setOfficeId] = useState(searchParams.get('officeId') || '');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [date, setDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState('15:00');
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('4');
  const [durationAnchor, setDurationAnchor] = useState<null | HTMLElement>(null);
  const [capacityAnchor, setCapacityAnchor] = useState<null | HTMLElement>(null);

  const officeIdFromUrl = searchParams.get('officeId') || '';
  const selectedOffice = offices.find((office) => office.id === officeId);

  useEffect(() => {
    setOfficeId(officeIdFromUrl);
  }, [officeIdFromUrl]);

  useEffect(() => {
    getOffices()
      .then((loadedOffices) => {
        setOffices(loadedOffices);
      })
      .catch(() => {
        setOffices(fallbackOffices);
      });
  }, []);

  useEffect(() => {
    if (!officeId) {
      setRooms([]);
      setRoomsStatus('success');
      onConnectionErrorChange(false);
      return;
    }

    const startsAt = new Date(`${date}T${startTime}:00`);
    const endsAt = new Date(startsAt.getTime() + Number(duration) * 60 * 1000);

    setRoomsStatus('loading');
    onConnectionErrorChange(false);

    getRooms({
      officeId,
      minCapacity: capacity,
      from: startsAt.toISOString(),
      to: endsAt.toISOString(),
    })
      .then((loadedRooms) => {
        setRooms(loadedRooms);
        setRoomsStatus('success');
      })
      .catch(() => {
        setRooms([]);
        setRoomsStatus('error');
        onConnectionErrorChange(true);
      });
  }, [capacity, date, duration, officeId, onConnectionErrorChange, startTime]);

  function selectOffice(nextOfficeId: string) {
    setOfficeId(nextOfficeId);
    setSearchParams({ officeId: nextOfficeId });
    setMenuAnchor(null);
  }

  function resetFilters() {
    setDate(getTodayDate());
    setStartTime('15:00');
    setDuration('60');
    setCapacity('4');
  }

  function selectDuration(nextDuration: string) {
    setDuration(nextDuration);
    setDurationAnchor(null);
  }

  function selectCapacity(nextCapacity: string) {
    setCapacity(nextCapacity);
    setCapacityAnchor(null);
  }

  return (
    <Box>
      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid #dce2ea' }}>
        <Container maxWidth="lg" sx={{ paddingTop: 2, paddingBottom: 2 }}>
          <Button
            color="inherit"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ fontSize: 20, fontWeight: 700, padding: 0 }}
          >
            {selectedOffice ? selectedOffice.name : 'Выберите офис'}
          </Button>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            {offices.map((office) => (
              <MenuItem
                key={office.id}
                onClick={() => selectOffice(office.id)}
              >
                {office.name}
              </MenuItem>
            ))}
          </Menu>
          <Typography color="text.secondary" sx={{ marginTop: 0.5 }}>
            {selectedOffice
              ? `${selectedOffice.address} · Местное время: 14:35 MSK`
              : 'Адрес не выбран · Местное время: --'}
          </Typography>
        </Container>
      </Box>

      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid #dce2ea' }}>
        <Container maxWidth="lg" sx={{ paddingTop: 2, paddingBottom: 2 }}>
          <Stack direction="row" spacing={1.5} rowGap={2} alignItems="flex-start" flexWrap="wrap">
            <Box sx={{ minWidth: 180 }}>
              <FilterLabel>Дата</FilterLabel>
              <DatePickerButton value={date} onChange={setDate} disabled={!selectedOffice} />
            </Box>

            <Box sx={{ minWidth: 140 }}>
              <FilterLabel>Время начала</FilterLabel>
              <TextField
                size="small"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={!selectedOffice}
                sx={{
                  width: '100%',
                  '& .MuiInputBase-root': { height: 40 },
                  '& input': { color: '#344054', fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
                }}
                inputProps={{ step: 900 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon fontSize="small" sx={{ color: '#344054' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ minWidth: 145 }}>
              <FilterLabel>Длительность</FilterLabel>
              <Button
                variant="outlined"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(event) => setDurationAnchor(event.currentTarget)}
                disabled={!selectedOffice}
                sx={{ ...filterButtonSx, width: '100%' }}
              >
                {getDurationLabel(duration)}
              </Button>
              <Menu
                anchorEl={durationAnchor}
                open={Boolean(durationAnchor)}
                onClose={() => setDurationAnchor(null)}
                variant="menu"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { width: durationAnchor?.clientWidth, maxHeight: 320 } }}
              >
                {durationOptions.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => selectDuration(option)}
                    sx={{ padding: 0.5, fontSize: 16, fontWeight: 400, lineHeight: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        borderRadius: 1,
                        padding: 0.75,
                        backgroundColor: option === duration ? '#c8f7ec' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{getDurationLabel(option)}</span>
                      {option === duration && <CheckIcon fontSize="small" />}
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Box sx={{ minWidth: 180 }}>
              <FilterLabel>Вместимость</FilterLabel>
              <Button
                variant="outlined"
                startIcon={<GroupsIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(event) => setCapacityAnchor(event.currentTarget)}
                disabled={!selectedOffice}
                sx={{ ...filterButtonSx, width: '100%' }}
              >
                {getCapacityButtonLabel(capacity)}
              </Button>
              <Menu
                anchorEl={capacityAnchor}
                open={Boolean(capacityAnchor)}
                onClose={() => setCapacityAnchor(null)}
                variant="menu"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { width: capacityAnchor?.clientWidth, maxHeight: 320 } }}
              >
                {capacityOptions.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => selectCapacity(option)}
                    sx={{ padding: 0.5, fontSize: 16, fontWeight: 400, lineHeight: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        borderRadius: 1,
                        padding: 0.75,
                        backgroundColor: option === capacity ? '#c8f7ec' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{getCapacityMenuLabel(option)}</span>
                      {option === capacity && <CheckIcon fontSize="small" />}
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ paddingTop: 4, paddingBottom: 4 }}>
        {!selectedOffice && <NoOfficeState />}

        {selectedOffice && (
          <Typography variant="h4" fontWeight={700} sx={{ marginBottom: 3 }}>
            {roomsStatus === 'loading'
              ? 'Загрузка переговорных...'
              : 'Доступные переговорные в этом офисе'}
          </Typography>
        )}

        {selectedOffice && roomsStatus === 'loading' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[1, 2, 3, 4].map((item) => (
              <RoomSkeleton key={item} />
            ))}
          </Box>
        )}

        {selectedOffice && roomsStatus === 'error' && <RoomsErrorState />}

        {selectedOffice && roomsStatus === 'success' && rooms.length === 0 && (
          <RoomsEmptyState onReset={resetFilters} />
        )}

        {selectedOffice && roomsStatus === 'success' && rooms.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {rooms.map((room) => (
              <Card key={room.id} sx={{ width: 360 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700}>
                    {room.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ marginTop: 1, marginBottom: 2 }}>
                    {room.floor} этаж
                  </Typography>

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GroupsIcon fontSize="small" color="action" />
                      <Typography color="text.secondary">
                        Вместимость: до {room.capacity} человек
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography color="text.secondary">
                        {room.available ? 'Свободна на выбранное время' : 'Занята на выбранное время'}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      marginTop: 2,
                      padding: 1.5,
                      borderRadius: 1,
                      backgroundColor: room.available ? '#c8f7ec' : '#e8edf3',
                      color: room.available ? '#087f73' : '#667085',
                      fontWeight: 700,
                    }}
                  >
                    {room.available
                      ? '• Доступно на выбранное время'
                      : '• Недоступно на выбранное время'}
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                    <Button
                      fullWidth
                      component={NavLink}
                      to={`/rooms/${room.id}`}
                      className="card-link-button"
                    >
                      Подробнее
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!room.available}
                      component={NavLink}
                      to={`/rooms/${room.id}?booking=1&date=${date}&time=${startTime}&duration=${duration}`}
                      className="card-book-button"
                    >
                      Забронировать
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

function FilterLabel({ children }: { children: string }) {
  return (
    <Typography color="text.secondary" fontSize={12} fontWeight={700} sx={{ marginBottom: 0.75 }}>
      {children}
    </Typography>
  );
}

function NoOfficeState() {
  return (
    <Stack alignItems="center" spacing={2} sx={{ paddingTop: 18, textAlign: 'center' }}>
      <Box className="no-office-state-icon">
        <BusinessIcon fontSize="large" />
      </Box>
      <Typography variant="h4" fontWeight={700}>
        Выберите офис
      </Typography>
      <Typography color="text.secondary">
        Для просмотра доступных переговорных сначала выберите офис из списка выше
      </Typography>
    </Stack>
  );
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

function getCapacityButtonLabel(value: string) {
  return `Мин. ${value} чел.`;
}

function getCapacityMenuLabel(value: string) {
  return `${value} чел.`;
}

function RoomSkeleton() {
  return (
    <Card sx={{ width: 360 }}>
      <CardContent>
        <Skeleton width={120} height={32} />
        <Skeleton width={70} height={24} />
        <Box sx={{ marginTop: 2 }}>
          <Skeleton width={230} height={24} />
          <Skeleton width={230} height={24} />
        </Box>
        <Skeleton height={56} sx={{ marginTop: 2 }} />
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
          <Skeleton height={44} sx={{ flex: 1 }} />
          <Skeleton height={44} sx={{ flex: 1 }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function RoomsEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ paddingTop: 18, textAlign: 'center' }}>
      <Box className="empty-state-icon">
        <SearchOffIcon fontSize="large" />
      </Box>
      <Typography variant="h4" fontWeight={700}>
        Нет доступных переговорных
      </Typography>
      <Typography color="text.secondary">
        Попробуйте изменить параметры фильтрации или выбрать другой офис
      </Typography>
      <Button variant="contained" className="card-book-button" onClick={onReset}>
        Сбросить фильтры
      </Button>
    </Stack>
  );
}

function RoomsErrorState() {
  return (
    <Stack alignItems="center" spacing={2} sx={{ paddingTop: 18, textAlign: 'center' }}>
      <Box className="error-state-icon">
        <WarningAmberIcon fontSize="large" />
      </Box>
      <Typography variant="h4" fontWeight={700}>
        Не удалось загрузить данные
      </Typography>
      <Typography color="text.secondary">
        Произошла ошибка при загрузке списка переговорных
      </Typography>
      <Button variant="contained" className="card-book-button">
        Попробовать снова
      </Button>
    </Stack>
  );
}
