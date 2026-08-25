import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { BookingsPage } from './pages/BookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RoomPage } from './pages/RoomPage';
import { RoomsPage } from './pages/RoomsPage';

export function App() {
  return (
    <BrowserRouter>
      <Box minHeight="100vh">
        <AppBar position="static" color="inherit" elevation={0}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ gap: 3, py: 2 }}>
              <Typography component="h1" variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>
                Бронирование переговорных
              </Typography>

              <Stack component="nav" direction="row" spacing={1} aria-label="Основная навигация">
                <Button
                  component={NavLink}
                  to="/rooms"
                  startIcon={<MeetingRoomIcon />}
                  variant="outlined"
                  className="nav-button"
                >
                  Комнаты
                </Button>
                <Button
                  component={NavLink}
                  to="/bookings"
                  startIcon={<CalendarMonthIcon />}
                  variant="outlined"
                  className="nav-button"
                >
                  Мои бронирования
                </Button>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/rooms" replace />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:roomId" element={<RoomPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}
