import type { Office, Room } from './types';

const API_URL = 'http://localhost:3000/api/v1';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    const data = (await response.json()) as { error: { message: string } };
    throw new Error(data.error.message);
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
