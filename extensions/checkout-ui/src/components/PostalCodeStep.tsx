import { FormEvent } from 'react';

interface PostalCodeStepProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  isLoading: boolean;
  error?: string | null;
  defaultPostalCode?: string;
  defaultSuburb?: string;
}

export function PostalCodeStep({
  value,
  onChange,
  onSubmit,
  isLoading,
  error,
  defaultPostalCode,
  defaultSuburb
}: PostalCodeStepProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoading) {
      void onSubmit();
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit} aria-describedby={error ? 'postcode-error' : undefined}>
      <div className="form-header">
        <p className="eyebrow">Step 1 of 4</p>
        <h2 className="form-title">Where do you need the installation?</h2>
        <p className="form-subtitle">
          We’ll connect you with licensed local installers already trusted by merchants in your area.
        </p>
      </div>

      <label className="form-label" htmlFor="postcode">
        Installation location
        <div className="input-with-meta">
          <input
            id="postcode"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]*"
            maxLength={4}
            minLength={4}
            className={`form-input ${error ? 'form-input--error' : ''}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. 3000"
            disabled={isLoading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'postcode-error' : undefined}
          />
          <span className="input-meta">
            {defaultSuburb && defaultPostalCode
              ? `${defaultSuburb}, ${defaultPostalCode}`
              : 'Using the postcode from checkout'}
          </span>
        </div>
      </label>

      {error ? (
        <p role="alert" id="postcode-error" className="form-error">
          {error}
        </p>
      ) : null}

      <button type="submit" className="button button--primary" disabled={isLoading}>
        {isLoading ? 'Finding installers…' : 'Find installers'}
      </button>
    </form>
  );
}
