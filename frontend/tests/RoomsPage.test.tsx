import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getOffices, getRoomBookings, getRooms } from '../src/api/client';
import type { Office, Room } from '../src/api/types';
import { RoomsPage } from '../src/pages/RoomsPage';

vi.mock('../src/api/client', () => ({
  getOffices: vi.fn(),
  getRoomBookings: vi.fn(),
  getRooms: vi.fn(),
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

const room: Room = {
  id: 'room-everest',
  officeId: 'office-moscow',
  name: 'Эверест',
  floor: 6,
  capacity: 8,
  features: [],
  available: true,
  office: offices[0],
};

const mockedGetOffices = vi.mocked(getOffices);
const mockedGetRooms = vi.mocked(getRooms);
const mockedGetRoomBookings = vi.mocked(getRoomBookings);

class WebSocketMock {
  onmessage: ((message: { data: string }) => void) | null = null;

  close() {}
}

function renderPage(initialPath = '/rooms') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/rooms"
          element={<RoomsPage onConnectionErrorChange={vi.fn()} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoomsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', WebSocketMock);
    mockedGetOffices.mockResolvedValue(offices);
    mockedGetRooms.mockResolvedValue([room]);
    mockedGetRoomBookings.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows no-office state before office selection', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: /Выберите офис/ })).toBeInTheDocument();
    expect(screen.getByText('Для просмотра доступных переговорных сначала выберите офис из списка выше')).toBeInTheDocument();
    expect(mockedGetRooms).not.toHaveBeenCalled();
  });

  it('loads rooms after office selection', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Выберите офис/ }));
    await user.click(await screen.findByText('Офис Москва'));

    expect(await screen.findByText('Эверест')).toBeInTheDocument();
    expect(screen.getByText('Вместимость: до 8 человек')).toBeInTheDocument();
    expect(mockedGetRooms).toHaveBeenCalledWith(
      expect.objectContaining({
        officeId: 'office-moscow',
        minCapacity: '4',
      }),
    );
  });

  it('loads rooms from office id in url', async () => {
    renderPage('/rooms?officeId=office-moscow');

    expect(await screen.findByText('Эверест')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Офис Москва/ })).toBeInTheDocument();
  });

  it('reloads rooms with selected capacity', async () => {
    const user = userEvent.setup();
    renderPage('/rooms?officeId=office-moscow');

    await screen.findByText('Эверест');
    await user.click(screen.getByRole('button', { name: /Мин\. 4 чел\./ }));
    await user.click(await screen.findByText('8 чел.'));

    await waitFor(() => {
      expect(mockedGetRooms).toHaveBeenCalledWith(
        expect.objectContaining({
          minCapacity: '8',
        }),
      );
    });
  });

  it('shows empty state when no rooms match filters', async () => {
    mockedGetRooms.mockResolvedValue([]);

    renderPage('/rooms?officeId=office-moscow');

    expect(await screen.findByText('Нет доступных переговорных')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument();
  });

  it('renders room card links', async () => {
    renderPage('/rooms?officeId=office-moscow');

    expect(await screen.findByRole('link', { name: 'Подробнее' })).toHaveAttribute(
      'href',
      '/rooms/room-everest',
    );
    expect(screen.getByRole('link', { name: 'Забронировать' })).toHaveAttribute(
      'href',
      '/rooms/room-everest',
    );
  });
});
