import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  cancelBooking,
  createBooking,
  getBookings,
  getOffices,
  getRoom,
  getRoomBookings,
  getRooms,
} from '../src/api/client';

function mockFetch(response: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws ApiError for failed responses', async () => {
    mockFetch({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: { message: 'Время уже занято' } }),
    });

    await expect(
      getRooms({
        officeId: 'office-moscow',
        minCapacity: '4',
        from: '2026-08-29T12:00:00.000Z',
        to: '2026-08-29T13:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Время уже занято',
    });
  });

  it('builds rooms query params', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    await getRooms({
      officeId: 'office-moscow',
      minCapacity: '6',
      from: '2026-08-29T12:00:00.000Z',
      to: '2026-08-29T13:30:00.000Z',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/rooms?officeId=office-moscow&minCapacity=6&from=2026-08-29T12%3A00%3A00.000Z&to=2026-08-29T13%3A30%3A00.000Z',
      undefined,
    );
  });

  it('loads offices from items field', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [{ id: 'office-moscow', name: 'Офис Москва' }] }),
    });

    await expect(getOffices()).resolves.toEqual([{ id: 'office-moscow', name: 'Офис Москва' }]);
  });

  it('loads a room by encoded id', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'room-1' }),
    });

    await getRoom('room 1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/rooms/room%201',
      undefined,
    );
  });

  it('builds room bookings query params', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    await getRoomBookings(
      'room-everest',
      '2026-08-29T00:00:00.000Z',
      '2026-08-30T00:00:00.000Z',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/rooms/room-everest/bookings?from=2026-08-29T00%3A00%3A00.000Z&to=2026-08-30T00%3A00%3A00.000Z',
      undefined,
    );
  });

  it('sends booking creation payload', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'booking-1' }),
    });

    await createBooking({
      roomId: 'room-everest',
      title: 'Синк',
      comment: '',
      startsAt: '2026-08-29T12:00:00.000Z',
      endsAt: '2026-08-29T13:00:00.000Z',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/bookings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: 'room-everest',
          title: 'Синк',
          comment: null,
          startsAt: '2026-08-29T12:00:00.000Z',
          endsAt: '2026-08-29T13:00:00.000Z',
        }),
      },
    );
  });

  it('builds bookings query with office filter', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    await getBookings('upcoming', 'office-moscow');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/bookings?scope=upcoming&officeId=office-moscow',
      undefined,
    );
  });

  it('builds bookings query without office filter', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    await getBookings('past', '');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/bookings?scope=past',
      undefined,
    );
  });

  it('sends DELETE when cancelling a booking', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 204,
    });

    await cancelBooking('booking-123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/bookings/booking-123',
      { method: 'DELETE' },
    );
  });

  it('encodes booking id when cancelling a booking', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 204,
    });

    await cancelBooking('booking 123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/bookings/booking%20123',
      { method: 'DELETE' },
    );
  });

  it('creates ApiError instances with status', () => {
    const error = new ApiError(400, 'Некорректный запрос');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Некорректный запрос');
  });
});
