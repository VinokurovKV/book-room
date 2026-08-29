import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createBooking, getRoom, getRoomBookings } from '../src/api/client';
import type { Booking, Room } from '../src/api/types';
import { RoomPage } from '../src/pages/RoomPage';

vi.mock('../src/api/client', async () => {
  const actual = await vi.importActual<typeof import('../src/api/client')>('../src/api/client');

  return {
    ...actual,
    createBooking: vi.fn(),
    getRoom: vi.fn(),
    getRoomBookings: vi.fn(),
  };
});

const room: Room = {
  id: 'room-everest',
  officeId: 'office-moscow',
  name: 'Эверест',
  floor: 6,
  capacity: 8,
  features: [],
  office: {
    id: 'office-moscow',
    name: 'Офис Москва',
    address: 'ул. Лесная, 7',
    timezone: 'Europe/Moscow',
  },
};

const mockedGetRoom = vi.mocked(getRoom);
const mockedGetRoomBookings = vi.mocked(getRoomBookings);
const mockedCreateBooking = vi.mocked(createBooking);

class WebSocketMock {
  onmessage: ((message: { data: string }) => void) | null = null;

  close() {}
}

function renderPage(state?: { openBooking?: boolean; date?: string; time?: string; duration?: string }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/rooms/room-everest', state }]}>
      <Routes>
        <Route path="/rooms/:roomId" element={<RoomPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function openBookingForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('Эверест');
  await user.click(screen.getByRole('button', { name: 'Забронировать комнату' }));
}

describe('Room booking form', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-29T10:00:00+03:00').getTime());
    vi.stubGlobal('WebSocket', WebSocketMock);

    mockedGetRoom.mockResolvedValue(room);
    mockedGetRoomBookings.mockResolvedValue([]);
    mockedCreateBooking.mockResolvedValue({} as Booking);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('opens booking form from room page', async () => {
    const user = userEvent.setup();
    renderPage();

    await openBookingForm(user);

    expect(screen.getByText('Новое бронирование')).toBeInTheDocument();
    expect(screen.getByText(/Переговорная:/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Укажите тему встречи')).toBeInTheDocument();
  });

  it('shows title validation after submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await openBookingForm(user);
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Обязательное поле')).toBeInTheDocument();
    expect(mockedCreateBooking).not.toHaveBeenCalled();
  });

  it('shows past date validation', async () => {
    const user = userEvent.setup();
    renderPage({ openBooking: true, date: '2026-08-28', time: '15:00', duration: '60' });

    await screen.findByText('Новое бронирование');
    await user.type(screen.getByPlaceholderText('Укажите тему встречи'), 'Синк');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Нельзя создать бронирование в прошлом')).toBeInTheDocument();
    expect(mockedCreateBooking).not.toHaveBeenCalled();
  });

  it('creates booking with form values', async () => {
    const user = userEvent.setup();
    renderPage({ openBooking: true, date: '2026-08-29', time: '15:00', duration: '60' });

    await screen.findByText('Новое бронирование');
    await user.type(screen.getByPlaceholderText('Укажите тему встречи'), 'Синк команды');
    await user.type(
      screen.getByPlaceholderText('Дополнительная информация для участников встречи...'),
      'Обсудить план',
    );
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    await waitFor(() => {
      expect(mockedCreateBooking).toHaveBeenCalledWith({
        roomId: 'room-everest',
        title: 'Синк команды',
        comment: 'Обсудить план',
        startsAt: '2026-08-29T12:00:00.000Z',
        endsAt: '2026-08-29T13:00:00.000Z',
      });
    });

    expect(await screen.findByText('Бронирование создано')).toBeInTheDocument();
  });

  it('shows conflict dialog for 409 response', async () => {
    const user = userEvent.setup();
    mockedCreateBooking.mockRejectedValue(new ApiError(409, 'Время уже занято'));
    renderPage({ openBooking: true, date: '2026-08-29', time: '15:00', duration: '60' });

    await screen.findByText('Новое бронирование');
    await user.type(screen.getByPlaceholderText('Укажите тему встречи'), 'Синк команды');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Время уже занято')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать другое время' })).toBeInTheDocument();
  });
});
