'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import { PRODUCT_TYPES } from '@/lib/constants';

interface NewOrderFormData {
  productType: string;
  quantity: string;
  targetPrice: string;
  targetDeliveryDate: string;
  productDescription: string;
  specificRequirements: string;
}

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Product Details' },
  { id: 3, label: 'Review & Submit' },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setUserName(profile.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(profile.company_name || '');
      } else {
        setUserName(user.user_metadata?.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(user.user_metadata?.company_name || '');
      }
    }
    loadUser();
  }, [router]);

  const [formData, setFormData] = useState<NewOrderFormData>({
    productType: '',
    quantity: '',
    targetPrice: '',
    targetDeliveryDate: '',
    productDescription: '',
    specificRequirements: '',
  });

  const [errors, setErrors] = useState<Partial<NewOrderFormData>>({});

  const handleInputChange = (
    field: keyof NewOrderFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Partial<NewOrderFormData> = {};

    if (!formData.productType) {
      newErrors.productType = 'Product type is required';
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.targetPrice || parseFloat(formData.targetPrice) <= 0) {
      newErrors.targetPrice = 'Target price must be greater than 0';
    }
    if (!formData.targetDeliveryDate) {
      newErrors.targetDeliveryDate = 'Target delivery date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<NewOrderFormData> = {};

    if (!formData.productDescription) {
      newErrors.productDescription = 'Product description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const orderNumber = `ORD-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          client_id: userId,
          order_number: orderNumber,
          status: 'submitted',
          product_type: formData.productType,
          product_description: formData.productDescription,
          quantity: parseInt(formData.quantity),
          target_price: parseFloat(formData.targetPrice),
          target_delivery_date: formData.targetDeliveryDate,
          notes: formData.specificRequirements || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order. Please try again.');
        setSubmitting(false);
        return;
      }

      setGeneratedOrderId(orderNumber);
      setShowSuccess(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Error:', err);
      alert('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <PortalLayout
        pageTitle="New Order"
        userName={userName}
        userEmail={userEmail}
        companyName={companyName}
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your order has been submitted and is now under review.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-xl font-bold text-green-600">{generatedOrderId}</p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                You will receive updates via email. Check your dashboard for more details.
              </p>
              <a href="/portal/orders">
                <Button variant="primary">View My Orders</Button>
              </a>
            </CardBody>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  const productOptions = PRODUCT_TYPES.map((type) => ({
    value: type,
    label: type,
  }));

  return (
    <PortalLayout
      pageTitle="New Order"
      userName={userName}
      userEmail={userEmail}
      companyName={companyName}
    >
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep >= step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={
                  currentStep >= step.id
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500'
                }
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">
              {currentStep === 1 && 'Basic Order Information'}
              {currentStep === 2 && 'Product Details'}
              {currentStep === 3 && 'Review & Submit'}
            </h2>
          </CardHeader>

          <CardBody className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <Select
                  label="Product Type"
                  options={productOptions}
                  value={formData.productType}
                  onChange={(e) =>
                    handleInputChange('productType', e.target.value)
                  }
                  error={errors.productType}
                  placeholder="Select a product type"
                />

                <Input
                  label="Quantity"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  error={errors.quantity}
                />

                <Input
                  label="Target Unit Price ($)"
                  type="number"
                  placeholder="e.g., 8.50"
                  step="0.01"
                  value={formData.targetPrice}
                  onChange={(e) =>
                    handleInputChange('targetPrice', e.target.value)
                  }
                  error={errors.targetPrice}
                />

                <Input
                  label="Target Delivery Date"
                  type="date"
                  value={formData.targetDeliveryDate}
                  onChange={(e) =>
                    handleInputChange('targetDeliveryDate', e.target.value)
                  }
                  error={errors.targetDeliveryDate}
                />
              </>
            )}

            {/* Step 2: Product Details */}
            {currentStep === 2 && (
              <>
                <Textarea
                  label="Product Description"
                  placeholder="Describe the product you want to order. Include details like materials, colors, branding requirements, etc."
                  rows={6}
                  value={formData.productDescription}
                  onChange={(e) =>
                    handleInputChange('productDescription', e.target.value)
                  }
                  error={errors.productDescription}
                />

                <Textarea
                  label="Specific Requirements (Optional)"
                  placeholder="Any additional specifications, certifications, or requirements for this order..."
                  rows={4}
                  value={formData.specificRequirements}
                  onChange={(e) =>
                    handleInputChange('specificRequirements', e.target.value)
                  }
                  helperText="You can upload reference images after submitting the order."
                />
              </>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Product Type</p>
                      <p className="font-semibold text-gray-900">
                        {formData.productType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="font-semibold text-gray-900">
                        {formData.quantity.toLocaleString()} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Target Unit Price
                      </p>
                      <p className="font-semibold text-gray-900">
                        ${formData.targetPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Target Delivery Date
                      </p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          formData.targetDeliveryDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Product Description
                    </p>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {formData.productDescription}
                    </p>
                  </div>

                  {formData.specificRequirements && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Specific Requirements
                      </p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {formData.specificRequirements}
                      </p>
                    </div>
                  )}
                </div>

                <Badge variant="success">
                  All information looks good! Ready to submit.
                </Badge>
              </div>
            )}
          </CardBody>

          {/* Navigation Buttons */}
          <CardFooter>
            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button variant="primary" onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
}
