import { useCallback, useState } from 'react';
import { submitLead, type LeadSubmissionResult } from '../services/mockApi.js';
import type { LeadFormValues } from '../types/index.js';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useLeadSubmission() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<keyof LeadFormValues | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const execute = useCallback(async (payload: LeadFormValues) => {
    setStatus('loading');
    setError(null);
    setLeadId(null);
    setFieldError(null);

    const response: LeadSubmissionResult = await submitLead(payload);

    if (response.status === 'ok') {
      setLeadId(response.leadId);
      setStatus('success');
      return { status: 'ok' as const, leadId: response.leadId };
    }

    setStatus('error');
    setError(response.message);
    setFieldError(response.field ?? null);
    return {
      status: 'error' as const,
      message: response.message,
      field: response.field
    };
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setFieldError(null);
    setLeadId(null);
  }, []);

  return {
    status,
    error,
    fieldError,
    leadId,
    submit: execute,
    reset
  };
}
