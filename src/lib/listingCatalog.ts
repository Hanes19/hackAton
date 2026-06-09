import type { BusinessType } from '$lib/seller'

export interface CatalogField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'tags'
  placeholder?: string
  options?: string[]
  unit?: string
}

export interface ProductIndustry {
  id: string
  label: string
  subcategories: string[]
  fields: CatalogField[]
}

export interface ServiceType {
  id: string
  label: string
  fields: CatalogField[]
}

export const PRODUCT_INDUSTRIES: ProductIndustry[] = [
  {
    id: 'food',
    label: 'Food & Beverage',
    subcategories: ['Bread', 'Meal', 'Snack', 'Beverage', 'Dessert', 'Ingredients', 'Packaged Goods'],
    fields: [
      { key: 'serving_size', label: 'Serving size', type: 'text', placeholder: 'e.g. per slice, per tray' },
      { key: 'dietary', label: 'Dietary tags', type: 'tags', placeholder: 'halal, vegan, gluten-free' },
      { key: 'shelf_life', label: 'Shelf life', type: 'text', placeholder: 'e.g. 3 days refrigerated' },
      { key: 'in_stock', label: 'Availability', type: 'select', options: ['In stock', 'Made to order', 'Seasonal'] }
    ]
  },
  {
    id: 'construction',
    label: 'Construction & Hardware',
    subcategories: ['Heavy Equipment', 'Utilities', 'Building Materials', 'Tools', 'Safety Gear', 'Rental'],
    fields: [
      { key: 'condition', label: 'Condition', type: 'select', options: ['Brand new', 'Used — good', 'Used — fair', 'For rent'] },
      { key: 'brand', label: 'Brand / manufacturer', type: 'text' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['per piece', 'per bag', 'per day (rental)', 'per sqm'] },
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g. 1 year' }
    ]
  },
  {
    id: 'clothing',
    label: 'Clothing & Fashion',
    subcategories: ['Casual', 'Formal', 'Uniform', 'Accessories', 'Footwear', 'Handmade'],
    fields: [
      { key: 'sizes', label: 'Available sizes', type: 'tags', placeholder: 'S, M, L, XL' },
      { key: 'material', label: 'Material', type: 'text', placeholder: 'cotton, polyester' },
      { key: 'color', label: 'Colors', type: 'tags', placeholder: 'red, blue, black' }
    ]
  },
  {
    id: 'electronics',
    label: 'Electronics',
    subcategories: ['Gadgets', 'Appliances', 'Computer Parts', 'Accessories', 'Mobile', 'Repair Parts'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Brand new', 'Refurbished', 'Used'] },
      { key: 'warranty', label: 'Warranty', type: 'text' }
    ]
  },
  {
    id: 'health',
    label: 'Health & Beauty',
    subcategories: ['Skincare', 'Haircare', 'Wellness', 'Cosmetics', 'Supplements', 'Personal Care'],
    fields: [
      { key: 'volume', label: 'Volume / size', type: 'text', placeholder: 'e.g. 250ml' },
      { key: 'skin_type', label: 'Best for', type: 'tags', placeholder: 'oily, dry, sensitive' },
      { key: 'certification', label: 'Certification', type: 'text', placeholder: 'FDA approved, organic' }
    ]
  },
  {
    id: 'agriculture',
    label: 'Agriculture & Produce',
    subcategories: ['Fresh Produce', 'Livestock', 'Seeds', 'Fertilizer', 'Farm Tools', 'Processed Goods'],
    fields: [
      { key: 'origin', label: 'Farm / origin', type: 'text' },
      { key: 'harvest', label: 'Harvest / batch', type: 'text' },
      { key: 'unit', label: 'Sold by', type: 'select', options: ['per kg', 'per sack', 'per bundle', 'per head'] }
    ]
  },
  {
    id: 'other',
    label: 'Other Products',
    subcategories: ['General', 'Handicraft', 'Souvenir', 'Custom'],
    fields: [
      { key: 'custom_label', label: 'Custom category label', type: 'text' },
      { key: 'specs', label: 'Specifications', type: 'textarea', placeholder: 'Add any details buyers should know' }
    ]
  }
]

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'personal_care',
    label: 'Personal Care & Salon',
    fields: [
      { key: 'duration', label: 'Duration', type: 'select', options: ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2+ hours'] },
      { key: 'service_mode', label: 'Service type', type: 'select', options: ['Walk-in', 'Appointment', 'Home service'] },
      { key: 'speed', label: 'Speed / priority', type: 'select', options: ['Standard', 'Express', 'Same-day'] },
      { key: 'includes', label: "What's included", type: 'textarea', placeholder: 'e.g. wash, cut, blow dry' }
    ]
  },
  {
    id: 'repair',
    label: 'Repair & Maintenance',
    fields: [
      { key: 'duration', label: 'Typical duration', type: 'select', options: ['Under 1 hour', '1–3 hours', 'Same day', '1–3 days', '1 week+'] },
      { key: 'equipment_type', label: 'Equipment / item type', type: 'text', placeholder: 'motorcycle, phone, appliance' },
      { key: 'turnaround', label: 'Turnaround speed', type: 'select', options: ['Express', 'Standard', 'Economy'] },
      { key: 'warranty', label: 'Service warranty', type: 'text', placeholder: 'e.g. 30-day repair warranty' }
    ]
  },
  {
    id: 'professional',
    label: 'Professional & Consulting',
    fields: [
      { key: 'duration', label: 'Session length', type: 'select', options: ['30 min', '1 hour', 'Half day', 'Full day', 'Per project'] },
      { key: 'consultation_type', label: 'Consultation type', type: 'select', options: ['In-person', 'Online', 'On-site visit', 'Hybrid'] },
      { key: 'delivery_speed', label: 'Delivery speed', type: 'select', options: ['Immediate', 'Within 24h', 'Within 3 days', 'Scheduled'] },
      { key: 'deliverables', label: 'Deliverables', type: 'textarea' }
    ]
  },
  {
    id: 'food_service',
    label: 'Food Service & Catering',
    fields: [
      { key: 'duration', label: 'Prep / serve time', type: 'select', options: ['Ready now', '30 min', '1–2 hours', 'Pre-order (1 day)', 'Event booking'] },
      { key: 'serving_type', label: 'Serving type', type: 'select', options: ['Dine-in', 'Takeout', 'Delivery', 'Catering', 'Buffet'] },
      { key: 'capacity', label: 'Capacity', type: 'text', placeholder: 'e.g. serves 10–50 pax' },
      { key: 'menu_notes', label: 'Menu notes', type: 'textarea' }
    ]
  },
  {
    id: 'transport',
    label: 'Transport & Delivery',
    fields: [
      { key: 'duration', label: 'Trip duration', type: 'select', options: ['Under 30 min', '30–60 min', '1–2 hours', 'Half day', 'Full day'] },
      { key: 'vehicle_type', label: 'Vehicle type', type: 'select', options: ['Motorcycle', 'Tricycle', 'Van', 'Truck', 'Car'] },
      { key: 'speed', label: 'Speed option', type: 'select', options: ['Standard', 'Express', 'Scheduled'] },
      { key: 'coverage', label: 'Service area', type: 'text', placeholder: 'Valencia City, nearby barangays' }
    ]
  },
  {
    id: 'education',
    label: 'Education & Training',
    fields: [
      { key: 'duration', label: 'Session duration', type: 'select', options: ['30 min', '1 hour', '2 hours', 'Half day', 'Multi-day course'] },
      { key: 'session_type', label: 'Session type', type: 'select', options: ['1-on-1', 'Small group', 'Class', 'Workshop', 'Online'] },
      { key: 'class_size', label: 'Class size', type: 'text', placeholder: 'e.g. max 10 students' },
      { key: 'materials', label: 'Materials provided', type: 'textarea' }
    ]
  },
  {
    id: 'other_service',
    label: 'Other Services',
    fields: [
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 2 hours per visit' },
      { key: 'service_type', label: 'Service type', type: 'text' },
      { key: 'speed', label: 'Speed / priority', type: 'select', options: ['Standard', 'Express', 'Flexible'] },
      { key: 'notes', label: 'Additional details', type: 'textarea' }
    ]
  }
]

