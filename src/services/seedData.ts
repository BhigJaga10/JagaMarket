import {
  User,
  VendorProfile,
  Product,
  Order,
  VendorSubOrder,
  ProductSourcingRequest,
  BankSettings,
  DeliveryZone,
  InAppNotification,
  AuditLogEntry
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-cust-01',
    role: 'customer',
    fullName: 'Amara Okafor',
    email: 'customer@jaga.ng',
    phone: '+234 803 456 7890',
    address: {
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos',
      lga: 'Eti-Osa'
    },
    createdAt: '2026-01-15T09:30:00Z'
  },
  {
    id: 'user-vend-01',
    role: 'vendor',
    fullName: 'Tunde Balogun',
    email: 'vendor@jaga.ng',
    phone: '+234 812 345 6789',
    address: {
      street: 'Shop 42, Block C, Balogun Modern Market',
      city: 'Lagos Island',
      state: 'Lagos',
      lga: 'Lagos Island'
    },
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-vend-02',
    role: 'vendor',
    fullName: 'Chidi Eze',
    email: 'alaba@jaga.ng',
    phone: '+234 806 789 0123',
    address: {
      street: 'Line 7, Alaba International Market',
      city: 'Ojo',
      state: 'Lagos',
      lga: 'Ojo'
    },
    createdAt: '2026-02-01T11:20:00Z'
  },
  {
    id: 'user-vend-pending',
    role: 'vendor',
    fullName: 'Fatima Abubakar',
    email: 'pending@jaga.ng',
    phone: '+234 802 111 2233',
    address: {
      street: '25 Dawanau Grain Market Road',
      city: 'Kano',
      state: 'Kano',
      lga: 'Dawakin Tofa'
    },
    createdAt: '2026-10-20T14:15:00Z'
  },
  {
    id: 'user-admin-01',
    role: 'admin',
    fullName: 'JAGA Operations Admin',
    email: 'admin@jaga.ng',
    phone: '+234 700 524 2642',
    address: {
      street: 'JAGA Tower, 45 Marina Street',
      city: 'Lagos Island',
      state: 'Lagos',
      lga: 'Lagos Island'
    },
    createdAt: '2025-12-01T00:00:00Z'
  }
];

