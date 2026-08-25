import { useState } from 'react';
import { Box, Button, Container, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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

export function RoomsPage() {
  const [officeId, setOfficeId] = useState('moscow');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const selectedOffice = offices.find((office) => office.id === officeId) || offices[0];

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
          <Stack direction="row" spacing={2}>
            <TextField size="small" label="Дата" type="date" defaultValue="2026-08-25" />
            <TextField size="small" label="Время начала" type="time" defaultValue="15:00" />
            <TextField size="small" select label="Длительность" defaultValue="60" sx={{ minWidth: 140 }}>
              <MenuItem value="30">30 минут</MenuItem>
              <MenuItem value="60">1 час</MenuItem>
              <MenuItem value="90">1,5 часа</MenuItem>
            </TextField>
            <TextField size="small" select label="Вместимость" defaultValue="4" sx={{ minWidth: 160 }}>
              <MenuItem value="2">от 2 человек</MenuItem>
              <MenuItem value="4">от 4 человек</MenuItem>
              <MenuItem value="8">от 8 человек</MenuItem>
            </TextField>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ paddingTop: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Доступные переговорные в этом офисе
        </Typography>
      </Container>
    </Box>
  );
}
