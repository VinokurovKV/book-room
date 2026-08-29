import { useState } from 'react';
import { Box, Button, IconButton, Popover, Stack, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

type DatePickerButtonProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  smallCalendar?: boolean;
  allowPast?: boolean;
};

export function DatePickerButton({
  value,
  onChange,
  disabled = false,
  placeholder = 'Выбрать дату',
  error = false,
  helperText = '',
  fullWidth = false,
  smallCalendar = false,
  allowPast = false,
}: DatePickerButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(value || getTodayDate()));
  const days = getCalendarDays(calendarMonth);

  function selectDate(nextDate: string) {
    onChange(nextDate);
    setCalendarMonth(startOfMonth(nextDate));
    setAnchorEl(null);
  }

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Button
        variant="outlined"
        startIcon={<CalendarMonthIcon color={error ? 'error' : 'inherit'} />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={disabled}
        sx={{
          color: '#344054',
          borderColor: error ? '#d32f2f' : '#d0d5dd',
          height: 40,
          minWidth: fullWidth ? 0 : 180,
          width: fullWidth ? '100%' : 'auto',
          justifyContent: 'flex-start',
          textTransform: 'none',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
        }}
      >
        {value ? formatFilterDate(value) : placeholder}
      </Button>

      {helperText && (
        <Typography color={error ? 'error' : 'text.secondary'} fontSize={12} sx={{ marginTop: 0.5 }}>
          {helperText}
        </Typography>
      )}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ width: smallCalendar ? 210 : 260, padding: smallCalendar ? 1.25 : 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize={smallCalendar ? 16 : 20} fontWeight={700}>
              {formatCalendarMonth(calendarMonth)}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: smallCalendar ? 0.25 : 0.5,
              marginTop: smallCalendar ? 1 : 1.5,
            }}
          >
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayName) => (
              <Typography
                key={dayName}
                color="text.secondary"
                textAlign="center"
                fontSize={smallCalendar ? 11 : 13}
                fontWeight={700}
              >
                {dayName}
              </Typography>
            ))}

            {days.map((day) => {
              const disabledDay = !isDateAllowed(day.date, allowPast);
              const selected = day.date === value;

              return (
                <Button
                  key={day.date}
                  onClick={() => selectDate(day.date)}
                  disabled={disabledDay}
                  sx={{
                    minWidth: 0,
                    height: smallCalendar ? 24 : 30,
                    color: selected ? 'white' : day.isCurrentMonth ? '#172133' : '#98a2b3',
                    backgroundColor: selected ? '#0f9d8f' : 'transparent',
                    borderRadius: 2,
                    fontSize: smallCalendar ? 11 : 13,
                    '&:hover': {
                      backgroundColor: selected ? '#0f9d8f' : '#f4f6f8',
                    },
                  }}
                >
                  {new Date(`${day.date}T12:00:00`).getDate()}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

export function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfMonth(value: string) {
  return `${value.slice(0, 7)}-01`;
}

function addMonths(value: string, count: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setMonth(date.getMonth() + count);
  return startOfMonth(date.toISOString().slice(0, 10));
}

function getCalendarDays(month: string) {
  const firstDay = new Date(`${month}T12:00:00`);
  const startDate = new Date(firstDay);
  const weekday = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
  startDate.setDate(firstDay.getDate() - weekday + 1);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    const date = day.toISOString().slice(0, 10);

    return {
      date,
      isCurrentMonth: date.slice(0, 7) === month.slice(0, 7),
    };
  });
}

function isDateAllowed(value: string, allowPast: boolean) {
  const today = getTodayDate();
  const maxDate = new Date(`${today}T12:00:00`);
  maxDate.setDate(maxDate.getDate() + 30);

  if (allowPast) {
    return value <= maxDate.toISOString().slice(0, 10);
  }

  return value >= today && value <= maxDate.toISOString().slice(0, 10);
}

function formatFilterDate(value: string) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  }).formatToParts(new Date(`${value}T12:00:00`));
  const day = parts.find((part) => part.type === 'day')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const weekday = parts.find((part) => part.type === 'weekday')?.value || '';

  return `${day} ${capitalize(month)}, ${capitalize(weekday)}`;
}

function formatCalendarMonth(value: string) {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
  const text = formatter.format(new Date(`${value}T12:00:00`));
  return text[0].toUpperCase() + text.slice(1);
}

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}