export const INITIAL_VENDORS: VendorProfile[] = [
  {
    id: 'vend-01',
    userId: 'user-vend-01',
    businessName: 'Balogun Fabrics & Style',
    ownerName: 'Tunde Balogun',
    email: 'vendor@jaga.ng',
    phone: '+234 812 345 6789',
    businessAddress: 'Shop 42, Block C, Balogun Modern Market, Lagos Island',
    state: 'Lagos',
    lga: 'Lagos Island',
    category: 'Fashion & Ankara',
    cacNumber: 'RC-1849204',
    tinNumber: '21049283-0001',
    kycStatus: 'approved',
    kycDocuments: {
      cacCertificateUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
      utilityBillUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      governmentIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      idType: 'NIN National Identity'
    },
    kycReviewedAt: '2026-01-12T10:00:00Z',
    rating: 4.9,
    totalSales: 184,
    joinedDate: '2026-01-10'
  },
  {
    id: 'vend-02',
    userId: 'user-vend-02',
    businessName: 'Alaba Tech Hub Ltd',
    ownerName: 'Chidi Eze',
    email: 'alaba@jaga.ng',
    phone: '+234 806 789 0123',
    businessAddress: 'Line 7, Alaba International Market, Ojo',
    state: 'Lagos',
    lga: 'Ojo',
    category: 'Phones & Gadgets',
    cacNumber: 'RC-2049182',
    tinNumber: '23948192-0001',
    kycStatus: 'approved',
    kycDocuments: {
      cacCertificateUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
      utilityBillUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      governmentIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      idType: 'Voter Card'
    },
    kycReviewedAt: '2026-02-03T09:30:00Z',
    rating: 4.8,
    totalSales: 312,
    joinedDate: '2026-02-01'
  },
  {
    id: 'vend-pending',
    userId: 'user-vend-pending',
    businessName: 'Arewa Gold Foodstuffs & Spices',
    ownerName: 'Fatima Abubakar',
    email: 'pending@jaga.ng',
    phone: '+234 802 111 2233',
    businessAddress: '25 Dawanau Grain Market Road, Kano',
    state: 'Kano',
    lga: 'Dawakin Tofa',
    category: 'Groceries & Foodstuff',
    cacNumber: 'BN-4829104',
    tinNumber: '92837194-0001',
    kycStatus: 'pending',
    kycDocuments: {
      cacCertificateUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
      utilityBillUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      governmentIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      idType: 'NIN Slip'
    },
    rating: 0,
    totalSales: 0,
    joinedDate: '2026-10-20'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    vendorId: 'vend-01',
    vendorBusinessName: 'Balogun Fabrics & Style',
    vendorLocation: 'Lagos Island, Lagos',
    name: 'Premium 100% Cotton Hollandais Wax Ankara (6 Yards)',
    description: 'Authentic high-grade Nigerian wax print suitable for weddings, owanbe, traditional engagements, and everyday bespoke tailoring. Vibrant, non-fade organic dyes with fine sheen.',
    category: 'Fashion & Ankara',
    subcategory: 'African Wax & Laces',
    price: 18500,
    originalPrice: 24000,
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 45,
    sku: 'BAL-ANK-001',
    brand: 'Vlisco Heritage',
    condition: 'new',
    weightKg: 1.2,
    prepTimeHours: 24,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v1-1', color: 'Emerald & Gold Motif', size: '6 Yards', stock: 20, sku: 'BAL-ANK-001-EMG' },
      { id: 'v1-2', color: 'Royal Blue & Ochre', size: '6 Yards', stock: 15, sku: 'BAL-ANK-001-RBO' },
      { id: 'v1-3', color: 'Crimson Sunset Geo', size: '6 Yards', stock: 10, sku: 'BAL-ANK-001-CSG' }
    ],
    status: 'published',
    rating: 4.9,
    salesCount: 88,
    createdAt: '2026-03-01T10:00:00Z',
    featured: true,
    dealDiscountPercent: 23
  },
  {
    id: 'prod-02',
    vendorId: 'vend-02',
    vendorBusinessName: 'Alaba Tech Hub Ltd',
    vendorLocation: 'Alaba International, Lagos',
    name: 'Oraimo FreePods 4 ANC Wireless Earbuds with HavyBass™',
    description: 'True wireless Bluetooth 5.2 earbuds with 30dB Active Noise Cancellation, IPX5 waterproof rating, 35.5-hour total playtime, and seamless touch controls. Original verified warranty.',
    category: 'Phones & Gadgets',
    subcategory: 'Audio & Earbuds',
    price: 36000,
    originalPrice: 42000,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 28,
    sku: 'ALB-EAR-04',
    brand: 'Oraimo',
    condition: 'new',
    weightKg: 0.35,
    prepTimeHours: 12,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v2-1', color: 'Midnight Black', size: 'Standard Case', stock: 16, sku: 'ALB-EAR-04-BLK' },
      { id: 'v2-2', color: 'Polar White', size: 'Standard Case', stock: 12, sku: 'ALB-EAR-04-WHT' }
    ],
    status: 'published',
    rating: 4.8,
    salesCount: 142,
    createdAt: '2026-04-10T14:30:00Z',
    featured: true,
    dealDiscountPercent: 14
  },
  {
    id: 'prod-03',
    vendorId: 'vend-02',
    vendorBusinessName: 'Alaba Tech Hub Ltd',
    vendorLocation: 'Alaba International, Lagos',
    name: '1000W Pure Sine Wave Solar Home Inverter System with 100Ah Gel Battery',
    description: 'Complete plug-and-play solar power backup system designed for Nigerian home appliances, laptops, TVs, decoder, fans, and LED lighting during power outages. Built-in smart UPS bypass.',
    category: 'Electronics & Solar',
    subcategory: 'Solar & Inverters',
    price: 345000,
    originalPrice: 395000,
    images: [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 6,
    sku: 'ALB-SOL-1KW',
    brand: 'Felicity Solar',
    condition: 'new',
    weightKg: 38.0,
    prepTimeHours: 24,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v3-1', optionName: '12V 100Ah Battery Kit', stock: 4, sku: 'ALB-SOL-1KW-100', priceDelta: 0 },
      { id: 'v3-2', optionName: '24V 200Ah Heavy Duty Kit', stock: 2, sku: 'ALB-SOL-1KW-200', priceDelta: 125000 }
    ],
    status: 'published',
    rating: 5.0,
    salesCount: 19,
    createdAt: '2026-05-15T09:00:00Z',
    featured: true,
    dealDiscountPercent: 12
  },
  {
    id: 'prod-04',
    vendorId: 'vend-01',
    vendorBusinessName: 'Balogun Fabrics & Style',
    vendorLocation: 'Lagos Island, Lagos',
    name: 'Hand-Tailored Nigerian Senator Suit (Top & Trousers)',
    description: 'Bespoke men\'s Senator kaftan set crafted from premium Italian wool cashmere blend. Features delicate embroidery along the chest placket, matching trousers, and clean structured fit.',
    category: 'Fashion & Ankara',
    subcategory: 'Men Traditional Wear',
    price: 45000,
    originalPrice: 55000,
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 14,
    sku: 'BAL-SEN-009',
    brand: 'Balogun Bespoke',
    condition: 'new',
    weightKg: 1.4,
    prepTimeHours: 48,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v4-1', color: 'Charcoal Black', size: 'L (42-44)', stock: 5, sku: 'BAL-SEN-BLK-L' },
      { id: 'v4-2', color: 'Charcoal Black', size: 'XL (46)', stock: 4, sku: 'BAL-SEN-BLK-XL' },
      { id: 'v4-3', color: 'Navy Blue', size: 'L (42-44)', stock: 3, sku: 'BAL-SEN-NVY-L' },
      { id: 'v4-4', color: 'Wine Red', size: 'M (38-40)', stock: 2, sku: 'BAL-SEN-WIN-M' }
    ],
    status: 'published',
    rating: 4.9,
    salesCount: 42,
    createdAt: '2026-06-02T12:00:00Z',
    featured: false,
    dealDiscountPercent: 18
  },
  {
    id: 'prod-05',
    vendorId: 'vend-01',
    vendorBusinessName: 'Balogun Fabrics & Style',
    vendorLocation: 'Lagos Island, Lagos',
    name: 'Original Benue Yam Tubers — 5 Large Giant Tubers Pack',
    description: 'Freshly harvested large tubers from Zaki Biam, Benue State. High dry matter content, perfect for smooth pounded yam, boiled yam with egg sauce, or crisp yam fries.',
    category: 'Groceries & Foodstuff',
    subcategory: 'Tubers & Fresh Produce',
    price: 26000,
    originalPrice: 30000,
    images: [
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 25,
    sku: 'BAL-YAM-5PK',
    brand: 'Benue Heartland',
    condition: 'new',
    weightKg: 20.0,
    prepTimeHours: 24,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v5-1', optionName: '5 Large Tubers (~20kg)', stock: 25, sku: 'BAL-YAM-5PK-STD' }
    ],
    status: 'published',
    rating: 4.8,
    salesCount: 71,
    createdAt: '2026-07-12T08:00:00Z',
    featured: true,
    dealDiscountPercent: 13
  },
  {
    id: 'prod-06',
    vendorId: 'vend-02',
    vendorBusinessName: 'Alaba Tech Hub Ltd',
    vendorLocation: 'Alaba International, Lagos',
    name: 'Xiaomi Redmi Note 13 Pro 4G (8GB RAM / 256GB Storage)',
    description: '6.67-inch AMOLED 120Hz display, 200MP ultra-clear camera with OIS, 67W turbo charging with 5000mAh battery. Official Nigeria dual SIM with 1-year Carlcare warranty.',
    category: 'Phones & Gadgets',
    subcategory: 'Smartphones',
    price: 310000,
    originalPrice: 340000,
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 12,
    sku: 'ALB-RED-13PRO',
    brand: 'Xiaomi',
    condition: 'new',
    weightKg: 0.5,
    prepTimeHours: 12,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v6-1', color: 'Midnight Black', size: '256GB', stock: 6, sku: 'ALB-RED-13PRO-BLK' },
      { id: 'v6-2', color: 'Ocean Teal', size: '256GB', stock: 4, sku: 'ALB-RED-13PRO-TEL' },
      { id: 'v6-3', color: 'Aurora Purple', size: '256GB', stock: 2, sku: 'ALB-RED-13PRO-PUR' }
    ],
    status: 'published',
    rating: 4.9,
    salesCount: 53,
    createdAt: '2026-08-01T15:00:00Z',
    featured: true,
    dealDiscountPercent: 9
  },
  {
    id: 'prod-07',
    vendorId: 'vend-01',
    vendorBusinessName: 'Balogun Fabrics & Style',
    vendorLocation: 'Lagos Island, Lagos',
    name: 'Pure Unadulterated Okomu Palm Oil (4 Litres Gallon)',
    description: 'Triple filtered, thick, rich red palm oil sourced directly from Edo/Delta palm estates. Zero artificial coloring or chemical additives. High natural carotene aroma.',
    category: 'Groceries & Foodstuff',
    subcategory: 'Cooking Oils & Condiments',
    price: 14500,
    originalPrice: 16500,
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 40,
    sku: 'BAL-PLM-4L',
    brand: 'Okomu Gold',
    condition: 'new',
    weightKg: 4.2,
    prepTimeHours: 24,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v7-1', optionName: '4 Litres Gallon', stock: 40, sku: 'BAL-PLM-4L-STD' }
    ],
    status: 'published',
    rating: 5.0,
    salesCount: 94,
    createdAt: '2026-08-14T09:00:00Z',
    featured: false,
    dealDiscountPercent: 12
  },
  {
    id: 'prod-08',
    vendorId: 'vend-02',
    vendorBusinessName: 'Alaba Tech Hub Ltd',
    vendorLocation: 'Alaba International, Lagos',
    name: 'Royal 43-inch Smart Full HD Frameless LED Android TV',
    description: 'Built-in Netflix, Prime Video, YouTube, DVB-T2 digital tuner (free Nigerian terrestrial channels without dish), Dolby audio, 3x HDMI, 2x USB. Includes wall mount bracket.',
    category: 'Electronics & Solar',
    subcategory: 'Televisions & Audio',
    price: 215000,
    originalPrice: 245000,
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 0, // Out of stock example to demonstrate requirement
    sku: 'ALB-TV-43F',
    brand: 'Royal Electronics',
    condition: 'new',
    weightKg: 8.5,
    prepTimeHours: 24,
    deliveryCoverage: 'nationwide',
    variants: [
      { id: 'v8-1', optionName: '43-inch Standard', stock: 0, sku: 'ALB-TV-43F-STD' }
    ],
    status: 'out_of_stock',
    rating: 4.7,
    salesCount: 38,
    createdAt: '2026-08-20T11:00:00Z',
    featured: false
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-001',
    ticketId: 'JAG-2026-000101',
    customerId: 'user-cust-01',
    customerName: 'Amara Okafor',
    customerEmail: 'customer@jaga.ng',
    customerPhone: '+234 803 456 7890',
    deliveryAddress: {
      fullName: 'Amara Okafor',
      phone: '+234 803 456 7890',
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos',
      instructions: 'Gate is black, call when outside.'
    },
    items: [
      {
        productId: 'prod-01',
        vendorId: 'vend-01',
        productName: 'Premium 100% Cotton Hollandais Wax Ankara (6 Yards)',
        unitPrice: 18500,
        quantity: 1,
        variantId: 'v1-1',
        variantDescription: 'Emerald & Gold Motif',
        productImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
      },
      {
        productId: 'prod-02',
        vendorId: 'vend-02',
        productName: 'Oraimo FreePods 4 ANC Wireless Earbuds with HavyBass™',
        unitPrice: 36000,
        quantity: 1,
        variantId: 'v2-1',
        variantDescription: 'Midnight Black',
        productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
      }
    ],
    vendorSubOrderIds: ['sub-ord-001-v1', 'sub-ord-001-v2'],
    subtotal: 54500,
    deliveryFee: 2500,
    total: 57000,
    paymentStatus: 'payment_claimed',
    orderStatus: 'pending',
    paymentClaim: {
      id: 'claim-001',
      orderTicketId: 'JAG-2026-000101',
      bankPaidFrom: 'GTBank (Guaranty Trust)',
      accountSenderName: 'AMARA MARY OKAFOR',
      transactionReference: 'GTB-TRX-9821491823',
      claimedAmount: 57000,
      submittedAt: '2026-10-23T14:40:00Z',
      receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
    },
    timeline: [
      {
        timestamp: '2026-10-23T14:20:00Z',
        title: 'Order Placed',
        description: 'Customer created order ticket JAG-2026-000101 awaiting manual bank transfer.',
        actor: 'customer'
      },
      {
        timestamp: '2026-10-23T14:40:00Z',
        title: 'Payment Claim Submitted',
        description: 'Amara Okafor submitted transfer reference GTB-TRX-9821491823 for ₦57,000.',
        actor: 'customer'
      }
    ],
    createdAt: '2026-10-23T14:20:00Z',
    updatedAt: '2026-10-23T14:40:00Z'
  },
  {
    id: 'ord-002',
    ticketId: 'JAG-2026-000098',
    customerId: 'user-cust-01',
    customerName: 'Amara Okafor',
    customerEmail: 'customer@jaga.ng',
    customerPhone: '+234 803 456 7890',
    deliveryAddress: {
      fullName: 'Amara Okafor',
      phone: '+234 803 456 7890',
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos'
    },
    items: [
      {
        productId: 'prod-04',
        vendorId: 'vend-01',
        productName: 'Hand-Tailored Nigerian Senator Suit (Top & Trousers)',
        unitPrice: 45000,
        quantity: 1,
        variantId: 'v4-1',
        variantDescription: 'Charcoal Black / L (42-44)',
        productImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      }
    ],
    vendorSubOrderIds: ['sub-ord-002-v1'],
    subtotal: 45000,
    deliveryFee: 2500,
    total: 47500,
    paymentStatus: 'confirmed',
    orderStatus: 'processing',
    paymentClaim: {
      id: 'claim-002',
      orderTicketId: 'JAG-2026-000098',
      bankPaidFrom: 'Access Bank PLC',
      accountSenderName: 'AMARA OKAFOR',
      transactionReference: 'ACC-TRX-81092834',
      claimedAmount: 47500,
      submittedAt: '2026-10-21T10:15:00Z',
      verifiedByAdmin: 'JAGA Operations Admin',
      adminVerifierNote: 'Bank statement credited. Narration matches JAG-2026-000098.',
      verifiedAt: '2026-10-21T11:00:00Z'
    },
    scheduledDeliveryDate: '2026-10-26',
    deliveryCourier: 'GIG Logistics (Express)',
    trackingNumber: 'GIG-Lagos-928174',
    timeline: [
      {
        timestamp: '2026-10-21T09:45:00Z',
        title: 'Order Placed',
        description: 'Customer generated order ticket JAG-2026-000098.',
        actor: 'customer'
      },
      {
        timestamp: '2026-10-21T10:15:00Z',
        title: 'Payment Claim Submitted',
        description: 'Transfer reference ACC-TRX-81092834 provided.',
        actor: 'customer'
      },
      {
        timestamp: '2026-10-21T11:00:00Z',
        title: 'Payment Confirmed by Admin',
        description: 'Verified with Zenith Bank statement. Affected vendors notified to begin fulfillment.',
        actor: 'admin'
      },
      {
        timestamp: '2026-10-21T14:30:00Z',
        title: 'Vendor Accepted & Preparing',
        description: 'Balogun Fabrics & Style accepted order for tailoring & packaging.',
        actor: 'vendor'
      },
      {
        timestamp: '2026-10-22T09:00:00Z',
        title: 'Scheduled Delivery Date Set',
        description: 'Estimated dispatch arrival: 2026-10-26 via GIG Logistics.',
        actor: 'admin'
      }
    ],
    createdAt: '2026-10-21T09:45:00Z',
    updatedAt: '2026-10-22T09:00:00Z'
  }
];

