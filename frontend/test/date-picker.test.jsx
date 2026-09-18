import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from '../src/components/ui/DatePicker.jsx';

function open(props = {}) {
  const onChange = vi.fn();
  render(
    <DatePicker
      label="Check-in"
      name="checkIn"
      value="2026-10-20"
      min="2026-10-15"
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange };
}

async function openCalendar(user) {
  await user.click(screen.getByLabelText('Check-in'));
  return screen.getByRole('grid');
}

describe('DatePicker', () => {
  it('shows a placeholder for an impossible stored date', () => {
    render(
      <DatePicker label="Check-in" name="checkIn" value="2026-02-31" min="" />,
    );
    expect(screen.getByLabelText('Check-in')).toHaveTextContent(
      'Select a date',
    );
  });

  it('exposes a labelled grid with weekday column headers', async () => {
    const user = userEvent.setup();
    open();
    const grid = await openCalendar(user);
    expect(grid).toHaveAccessibleName('October 2026');
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7);
    const selectedCell = within(grid)
      .getByRole('button', { name: 'October 20, 2026' })
      .closest('td');
    expect(selectedCell).toHaveAttribute('aria-selected', 'true');
  });

  it('disables days before the minimum date', async () => {
    const user = userEvent.setup();
    open();
    await openCalendar(user);
    expect(
      screen.getByRole('button', { name: 'October 10, 2026' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'October 16, 2026' }),
    ).toBeEnabled();
  });

  it('keeps focus on an enabled day when navigation crosses the minimum', async () => {
    const user = userEvent.setup();
    open();
    await openCalendar(user);
    const active = document.activeElement;
    expect(active).toHaveAttribute('aria-label', 'October 20, 2026');

    fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' }); // Oct 13 -> clamp 15
    expect(document.activeElement).toHaveAttribute(
      'aria-label',
      'October 15, 2026',
    );
    fireEvent.keyDown(document.activeElement, { key: 'PageUp' }); // September -> clamp 15
    expect(document.activeElement).toHaveAttribute(
      'aria-label',
      'October 15, 2026',
    );
    expect(document.activeElement).toBeEnabled();
  });

  it('selects a day, reports an ISO value, and closes', async () => {
    const user = userEvent.setup();
    const { onChange } = open();
    await openCalendar(user);
    await user.click(screen.getByRole('button', { name: 'October 22, 2026' }));
    expect(onChange).toHaveBeenCalledWith({
      target: { name: 'checkIn', value: '2026-10-22' },
    });
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});
