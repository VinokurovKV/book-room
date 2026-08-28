import type { Booking, Office, Room } from './types';

const API_URL = 'http://localhost:3000/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const data = (await response.json()) as { error: { message: string } };
    throw new Error(data.error.message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getOffices() {
  const data = await request<{ items: Office[] }>('/offices');
  return data.items;
}

export async function getRooms(params: {
  officeId: string;
  minCapacity: string;
  from: string;
  to: string;
}) {
  const searchParams = new URLSearchParams({
    officeId: params.officeId,
    minCapacity: params.minCapacity,
    from: params.from,
    to: params.to,
  });

  const data = await request<{ items: Room[] }>(`/rooms?${searchParams.toString()}`);
  return data.items;
}

export async function getRoom(roomId: string) {
  return request<Room>(`/rooms/${encodeURIComponent(roomId)}`);
}

export async function createBooking(data: {
  roomId: string;
  title: string;
  comment: string;
  startsAt: string;
  endsAt: string;
}) {
  return request<Booking>('/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomId: data.roomId,
      title: data.title,
      comment: data.comment || null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    }),
  });
}

export async function getBookings(scope: 'upcoming' | 'past', officeId: string) {
  const searchParams = new URLSearchParams({ scope });

  if (officeId) {
    searchParams.set('officeId', officeId);
  }

  const data = await request<{ items: Booking[] }>(`/bookings?${searchParams.toString()}`);
  return data.items;
}

export async function cancelBooking(bookingId: string) {
  return request<void>(`/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
  });
}