export const INITIAL_SUBORDERS: VendorSubOrder[] = [
  {
    id: 'sub-ord-001-v1',
    parentOrderId: 'ord-001',
    orderTicketId: 'JAG-2026-000101',
    vendorId: 'vend-01',
    items: [
      {
        productId: 'prod-01',
        vendorId: 'vend-01',
        productName: 'Premium 100% Cotton Hollandais Wax Ankara (6 Yards)',
        unitPrice: 18500,
        quantity: 1,
        variantId: 'v1-1',
        variantDescription: 'Emerald & Gold Motif',
        productImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
      }
    ],
    subtotal: 18500,
    vendorFulfillmentStatus: 'pending',
    updatedAt: '2026-10-23T14:20:00Z'
  },
  {
    id: 'sub-ord-001-v2',
    parentOrderId: 'ord-001',
    orderTicketId: 'JAG-2026-000101',
    vendorId: 'vend-02',
    items: [
      {
        productId: 'prod-02',
        vendorId: 'vend-02',
        productName: 'Oraimo FreePods 4 ANC Wireless Earbuds with HavyBass™',
        unitPrice: 36000,
        quantity: 1,
        variantId: 'v2-1',
        variantDescription: 'Midnight Black',
        productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
      }
    ],
    subtotal: 36000,
    vendorFulfillmentStatus: 'pending',
    updatedAt: '2026-10-23T14:20:00Z'
  },
  {
    id: 'sub-ord-002-v1',
    parentOrderId: 'ord-002',
    orderTicketId: 'JAG-2026-000098',
    vendorId: 'vend-01',
    items: [
      {
        productId: 'prod-04',
        vendorId: 'vend-01',
        productName: 'Hand-Tailored Nigerian Senator Suit (Top & Trousers)',
        unitPrice: 45000,
        quantity: 1,
        variantId: 'v4-1',
        variantDescription: 'Charcoal Black / L (42-44)',
        productImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      }
    ],
    subtotal: 45000,
    vendorFulfillmentStatus: 'preparing',
    updatedAt: '2026-10-21T14:30:00Z'
  }
];

