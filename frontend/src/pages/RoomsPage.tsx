import { useState } from 'react';
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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const offices = [
  {
    id: 'moscow',
    name: 'Офис Москва',
    address: 'ул. Лесная, 7',
    localTime: '14:35 MSK',
  },
  {
    id: 'saint-petersburg',
    name: 'Офис Санкт-Петербург',
    address: 'ул. Морская, 8',
    localTime: '15:35 MSK',
  },
];

const rooms = [
  {
    id: 'everest',
    name: 'Эверест',
    floor: '4 этаж',
    capacity: 12,
    timeText: 'Занята до 15:30',
    isAvailable: false,
  },
  {
    id: 'elbrus',
    name: 'Эльбрус',
    floor: '4 этаж',
    capacity: 8,
    timeText: 'Занята до 16:00',
    isAvailable: false,
  },
  {
    id: 'kazbek',
    name: 'Казбек',
    floor: '3 этаж',
    capacity: 6,
    timeText: 'Свободна весь день',
    isAvailable: true,
  },
  {
    id: 'monblan',
    name: 'Монблан',
    floor: '3 этаж',
    capacity: 4,
    timeText: 'Занята до 15:00',
    isAvailable: true,
  },
];

export type RoomsPageState = 'success' | 'loading' | 'empty' | 'error';

export function RoomsPage({ pageState }: { pageState: RoomsPageState }) {
  const [officeId, setOfficeId] = useState('moscow');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [date, setDate] = useState('2026-08-25');
  const [startTime, setStartTime] = useState('15:00');
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('4');

  const selectedOffice = offices.find((office) => office.id === officeId) || offices[0];
  const filteredRooms = rooms.filter((room) => room.capacity >= Number(capacity));

  function resetFilters() {
    setDate('2026-08-25');
    setStartTime('15:00');
    setDuration('60');
    setCapacity('4');
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
            {selectedOffice.name}
          </Button>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            {offices.map((office) => (
              <MenuItem
                key={office.id}
                onClick={() => {
                  setOfficeId(office.id);
                  setMenuAnchor(null);
                }}
              >
                {office.name}
              </MenuItem>
            ))}
          </Menu>
          <Typography color="text.secondary" sx={{ marginTop: 0.5 }}>
            {selectedOffice.address} · Местное время: {selectedOffice.localTime}
          </Typography>
        </Container>
      </Box>

      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid #dce2ea' }}>
        <Container maxWidth="lg" sx={{ paddingTop: 2, paddingBottom: 2 }}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              size="small"
              label="Дата"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              sx={{ width: 170 }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              label="Время начала"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              sx={{ width: 140 }}
              inputProps={{ step: 900 }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTimeIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              select
              label="Длительность"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              sx={{ width: 150 }}
            >
              <MenuItem value="30">30 минут</MenuItem>
              <MenuItem value="60">1 час</MenuItem>
              <MenuItem value="90">1,5 часа</MenuItem>
            </TextField>
            <TextField
              size="small"
              select
              label="Вместимость"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              sx={{ width: 175 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupsIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="2">от 2 человек</MenuItem>
              <MenuItem value="4">от 4 человек</MenuItem>
              <MenuItem value="8">от 8 человек</MenuItem>
            </TextField>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ paddingTop: 4, paddingBottom: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ marginBottom: 3 }}>
          {pageState === 'loading'
            ? 'Загрузка переговорных...'
            : 'Доступные переговорные в этом офисе'}
        </Typography>

        {pageState === 'loading' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[1, 2, 3, 4].map((item) => (
              <RoomSkeleton key={item} />
            ))}
          </Box>
        )}

        {pageState === 'error' && <RoomsErrorState />}

        {pageState === 'empty' && <RoomsEmptyState onReset={resetFilters} />}

        {pageState === 'success' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {filteredRooms.map((room) => (
              <Card key={room.id} sx={{ width: 360 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700}>
                    {room.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ marginTop: 1, marginBottom: 2 }}>
                    {room.floor}
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
                      <Typography color="text.secondary">{room.timeText}</Typography>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      marginTop: 2,
                      padding: 1.5,
                      borderRadius: 1,
                      backgroundColor: room.isAvailable ? '#c8f7ec' : '#e8edf3',
                      color: room.isAvailable ? '#087f73' : '#667085',
                      fontWeight: 700,
                    }}
                  >
                    {room.isAvailable
                      ? '• Доступно на выбранное время'
                      : '• Недоступно на выбранное время'}
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                    <Button fullWidth className="card-link-button">
                      Подробнее
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!room.isAvailable}
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
