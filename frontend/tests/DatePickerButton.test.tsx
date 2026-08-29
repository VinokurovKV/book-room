import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePickerButton, getTodayDate } from '../src/components/DatePickerButton';

describe('DatePickerButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current local date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T10:00:00+03:00'));

    expect(getTodayDate()).toBe('2026-08-29');
  });

  it('renders error helper text', () => {
    render(
      <DatePickerButton
        value="2026-08-29"
        onChange={vi.fn()}
        error
        helperText="Нельзя создать бронирование в прошлом"
      />,
    );

    expect(screen.getByText('Нельзя создать бронирование в прошлом')).toBeInTheDocument();
  });
});