export const INITIAL_SOURCING_REQUESTS: ProductSourcingRequest[] = [
  {
    id: 'req-001',
    requestId: 'JAG-REQ-2026-000034',
    customerId: 'user-cust-01',
    customerName: 'Amara Okafor',
    customerEmail: 'customer@jaga.ng',
    customerPhone: '+234 803 456 7890',
    productName: 'Electric Yam Pounder & Food Processor 3.5 Litre (Stainless Steel)',
    description: 'Looking for a heavy-duty electric yam pounder that produces smooth Nigerian pounded yam in under 3 minutes without water separation. Must have pure copper motor.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    preferredBrand: 'National / Master Chef',
    expectedBudgetNgn: 45000,
    quantity: 1,
    deliveryState: 'Lagos',
    additionalNotes: 'Need it delivered to Lekki before the upcoming weekend.',
    status: 'quotation_ready',
    quotation: {
      quotedPriceNgn: 42000,
      estimatedDeliveryDays: 3,
      sourcingNotes: 'Sourced directly from verified Alaba importer with 12-month warranty replacement.',
      quotedAt: '2026-10-24T10:00:00Z',
      quotedByAdmin: 'JAGA Operations Admin'
    },
    createdAt: '2026-10-23T18:00:00Z',
    updatedAt: '2026-10-24T10:00:00Z'
  }
];

