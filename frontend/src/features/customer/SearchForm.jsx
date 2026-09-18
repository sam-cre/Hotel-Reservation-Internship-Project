import { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { DatePicker } from '../../components/ui/DatePicker.jsx';
import { SelectField } from '../../components/ui/Field.jsx';
import { isoDate, validateStay } from './customer-utils.js';
import styles from './Customer.module.css';

export function SearchForm({ stay, cities, onSearch, busy = false }) {
  const [values, setValues] = useState(stay);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  function change(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setErrors((current) => ({ ...current, [event.target.name]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const issues = validateStay(values);
    setErrors(issues);
    const first = Object.keys(issues)[0];
    if (first) {
      // The date fields are custom controls, so focus their trigger button by
      // ref; native controls (city, guests) resolve through the form elements.
      const dateTrigger =
        first === 'checkIn'
          ? checkInRef.current
          : first === 'checkOut'
            ? checkOutRef.current
            : null;
      const target = dateTrigger ?? formRef.current.elements.namedItem(first);
      target?.focus();
      return;
    }
    onSearch(values);
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className={styles.searchForm}
      aria-label="Find a stay"
    >
      <SelectField
        label="Where to?"
        name="city"
        value={values.city}
        onChange={change}
        disabled={!cities.length}
      >
        {!cities.length && <option value={values.city}>{values.city}</option>}
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </SelectField>
      <DatePicker
        label="Check-in"
        name="checkIn"
        value={values.checkIn}
        min={isoDate(new Date())}
        error={errors.checkIn}
        onChange={change}
        buttonRef={checkInRef}
      />
      <DatePicker
        label="Check-out"
        name="checkOut"
        value={values.checkOut}
        min={values.checkIn}
        error={errors.checkOut}
        onChange={change}
        buttonRef={checkOutRef}
      />
      <SelectField
        label="Guests"
        name="guests"
        value={values.guests}
        onChange={change}
      >
        {[1, 2, 3, 4].map((count) => (
          <option key={count} value={count}>
            {count} {count === 1 ? 'guest' : 'guests'}
          </option>
        ))}
      </SelectField>
      <Button type="submit" loading={busy}>
        <Search size={18} aria-hidden="true" />
        Find rooms
      </Button>
      {Object.keys(errors).some((key) => errors[key]) && (
        <p role="alert" className={styles.formSummary}>
          Check the highlighted stay details and try again.
        </p>
      )}
    </form>
  );
}
