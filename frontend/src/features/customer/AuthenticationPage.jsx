import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { apiMessage } from '../../services/api.js';
import { useAuth } from './useAuth.js';
import { safeReturnTo } from './customer-utils.js';
import styles from './Customer.module.css';

export function AuthenticationPage({ mode }) {
  const registering = mode === 'register';
  const { user, login, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate(returnTo, { replace: true });
  }, [navigate, returnTo, user]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (registering) await register(data);
      else await login(data);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(
        apiMessage(
          requestError,
          registering
            ? 'We could not create your account.'
            : 'We could not sign you in.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  const alternate = `${registering ? '/login' : '/register'}?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <main id="main-content" className={styles.authPage}>
      <section className={styles.authIntro}>
        <p className={styles.kicker}>Your Stillwater account</p>
        <h1>{registering ? 'Begin your stay.' : 'Welcome back.'}</h1>
        <p>
          {registering
            ? 'Create an account to secure a room and keep every reservation in one place.'
            : 'Sign in to continue your reservation or review an upcoming stay.'}
        </p>
      </section>
      <section className={styles.authPanel} aria-labelledby="auth-title">
        <h2 id="auth-title">{registering ? 'Create an account' : 'Sign in'}</h2>
        <form onSubmit={submit} className={styles.authForm}>
          {registering && (
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              maxLength="120"
              required
            />
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            maxLength="320"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            minLength="12"
            maxLength="256"
            hint={registering ? 'Use at least 12 characters.' : undefined}
            required
          />
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy}>
            {registering ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <p className={styles.authAlternate}>
          {registering ? 'Already have an account?' : 'New to Stillwater?'}{' '}
          <Link to={alternate}>
            {registering ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