export const INITIAL_BANK_SETTINGS: BankSettings = {
  bankName: 'Zenith Bank PLC',
  accountName: 'JAGA COMMERCE ESCROW LTD',
  accountNumber: '1018942351',
  narrationPrefix: 'JAG-',
  instructions: 'Please transfer the exact order amount using your Nigerian banking app or USSD. In the narration/remark field, enter ONLY your Order Ticket ID (e.g., JAG-2026-000101). Do not write "goods" or "shopping". After sending, upload your transaction reference or receipt below.',
  verificationContact: 'verification@jaga.ng | WhatsApp: +234 800 5242 642',
  transferDeadlineHours: 24
};

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  { state: 'Lagos', fee: 2500, estimatedDays: '1 - 2 business days' },
  { state: 'Abuja (FCT)', fee: 3500, estimatedDays: '2 - 3 business days' },
  { state: 'Rivers (Port Harcourt)', fee: 4000, estimatedDays: '2 - 4 business days' },
  { state: 'Kano', fee: 4500, estimatedDays: '3 - 5 business days' },
  { state: 'Oyo (Ibadan)', fee: 3000, estimatedDays: '2 - 3 business days' },
  { state: 'Other Nigerian States', fee: 5000, estimatedDays: '3 - 6 business days' }
];

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-001',
    targetUserId: 'user-cust-01',
    title: 'Quotation Ready for Product Request',
    message: 'Your sourcing request JAG-REQ-2026-000034 has received an official quotation of ₦42,000. Click to review and accept.',
    type: 'request',
    linkId: 'JAG-REQ-2026-000034',
    read: false,
    createdAt: '2026-10-24T10:05:00Z'
  },
  {
    id: 'notif-002',
    targetUserId: 'user-vend-01',
    title: 'Payment Confirmed for Order JAG-2026-000098',
    message: 'Admin has verified payment of ₦47,500. Please prepare your Senator Suit for dispatch.',
    type: 'payment',
    linkId: 'JAG-2026-000098',
    read: true,
    createdAt: '2026-10-21T11:02:00Z'
  },
  {
    id: 'notif-003',
    targetUserId: 'user-admin-01',
    title: 'New Payment Claim Submitted',
    message: 'Customer Amara Okafor submitted payment claim for ticket JAG-2026-000101 (₦57,000). Awaiting admin verification.',
    type: 'payment',
    linkId: 'JAG-2026-000101',
    read: false,
    createdAt: '2026-10-23T14:41:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-01-12T10:00:00Z',
    adminName: 'JAGA Operations Admin',
    action: 'VENDOR_KYC_APPROVED',
    details: 'Approved vendor Balogun Fabrics & Style after validating CAC RC-1849204 and NIN document.',
    targetRef: 'vend-01'
  },
  {
    id: 'audit-002',
    timestamp: '2026-10-21T11:00:00Z',
    adminName: 'JAGA Operations Admin',
    action: 'PAYMENT_CONFIRMED',
    details: 'Verified transfer for ticket JAG-2026-000098 against Zenith Bank statement. Status set to confirmed.',
    targetRef: 'JAG-2026-000098'
  },
  {
    id: 'audit-003',
    timestamp: '2026-10-22T09:00:00Z',
    adminName: 'JAGA Operations Admin',
    action: 'DELIVERY_SCHEDULED',
    details: 'Scheduled delivery date for ticket JAG-2026-000098 to 2026-10-26 with GIG Logistics.',
    targetRef: 'JAG-2026-000098'
  }
];
