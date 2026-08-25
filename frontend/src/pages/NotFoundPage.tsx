import { NavLink } from 'react-router-dom';
import { Button, Paper, Stack, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

export function NotFoundPage() {
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
