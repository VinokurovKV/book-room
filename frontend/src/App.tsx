import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { AppBar, Box, Button, Container, Paper, Stack, Toolbar, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SearchOffIcon from '@mui/icons-material/SearchOff';

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
            <Route path="/rooms" element={<PageStub title="Список переговорных" />} />
            <Route path="/rooms/:roomId" element={<PageStub title="Расписание комнаты" />} />
            <Route path="/bookings" element={<PageStub title="Мои бронирования" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

function PageStub({ title }: { title: string }) {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        minHeight: 320,
        p: 4,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box>
        <Typography component="h2" variant="h3" fontWeight={700}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

function NotFoundPage() {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        minHeight: 320,
        p: 4,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <Stack alignItems="center" spacing={1.5}>
        <SearchOffIcon color="disabled" fontSize="large" />
        <Typography component="h2" variant="h3" fontWeight={700}>
          Ничего не найдено
        </Typography>
        <Typography color="text.secondary">
          Проверьте адрес страницы или вернитесь к списку переговорных.
        </Typography>
        <Button component={NavLink} to="/rooms" variant="contained">
          К комнатам
        </Button>
      </Stack>
    </Paper>
  );
}
