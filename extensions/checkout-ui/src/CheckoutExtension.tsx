import { useEffect, useState, useCallback } from 'react';
import {
  reactExtension,
  BlockStack,
  Text,
  Button,
  TextField,
  Select,
  Banner,
  ChoiceList,
  useShippingAddress,
  useEmail,
  Divider,
  Heading,
  InlineLayout,
  View,
} from '@shopify/ui-extensions-react/checkout';
import { fetchTradies, submitLead, type TradieResponse } from './services/api.js';
import type { Tradie, LeadFormValues } from './types/index.js';

export default reactExtension('purchase.thank-you.block.render', () => <Extension />);

type Step = 'loading' | 'select-tradie' | 'contact' | 'success' | 'no-coverage';

function Extension() {
  const shippingAddress = useShippingAddress();
  const email = useEmail();

  // Debug: Log what we're getting from hooks
  console.log('[Fitted Extension] Shipping Address:', shippingAddress);
  console.log('[Fitted Extension] Email:', email);

  const [step, setStep] = useState<Step>('loading');
  const [tradies, setTradies] = useState<Tradie[]>([]);
  const [selectedTradieId, setSelectedTradieId] = useState<string>('');
  const [formData, setFormData] = useState({
    serviceType: 'lighting',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    description: '',
    urgency: 'soon' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Auto-fetch tradies when shipping address is available
  useEffect(() => {
    console.log('[Fitted Extension] useEffect triggered, zip:', shippingAddress?.zip);

    if (!shippingAddress?.zip) {
      console.log('[Fitted Extension] No zip code found, returning early');
      return;
    }

    const loadTradies = async () => {
      console.log('[Fitted Extension] Loading tradies for zip:', shippingAddress.zip);
      setStep('loading');
      const result = await fetchTradies(shippingAddress.zip);
      console.log('[Fitted Extension] Fetch result:', result);

      if (result.status === 'ok') {
        setTradies(result.tradies);
        const recommended = result.tradies.find((t) => t.isRecommended) ?? result.tradies[0];
        if (recommended) {
          setSelectedTradieId(recommended.id);
        }
        setStep('select-tradie');
      } else if (result.status === 'empty') {
        setStep('no-coverage');
      } else {
        setError(result.message);
        setStep('no-coverage');
      }
    };

    // Prefill contact data from checkout
    setFormData({
      serviceType: 'lighting',
      firstName: shippingAddress.firstName || '',
      lastName: shippingAddress.lastName || '',
      email: email || '',
      phone: shippingAddress.phone || '',
      description: '',
      urgency: 'soon',
    });

    loadTradies();
  }, [shippingAddress?.zip, shippingAddress?.firstName, shippingAddress?.lastName, shippingAddress?.phone, email]);

  const handleSubmit = useCallback(async () => {
    if (!shippingAddress?.zip || !selectedTradieId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: LeadFormValues = {
      postalCode: shippingAddress.zip,
      tradieId: selectedTradieId,
      ...formData,
    };

    const result = await submitLead(payload);

    if (result.status === 'ok') {
      setLeadId(result.leadId);
      setStep('success');
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  }, [shippingAddress?.zip, selectedTradieId, formData]);

  // Don't show anything if no shipping address yet
  // Show debug banner if address exists but no zip
  if (!shippingAddress) {
    return (
      <BlockStack spacing="base">
        <Heading level={2}>Installation Service</Heading>
        <Banner status="info">
          Loading address information...
        </Banner>
      </BlockStack>
    );
  }

  if (!shippingAddress.zip) {
    return (
      <BlockStack spacing="base">
        <Heading level={2}>Installation Service</Heading>
        <Banner status="warning">
          Address found but no postal code: {JSON.stringify(shippingAddress)}
        </Banner>
      </BlockStack>
    );
  }

  // Loading state
  if (step === 'loading') {
    return (
      <BlockStack spacing="base">
        <Heading level={2}>Need Installation?</Heading>
        <Text>Finding licensed installers in your area...</Text>
      </BlockStack>
    );
  }

  // No coverage
  if (step === 'no-coverage') {
    return (
      <BlockStack spacing="base">
        <Heading level={2}>Need Installation?</Heading>
        <Banner status="info">
          We don't have coverage in {shippingAddress.city || shippingAddress.zip} yet, but we're expanding soon!
        </Banner>
        {error && (
          <Banner status="critical">
            Error: {error}
          </Banner>
        )}
      </BlockStack>
    );
  }

  // Success
  if (step === 'success') {
    const selectedTradie = tradies.find((t) => t.id === selectedTradieId);
    return (
      <BlockStack spacing="base">
        <Heading level={2}>Installation Scheduled!</Heading>
        <Banner status="success">
          Your installation request has been sent to {selectedTradie?.name}. They'll contact you within 24 hours to
          confirm the details.
        </Banner>
        <Text size="small">Reference: {leadId}</Text>
      </BlockStack>
    );
  }

  // Contact details form
  if (step === 'contact') {
    const selectedTradie = tradies.find((t) => t.id === selectedTradieId);

    return (
      <BlockStack spacing="base">
        <Heading level={2}>Contact Details</Heading>
        <Text>Confirm your details for {selectedTradie?.name}</Text>

        <Divider />

        <TextField
          label="First Name"
          value={formData.firstName}
          onChange={(value) => setFormData({ ...formData, firstName: value })}
          required
        />

        <TextField
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => setFormData({ ...formData, lastName: value })}
          required
        />

        <TextField
          label="Email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          required
        />

        <TextField
          label="Phone"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          required
        />

        <Select
          label="Service Type"
          value={formData.serviceType}
          onChange={(value) => setFormData({ ...formData, serviceType: value })}
          options={[
            { value: 'lighting', label: 'Lighting Installation' },
            { value: 'electrical', label: 'General Electrical' },
            { value: 'appliance', label: 'Appliance Installation' },
          ]}
        />

        <TextField
          label="Installation Notes (Optional)"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          multiline={3}
        />

        <Select
          label="Urgency"
          value={formData.urgency}
          onChange={(value) => setFormData({ ...formData, urgency: value as 'asap' | 'soon' | 'flexible' })}
          options={[
            { value: 'asap', label: 'ASAP' },
            { value: 'soon', label: 'Within a week' },
            { value: 'flexible', label: 'Flexible timing' },
          ]}
        />

        {error && <Banner status="critical">{error}</Banner>}

        <InlineLayout spacing="base" blockAlignment="center">
          <Button onPress={() => setStep('select-tradie')}>Back</Button>
          <Button kind="primary" onPress={handleSubmit} loading={isSubmitting}>
            Confirm Installation
          </Button>
        </InlineLayout>
      </BlockStack>
    );
  }

  // Tradie selection
  const selectedTradie = tradies.find((t) => t.id === selectedTradieId);

  return (
    <BlockStack spacing="base">
      <Heading level={2}>Professional Installation Available</Heading>
      <Text appearance="subdued">
        We've found {tradies.length} licensed installer{tradies.length > 1 ? 's' : ''} in{' '}
        {shippingAddress.city || shippingAddress.zip}
      </Text>

      <Divider />

      <ChoiceList
        name="installer"
        value={selectedTradieId}
        onChange={setSelectedTradieId}
        choices={tradies.map((tradie) => ({
          id: tradie.id,
          label: tradie.name + (tradie.isRecommended ? ' (Recommended)' : ''),
          secondaryLabel: `⭐ ${tradie.rating.toFixed(1)} (${tradie.reviewCount} reviews) • ${tradie.distanceKm.toFixed(1)}km away`
        }))}
      />

      {selectedTradie && (
        <>
          <Divider />
          <View border="base" padding="base" cornerRadius="base">
            <BlockStack spacing="tight">
              <Text emphasis="bold">{selectedTradie.name}</Text>
              <Text size="small">⭐ {selectedTradie.rating.toFixed(1)} ({selectedTradie.reviewCount} reviews)</Text>
              <Text size="small">{selectedTradie.distanceKm.toFixed(1)}km away</Text>
              {selectedTradie.licensed && selectedTradie.insured && (
                <Text size="small">✓ Licensed & Insured</Text>
              )}
              {selectedTradie.responseTime && (
                <Text size="small">Response time: {selectedTradie.responseTime}</Text>
              )}
            </BlockStack>
          </View>
        </>
      )}

      <Button kind="primary" onPress={() => setStep('contact')} disabled={!selectedTradieId}>
        Continue with {selectedTradie?.name || 'Selected Installer'}
      </Button>

      <Text size="small" appearance="subdued">
        No payment required now. The installer will provide a quote after assessing your needs.
      </Text>
    </BlockStack>
  );
}
