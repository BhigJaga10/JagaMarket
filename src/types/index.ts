export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  userId?: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    lga?: string;
  };
  createdAt: string;
}

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type VendorApplicationStatus =
  | 'not_applied'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_changes'
  | 'suspended';

export interface VendorPayoutBank {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface VendorApplicationHistoryEntry {
  status: VendorApplicationStatus;
  notes?: string;
  adminUid?: string;
  adminEmail?: string;
  timestamp: string;
}

export interface VendorApplication {
  id: string;
  userId: string;
  legalName: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  state: string;
  lga?: string;
  businessDescription: string;
  category: string;
  cacNumber?: string;
  tinNumber?: string;
  idType: string;
  idDocumentUrl: string;
  cacCertificateUrl?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: VendorApplicationStatus;
  adminNotes?: string;
  reviewedByAdminUid?: string;
  reviewedByAdminEmail?: string;
  reviewedAt?: string;
  submittedAt: string;
  updatedAt: string;
  history?: VendorApplicationHistoryEntry[];
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessAddress: string;
  state: string;
  lga: string;
  category: string;
  cacNumber?: string;
  tinNumber?: string;
  kycStatus: KycStatus;
  kycDocuments: {
    cacCertificateUrl?: string;
    utilityBillUrl?: string;
    governmentIdUrl?: string;
    idType?: string;
  };
  kycRejectionReason?: string;
  kycReviewedAt?: string;
  rating: number;
  totalSales: number;
  joinedDate: string;
}

export interface ProductVariant {
  id: string;
  color?: string;
  size?: string;
  optionName?: string;
  stock: number;
  sku: string;
  priceDelta?: number;
}

export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'out_of_stock';

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  vendorId: string;
  vendorBusinessName: string;
  vendorLocation: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  sku: string;
  brand?: string;
  condition: 'new' | 'refurbished' | 'handmade';
  weightKg?: number;
  prepTimeHours?: number;
  deliveryCoverage: 'nationwide' | 'state_only' | 'regional';
  variants: ProductVariant[];
  status: ProductStatus;
  rejectionReason?: string;
  rating: number;
  salesCount: number;
  createdAt: string;
  featured?: boolean;
  dealDiscountPercent?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
}

export type PaymentStatus =
  | 'awaiting_payment'
  | 'payment_claimed'
  | 'under_review'
  | 'confirmed'
  | 'rejected'
  | 'refund_pending'
  | 'refunded';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'ready_for_dispatch'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  vendorId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  variantId?: string;
  variantDescription?: string;
  productImage: string;
}

export interface VendorSubOrder {
  id: string; // e.g. SUB-JAG-2026-000123-V01
  parentOrderId: string;
  orderTicketId: string;
  vendorId: string;
  vendorUserId?: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  vendorFulfillmentStatus: 'pending' | 'accepted' | 'preparing' | 'ready_for_dispatch' | 'dispatched' | 'cancelled';
  vendorNotes?: string;
  cancellationReason?: string;
  updatedAt: string;
}

export interface PaymentClaim {
  id: string;
  orderTicketId: string;
  bankPaidFrom: string;
  accountSenderName: string;
  transactionReference: string;
  claimedAmount: number;
  submittedAt: string;
  receiptImageUrl?: string;
  adminVerifierNote?: string;
  verifiedByAdmin?: string;
  verifiedAt?: string;
}

export interface OrderTimelineEvent {
  timestamp: string;
  title: string;
  description: string;
  actor: 'customer' | 'vendor' | 'admin' | 'system';
}

export interface Order {
  id: string;
  ticketId: string; // e.g. JAG-2026-000123
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    instructions?: string;
  };
  items: OrderItem[];
  vendorSubOrderIds: string[];
  vendorUserIds?: string[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentClaim?: PaymentClaim;
  scheduledDeliveryDate?: string;
  trackingNumber?: string;
  deliveryCourier?: string;
  timeline: OrderTimelineEvent[];
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'vendor' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export type ProductRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'sourcing'
  | 'quotation_ready'
  | 'awaiting_customer_approval'
  | 'accepted'
  | 'unable_to_source'
  | 'converted_to_order'
  | 'closed';

export interface ProductSourcingRequest {
  id: string;
  requestId: string; // e.g. JAG-REQ-2026-000045
  ticketId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  description: string;
  referenceImageUrl?: string;
  preferredBrand?: string;
  preferredColorOrSize?: string;
  expectedBudgetNgn?: number;
  quantity: number;
  deliveryState: string;
  additionalNotes?: string;
  status: ProductRequestStatus;
  quotation?: {
    quotedPriceNgn: number;
    estimatedDeliveryDays: number;
    sourcingNotes: string;
    quotedAt: string;
    quotedByAdmin: string;
  };
  customerDecision?: 'accepted' | 'declined';
  customerDecisionDate?: string;
  convertedTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  targetUserId: string; // or 'all_admins' or role
  targetRole?: UserRole;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'kyc' | 'product' | 'request' | 'system';
  linkId?: string; // e.g. order ticket ID or request ID
  read: boolean;
  createdAt: string;
}

export interface BankSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  narrationPrefix: string;
  instructions: string;
  verificationContact: string;
  transferDeadlineHours: number;
}

export interface DeliveryZone {
  state: string;
  fee: number;
  estimatedDays: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  details: string;
  targetRef?: string;
}
