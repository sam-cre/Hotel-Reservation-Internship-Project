import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Button, ButtonLink } from '../src/components/ui/Button.jsx';
import { Field } from '../src/components/ui/Field.jsx';
import { StatusBadge } from '../src/components/ui/StatusBadge.jsx';
import { CustomerPreview } from '../src/features/design/CustomerPreview.jsx';
import { AdminPreview } from '../src/features/design/AdminPreview.jsx';
import {
  nightsBetween,
  validateStay,
} from '../src/features/design/sample-data.js';

describe('design-system controls', () => {
  it('prevents repeated actions while loading and retains an accessible name', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
  it('uses a real link for navigation', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/design/admin">Reservations</ButtonLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Reservations' })).toHaveAttribute(
      'href',
      '/design/admin',
    );
  });
  it('connects visible field labels and errors to the input', () => {
    render(<Field label="Email" error="Enter a valid email." />);
    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toHaveAccessibleDescription('Enter a valid email.');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
  it('communicates reservation states without relying on color', () => {
    render(
      <>
        <StatusBadge status="confirmed" />
        <StatusBadge status="cancelled" />
      </>,
    );
    expect(screen.getByText('Confirmed')).toBeVisible();
    expect(screen.getByText('Cancelled')).toBeVisible();
  });
});

describe('design-system sample search', () => {
  it('counts nights consistently over a daylight-saving transition', () => {
    expect(nightsBetween('2026-10-31', '2026-11-02')).toBe(2);
  });
  it.each([
    ['2026-10-09', '2026-10-09'],
    ['2026-10-10', '2026-10-09'],
    ['2026-02-30', '2026-10-09'],
  ])('rejects invalid sample stay %s to %s', (checkIn, checkOut) => {
    expect(
      Object.keys(
        validateStay(
          { city: 'Charleston', guests: '2', checkIn, checkOut },
          '2026-01-01',
        ),
      ).length,
    ).toBeGreaterThan(0);
  });
  it('recovers from invalid URL state without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/design/customer?checkIn=invalid']}>
        <CustomerPreview />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Those search details were invalid/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'The Battery' })).toBeVisible();
  });
  it('filters sample reservations and offers a reset for empty results', async () => {
    render(
      <MemoryRouter>
        <AdminPreview />
      </MemoryRouter>,
    );
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search reservations' }),
      'No matching name',
    );
    expect(
      screen.getByRole('heading', { name: 'No matching reservations' }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Reset filters' }),
    );
    expect(
      screen.getByRole('rowheader', { name: /Olivia Martin/ }),
    ).toBeVisible();
  });
});
