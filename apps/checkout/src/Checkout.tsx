import { useCallback, useMemo, useState } from 'react';
import { LeadCaptureFlow } from './components/LeadCaptureFlow.js';
import type { LeadFormValues } from './types/index.js';
import './styles/base.css';

type Step = 'purchase' | 'confirmation';

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface LeadPrefill {
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

const DEFAULT_SHIPPING: ShippingDetails = {
  firstName: 'Harper',
  lastName: 'Ellis',
  email: 'harper.ellis@example.com',
  phone: '+61 412 555 882',
  addressLine1: '12 Flora Street',
  addressLine2: '',
  suburb: 'Coorparoo',
  state: 'QLD',
  postcode: '4151'
};

const PRODUCT = {
  name: 'Aurora Brushed Brass Pendant Light',
  sku: 'PEND-AB-12',
  price: '$329.00',
  imageAlt: 'Aurora pendant light hanging above a dining table',
  features: ['Brushed brass finish', 'Adjustable drop height', 'Dimmable LED compatible']
};

export function CheckoutExtension() {
  const [step, setStep] = useState<Step>('purchase');
  const [shipping, setShipping] = useState<ShippingDetails>(DEFAULT_SHIPPING);

  const prefillForFitted: LeadPrefill = useMemo(
    () => ({
      postalCode: shipping.postcode,
      suburb: shipping.suburb,
      serviceType: 'lighting',
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      email: shipping.email,
      phone: shipping.phone,
      description: `Installation for the ${PRODUCT.name.toLowerCase()} at ${shipping.addressLine1}, ${shipping.suburb}`,
      urgency: 'soon'
    }),
    [shipping]
  );

  const handleShippingChange = useCallback(
    (field: keyof ShippingDetails, value: string) => {
      setShipping((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetFlow = useCallback(() => {
    setStep('purchase');
    setShipping(DEFAULT_SHIPPING);
  }, []);

  return (
    <div className="checkout-root">
      {step === 'purchase' ? (
        <PurchaseScreen
          shipping={shipping}
          onFieldChange={handleShippingChange}
          onComplete={() => setStep('confirmation')}
        />
      ) : (
        <ConfirmationScreen
          shipping={shipping}
          prefill={prefillForFitted}
          onStartOver={resetFlow}
        />
      )}
    </div>
  );
}

interface PurchaseScreenProps {
  shipping: ShippingDetails;
  onFieldChange: (field: keyof ShippingDetails, value: string) => void;
  onComplete: () => void;
}

function PurchaseScreen({ shipping, onFieldChange, onComplete }: PurchaseScreenProps) {
  return (
    <div className="experience-shell">
      <section className="experience-card experience-card--primary">
        <header className="experience-header">
          <p className="eyebrow">Complete your purchase</p>
          <h1 className="experience-title">{PRODUCT.name}</h1>
          <p className="experience-subtitle">
            A modern pendant light crafted for statement dining spaces and open-plan living.
          </p>
        </header>

        <div className="purchase-grid">
          <aside className="order-summary">
            <div className="summary-hero" aria-hidden="true">
              <div className="summary-image-placeholder">{PRODUCT.name[0]}</div>
            </div>
            <div className="summary-body">
              <div className="summary-row">
                <span>SKU</span>
                <strong>{PRODUCT.sku}</strong>
              </div>
              <div className="summary-row">
                <span>Price</span>
                <strong>{PRODUCT.price}</strong>
              </div>
              <div className="summary-divider" />
              <ul className="feature-list">
                {PRODUCT.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </aside>

          <form
            className="shipping-form"
            onSubmit={(event) => {
              event.preventDefault();
              onComplete();
            }}
          >
            <fieldset className="form-fieldset">
              <legend className="form-fieldset__legend">Delivery details</legend>
              <div className="form-grid form-grid--two">
                <label className="form-label">
                  First name
                  <input
                    className="form-input"
                    value={shipping.firstName}
                    onChange={(event) => onFieldChange('firstName', event.target.value)}
                    required
                  />
                </label>
                <label className="form-label">
                  Last name
                  <input
                    className="form-input"
                    value={shipping.lastName}
                    onChange={(event) => onFieldChange('lastName', event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="form-label">
                Email
                <input
                  className="form-input"
                  type="email"
                  value={shipping.email}
                  onChange={(event) => onFieldChange('email', event.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Phone
                <input
                  className="form-input"
                  value={shipping.phone}
                  onChange={(event) => onFieldChange('phone', event.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Address line 1
                <input
                  className="form-input"
                  value={shipping.addressLine1}
                  onChange={(event) => onFieldChange('addressLine1', event.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Address line 2 (optional)
                <input
                  className="form-input"
                  value={shipping.addressLine2}
                  onChange={(event) => onFieldChange('addressLine2', event.target.value)}
                />
              </label>

              <div className="form-grid form-grid--three">
                <label className="form-label">
                  Suburb
                  <input
                    className="form-input"
                    value={shipping.suburb}
                    onChange={(event) => onFieldChange('suburb', event.target.value)}
                    required
                  />
                </label>
                <label className="form-label">
                  State
                  <input
                    className="form-input"
                    value={shipping.state}
                    onChange={(event) => onFieldChange('state', event.target.value)}
                    required
                  />
                </label>
                <label className="form-label">
                  Postcode
                  <input
                    className="form-input"
                    value={shipping.postcode}
                    onChange={(event) => onFieldChange('postcode', event.target.value)}
                    required
                  />
                </label>
              </div>
            </fieldset>

            <div className="form-actions">
              <button className="button button--primary" type="submit">
                Complete purchase
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

interface ConfirmationScreenProps {
  shipping: ShippingDetails;
  prefill: LeadPrefill;
  onStartOver: () => void;
}

function ConfirmationScreen({ shipping, prefill, onStartOver }: ConfirmationScreenProps) {
  return (
    <div className="experience-shell">
      <section className="experience-card experience-card--confirmation">
        <header className="experience-header">
          <p className="eyebrow">Order confirmed</p>
          <h1 className="experience-title">Thanks for your purchase</h1>
          <p className="experience-subtitle">
            We&apos;ve emailed your receipt and will share updates as your pendant light ships.
          </p>
        </header>

        <div className="confirmation-grid">
          <div className="thanks-summary">
            <h2>Shipping to</h2>
            <p>
              {shipping.firstName} {shipping.lastName}
            </p>
            <p>{shipping.addressLine1}</p>
            {shipping.addressLine2 ? <p>{shipping.addressLine2}</p> : null}
            <p>
              {shipping.suburb}, {shipping.state} {shipping.postcode}
            </p>
            <p>{shipping.phone}</p>
            <p>{shipping.email}</p>
            <button className="button button--secondary" type="button" onClick={onStartOver}>
              Edit delivery details
            </button>
          </div>

          <div className="fitted-plugin">
            <header className="plugin-header">
              <p className="eyebrow">Need installation?</p>
              <h2>Connect with a licensed electrician</h2>
              <p>
                We already checked coverage for {shipping.suburb}. Confirm the recommended electrician
                below or choose another tradie before locking in your install.
              </p>
            </header>

            <LeadCaptureFlow prefill={prefill} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default CheckoutExtension;
