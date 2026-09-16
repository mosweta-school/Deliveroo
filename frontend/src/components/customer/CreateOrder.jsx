// frontend/src/components/customer/CreateOrder.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  MapPin, Package, Weight, User, Phone, Mail, AlertCircle,
  Check, Shield, DollarSign, Loader, ArrowRight,
  FileText, RefreshCw, RotateCcw, Receipt,
} from 'lucide-react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { customerService } from '../../services/customerService';
import { authService } from '../../services/authService';
import AddressAutocomplete from '../common/AddressAutocomplete';

const mapContainerStyle = { width: '100%', height: '280px', borderRadius: '8px' };
const DRAFT_KEY = 'deliveroo_order_draft';

const getEmptyForm = (user = null) => ({
  pickup_address: '',
  pickup_street_address: '',
  pickup_city: '',
  pickup_county: '',
  pickup_latitude: null,
  pickup_longitude: null,

  destination_address: '',
  destination_street_address: '',
  destination_city: '',
  destination_county: '',
  destination_latitude: null,
  destination_longitude: null,

  sender_name: user?.full_name || '',
  sender_email: user?.email || '',
  sender_phone: user?.phone_number || '',

  receiver_name: '',
  receiver_email: '',
  receiver_phone: '',

  weight: '',
  weight_category: 'Medium',
  distance: '',
  is_fragile: false,
  item_description: '',
  notes: '',
});

