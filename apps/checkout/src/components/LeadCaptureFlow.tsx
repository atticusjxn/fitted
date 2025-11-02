import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { leadFormSchema, contactDetailsSchema, type LeadFormValues, type Tradie } from '../types/index.js';
import { useLeadSubmission, useTradieMatching } from '../hooks/index.js';
import { PostalCodeStep } from './PostalCodeStep.js';
import { TradieSelectionStep } from './TradieSelectionStep.js';
import { ContactDetailsStep } from './ContactDetailsStep.js';
import { SuccessStep } from './SuccessStep.js';

type Step = 'postcode' | 'tradies' | 'contact' | 'success';

interface PrefillData {
  postalCode?: string;
  suburb?: string;
  serviceType?: LeadFormValues['serviceType'];
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  description?: string;
  urgency?: LeadFormValues['urgency'];
}

const DEFAULT_CONTACT_VALUES: Omit<LeadFormValues, 'postalCode' | 'tradieId'> = {
  serviceType: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  description: '',
  urgency: 'soon'
};

interface LeadCaptureFlowProps {
  prefill?: PrefillData;
}

export function LeadCaptureFlow({ prefill }: LeadCaptureFlowProps) {
  const [step, setStep] = useState<Step>('postcode');
  const [postalCode, setPostalCode] = useState(prefill?.postalCode ?? '');
  const [selectedTradieId, setSelectedTradieId] = useState<string | null>(null);
  const [contactValues, setContactValues] = useState({
    serviceType: prefill?.serviceType ?? DEFAULT_CONTACT_VALUES.serviceType,
    firstName: prefill?.firstName ?? DEFAULT_CONTACT_VALUES.firstName,
    lastName: prefill?.lastName ?? DEFAULT_CONTACT_VALUES.lastName,
    email: prefill?.email ?? DEFAULT_CONTACT_VALUES.email,
    phone: prefill?.phone ?? DEFAULT_CONTACT_VALUES.phone,
    description: prefill?.description ?? DEFAULT_CONTACT_VALUES.description,
    urgency: prefill?.urgency ?? DEFAULT_CONTACT_VALUES.urgency
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});
  const hasAutoLookupRun = useRef(false);

  const { tradies, status: tradieStatus, error: tradieError, executeLookup, reset: resetTradies } =
    useTradieMatching();
  const {
    submit,
    status: submissionStatus,
    error: submissionError,
    fieldError: submissionFieldError,
    leadId,
    reset: resetSubmission
  } = useLeadSubmission();

  const isLoadingTradies = tradieStatus === 'loading';
  const isSubmittingLead = submissionStatus === 'loading';

  const selectedInstaller: Tradie | undefined = useMemo(
    () => tradies.find((tradie) => tradie.id === selectedTradieId),
    [tradies, selectedTradieId]
  );

  const handlePostalSubmit = useCallback(
    async (override?: string) => {
      const codeToUse = (override ?? postalCode).trim();
      setPostalCode(codeToUse);

      const result = await executeLookup(codeToUse);

      if (result.status === 'ok') {
        const recommended = result.tradies.find((candidate) => candidate.isRecommended) ?? result.tradies[0];
        setSelectedTradieId(recommended?.id ?? null);
        setStep('tradies');
      }
    },
    [executeLookup, postalCode]
  );

  const handleTradieContinue = useCallback(() => {
    if (!selectedTradieId) {
      return;
    }
    setStep('contact');
  }, [selectedTradieId]);

  const handleFieldChange = useCallback(
    <Key extends keyof LeadFormValues>(field: Key, value: LeadFormValues[Key]) => {
      setContactValues((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!(field in prev)) {
          return prev;
        }

        const next = { ...prev };
        delete next[field];
        return next;
      });

      if (submissionStatus === 'error') {
        resetSubmission();
      }
    },
    [resetSubmission, submissionStatus]
  );

  const handleContactSubmit = useCallback(async () => {
    const contactCheck = contactDetailsSchema.safeParse(contactValues);
    if (!contactCheck.success) {
      const issues = contactCheck.error.flatten().fieldErrors;
      const nextErrors: Partial<Record<keyof LeadFormValues, string>> = {};
      for (const key of Object.keys(issues) as (keyof typeof issues)[]) {
        const message = issues[key]?.[0];
        if (message) {
          nextErrors[key as keyof LeadFormValues] = message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    if (!selectedTradieId) {
      setStep('tradies');
      return;
    }

    const aggregate: LeadFormValues = {
      postalCode,
      tradieId: selectedTradieId,
      ...contactValues
    };

    const parsed = leadFormSchema.safeParse(aggregate);
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      const nextErrors: Partial<Record<keyof LeadFormValues, string>> = {};
      for (const key of Object.keys(issues) as (keyof typeof issues)[]) {
        const message = issues[key]?.[0];
        if (message) {
          nextErrors[key as keyof LeadFormValues] = message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    const result = await submit(aggregate);
    if (result.status === 'ok') {
      setFieldErrors({});
      setStep('success');
      return;
    }

    if (result.field) {
      setFieldErrors((prev) => ({ ...prev, [result.field!]: result.message }));
    }
  }, [contactValues, postalCode, selectedTradieId, submit]);

  const handleReset = useCallback(() => {
    setStep('postcode');
    setPostalCode(prefill?.postalCode ?? '');
    setContactValues({
      serviceType: prefill?.serviceType ?? DEFAULT_CONTACT_VALUES.serviceType,
      firstName: prefill?.firstName ?? DEFAULT_CONTACT_VALUES.firstName,
      lastName: prefill?.lastName ?? DEFAULT_CONTACT_VALUES.lastName,
      email: prefill?.email ?? DEFAULT_CONTACT_VALUES.email,
      phone: prefill?.phone ?? DEFAULT_CONTACT_VALUES.phone,
      description: prefill?.description ?? DEFAULT_CONTACT_VALUES.description,
      urgency: prefill?.urgency ?? DEFAULT_CONTACT_VALUES.urgency
    });
    setSelectedTradieId(null);
    setFieldErrors({});
    resetTradies();
    resetSubmission();
    hasAutoLookupRun.current = false;
  }, [prefill, resetTradies, resetSubmission]);

  useEffect(() => {
    setContactValues((prev) => ({
      ...prev,
      serviceType: prefill?.serviceType ?? DEFAULT_CONTACT_VALUES.serviceType,
      firstName: prefill?.firstName ?? DEFAULT_CONTACT_VALUES.firstName,
      lastName: prefill?.lastName ?? DEFAULT_CONTACT_VALUES.lastName,
      email: prefill?.email ?? DEFAULT_CONTACT_VALUES.email,
      phone: prefill?.phone ?? DEFAULT_CONTACT_VALUES.phone,
      description: prefill?.description ?? DEFAULT_CONTACT_VALUES.description,
      urgency: prefill?.urgency ?? DEFAULT_CONTACT_VALUES.urgency
    }));
    if (prefill?.postalCode) {
      setPostalCode(prefill.postalCode);
    }
  }, [prefill]);

  useEffect(() => {
    if (!prefill?.postalCode || hasAutoLookupRun.current) {
      return;
    }

    hasAutoLookupRun.current = true;
    void handlePostalSubmit(prefill.postalCode);
  }, [prefill?.postalCode, handlePostalSubmit]);

  if (step === 'success' && leadId && selectedInstaller) {
    return <SuccessStep leadId={leadId} tradie={selectedInstaller} onReset={handleReset} />;
  }

  if (step === 'tradies') {
    if (tradieStatus === 'empty') {
      return (
        <section className="form-card">
          <div className="form-header">
            <p className="eyebrow">Step 2 of 4</p>
            <h2 className="form-title">No installers yet</h2>
            <p className="form-subtitle">
              We couldn’t find certified installers for {postalCode}. Try a nearby postcode or adjust details.
            </p>
          </div>
          <div className="form-actions">
            <button type="button" className="button button--secondary" onClick={() => setStep('postcode')}>
              Try another postcode
            </button>
          </div>
        </section>
      );
    }

    return (
      <TradieSelectionStep
        tradies={tradies}
        selectedTradieId={selectedTradieId}
        onSelect={setSelectedTradieId}
        onBack={() => setStep('postcode')}
        onNext={handleTradieContinue}
      />
    );
  }

  if (step === 'contact' && selectedInstaller) {
    return (
      <ContactDetailsStep
        values={contactValues}
        errors={fieldErrors}
        selectedTradieName={selectedInstaller.name}
        submissionFieldError={submissionFieldError}
        onFieldChange={handleFieldChange}
        onBack={() => setStep('tradies')}
        onSubmit={handleContactSubmit}
        isSubmitting={isSubmittingLead}
        submissionError={submissionStatus === 'error' ? submissionError : null}
      />
    );
  }

  return (
    <PostalCodeStep
      value={postalCode}
      onChange={(value) => {
        setPostalCode(value);
        if (fieldErrors.postalCode) {
          setFieldErrors((prev) => ({ ...prev, postalCode: undefined }));
        }
      }}
      onSubmit={handlePostalSubmit}
      isLoading={isLoadingTradies}
      error={tradieError ?? fieldErrors.postalCode}
      defaultPostalCode={prefill?.postalCode}
      defaultSuburb={prefill?.suburb}
    />
  );
}
