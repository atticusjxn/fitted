import { CheckCircle2 } from 'lucide-react';

interface SuccessStepProps {
  leadId: string;
  onReset: () => void;
}

export function SuccessStep({ leadId, onReset }: SuccessStepProps) {
  return (
    <section className="form-card" aria-labelledby="success-heading">
      <div className="form-header">
        <p className="eyebrow">All done</p>
        <h2 id="success-heading" className="form-title">
          Your request is on its way
        </h2>
        <p className="form-subtitle">
          We’ve shared your details with the installer you selected. They’ll reach out shortly to lock in the
          install.
        </p>
      </div>

      <div className="success-card">
        <p className="success-badge" aria-label="Lead created">
          <CheckCircle2 size={18} aria-hidden /> Lead created
        </p>
        <p className="success-lead">Reference ID: {leadId}</p>
        <p>
          Check your email for a confirmation and keep an eye on your phone. If you need to adjust any
          details, reply to the installer directly.
        </p>
      </div>

      <button type="button" className="button button--primary" onClick={onReset}>
        Book another installation
      </button>
    </section>
  );
}