export function getProductIndustry(id: string) {
  return PRODUCT_INDUSTRIES.find((i) => i.id === id) ?? PRODUCT_INDUSTRIES[PRODUCT_INDUSTRIES.length - 1]
}

export function getServiceType(id: string) {
  return SERVICE_TYPES.find((s) => s.id === id) ?? SERVICE_TYPES[SERVICE_TYPES.length - 1]
}

export interface ListingFormData {
  name: string
  price: string
  description: string
  highlights: string
  industryId: string
  subcategory: string
  imageData: string
  imageName: string
  details: Record<string, string>
}

export function emptyListingForm(businessType: BusinessType): ListingFormData {
  return {
    name: '',
    price: '',
    description: '',
    highlights: '',
    industryId: businessType === 'service' ? 'personal_care' : 'food',
    subcategory: businessType === 'service' ? '' : 'Snack',
    imageData: '',
    imageName: '',
    details: {}
  }
}

export function listingFromProduct(p: {
  name: string
  price: number
  description: string
  highlights?: string | null
  industry?: string | null
  subcategory?: string | null
  image_data?: string | null
  image_name?: string | null
  details?: Record<string, string> | null
}): ListingFormData {
  return {
    name: p.name,
    price: String(p.price ?? ''),
    description: p.description || '',
    highlights: p.highlights || '',
    industryId: p.industry || 'food',
    subcategory: p.subcategory || '',
    imageData: p.image_data || '',
    imageName: p.image_name || '',
    details: (p.details as Record<string, string>) || {}
  }
}

export function formatDetailChips(
  businessType: BusinessType,
  industryId: string,
  details: Record<string, string>
): string[] {
  const chips: string[] = []
  const catalog = businessType === 'service' ? getServiceType(industryId).fields : getProductIndustry(industryId).fields

  for (const field of catalog) {
    const val = details[field.key]?.trim()
    if (val) chips.push(`${field.label}: ${val}`)
  }
  return chips.slice(0, 4)
}
