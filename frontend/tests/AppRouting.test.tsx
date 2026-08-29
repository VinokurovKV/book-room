import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

vi.mock('../src/pages/RoomsPage', () => ({
  RoomsPage: () => <div>Страница переговорных</div>,
}));

vi.mock('../src/pages/RoomPage', () => ({
  RoomPage: () => <div>Страница комнаты</div>,
}));

vi.mock('../src/pages/BookingsPage', () => ({
  BookingsPage: () => <div>Страница бронирований</div>,
}));

describe('App routing', () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
  });

  it('redirects from root to rooms page', async () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(await screen.findByText('Страница переговорных')).toBeInTheDocument();
  });

  it('opens bookings page from navigation', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/rooms');

    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Мои бронирования' }));

    expect(await screen.findByText('Страница бронирований')).toBeInTheDocument();
  });

  it('shows not found page for unknown route', async () => {
    window.history.pushState({}, '', '/unknown-page');

    render(<App />);

    expect(await screen.findByText('Страница не найдена')).toBeInTheDocument();
  });
});
