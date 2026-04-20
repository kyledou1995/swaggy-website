'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Truck,
  Plus,
  Trash2,
  MapPin,
  Star,
  AlertCircle,
  SplitSquareVertical,
  Package,
  Clock,
  Pencil,
  Image as ImageIcon,
  Upload,
  X,
  Ruler,
} from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import { notifyAdmins } from '@/lib/notifications';
import { PRODUCT_TYPES } from '@/lib/constants';
import { DeliveryAddress, PrefixedProduct } from '@/types';

interface NewOrderFormData {
  productType: string;
  quantity: string;
  targetPrice: string;
  targetDeliveryDate: string;
  productDescription: string;
  specificRequirements: string;
}

interface ShipmentSplit {
  addressId: string;
  quantity: string;
  notes: string;
}

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Product Details' },
  { id: 3, label: 'Delivery' },
  { id: 4, label: 'Review & Submit' },
];

const supabase = createClient();

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

  // Prefixed product selection
  const [prefixedProducts, setPrefixedProducts] = useState<PrefixedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedPrefixed, setSelectedPrefixed] = useState<PrefixedProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showDeselectWarning, setShowDeselectWarning] = useState(false);
  const [pendingFieldEdit, setPendingFieldEdit] = useState<{ field: keyof NewOrderFormData; value: string } | null>(null);

  // Custom product dimensions
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customLength, setCustomLength] = useState('');

  // Inspiration images
  const [inspirationImages, setInspirationImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Delivery addresses
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [splitMode, setSplitMode] = useState(false);
  const [shipments, setShipments] = useState<ShipmentSplit[]>([{ addressId: '', quantity: '', notes: '' }]);
  const [deliveryError, setDeliveryError] = useState('');

  useEffect(() => {
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

      // Load delivery addresses
      const { data: addrData } = await supabase
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      const addrs = addrData || [];
      setAddresses(addrs);
      setAddressesLoading(false);

      // Pre-select default address
      const defaultAddr = addrs.find((a: DeliveryAddress) => a.is_default);
      if (defaultAddr) {
        setShipments([{ addressId: defaultAddr.id, quantity: '', notes: '' }]);
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

  // Fetch prefixed products when product type changes
  useEffect(() => {
    if (!formData.productType) {
      setPrefixedProducts([]);
      setSelectedPrefixed(null);
      setSelectedSize('');
      setIsCustomMode(false);
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from('prefixed_products')
        .select('*')
        .eq('product_type', formData.productType)
        .eq('is_active', true)
        .order('name', { ascending: true });

      const products = (data as PrefixedProduct[]) || [];
      setPrefixedProducts(products);
      setLoadingProducts(false);

      // If no prefixed products exist for this type, go straight to custom mode
      if (products.length === 0) {
        setIsCustomMode(true);
        setSelectedPrefixed(null);
        setSelectedSize('');
      } else {
        // Reset selection when product type changes
        setIsCustomMode(false);
        setSelectedPrefixed(null);
        setSelectedSize('');
      }
    };

    fetchProducts();
  }, [formData.productType]);

  const handleInputChange = (field: keyof NewOrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleProductTypeChange = (value: string) => {
    handleInputChange('productType', value);
    // Clear product-related fields when type changes
    setFormData((prev) => ({
      ...prev,
      productType: value,
      productDescription: '',
      specificRequirements: '',
    }));
    setSelectedPrefixed(null);
    setSelectedSize('');
    setIsCustomMode(false);
  };

  const selectPrefixedProduct = (product: PrefixedProduct) => {
    setSelectedPrefixed(product);
    setSelectedSize(product.sizes.length === 1 ? product.sizes[0].size : '');
    setIsCustomMode(false);

    // Auto-fill product details
    const sizeList = product.sizes.map((s) => s.size).join(', ');
    const priceRange =
      product.estimated_price_min != null && product.estimated_price_max != null
        ? `$${product.estimated_price_min.toFixed(2)} – $${product.estimated_price_max.toFixed(2)} per unit`
        : '';
    const prodTime = product.estimated_production_days
      ? `Estimated production: ${product.estimated_production_days} days`
      : '';

    const description = [
      `${product.name} (SKU: ${product.sku})`,
      `Material: ${product.material}`,
      `Available sizes: ${sizeList}`,
      priceRange,
      prodTime,
      product.description,
    ]
      .filter(Boolean)
      .join('\n');

    setFormData((prev) => ({
      ...prev,
      productDescription: description,
      specificRequirements: '',
    }));
  };

  const switchToCustom = () => {
    setIsCustomMode(true);
    setSelectedPrefixed(null);
    setSelectedSize('');
    setFormData((prev) => ({
      ...prev,
      productDescription: '',
      specificRequirements: '',
    }));
  };

  // Handle edits to auto-filled fields — warn about deselecting prefixed product
  const handleProductDetailChange = (field: keyof NewOrderFormData, value: string) => {
    if (selectedPrefixed && !isCustomMode) {
      setPendingFieldEdit({ field, value });
      setShowDeselectWarning(true);
      return;
    }
    handleInputChange(field, value);
  };

  const confirmDeselect = () => {
    if (pendingFieldEdit) {
      setSelectedPrefixed(null);
      setSelectedSize('');
      setIsCustomMode(true);
      handleInputChange(pendingFieldEdit.field, pendingFieldEdit.value);
    }
    setShowDeselectWarning(false);
    setPendingFieldEdit(null);
  };

  const cancelDeselect = () => {
    setShowDeselectWarning(false);
    setPendingFieldEdit(null);
  };

  // Inspiration image handlers
  const handleInspirationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - inspirationImages.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setInspirationImages((prev) => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeInspirationImage = (index: number) => {
    setInspirationImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadInspirationImages = async (): Promise<string[]> => {
    if (inspirationImages.length === 0) return [];
    setUploadingImages(true);

    const urls: string[] = [];
    for (const img of inspirationImages) {
      const ext = img.file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('order-inspiration')
        .upload(fileName, img.file, { cacheControl: '3600', upsert: false });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('order-inspiration')
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }

    setUploadingImages(false);
    return urls;
  };

  const validateStep1 = () => {
    const newErrors: Partial<NewOrderFormData> = {};
    if (!formData.productType) newErrors.productType = 'Product type is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.targetPrice && parseFloat(formData.targetPrice) <= 0) newErrors.targetPrice = 'Target price must be greater than 0';
    if (!formData.targetDeliveryDate) newErrors.targetDeliveryDate = 'Target delivery date is required';

    // If prefixed products exist and none is selected AND not in custom mode
    if (prefixedProducts.length > 0 && !selectedPrefixed && !isCustomMode) {
      newErrors.productType = 'Please select a design or choose "Custom Product"';
    }

    // If a prefixed product is selected, require size selection
    if (selectedPrefixed && selectedPrefixed.sizes.length > 1 && !selectedSize) {
      newErrors.productType = 'Please select a size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<NewOrderFormData> = {};
    if (!formData.productDescription) newErrors.productDescription = 'Product description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    setDeliveryError('');

    if (addresses.length === 0) {
      return true;
    }

    const hasAddress = shipments.some((s) => s.addressId);
    if (!hasAddress) {
      setDeliveryError('Please select at least one delivery address.');
      return false;
    }

    if (splitMode) {
      for (let i = 0; i < shipments.length; i++) {
        if (!shipments[i].addressId) {
          setDeliveryError(`Shipment ${i + 1}: Please select a delivery address.`);
          return false;
        }
        if (!shipments[i].quantity || parseInt(shipments[i].quantity) <= 0) {
          setDeliveryError(`Shipment ${i + 1}: Please enter a valid quantity.`);
          return false;
        }
      }

      const totalSplitQty = shipments.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
      const orderQty = parseInt(formData.quantity) || 0;
      if (totalSplitQty !== orderQty) {
        setDeliveryError(
          `Split quantities (${totalSplitQty.toLocaleString()}) must equal the total order quantity (${orderQty.toLocaleString()}).`
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddSplit = () => {
    setShipments((prev) => [...prev, { addressId: '', quantity: '', notes: '' }]);
  };

  const handleRemoveSplit = (index: number) => {
    setShipments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleShipmentChange = (index: number, field: keyof ShipmentSplit, value: string) => {
    setShipments((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    setDeliveryError('');
  };

  const handleToggleSplitMode = () => {
    if (!splitMode) {
      const first = shipments[0] || { addressId: '', quantity: '', notes: '' };
      setShipments([{ ...first, quantity: formData.quantity }]);
    } else {
      const first = shipments[0] || { addressId: '', quantity: '', notes: '' };
      setShipments([{ ...first, quantity: '', notes: '' }]);
    }
    setSplitMode(!splitMode);
    setDeliveryError('');
  };

  const getAddressLabel = (addrId: string) => {
    const addr = addresses.find((a) => a.id === addrId);
    if (!addr) return 'Unknown address';
    return `${addr.label} — ${addr.address_line1}, ${addr.city}, ${addr.state} ${addr.zip_code}`;
  };

  const getAddressShort = (addrId: string) => {
    const addr = addresses.find((a) => a.id === addrId);
    if (!addr) return 'Not selected';
    return addr.label;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const orderNumber = `ORD-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

      // Upload inspiration images first
      const imageUrls = await uploadInspirationImages();

      const { data, error } = await supabase
        .from('orders')
        .insert({
          client_id: userId,
          order_number: orderNumber,
          status: 'submitted',
          product_type: formData.productType,
          product_description: formData.productDescription,
          quantity: parseInt(formData.quantity),
          target_price: formData.targetPrice ? parseFloat(formData.targetPrice) : null,
          target_delivery_date: formData.targetDeliveryDate,
          notes: formData.specificRequirements || '',
          prefixed_product_id: selectedPrefixed?.id || null,
          selected_size: selectedSize || null,
          custom_width: isCustomMode && customWidth ? parseFloat(customWidth) : null,
          custom_height: isCustomMode && customHeight ? parseFloat(customHeight) : null,
          custom_length: isCustomMode && customLength ? parseFloat(customLength) : null,
          custom_dimension_unit: isCustomMode && (customWidth || customHeight || customLength) ? 'inches' : null,
          inspiration_images: imageUrls.length > 0 ? imageUrls : [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error.message, error.details, error.hint);
        alert(`Failed to create order: ${error.message}`);
        setSubmitting(false);
        return;
      }

      // Insert order shipments
      const validShipments = shipments.filter((s) => s.addressId);
      if (validShipments.length > 0) {
        const shipmentsToInsert = splitMode
          ? validShipments.map((s) => ({
              order_id: data.id,
              delivery_address_id: s.addressId,
              quantity: parseInt(s.quantity),
              notes: s.notes || '',
            }))
          : [
              {
                order_id: data.id,
                delivery_address_id: validShipments[0].addressId,
                quantity: parseInt(formData.quantity),
                notes: validShipments[0].notes || '',
              },
            ];

        const { error: shipError } = await supabase
          .from('order_shipments')
          .insert(shipmentsToInsert);

        if (shipError) {
          console.error('Error creating shipments:', shipError);
        }
      }

      // Notify admins about new order
      const productLabel = selectedPrefixed
        ? `${selectedPrefixed.name} (${selectedSize || 'no size'})`
        : formData.productType;

      await notifyAdmins({
        orderId: data.id,
        type: 'order_status',
        title: `New Order Submitted — ${orderNumber}`,
        body: `${userName} (${companyName}) submitted a new order for ${parseInt(formData.quantity).toLocaleString()} ${productLabel} units.`,
      });

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
      <PortalLayout pageTitle="New Order" userId={userId} userName={userName} userEmail={userEmail} companyName={companyName}>
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

  const productOptions = PRODUCT_TYPES.map((type) => ({ value: type, label: type }));

  const addressOptions = addresses.map((a) => ({
    value: a.id,
    label: `${a.label}${a.is_default ? ' (Default)' : ''} — ${a.city}, ${a.state}`,
  }));

  const totalSplitQty = shipments.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
  const orderQty = parseInt(formData.quantity) || 0;
  const remainingQty = orderQty - totalSplitQty;

  return (
    <PortalLayout pageTitle="New Order" userId={userId} userName={userName} userEmail={userEmail} companyName={companyName}>
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors flex-shrink-0 ${
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
                className={currentStep >= step.id ? 'font-semibold text-gray-900' : 'text-gray-500'}
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
              {currentStep === 3 && 'Delivery Location'}
              {currentStep === 4 && 'Review & Submit'}
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
                  onChange={(e) => handleProductTypeChange(e.target.value)}
                  error={errors.productType}
                  placeholder="Select a product type"
                />

                {/* Prefixed Product Selection */}
                {formData.productType && !loadingProducts && prefixedProducts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Choose a Design
                    </label>
                    <div className="space-y-3">
                      {prefixedProducts.map((product) => {
                        const isSelected = selectedPrefixed?.id === product.id;
                        return (
                          <div
                            key={product.id}
                            onClick={() => selectPrefixedProduct(product)}
                            className={`flex gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? 'border-green-500 bg-green-50/50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            {/* Product Image */}
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <ImageIcon className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    SKU: {product.sku} · {product.material}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  </div>
                                )}
                              </div>

                              {/* Size Selection */}
                              {isSelected && product.sizes.length > 1 && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">Select Size:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((s, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSize(s.size);
                                        }}
                                        className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                                          selectedSize === s.size
                                            ? 'border-green-600 bg-green-600 text-white shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50'
                                        }`}
                                      >
                                        <span className="block font-semibold">{s.size}</span>
                                        <span className={`block text-xs mt-0.5 ${selectedSize === s.size ? 'text-green-100' : 'text-gray-500'}`}>
                                          ${s.price.toFixed(2)}/unit
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                  {!selectedSize && (
                                    <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      Please select a size to continue
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Show sizes as info when NOT selected */}
                              {!isSelected && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {product.sizes.map((s, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-gray-100 text-gray-600">
                                      {s.size} — ${s.price.toFixed(2)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Single size — auto-selected, just show confirmation */}
                              {isSelected && product.sizes.length === 1 && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white font-semibold">
                                    Size: {product.sizes[0].size} — ${product.sizes[0].price.toFixed(2)}/unit
                                  </span>
                                </div>
                              )}

                              {/* Price & Production Time */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {product.estimated_price_min != null && product.estimated_price_max != null && (
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5" />
                                    ${product.estimated_price_min.toFixed(2)} – ${product.estimated_price_max.toFixed(2)}/unit
                                  </span>
                                )}
                                {product.estimated_production_days && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    ~{product.estimated_production_days} days
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom Product Option */}
                      <div
                        onClick={switchToCustom}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isCustomMode
                            ? 'border-green-500 bg-green-50/50 shadow-sm'
                            : 'border-dashed border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Pencil className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Custom Product</h4>
                          <p className="text-xs text-gray-500">
                            Describe your own product — we&apos;ll source it for you
                          </p>
                        </div>
                        {isCustomMode && (
                          <div className="ml-auto flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {loadingProducts && formData.productType && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Loading available designs...
                  </div>
                )}

                <Input
                  label="Quantity"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  error={errors.quantity}
                />
                <Input
                  label="Target Unit Price ($) — Optional"
                  type="number"
                  placeholder="e.g., 8.50"
                  step="0.01"
                  value={formData.targetPrice}
                  onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                  error={errors.targetPrice}
                  helperText="Leave blank if you don't have a target price in mind."
                />
                <Input
                  label="Target Delivery Date"
                  type="date"
                  value={formData.targetDeliveryDate}
                  onChange={(e) => handleInputChange('targetDeliveryDate', e.target.value)}
                  error={errors.targetDeliveryDate}
                />
              </>
            )}

            {/* Step 2: Product Details */}
            {currentStep === 2 && (
              <>
                {/* Show selected prefixed product summary */}
                {selectedPrefixed && !isCustomMode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                    <div className="flex items-start gap-3">
                      {selectedPrefixed.image_url && (
                        <img
                          src={selectedPrefixed.image_url}
                          alt={selectedPrefixed.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-green-800">{selectedPrefixed.name}</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          SKU: {selectedPrefixed.sku} · Size: {selectedSize || 'N/A'} · {selectedPrefixed.material}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Textarea
                  label="Product Description"
                  placeholder="Describe the product you want to order. Include details like materials, colors, branding requirements, etc."
                  rows={6}
                  value={formData.productDescription}
                  onChange={(e) => handleProductDetailChange('productDescription', e.target.value)}
                  error={errors.productDescription}
                />

                {/* Custom mode: Product Dimensions */}
                {isCustomMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <Ruler className="w-4 h-4" />
                      Product Dimensions (inches) — Optional
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Width</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="W"
                          value={customWidth}
                          onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) setCustomWidth(v); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Height</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="H"
                          value={customHeight}
                          onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) setCustomHeight(v); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Length</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="L"
                          value={customLength}
                          onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) setCustomLength(v); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Enter the desired dimensions of your product in inches (Width × Height × Length)
                    </p>
                  </div>
                )}

                <Textarea
                  label="Specific Requirements (Optional)"
                  placeholder="Any additional specifications, certifications, or requirements for this order..."
                  rows={4}
                  value={formData.specificRequirements}
                  onChange={(e) => handleProductDetailChange('specificRequirements', e.target.value)}
                />

                {/* Custom mode: Inspiration Images */}
                {isCustomMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      Inspiration Images — Optional
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload up to 5 reference photos to help us understand your vision. These could be similar products, design mockups, or anything that inspires your order.
                    </p>

                    {/* Image grid */}
                    <div className="flex flex-wrap gap-3">
                      {inspirationImages.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                          <img
                            src={img.preview}
                            alt={`Inspiration ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeInspirationImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Upload button */}
                      {inspirationImages.length < 5 && (
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-400 font-medium">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleInspirationUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {inspirationImages.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {inspirationImages.length}/5 images added · Hover over an image to remove it
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Step 3: Delivery */}
            {currentStep === 3 && (
              <>
                {addressesLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading delivery addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-1">No delivery addresses configured</p>
                    <p className="text-sm text-gray-400 mb-4">
                      You can add delivery addresses in your Account Settings, or skip this step and add them later.
                    </p>
                    <a href="/portal/settings">
                      <Button variant="secondary" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Go to Settings
                      </Button>
                    </a>
                  </div>
                ) : (
                  <>
                    {/* Toggle split mode */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <SplitSquareVertical className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Split Shipment</p>
                          <p className="text-xs text-gray-500">
                            Send portions of this order to different warehouses
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleSplitMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          splitMode ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            splitMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {!splitMode ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Address
                        </label>
                        <div className="space-y-2">
                          {addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                                shipments[0]?.addressId === addr.id
                                  ? 'border-green-500 bg-green-50/40'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryAddress"
                                checked={shipments[0]?.addressId === addr.id}
                                onChange={() => setShipments([{ addressId: addr.id, quantity: '', notes: '' }])}
                                className="mt-1 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{addr.label}</span>
                                  {addr.is_default && (
                                    <Badge variant="success">
                                      <Star className="w-3 h-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {addr.address_line1}
                                  {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {addr.city}, {addr.state} {addr.zip_code}, {addr.country}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">
                            Total Order: <span className="text-green-600 font-bold">{orderQty.toLocaleString()} units</span>
                          </p>
                          {remainingQty !== 0 && (
                            <p className={`text-sm font-medium ${remainingQty > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                              {remainingQty > 0
                                ? `${remainingQty.toLocaleString()} units unassigned`
                                : `${Math.abs(remainingQty).toLocaleString()} units over-assigned`}
                            </p>
                          )}
                          {remainingQty === 0 && (
                            <p className="text-sm font-medium text-green-600">All units assigned</p>
                          )}
                        </div>

                        {shipments.map((shipment, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                Shipment {idx + 1}
                              </span>
                              {shipments.length > 1 && (
                                <button
                                  onClick={() => handleRemoveSplit(idx)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <Select
                              label="Deliver to"
                              options={addressOptions}
                              value={shipment.addressId}
                              onChange={(e) => handleShipmentChange(idx, 'addressId', e.target.value)}
                              placeholder="Select delivery address"
                            />

                            <Input
                              label="Quantity"
                              type="number"
                              placeholder={`Units to ship (max ${orderQty.toLocaleString()})`}
                              value={shipment.quantity}
                              onChange={(e) => handleShipmentChange(idx, 'quantity', e.target.value)}
                            />

                            <Input
                              label="Notes (optional)"
                              placeholder="e.g., Attention: Receiving Dept"
                              value={shipment.notes}
                              onChange={(e) => handleShipmentChange(idx, 'notes', e.target.value)}
                            />
                          </div>
                        ))}

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleAddSplit}
                          disabled={shipments.length >= addresses.length}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Shipment
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {deliveryError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {deliveryError}
                  </div>
                )}
              </>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* Show selected prefixed product */}
                  {selectedPrefixed && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      {selectedPrefixed.image_url && (
                        <img
                          src={selectedPrefixed.image_url}
                          alt={selectedPrefixed.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-green-800 text-sm">{selectedPrefixed.name}</p>
                        <p className="text-xs text-green-600">
                          SKU: {selectedPrefixed.sku}
                          {selectedSize ? ` · Size: ${selectedSize}` : ''}
                        </p>
                      </div>
                      <Badge variant="success" className="ml-auto">Catalog Product</Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Product Type</p>
                      <p className="font-semibold text-gray-900">{formData.productType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="font-semibold text-gray-900">{parseInt(formData.quantity).toLocaleString()} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Target Unit Price</p>
                      <p className="font-semibold text-gray-900">
                        {formData.targetPrice ? `$${formData.targetPrice}` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Target Delivery Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(formData.targetDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-2">Product Description</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.productDescription}</p>
                  </div>

                  {/* Custom dimensions */}
                  {isCustomMode && (customWidth || customHeight || customLength) && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5">
                        <Ruler className="w-4 h-4" />
                        Product Dimensions
                      </p>
                      <p className="font-semibold text-gray-900">
                        {[customWidth && `${customWidth}"W`, customHeight && `${customHeight}"H`, customLength && `${customLength}"L`]
                          .filter(Boolean)
                          .join(' × ')}
                      </p>
                    </div>
                  )}

                  {formData.specificRequirements && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-500 mb-2">Specific Requirements</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{formData.specificRequirements}</p>
                    </div>
                  )}

                  {/* Inspiration images */}
                  {inspirationImages.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        Inspiration Images ({inspirationImages.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {inspirationImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.preview}
                            alt={`Inspiration ${idx + 1}`}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery summary */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      Delivery
                    </p>
                    {shipments.filter((s) => s.addressId).length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No delivery address selected — will be confirmed later</p>
                    ) : splitMode ? (
                      <div className="space-y-2">
                        {shipments.filter((s) => s.addressId).map((s, idx) => (
                          <div key={idx} className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-3">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{getAddressShort(s.addressId)}</p>
                              <p className="text-xs text-gray-500">{getAddressLabel(s.addressId)}</p>
                              {s.notes && <p className="text-xs text-gray-400 mt-1">Note: {s.notes}</p>}
                            </div>
                            <Badge variant="info">{parseInt(s.quantity).toLocaleString()} units</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">{getAddressShort(shipments[0].addressId)}</p>
                        <p className="text-xs text-gray-500">{getAddressLabel(shipments[0].addressId)}</p>
                      </div>
                    )}
                  </div>
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
              <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 4 ? (
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

        {/* Deselect Warning Modal */}
        {showDeselectWarning && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Switch to Custom Product?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Editing the product details will deselect the prefixed design
                <strong> &ldquo;{selectedPrefixed?.name}&rdquo;</strong> and switch to a custom product.
                Are you sure you want to continue?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={cancelDeselect}>
                  Keep Design
                </Button>
                <Button variant="primary" onClick={confirmDeselect}>
                  Switch to Custom
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
