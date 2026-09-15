import { Children, useId, useState } from 'react';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import styles from './Ui.module.css';

export function Field({ label, error, hint, className = '', ...props }) {
  const id = useId();
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-description` : undefined}
      />
      {(error || hint) && (
        <span
          id={`${id}-description`}
          className={error ? styles.error : styles.hint}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}

export function SelectField({
  label,
  children,
  className = '',
  onChange,
  value,
  defaultValue,
  name,
  disabled,
  ...props
}) {
  const id = useId();
  const options = Children.toArray(children).map((option) => ({
    disabled: Boolean(option.props.disabled),
    label: option.props.children,
    value: String(option.props.value ?? option.props.children),
  }));
  const fallbackValue = options.find((option) => !option.disabled)?.value;
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? fallbackValue ?? ''),
  );
  const selectedValue = value === undefined ? internalValue : String(value);
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  function changeValue(nextValue) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.({ target: { name, value: nextValue } });
  }

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <Listbox
        value={selectedValue}
        onChange={changeValue}
        name={name}
        disabled={disabled}
      >
        <ListboxButton id={id} className={styles.selectTrigger} {...props}>
          <span>{selectedOption?.label}</span>
          <span className={styles.selectIcon}>
            <ChevronDown size={17} aria-hidden="true" />
          </span>
        </ListboxButton>
        <ListboxOptions
          className={styles.selectContent}
          anchor={{ to: 'bottom start', gap: 6, padding: 12 }}
          modal={false}
        >
          <div className={styles.selectViewport}>
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={styles.selectItem}
              >
                {({ selected }) => (
                  <>
                    <span>{option.label}</span>
                    {selected && (
                      <span className={styles.selectIndicator}>
                        <Check size={16} aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </div>
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