const CreateOrder = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdParcel, setCreatedParcel] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [directions, setDirections] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Payment state
  const [paying, setPaying] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const [formData, setFormData] = useState(getEmptyForm());

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const isSubmittingRef = useRef(false);

  const [priceBreakdown, setPriceBreakdown] = useState({
    base_fare: 500,
    weight_charge: 0,
    distance_charge: 0,
    fragile_charge: 0,
    total: 500,
  });

  // ---- Wait for Google Maps ----
  useEffect(() => {
    if (window.google?.maps) {
      setGoogleReady(true);
      return;
    }
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.maps) {
        setGoogleReady(true);
        clearInterval(interval);
      } else if (attempts > 50) {
        clearInterval(interval);
        console.error('❌ [CreateOrder] Google Maps never became available');
        setError('Maps failed to load. Please refresh the page.');
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // ---- Prefill sender + restore draft ----
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData({
          ...getEmptyForm(currentUser),
          ...parsed,
          sender_name: currentUser?.full_name || parsed.sender_name || '',
          sender_email: currentUser?.email || parsed.sender_email || '',
          sender_phone: currentUser?.phone_number || parsed.sender_phone || '',
        });
        setHasDraft(true);
        toast.info('Draft restored from your last session');
      } catch (err) {
        console.error('Failed to restore draft:', err);
        setFormData(getEmptyForm(currentUser));
      }
    } else {
      setFormData(getEmptyForm(currentUser));
    }
  }, []);

  // ---- Auto-save draft ----
  useEffect(() => {
    const isEmpty =
      !formData.pickup_address &&
      !formData.destination_address &&
      !formData.weight;
    if (isEmpty) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setHasDraft(true);
    } catch (err) {
      console.warn('Failed to save draft:', err);
    }
  }, [formData]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }, []);

  // ---- Route calculation ----
  useEffect(() => {
    if (
      !googleReady ||
      !window.google?.maps ||
      !formData.pickup_latitude || !formData.pickup_longitude ||
      !formData.destination_latitude || !formData.destination_longitude
    ) {
      return;
    }
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: formData.pickup_latitude, lng: formData.pickup_longitude },
        destination: {
          lat: formData.destination_latitude,
          lng: formData.destination_longitude,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result.routes?.length > 0) {
          setDirections(result);
          const distanceKm = (
            result.routes[0].legs[0].distance.value / 1000
          ).toFixed(1);
          setRouteDistance(distanceKm);
          setFormData((prev) => ({ ...prev, distance: distanceKm }));
        } else {
          console.warn('⚠️ [CreateOrder] Route calculation failed:', status);
        }
      }
    );
  }, [
    googleReady,
    formData.pickup_latitude, formData.pickup_longitude,
    formData.destination_latitude, formData.destination_longitude,
  ]);

  // ---- Price calculation (debounced) ----
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        setPriceBreakdown({
          base_fare: 500, weight_charge: 0, distance_charge: 0,
          fragile_charge: 0, total: 500,
        });
        return;
      }
      setCalculating(true);
      try {
        const response = await customerService.calculatePrice({
          weight: formData.weight,
          weight_category: formData.weight_category,
          distance: formData.distance || 100,
          is_fragile: formData.is_fragile,
        });
        if (response.success) setPriceBreakdown(response.breakdown);
      } catch (err) {
        const baseFare = 500;
        const weightRates = { Light: 100, Medium: 200, Heavy: 350 };
        const weightCharge =
          (weightRates[formData.weight_category] || 200) *
          parseFloat(formData.weight);
        const distanceCharge = (parseFloat(formData.distance) || 100) * 5;
        const fragileCharge = formData.is_fragile ? 200 : 0;
        setPriceBreakdown({
          base_fare: baseFare,
          weight_charge: weightCharge,
          distance_charge: distanceCharge,
          fragile_charge: fragileCharge,
          total: baseFare + weightCharge + distanceCharge + fragileCharge,
        });
      } finally {
        setCalculating(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    formData.weight,
    formData.weight_category,
    formData.distance,
    formData.is_fragile,
  ]);

  // ---- Handlers ----
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  const handlePickupSelect = useCallback((place) => {
    if (!place?.address) return;
    setFormData((prev) => ({
      ...prev,
      pickup_address: place.address,
      pickup_city: place.city || '',
      pickup_county: place.county || '',
      pickup_latitude: place.latitude || null,
      pickup_longitude: place.longitude || null,
      pickup_street_address:
        prev.pickup_street_address || place.street_address || '',
    }));
  }, []);

  const handleDestinationSelect = useCallback((place) => {
    if (!place?.address) return;
    setFormData((prev) => ({
      ...prev,
      destination_address: place.address,
      destination_city: place.city || '',
      destination_county: place.county || '',
      destination_latitude: place.latitude || null,
      destination_longitude: place.longitude || null,
      destination_street_address:
        prev.destination_street_address || place.street_address || '',
    }));
  }, []);

  // ---- Validation (reads from formDataRef so it never sees stale state) ----
  const validateStep = useCallback((step) => {
    const current = formDataRef.current;
    const toStr = (v) => (v == null ? '' : String(v)).trim();

    const fail = (message) => {
      setError(message);
      return false;
    };

    if (step === 1) {
      if (!toStr(current.pickup_address))
        return fail('Pickup address is required');
      if (!toStr(current.sender_name))
        return fail('Sender name is required');
      if (!toStr(current.sender_phone))
        return fail('Sender phone is required');
    }

    if (step === 2) {
      if (!toStr(current.destination_address))
        return fail('Destination address is required');
      if (!toStr(current.receiver_name))
        return fail('Receiver name is required');
      if (!toStr(current.receiver_phone))
        return fail('Receiver phone is required');
    }

    if (step === 3) {
      const weight = parseFloat(current.weight);
      if (isNaN(weight) || weight <= 0)
        return fail('Please enter a valid weight');
    }

    return true;
  }, []);

  const nextStep = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (validateStep(currentStep)) {
        setCurrentStep((prev) => Math.min(prev + 1, 3));
        setError(null);
      }
    },
    [currentStep, validateStep]
  );

  const prevStep = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  }, []);

  // ---- Submission ----
  const submitOrder = useCallback(
    async (dataToSubmit) => {
      if (isSubmittingRef.current) return null;

      for (let i = 1; i <= 3; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          return null;
        }
      }

      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await customerService.createOrder(dataToSubmit);

        if (response.success) {
          setCreatedParcel(response.parcel);
          setSuccess(true);
          clearDraft();
          toast.success('Order created successfully!');
          return response.parcel;
        } else {
          setError(response.error || 'Failed to create order');
          setLastSubmission(dataToSubmit);
          return null;
        }
      } catch (err) {
        const message = err.message || 'Failed to create order';
        setError(message);
        setLastSubmission(dataToSubmit);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [clearDraft, validateStep]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitOrder(formDataRef.current);
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && currentStep < 3) {
      const target = e.target;
      const tag = (target?.tagName || '').toLowerCase();
      const isTextarea = tag === 'textarea';
      if (!isTextarea) {
        e.preventDefault();
      }
    }
  };

  // ---- Pay deposit (mock) ----
  const handlePayDeposit = useCallback(async () => {
    if (!createdParcel?.id || paying) return;
    setPaying(true);
    setError(null);
    try {
      const response = await customerService.payOrderDeposit(createdParcel.id);
      if (response.success && response.parcel) {
        setCreatedParcel(response.parcel);
        setPaymentReceipt(response.payment || null);
        toast.success('Payment received (mock)');
      } else {
        const msg = response.error || 'Payment failed';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const message = err.message || 'Payment failed';
      setError(message);
      toast.error(message);
    } finally {
      setPaying(false);
    }
  }, [createdParcel, paying]);

  const handleRetry = useCallback(async () => {
    if (!lastSubmission) return;
    setError(null);
    await submitOrder(lastSubmission);
  }, [lastSubmission, submitOrder]);

  const handleCreateAnother = useCallback(() => {
    setFormData(getEmptyForm(user));
    setPriceBreakdown({
      base_fare: 500, weight_charge: 0, distance_charge: 0,
      fragile_charge: 0, total: 500,
    });
    setDirections(null);
    setRouteDistance(null);
    setCreatedParcel(null);
    setLastSubmission(null);
    setSuccess(false);
    setError(null);
    setCurrentStep(1);
    setPaying(false);
    setPaymentReceipt(null);
    clearDraft();
  }, [user, clearDraft]);

  const handleClearDraft = useCallback(() => {
    if (!window.confirm('Clear all form data and start fresh?')) return;
    handleCreateAnother();
    toast.info('Draft cleared');
  }, [handleCreateAnother]);

  const formatPrice = (price) => `KSh ${Number(price || 0).toLocaleString()}`;

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================
  if (success) {
    const paymentMethod = createdParcel?.payment_method || 'deposit';
    const depositAmount = createdParcel?.deposit_amount ?? 0;
    const amountDue = createdParcel?.amount_due ?? 0;
    const depositPercent = createdParcel?.deposit_percent ?? 0;
    const totalPrice = createdParcel?.price ?? priceBreakdown.total;

    // Deposit is considered paid if either the fresh parcel says so, or
    // we just received a receipt in this session.
    const depositPaid =
      (createdParcel?.is_deposit_paid ?? false) || !!paymentReceipt;

    // The receipt to show: prefer the one we just got, otherwise pull the
    // first deposit payment off the parcel if the API returned it.
    const receiptNumber =
      paymentReceipt?.mpesa_receipt ||
      createdParcel?.payments?.find((p) => p.type === 'deposit' && p.status === 'completed')
        ?.mpesa_receipt ||
      null;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
            <p className="text-gray-600">
              Your delivery order has been created successfully.
            </p>
          </div>

          {/* Tracking number */}
          {createdParcel && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-xs text-blue-600 mb-1">Tracking Number</p>
              <p className="font-mono font-bold text-blue-700 text-lg">
                {createdParcel.tracking_number}
              </p>
            </div>
          )}

          {/* Error (payment failures etc) */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Payment block */}
          {createdParcel && (
            <div className="border border-slate-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Payment
                </span>
              </div>

              {paymentMethod === 'cod' ? (
                <div className="text-sm text-slate-600">
                  <p className="mb-1">
                    You're eligible for{' '}
                    <strong className="text-slate-900">Cash on Delivery</strong>.
                  </p>
                  <p>
                    Please have{' '}
                    <strong className="text-slate-900">
                      {formatPrice(amountDue)}
                    </strong>{' '}
                    ready when the parcel arrives.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total</span>
                      <span className="font-medium text-slate-900">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Deposit due now ({depositPercent}%)
                      </span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(depositAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Balance on delivery</span>
                      <span className="font-medium text-slate-900">
                        {formatPrice(amountDue)}
                      </span>
                    </div>
                  </div>

                  {depositPaid ? (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <Check className="h-4 w-4" />
                        Deposit paid
                      </div>
                      {receiptNumber && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                          <Receipt className="h-3.5 w-3.5" />
                          Receipt: <span className="font-mono">{receiptNumber}</span>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-green-700">
                        The rider will collect {formatPrice(amountDue)} on delivery.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handlePayDeposit}
                      disabled={paying}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paying ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Processing payment...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          Pay {formatPrice(depositAmount)} Now
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Policy explanation */}
              {paymentMethod === 'deposit' && depositPercent === 60 && (
                <p className="text-xs text-amber-600 mt-3">
                  A 60% deposit applies because this parcel is marked fragile.
                </p>
              )}
              {paymentMethod === 'deposit' && depositPercent === 40 && (
                <p className="text-xs text-slate-500 mt-3">
                  New customers pay a 40% deposit. Complete 2 deliveries to
                  unlock Cash on Delivery.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCreateAnother}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition-colors"
          >
            Create Another Order
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN FORM
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Create Delivery Order
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Send a parcel to any destination across Kenya
            </p>
          </div>
          {hasDraft && (
            <button
              onClick={handleClearDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear draft and start fresh"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear draft
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Something went wrong</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            {lastSubmission && (
              <button
                onClick={handleRetry}
                disabled={loading}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Pickup & Sender', icon: MapPin },
              { num: 2, label: 'Destination & Receiver', icon: MapPin },
              { num: 3, label: 'Package', icon: Package },
            ].map((step) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${currentStep >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {currentStep > step.num ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`
                      text-xs mt-2 font-medium
                      ${currentStep >= step.num ? 'text-blue-600' : 'text-gray-400'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
                {step.num < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate>
              {/* STEP 1 */}
              <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      1. Pickup Location
                    </h2>
                    <div className="space-y-4">
                      <AddressAutocomplete
                        key="pickup-autocomplete"
                        label="Pickup Address"
                        value={formData.pickup_address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pickup_address: e.target.value,
                          }))
                        }
                        onPlaceSelect={handlePickupSelect}
                        placeholder="e.g., Quickmart Moi Avenue, Nairobi"
                        showCurrentLocation
                        streetAddress={formData.pickup_street_address}
                        onStreetAddressChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            pickup_street_address: v,
                          }))
                        }
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Town / Area
                          </label>
                          <input
                            type="text"
                            value={formData.pickup_city}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                pickup_city: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            placeholder="Auto-filled — edit if needed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            County
                          </label>
                          <input
                            type="text"
                            value={formData.pickup_county}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                pickup_county: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            placeholder="Auto-filled — edit if needed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Sender Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            name="sender_name"
                            value={formData.sender_name}
                            onChange={handleChange}
                            className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              name="sender_email"
                              value={formData.sender_email}
                              onChange={handleChange}
                              className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="tel"
                              name="sender_phone"
                              value={formData.sender_phone}
                              onChange={handleChange}
                              className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-red-600" />
                      2. Destination
                    </h2>
                    <div className="space-y-4">
                      <AddressAutocomplete
                        key="destination-autocomplete"
                        label="Delivery Address"
                        value={formData.destination_address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            destination_address: e.target.value,
                          }))
                        }
                        onPlaceSelect={handleDestinationSelect}
                        placeholder="e.g., Nyayo Estate Embakasi Gate D"
                        streetAddress={formData.destination_street_address}
                        onStreetAddressChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            destination_street_address: v,
                          }))
                        }
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Town / Area
                          </label>
                          <input
                            type="text"
                            value={formData.destination_city}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                destination_city: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            placeholder="Auto-filled — edit if needed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            County
                          </label>
                          <input
                            type="text"
                            value={formData.destination_county}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                destination_county: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            placeholder="Auto-filled — edit if needed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-red-600" />
                      Receiver Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            name="receiver_name"
                            value={formData.receiver_name}
                            onChange={handleChange}
                            className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              name="receiver_email"
                              value={formData.receiver_email}
                              onChange={handleChange}
                              className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="tel"
                              name="receiver_phone"
                              value={formData.receiver_phone}
                              onChange={handleChange}
                              className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    3. Package Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (kg) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight Category
                        </label>
                        <select
                          name="weight_category"
                          value={formData.weight_category}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Light">Light (Under 2 kg)</option>
                          <option value="Medium">Medium (2 - 5 kg)</option>
                          <option value="Heavy">Heavy (5 - 10 kg)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What's in the package?
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          name="item_description"
                          value={formData.item_description}
                          onChange={handleChange}
                          placeholder="e.g., Laptop, Documents, Food items"
                          className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distance (auto-calculated)
                      </label>
                      <input
                        type="text"
                        value={formData.distance ? `${formData.distance} km` : 'Calculating...'}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50"
                        readOnly
                      />
                      {routeDistance && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Route calculated using Google Maps
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="fragile"
                        name="is_fragile"
                        checked={formData.is_fragile}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="fragile"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4 text-amber-500" />
                        Fragile — Handle with care (+KSh 200)
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Any special instructions for the rider..."
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {directions && googleReady && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Route Preview
                        </h3>
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={{
                            lat:
                              (formData.pickup_latitude +
                                formData.destination_latitude) /
                              2,
                            lng:
                              (formData.pickup_longitude +
                                formData.destination_longitude) /
                              2,
                          }}
                          zoom={11}
                        >
                          <Marker
                            position={{
                              lat: formData.pickup_latitude,
                              lng: formData.pickup_longitude,
                            }}
                            label="P"
                          />
                          <Marker
                            position={{
                              lat: formData.destination_latitude,
                              lng: formData.destination_longitude,
                            }}
                            label="D"
                          />
                          <DirectionsRenderer directions={directions} />
                        </GoogleMap>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Place Order
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* SIDEBAR */}
          <aside className="w-full lg:w-96">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Order Summary
              </h2>

              {(formData.pickup_address || formData.destination_address) && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formData.pickup_address || 'Not set'}
                      </p>
                      {formData.pickup_street_address && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formData.pickup_street_address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 my-2 pl-6">
                    <div className="flex-1 border-t border-dashed border-gray-300" />
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <div className="flex-1 border-t border-dashed border-gray-300" />
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Destination</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formData.destination_address || 'Not set'}
                      </p>
                      {formData.destination_street_address && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formData.destination_street_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium">
                    {formatPrice(priceBreakdown.base_fare)}
                  </span>
                </div>
                {formData.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Weight ({formData.weight} kg)
                    </span>
                    <span className="font-medium">
                      {calculating ? (
                        <Loader className="h-4 w-4 animate-spin inline" />
                      ) : (
                        formatPrice(priceBreakdown.weight_charge)
                      )}
                    </span>
                  </div>
                )}
                {formData.distance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Distance ({formData.distance} km)
                    </span>
                    <span className="font-medium">
                      {formatPrice(priceBreakdown.distance_charge)}
                    </span>
                  </div>
                )}
                {formData.is_fragile && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Shield className="h-3 w-3 text-amber-500" />
                      Fragile Handling
                    </span>
                    <span className="font-medium">
                      {formatPrice(priceBreakdown.fragile_charge)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {calculating ? (
                      <Loader className="h-5 w-5 animate-spin inline" />
                    ) : (
                      formatPrice(priceBreakdown.total)
                    )}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                By placing the order you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;