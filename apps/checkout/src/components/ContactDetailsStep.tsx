import type { LeadFormValues } from '../types/index.js';

const SERVICE_TYPES = [
  { value: 'lighting', label: 'Lighting installation' },
  { value: 'appliance', label: 'Appliance installation' },
  { value: 'mounting', label: 'Wall mounting & fixtures' },
  { value: 'custom', label: 'Custom installation' }
 ] as const;

const URGENCY_OPTIONS = [
  { value: 'flexible', label: 'Flexible (1-2 weeks)' },
  { value: 'soon', label: 'Soon (within a week)' },
  { value: 'urgent', label: 'Urgent (within 48 hours)' }
] as const;

interface ContactDetailsStepProps {
  values: Pick<
    LeadFormValues,
    'serviceType' | 'firstName' | 'lastName' | 'email' | 'phone' | 'description' | 'urgency'
  >;
  errors: Partial<Record<keyof LeadFormValues, string>>;
  submissionFieldError?: keyof LeadFormValues | null;
  selectedTradieName?: string;
  onFieldChange: <Key extends keyof LeadFormValues>(field: Key, value: LeadFormValues[Key]) => void;
  onBack: () => void;
  onSubmit: () => Promise<void> | void;
  isSubmitting: boolean;
  submissionError?: string | null;
}

export function ContactDetailsStep({
  values,
  errors,
  submissionFieldError,
  selectedTradieName,
  onFieldChange,
  onBack,
  onSubmit,
  isSubmitting,
  submissionError
}: ContactDetailsStepProps) {
  return (
    <form className="form-card" onSubmit={(event) => event.preventDefault()}>
      <div className="form-header">
        <p className="eyebrow">Step 3 of 4</p>
        <h2 className="form-title">Confirm your contact details</h2>
        <p className="form-subtitle">
          We’ll share this with your installer so they can confirm availability and lock in the job.
        </p>
        {selectedTradieName ? (
          <p className="form-helper">You’re booking: {selectedTradieName}</p>
        ) : null}
      </div>

      <label className="form-label" htmlFor="serviceType">
        Service type
        <select
          id="serviceType"
          className={`form-select ${errors.serviceType ? 'form-input--error' : ''}`}
          value={values.serviceType}
          onChange={(event) => onFieldChange('serviceType', event.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.serviceType)}
        >
          <option value="" disabled>
            Select a service
          </option>
          {SERVICE_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.serviceType ? (
          <p role="alert" className="form-error">
            {errors.serviceType}
          </p>
        ) : null}
      </label>

      <div className="form-grid">
        <label className="form-label" htmlFor="firstName">
          First name
          <input
            id="firstName"
            className={`form-input ${errors.firstName ? 'form-input--error' : ''}`}
            value={values.firstName}
            onChange={(event) => onFieldChange('firstName', event.target.value)}
            autoComplete="given-name"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.firstName)}
          />
          {errors.firstName ? (
            <p role="alert" className="form-error">
              {errors.firstName}
            </p>
          ) : null}
        </label>

        <label className="form-label" htmlFor="lastName">
          Last name
          <input
            id="lastName"
            className={`form-input ${errors.lastName ? 'form-input--error' : ''}`}
            value={values.lastName}
            onChange={(event) => onFieldChange('lastName', event.target.value)}
            autoComplete="family-name"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.lastName)}
          />
          {errors.lastName ? (
            <p role="alert" className="form-error">
              {errors.lastName}
            </p>
          ) : null}
        </label>
      </div>

      <label className="form-label" htmlFor="email">
        Email
        <input
          id="email"
          className={`form-input ${errors.email ? 'form-input--error' : ''}`}
          value={values.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? (
          <p role="alert" className="form-error">
            {errors.email}
          </p>
        ) : null}
      </label>

      <label className="form-label" htmlFor="phone">
        Phone number
        <input
          id="phone"
          className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
          value={values.phone}
          onChange={(event) => onFieldChange('phone', event.target.value)}
          autoComplete="tel"
          inputMode="tel"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone ? (
          <p role="alert" className="form-error">
            {errors.phone}
          </p>
        ) : null}
      </label>

      <label className="form-label" htmlFor="description">
        Project details
        <textarea
          id="description"
          className={`form-textarea ${errors.description ? 'form-input--error' : ''}`}
          value={values.description}
          minLength={10}
          maxLength={500}
          rows={4}
          onChange={(event) => onFieldChange('description', event.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.description)}
        />
        <span className="helper-text">10-500 characters</span>
        {errors.description ? (
          <p role="alert" className="form-error">
            {errors.description}
          </p>
        ) : null}
      </label>

      <fieldset className="form-fieldset">
        <legend className="form-label">How soon do you need the work?</legend>
        <div className="urgency-options">
          {URGENCY_OPTIONS.map((option) => (
            <label key={option.value} className={`chip ${values.urgency === option.value ? 'chip--selected' : ''}`}>
              <input
                type="radio"
                name="urgency"
                value={option.value}
                checked={values.urgency === option.value}
                onChange={() => onFieldChange('urgency', option.value)}
                className="hidden-radio"
                disabled={isSubmitting}
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.urgency ? (
          <p role="alert" className="form-error">
            {errors.urgency || 'Please choose an option'}
          </p>
        ) : null}
      </fieldset>

      {submissionError ? (
        <div role="alert" className="form-alert">
          {submissionFieldError ? `${submissionError}` : submissionError}
        </div>
      ) : null}

      <div className="form-actions">
        <button type="button" className="button button--secondary" onClick={onBack} disabled={isSubmitting}>
          Back
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            void onSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Booking…' : 'Book installation'}
        </button>
      </div>
    </form>
  );
}
