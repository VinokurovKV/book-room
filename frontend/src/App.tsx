import { useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { AppBar, Avatar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BookingsPage } from './pages/BookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RoomPage } from './pages/RoomPage';
import { RoomsPage, type RoomsPageState } from './pages/RoomsPage';

export function App() {
  const [roomsPageState] = useState<RoomsPageState>('success');

  return (
    <BrowserRouter>
      <Box minHeight="100vh">
        {roomsPageState === 'error' && (
          <Box
            sx={{
              backgroundColor: '#fff08a',
              color: '#8a5a00',
              padding: 1,
              textAlign: 'center',
              fontWeight: 700,
            }}
          >
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <InfoOutlinedIcon fontSize="small" />
              <span>Соединение потеряно. Переподключение...</span>
            </Stack>
          </Box>
        )}

        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid #dce2ea' }}
        >
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ gap: 3, py: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: 260 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: '#0f9d8f',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarMonthIcon />
                </Box>
                <Typography component="h1" variant="h5" fontWeight={700}>
                  BookRoom
                </Typography>
              </Stack>

              <Stack
                component="nav"
                direction="row"
                spacing={2}
                aria-label="Основная навигация"
                sx={{ flexGrow: 1, justifyContent: 'center' }}
              >
                <Button
                  component={NavLink}
                  to="/rooms"
                  variant="text"
                  className="nav-button"
                >
                  Переговорные
                </Button>
                <Button
                  component={NavLink}
                  to="/bookings"
                  variant="text"
                  className="nav-button"
                >
                  Мои бронирования
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: 260, justifyContent: 'flex-end' }}>
                <Typography fontWeight={700}>Константин К.</Typography>
                <Avatar sx={{ backgroundColor: '#4f74d9' }}>КК</Avatar>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Box component="main">
          <Routes>
            <Route path="/" element={<Navigate to="/rooms" replace />} />
            <Route path="/rooms" element={<RoomsPage pageState={roomsPageState} />} />
            <Route path="/rooms/:roomId" element={<RoomPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}
