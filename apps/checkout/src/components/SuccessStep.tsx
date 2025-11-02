import { useCallback, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Tradie } from '../types/index.js';

interface SuccessStepProps {
  leadId: string;
  tradie: Tradie;
  onReset: () => void;
}

export function SuccessStep({ leadId, tradie, onReset }: SuccessStepProps) {
  const telHref = useMemo(
    () => `tel:${tradie.phone.replace(/[^\d+]/g, '')}`,
    [tradie.phone]
  );

  const handleSaveContact = useCallback(() => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${tradie.name}`,
      `ORG:${tradie.name}`,
      `TEL;TYPE=WORK,VOICE:${tradie.phone}`,
      'END:VCARD'
    ].join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${tradie.name.replace(/\s+/g, '-').toLowerCase()}-contact.vcf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [tradie.name, tradie.phone]);

  return (
    <section className="form-card" aria-labelledby="success-heading">
      <div className="form-header">
        <p className="eyebrow">All done</p>
        <h2 id="success-heading" className="form-title">
          Your request is on its way
        </h2>
        <p className="form-subtitle">
          We’ve sent your details straight to {tradie.name}. Expect a text or call soon to confirm your install time.
        </p>
      </div>

      <div className="success-card success-card--friendly">
        <p className="success-badge" aria-label={`Request sent to ${tradie.name}`}>
          <CheckCircle2 size={18} aria-hidden /> Request sent to {tradie.name}
        </p>
        <p>
          They’ll reach out from <a href={telHref}>{tradie.phone}</a>. Keep an eye on your phone so you don’t miss
          their message.
        </p>
        <div className="contact-card" role="group" aria-label={`${tradie.name} contact options`}>
          <div className="contact-card__details">
            <span className="contact-card__label">Installer phone</span>
            <a className="contact-card__value" href={telHref}>
              {tradie.phone}
            </a>
            <span className="contact-card__hint">Tap to call or text {tradie.name} directly.</span>
          </div>
          <div className="contact-card__actions">
            <button type="button" className="button button--ghost" onClick={handleSaveContact}>
              Add to contacts
            </button>
          </div>
        </div>
        <p className="success-reference">Request reference: {leadId}</p>
      </div>

      <button type="button" className="button button--primary" onClick={onReset}>
        Book another installation
      </button>
    </section>
  );
}
