import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelBooking, getBookings, getOffices } from '../src/api/client';
import type { Booking, Office } from '../src/api/types';
import { BookingsPage } from '../src/pages/BookingsPage';

vi.mock('../src/api/client', () => ({
  getOffices: vi.fn(),
  getBookings: vi.fn(),
  cancelBooking: vi.fn(),
}));

const offices: Office[] = [
  {
    id: 'office-moscow',
    name: 'Офис Москва',
    address: 'ул. Лесная, 7',
    timezone: 'Europe/Moscow',
  },
  {
    id: 'office-spb',
    name: 'Офис Санкт-Петербург',
    address: 'Невский проспект, 1',
    timezone: 'Europe/Moscow',
  },
];

const upcomingBooking: Booking = {
  id: 'booking-1',
  roomId: 'room-everest',
  title: 'Планирование',
  comment: null,
  startsAt: '2026-08-29T12:00:00.000Z',
  endsAt: '2026-08-29T13:00:00.000Z',
  room: {
    id: 'room-everest',
    officeId: 'office-moscow',
    name: 'Эверест',
    floor: 6,
    capacity: 8,
    features: [],
  },
  office: offices[0],
};

const pastBooking: Booking = {
  id: 'booking-2',
  roomId: 'room-neva',
  title: 'Разбор итогов',
  comment: null,
  startsAt: '2026-08-20T09:00:00.000Z',
  endsAt: '2026-08-20T10:00:00.000Z',
  room: {
    id: 'room-neva',
    officeId: 'office-spb',
    name: 'Нева',
    floor: 3,
    capacity: 4,
    features: [],
  },
  office: offices[1],
};

const mockedGetOffices = vi.mocked(getOffices);
const mockedGetBookings = vi.mocked(getBookings);
const mockedCancelBooking = vi.mocked(cancelBooking);

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/bookings']}>
      <BookingsPage />
    </MemoryRouter>,
  );
}

describe('BookingsPage', () => {
  beforeEach(() => {
    mockedGetOffices.mockResolvedValue(offices);
    mockedGetBookings.mockResolvedValue([upcomingBooking]);
    mockedCancelBooking.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads upcoming bookings', async () => {
    renderPage();

    expect(await screen.findByText('Планирование')).toBeInTheDocument();
    expect(screen.getByText('Эверест')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument();
    expect(mockedGetBookings).toHaveBeenCalledWith('upcoming', '');
  });

  it('loads past bookings after tab click', async () => {
    const user = userEvent.setup();
    mockedGetBookings.mockImplementation((scope) =>
      Promise.resolve(scope === 'past' ? [pastBooking] : [upcomingBooking]),
    );

    renderPage();
    await screen.findByText('Планирование');

    await user.click(screen.getByRole('button', { name: /Прошедшие/ }));

    expect(await screen.findByText('Разбор итогов')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument();
    expect(mockedGetBookings).toHaveBeenCalledWith('past', '');
  });

  it('loads bookings for selected office', async () => {
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Планирование');

    await user.click(screen.getByRole('button', { name: 'Все офисы' }));
    await user.click(await screen.findByText('Офис Санкт-Петербург'));

    await waitFor(() => {
      expect(mockedGetBookings).toHaveBeenCalledWith('upcoming', 'office-spb');
    });
  });

  it('shows empty state when there are no bookings', async () => {
    mockedGetBookings.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Нет бронирований')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Перейти к переговорным' })).toHaveAttribute(
      'href',
      '/rooms',
    );
  });

  it('reloads bookings from error state', async () => {
    const user = userEvent.setup();
    mockedGetBookings
      .mockRejectedValueOnce(new Error('Ошибка загрузки'))
      .mockResolvedValueOnce([upcomingBooking]);

    renderPage();

    expect(await screen.findByText('Не удалось загрузить данные')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Попробовать снова' }));

    expect(await screen.findByText('Планирование')).toBeInTheDocument();
    expect(mockedGetBookings).toHaveBeenCalledTimes(2);
  });

  it('cancels upcoming booking', async () => {
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Планирование');

    await user.click(screen.getByRole('button', { name: 'Отменить' }));
    await user.click(screen.getByRole('button', { name: 'Да, отменить' }));

    await waitFor(() => {
      expect(mockedCancelBooking).toHaveBeenCalledWith('booking-1');
    });

    await waitFor(() => {
      expect(screen.queryByText('Планирование')).not.toBeInTheDocument();
    });
  });

  it('shows cancel error message', async () => {
    const user = userEvent.setup();
    mockedCancelBooking.mockRejectedValue(new Error('Не удалось отменить'));

    renderPage();
    await screen.findByText('Планирование');

    await user.click(screen.getByRole('button', { name: 'Отменить' }));
    await user.click(screen.getByRole('button', { name: 'Да, отменить' }));

    expect(await screen.findByText('Не удалось отменить')).toBeInTheDocument();
  });
});
