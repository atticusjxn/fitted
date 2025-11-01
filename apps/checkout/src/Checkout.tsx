import { LeadCaptureFlow } from './components/LeadCaptureFlow.js';
import './styles/base.css';

export function CheckoutExtension() {
  const mockPrefill = {
    postalCode: '4151',
    suburb: 'Coorparoo',
    firstName: 'Atticus',
    lastName: 'Jackson',
    email: 'atticusjxn@gmail.com',
    phone: '+61 497 779 071',
    description: 'Need a chandelier installed in the living room with cable concealment.',
    serviceType: 'lighting',
    urgency: 'soon' as const
  };

  return (
    <div className="checkout-root">
      <LeadCaptureFlow prefill={mockPrefill} />
    </div>
  );
}

export default CheckoutExtension;
