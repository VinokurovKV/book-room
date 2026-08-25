import { Box, Paper, Typography } from '@mui/material';

export function PageStub({ title }: { title: string }) {
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
