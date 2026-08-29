import type { Booking, Room } from '../api/types';

export type RoomsRealtimeEvent = {
  type: string;
  data: {
    booking?: Booking;
    officeId?: string;
    startsAt?: string;
    endsAt?: string;
  };
};

export function getAvailabilityText(
  room: Room,
  bookings: Booking[],
  date: string,
  startTime: string,
  duration: string,
) {
  const { startsAt, endsAt } = getSelectedInterval(date, startTime, duration);
  const sortedBookings = [...bookings].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
  const busyBooking = sortedBookings.find((booking) =>
    intervalsOverlap(booking.startsAt, booking.endsAt, startsAt, endsAt),
  );

  if (busyBooking) {
    return `Занята до ${formatTime(busyBooking.endsAt)}`;
  }

  const nextBooking = sortedBookings.find(
    (booking) => new Date(booking.startsAt).getTime() > startsAt.getTime(),
  );

  if (room.available && nextBooking) {
    return `Свободна до ${formatTime(nextBooking.startsAt)}`;
  }

  if (room.available) {
    return 'Свободна весь день';
  }

  return 'Занята';
}

export function getSelectedInterval(date: string, startTime: string, duration: string) {
  const safeStartTime = isValidTime(startTime) ? startTime : '15:00';
  const startsAt = new Date(`${date}T${safeStartTime}:00`);
  const endsAt = new Date(startsAt.getTime() + Number(duration) * 60 * 1000);

  return { startsAt, endsAt };
}

export function shouldReloadRooms(
  event: RoomsRealtimeEvent,
  officeId: string,
  date: string,
  startTime: string,
  duration: string,
) {
  if (event.type === 'data.reset') {
    return true;
  }

  if (event.type === 'room.availability_changed') {
    if (event.data.officeId !== officeId || !event.data.startsAt || !event.data.endsAt) {
      return false;
    }

    const { startsAt, endsAt } = getSelectedInterval(date, startTime, duration);
    return intervalsOverlap(event.data.startsAt, event.data.endsAt, startsAt, endsAt);
  }

  if (event.type === 'booking.created' || event.type === 'booking.cancelled') {
    const booking = event.data.booking;

    if (!booking || booking.office.id !== officeId) {
      return false;
    }

    return isTimeInSelectedDay(booking.startsAt, booking.endsAt, date);
  }

  return false;
}

export function getDayStartIso(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

export function getNextDayStartIso(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function intervalsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: Date,
  secondEnd: Date,
) {
  return new Date(firstStart).getTime() < secondEnd.getTime()
    && new Date(firstEnd).getTime() > secondStart.getTime();
}

function isTimeInSelectedDay(startsAt: string, endsAt: string, date: string) {
  const dayStart = new Date(getDayStartIso(date)).getTime();
  const dayEnd = new Date(getNextDayStartIso(date)).getTime();
  const bookingStart = new Date(startsAt).getTime();
  const bookingEnd = new Date(endsAt).getTime();

  return bookingStart < dayEnd && bookingEnd > dayStart;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(new Date(value));
}
