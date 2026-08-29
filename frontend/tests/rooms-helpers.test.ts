import { describe, expect, it } from 'vitest';
import type { Booking, Room } from '../src/api/types';
import {
  getAvailabilityText,
  getSelectedInterval,
  isValidTime,
  shouldReloadRooms,
} from '../src/pages/rooms-helpers';

const room: Room = {
  id: 'room-everest',
  officeId: 'office-moscow',
  name: 'Эверест',
  floor: 6,
  capacity: 12,
  features: [],
  available: true,
  office: {
    id: 'office-moscow',
    name: 'Офис Москва',
    address: 'ул. Лесная, 7',
    timezone: 'Europe/Moscow',
  },
};

const booking: Booking = {
  id: 'booking-1',
  roomId: 'room-everest',
  title: 'Синк команды',
  comment: null,
  startsAt: '2026-08-29T13:00:00.000+03:00',
  endsAt: '2026-08-29T14:00:00.000+03:00',
  room: {
    id: 'room-everest',
    officeId: 'office-moscow',
    name: 'Эверест',
    floor: 6,
    capacity: 12,
    features: [],
  },
  office: room.office,
};

describe('rooms helpers', () => {
  it('shows when a free room is free until the next booking', () => {
    expect(getAvailabilityText(room, [booking], '2026-08-29', '12:00', '30')).toBe('Свободна до 13:00');
  });

  it('shows when the selected interval is busy', () => {
    expect(getAvailabilityText({ ...room, available: false }, [booking], '2026-08-29', '13:30', '30')).toBe(
      'Занята до 14:00',
    );
  });

  it('uses the earliest next booking for free room text', () => {
    const laterBooking = {
      ...booking,
      id: 'booking-2',
      startsAt: '2026-08-29T16:00:00.000+03:00',
      endsAt: '2026-08-29T17:00:00.000+03:00',
    };

    expect(getAvailabilityText(room, [laterBooking, booking], '2026-08-29', '12:00', '30')).toBe('Свободна до 13:00');
  });

  it('keeps the mock text from the layout when there are no later bookings', () => {
    expect(getAvailabilityText(room, [], '2026-08-29', '12:00', '30')).toBe('Свободна весь день');
  });

  it('shows busy fallback when backend says room is unavailable but bookings are missing', () => {
    expect(getAvailabilityText({ ...room, available: false }, [], '2026-08-29', '12:00', '30')).toBe('Занята');
  });

  it('falls back to a valid time if the input is temporarily empty', () => {
    const interval = getSelectedInterval('2026-08-29', '', '60');

    expect(interval.startsAt.toISOString()).toBe(new Date('2026-08-29T15:00:00').toISOString());
  });

  it('falls back to a valid time if the input has invalid hours', () => {
    const interval = getSelectedInterval('2026-08-29', '25:00', '30');

    expect(interval.startsAt.toISOString()).toBe(new Date('2026-08-29T15:00:00').toISOString());
  });

  it('validates time input format', () => {
    expect(isValidTime('09:15')).toBe(true);
    expect(isValidTime('')).toBe(false);
    expect(isValidTime('25:00')).toBe(false);
  });

  it('reloads rooms when a booking event touches the selected day', () => {
    expect(
      shouldReloadRooms(
        { type: 'booking.created', data: { booking } },
        'office-moscow',
        '2026-08-29',
        '10:00',
        '60',
      ),
    ).toBe(true);
  });

  it('reloads rooms for data reset events', () => {
    expect(
      shouldReloadRooms(
        { type: 'data.reset', data: {} },
        'office-moscow',
        '2026-08-29',
        '10:00',
        '60',
      ),
    ).toBe(true);
  });

  it('reloads rooms when availability event overlaps selected interval', () => {
    expect(
      shouldReloadRooms(
        {
          type: 'room.availability_changed',
          data: {
            officeId: 'office-moscow',
            startsAt: '2026-08-29T10:30:00.000+03:00',
            endsAt: '2026-08-29T11:30:00.000+03:00',
          },
        },
        'office-moscow',
        '2026-08-29',
        '11:00',
        '30',
      ),
    ).toBe(true);
  });

  it('ignores availability events from another office', () => {
    expect(
      shouldReloadRooms(
        {
          type: 'room.availability_changed',
          data: {
            officeId: 'office-spb',
            startsAt: '2026-08-29T10:00:00.000Z',
            endsAt: '2026-08-29T11:00:00.000Z',
          },
        },
        'office-moscow',
        '2026-08-29',
        '10:00',
        '60',
      ),
    ).toBe(false);
  });

  it('ignores availability events outside selected interval', () => {
    expect(
      shouldReloadRooms(
        {
          type: 'room.availability_changed',
          data: {
            officeId: 'office-moscow',
            startsAt: '2026-08-29T09:00:00.000+03:00',
            endsAt: '2026-08-29T10:00:00.000+03:00',
          },
        },
        'office-moscow',
        '2026-08-29',
        '11:00',
        '30',
      ),
    ).toBe(false);
  });

  it('ignores booking events from another office', () => {
    expect(
      shouldReloadRooms(
        {
          type: 'booking.created',
          data: { booking: { ...booking, office: { ...booking.office, id: 'office-spb' } } },
        },
        'office-moscow',
        '2026-08-29',
        '10:00',
        '60',
      ),
    ).toBe(false);
  });

  it('ignores booking events from another day', () => {
    expect(
      shouldReloadRooms(
        {
          type: 'booking.created',
          data: {
            booking: {
              ...booking,
              startsAt: '2026-08-30T13:00:00.000+03:00',
              endsAt: '2026-08-30T14:00:00.000+03:00',
            },
          },
        },
        'office-moscow',
        '2026-08-29',
        '10:00',
        '60',
      ),
    ).toBe(false);
  });

  it('ignores unknown realtime events', () => {
    expect(
      shouldReloadRooms(
        { type: 'unknown.event', data: {} },
        'office-moscow',
        '2026-08-29',
        '10:00',
        '60',
      ),
    ).toBe(false);
  });
});
