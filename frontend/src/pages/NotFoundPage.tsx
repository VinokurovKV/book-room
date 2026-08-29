import { NavLink } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

export function NotFoundPage() {
  return (
    <Container maxWidth="lg">
      <Stack alignItems="center" sx={{ paddingTop: 28, textAlign: 'center' }}>
        <Typography
          component="h2"
          sx={{
            color: '#0f9d8f',
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          404
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ marginTop: 3 }}>
          Страница не найдена
        </Typography>
        <Typography color="text.secondary" sx={{ marginTop: 2, maxWidth: 520 }}>
          Запрашиваемая страница не существует, была удалена или перенесена на другой адрес.
        </Typography>

        <Button
          component={NavLink}
          to="/rooms"
          variant="contained"
          className="card-book-button"
          sx={{ marginTop: 4 }}
          startIcon={<HomeOutlinedIcon />}
        >
          Вернуться к переговорным
        </Button>
      </Stack>
    </Container>
  );
}
