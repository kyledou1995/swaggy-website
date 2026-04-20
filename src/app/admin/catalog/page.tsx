'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Package,
  Search,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import { PRODUCT_TYPES } from '@/lib/constants';
import { PrefixedProduct, PrefixedProductSize } from '@/types';

interface ProductFormData {
  name: string;
  product_type: string;
  description: string;
  material: string;
  sizes: PrefixedProductSize[];
  estimated_price_min: string;
  estimated_price_max: string;
  estimated_production_days: string;
  sku: string;
  is_active: boolean;
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  product_type: '',
  description: '',
  material: '',
  sizes: [{ size: '', price: 0 }],
  estimated_price_min: '',
  estimated_price_max: '',
  estimated_production_days: '',
  sku: '',
  is_active: true,
};

export default function CatalogPage() {
  const [products, setProducts] = useState<PrefixedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PrefixedProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  const loadProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('prefixed_products')
      .select('*')
      .order('product_type', { ascending: true })
      .order('name', { ascending: true });

    if (filterType) {
      query = query.eq('product_type', filterType);
    }

    const { data } = await query;
    setProducts((data as PrefixedProduct[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [filterType]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ ...EMPTY_FORM, product_type: filterType || '' });
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (product: PrefixedProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      product_type: product.product_type,
      description: product.description || '',
      material: product.material || '',
      sizes: product.sizes.length > 0 ? product.sizes : [{ size: '', price: 0 }],
      estimated_price_min: product.estimated_price_min?.toString() || '',
      estimated_price_max: product.estimated_price_max?.toString() || '',
      estimated_production_days: product.estimated_production_days?.toString() || '',
      sku: product.sku,
      is_active: product.is_active,
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setFormErrors({});
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return editingProduct?.image_url || '';

    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

    setUploading(false);

    if (error) {
      console.error('Upload error:', error);
      return editingProduct?.image_url || '';
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const addSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', price: 0 }],
    }));
  };

  const removeSize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const updateSize = (index: number, field: keyof PrefixedProductSize, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s, i) =>
        i === index ? { ...s, [field]: field === 'price' ? parseFloat(value as string) || 0 : value } : s
      ),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.product_type) errors.product_type = 'Product type is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.material.trim()) errors.material = 'Material is required';

    const validSizes = formData.sizes.filter((s) => s.size.trim());
    if (validSizes.length === 0) errors.sizes = 'At least one size is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const imageUrl = await uploadImage();
      const validSizes = formData.sizes.filter((s) => s.size.trim());

      // Auto-calculate price range from sizes
      const prices = validSizes.map((s) => s.price).filter((p) => p > 0);
      const minPrice = formData.estimated_price_min
        ? parseFloat(formData.estimated_price_min)
        : prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = formData.estimated_price_max
        ? parseFloat(formData.estimated_price_max)
        : prices.length > 0 ? Math.max(...prices) : null;

      const payload = {
        name: formData.name.trim(),
        product_type: formData.product_type,
        description: formData.description.trim(),
        material: formData.material.trim(),
        sizes: validSizes,
        estimated_price_min: minPrice,
        estimated_price_max: maxPrice,
        estimated_production_days: formData.estimated_production_days
          ? parseInt(formData.estimated_production_days)
          : null,
        sku: formData.sku.trim(),
        image_url: imageUrl,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('prefixed_products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) {
          alert(`Failed to update: ${error.message}`);
          setSaving(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from('prefixed_products')
          .insert(payload);

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            setFormErrors({ sku: 'This SKU already exists' });
          } else {
            alert(`Failed to create: ${error.message}`);
          }
          setSaving(false);
          return;
        }
      }

      setShowModal(false);
      loadProducts();
    } catch (err) {
      console.error('Save error:', err);
      alert('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const { error } = await supabase
      .from('prefixed_products')
      .delete()
      .eq('id', productId);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      setDeleteConfirm(null);
      loadProducts();
    }
  };

  const toggleActive = async (product: PrefixedProduct) => {
    await supabase
      .from('prefixed_products')
      .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
      .eq('id', product.id);
    loadProducts();
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q)
    );
  });

  const typeOptions = PRODUCT_TYPES.map((t) => ({ value: t, label: t }));

  // Group products by product_type for display
  const grouped = filteredProducts.reduce<Record<string, PrefixedProduct[]>>((acc, p) => {
    if (!acc[p.product_type]) acc[p.product_type] = [];
    acc[p.product_type].push(p);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage prefixed designs that clients can choose from when placing orders
            </p>
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="w-56">
            <Select
              options={typeOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder="All Product Types"
            />
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No products yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add prefixed designs so clients can choose from them when placing orders.
              </p>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </CardBody>
          </Card>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {type} ({items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {items.map((product) => (
                  <Card key={product.id} className={`overflow-hidden ${!product.is_active ? 'opacity-60' : ''}`}>
                    {/* Image */}
                    <div className="h-44 bg-gray-100 relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {!product.is_active && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="neutral">Inactive</Badge>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="info">{product.sku}</Badge>
                      </div>
                    </div>

                    <CardBody className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{product.material}</p>
                      </div>

                      {/* Sizes */}
                      <div className="flex flex-wrap gap-1.5">
                        {product.sizes.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {s.size} — ${s.price.toFixed(2)}
                          </span>
                        ))}
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {product.estimated_price_min != null && product.estimated_price_max != null
                            ? `$${product.estimated_price_min.toFixed(2)} – $${product.estimated_price_max.toFixed(2)}`
                            : 'Price varies'}
                        </span>
                        {product.estimated_production_days && (
                          <span>{product.estimated_production_days} days production</span>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button
                          onClick={() => toggleActive(product)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {product.is_active ? (
                            <ToggleRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirm === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-xs text-red-600 font-medium hover:underline"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-gray-400 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      <Upload className="w-4 h-4" />
                      {imageFile ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imageFile && (
                      <p className="text-xs text-gray-500 mt-2">{imageFile.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Product Name"
                  placeholder="e.g., Classic Cotton Tee"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  error={formErrors.name}
                />
                <Select
                  label="Product Type"
                  options={typeOptions}
                  value={formData.product_type}
                  onChange={(e) => setFormData((f) => ({ ...f, product_type: e.target.value }))}
                  placeholder="Select type"
                  error={formErrors.product_type}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SKU"
                  placeholder="e.g., APR-TEE-001"
                  value={formData.sku}
                  onChange={(e) => setFormData((f) => ({ ...f, sku: e.target.value }))}
                  error={formErrors.sku}
                />
                <Input
                  label="Material"
                  placeholder="e.g., 100% Organic Cotton"
                  value={formData.material}
                  onChange={(e) => setFormData((f) => ({ ...f, material: e.target.value }))}
                  error={formErrors.material}
                />
              </div>

              <Textarea
                label="Description (Optional)"
                placeholder="Brief description of the product..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              />

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sizes & Pricing
                  </label>
                  <button
                    onClick={addSize}
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Size
                  </button>
                </div>
                {formErrors.sizes && (
                  <p className="text-xs text-red-600 mb-2">{formErrors.sizes}</p>
                )}
                <div className="space-y-2">
                  {formData.sizes.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Size (e.g., S, M, L, XL)"
                        value={s.size}
                        onChange={(e) => updateSize(i, 'size', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={s.price || ''}
                          onChange={(e) => updateSize(i, 'price', e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      {formData.sizes.length > 1 && (
                        <button
                          onClick={() => removeSize(i)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Production */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Min Price ($)"
                  type="number"
                  step="0.01"
                  placeholder="Auto from sizes"
                  value={formData.estimated_price_min}
                  onChange={(e) => setFormData((f) => ({ ...f, estimated_price_min: e.target.value }))}
                  helperText="Leave blank to auto-calculate"
                />
                <Input
                  label="Max Price ($)"
                  type="number"
                  step="0.01"
                  placeholder="Auto from sizes"
                  value={formData.estimated_price_max}
                  onChange={(e) => setFormData((f) => ({ ...f, estimated_price_max: e.target.value }))}
                  helperText="Leave blank to auto-calculate"
                />
                <Input
                  label="Production Days"
                  type="number"
                  placeholder="e.g., 14"
                  value={formData.estimated_production_days}
                  onChange={(e) => setFormData((f) => ({ ...f, estimated_production_days: e.target.value }))}
                  helperText="Estimated production time"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Active</p>
                  <p className="text-xs text-gray-500">
                    Inactive products won&apos;t be shown to clients
                  </p>
                </div>
                <button
                  onClick={() => setFormData((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving || uploading}>
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
