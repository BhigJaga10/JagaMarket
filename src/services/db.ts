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
  AuditLogEntry,
  ProductStatus,
  KycStatus,
  PaymentClaim
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_VENDORS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SUBORDERS,
  INITIAL_SOURCING_REQUESTS,
  INITIAL_BANK_SETTINGS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from './seedData';

const STORAGE_KEYS = {
  USERS: 'jaga_users_v1',
  VENDORS: 'jaga_vendors_v1',
  PRODUCTS: 'jaga_products_v1',
  ORDERS: 'jaga_orders_v1',
  SUBORDERS: 'jaga_suborders_v1',
  SOURCING_REQUESTS: 'jaga_sourcing_requests_v1',
  BANK_SETTINGS: 'jaga_bank_settings_v1',
  DELIVERY_ZONES: 'jaga_delivery_zones_v1',
  NOTIFICATIONS: 'jaga_notifications_v1',
  AUDIT_LOGS: 'jaga_audit_logs_v1',
  CURRENT_USER_ID: 'jaga_current_user_id_v1'
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving to localStorage key ${key}`, err);
  }
}

export const db = {
  // Reset all data to default demo state
  resetToDemo(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.SUBORDERS, JSON.stringify(INITIAL_SUBORDERS));
    localStorage.setItem(STORAGE_KEYS.SOURCING_REQUESTS, JSON.stringify(INITIAL_SOURCING_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.BANK_SETTINGS, JSON.stringify(INITIAL_BANK_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ZONES, JSON.stringify(INITIAL_DELIVERY_ZONES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  },

  // Users
  getUsers(): User[] {
    return getFromStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.getUsers().find((u) => u.email.toLowerCase() === clean);
  },

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // Vendors
  getVendors(): VendorProfile[] {
    return getFromStorage<VendorProfile[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
  },

  getVendorById(id: string): VendorProfile | undefined {
    return this.getVendors().find((v) => v.id === id);
  },

  getVendorByUserId(userId: string): VendorProfile | undefined {
    return this.getVendors().find((v) => v.userId === userId);
  },

  createVendorProfile(profileData: Omit<VendorProfile, 'id' | 'kycStatus' | 'rating' | 'totalSales' | 'joinedDate'>): VendorProfile {
    const vendors = this.getVendors();
    const newVendor: VendorProfile = {
      ...profileData,
      id: `vend-${Date.now()}`,
      kycStatus: 'pending',
      rating: 5.0,
      totalSales: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    vendors.push(newVendor);
    saveToStorage(STORAGE_KEYS.VENDORS, vendors);

    // Notify Admins
    this.createNotification({
      targetUserId: 'admin',
      targetRole: 'admin',
      title: 'New Vendor Registration (KYC Pending)',
      message: `${newVendor.businessName} (${newVendor.ownerName}) registered and submitted verification documents.`,
      type: 'kyc',
      linkId: newVendor.id
    });

    return newVendor;
  },

  updateVendorKycStatus(vendorId: string, status: KycStatus, reason?: string, adminName: string = 'Admin'): VendorProfile {
    const vendors = this.getVendors();
    const index = vendors.findIndex((v) => v.id === vendorId);
    if (index === -1) throw new Error('Vendor not found');

    vendors[index].kycStatus = status;
    vendors[index].kycRejectionReason = reason;
    vendors[index].kycReviewedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.VENDORS, vendors);

    // Audit log
    this.addAuditLog({
      adminName,
      action: `VENDOR_KYC_${status.toUpperCase()}`,
      details: `Vendor ${vendors[index].businessName} KYC updated to ${status}. Reason: ${reason || 'Approved'}`,
      targetRef: vendorId
    });

    // Notify Vendor
    this.createNotification({
      targetUserId: vendors[index].userId,
      title: `Vendor KYC Application ${status === 'approved' ? 'Approved' : 'Updated'}`,
      message:
        status === 'approved'
          ? 'Congratulations! Your JAGA vendor account has been verified. You can now publish products to the live marketplace.'
          : `Your vendor application was ${status}. Reason: ${reason || 'Please review your uploaded documents.'}`,
      type: 'kyc',
      linkId: vendorId
    });

    return vendors[index];
  },

  // Products
  getProducts(): Product[] {
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  // Only approved vendor's published and in-stock or clearly labelled products appear on homepage
  getPublicMarketplaceProducts(): Product[] {
    const all = this.getProducts();
    const vendors = this.getVendors();
    const approvedVendorIds = new Set(vendors.filter((v) => v.kycStatus === 'approved').map((v) => v.id));

    return all.filter((p) => {
      const isApprovedVendor = approvedVendorIds.has(p.vendorId);
      const isPublished = p.status === 'published' || p.status === 'out_of_stock';
      return isApprovedVendor && isPublished;
    });
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  },

  createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'salesCount' | 'rating' | 'status'>,
    vendorUserId: string
  ): Product {
    const vendor = this.getVendorByUserId(vendorUserId);
    if (!vendor) {
      throw new Error('You must be a registered vendor to upload products.');
    }
    if (vendor.kycStatus !== 'approved') {
      throw new Error('Your vendor account is not yet approved. Only approved vendors can upload and publish products.');
    }
    if (!productData.images || productData.images.length === 0) {
      throw new Error('At least one product image is mandatory before uploading.');
    }

    const products = this.getProducts();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      vendorId: vendor.id,
      vendorBusinessName: vendor.businessName,
      vendorLocation: `${vendor.businessAddress}, ${vendor.state}`,
      status: 'published', // Approved vendors products auto-publish or can be set to review
      salesCount: 0,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    products.unshift(newProduct);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    // Notify Admin of new product
    this.createNotification({
      targetUserId: 'admin',
      targetRole: 'admin',
      title: 'New Product Uploaded',
      message: `${vendor.businessName} uploaded "${newProduct.name}" priced at ₦${newProduct.price.toLocaleString()}.`,
      type: 'product',
      linkId: newProduct.id
    });

    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>, requestingVendorUserId?: string): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    if (requestingVendorUserId) {
      const vendor = this.getVendorByUserId(requestingVendorUserId);
      if (!vendor || products[index].vendorId !== vendor.id) {
        throw new Error('Unauthorized: You can only edit your own products.');
      }
    }

    // If stock changed to 0, status is out_of_stock
    const updatedStock = updates.stock !== undefined ? updates.stock : products[index].stock;
    let nextStatus = updates.status || products[index].status;
    if (updatedStock === 0 && nextStatus === 'published') {
      nextStatus = 'out_of_stock';
    } else if (updatedStock > 0 && nextStatus === 'out_of_stock') {
      nextStatus = 'published';
    }

    products[index] = {
      ...products[index],
      ...updates,
      stock: updatedStock,
      status: nextStatus
    };

    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  deleteProduct(id: string, requestingVendorUserId?: string): boolean {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;

    if (requestingVendorUserId) {
      const vendor = this.getVendorByUserId(requestingVendorUserId);
      if (!vendor || products[index].vendorId !== vendor.id) {
        throw new Error('Unauthorized to delete this product');
      }
    }

    products.splice(index, 1);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return true;
  },

  reviewProductByAdmin(productId: string, status: ProductStatus, reason?: string, adminName = 'Admin'): Product {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    product.status = status;
    product.rejectionReason = reason;
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    // Audit
    this.addAuditLog({
      adminName,
      action: `PRODUCT_STATUS_${status.toUpperCase()}`,
      details: `Admin changed status of ${product.name} to ${status}. Note: ${reason || 'N/A'}`,
      targetRef: productId
    });

    // Notify vendor
    const vendor = this.getVendorById(product.vendorId);
    if (vendor) {
      this.createNotification({
        targetUserId: vendor.userId,
        title: `Product Listing ${status === 'published' ? 'Approved' : 'Status Update'}`,
        message: `Your product "${product.name}" is now marked as ${status}. ${reason ? 'Reason: ' + reason : ''}`,
        type: 'product',
        linkId: product.id
      });
    }

    return product;
  },

  // Orders & Suborders
  getOrders(): Order[] {
    return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  getSubOrders(): VendorSubOrder[] {
    return getFromStorage<VendorSubOrder[]>(STORAGE_KEYS.SUBORDERS, INITIAL_SUBORDERS);
  },

  getOrderByTicketId(ticketId: string): Order | undefined {
    return this.getOrders().find((o) => o.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
  },

  generateOrderTicketId(): string {
    const orders = this.getOrders();
    const currentYear = new Date().getFullYear();
    const count = orders.length + 102;
    const padded = String(count).padStart(6, '0');
    return `JAG-${currentYear}-${padded}`;
  },

  createOrder(orderData: {
    customer: User;
    deliveryAddress: Order['deliveryAddress'];
    cartItems: {
      productId: string;
      variantId?: string;
      quantity: number;
    }[];
  }): Order {
    const products = this.getProducts();
    const ticketId = this.generateOrderTicketId();
    const parentOrderId = `ord-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 1. Server recalculates prices and validates stock
    let subtotal = 0;
    const orderItems: Order['items'] = [];
    const itemsByVendor: Record<string, Order['items']> = {};

    for (const item of orderData.cartItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Check stock
      let unitPrice = product.price;
      let variantDesc = '';

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) throw new Error(`Selected variant not found for ${product.name}`);
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name} (${variant.color || variant.size || variant.optionName}). Available: ${variant.stock}`);
        }
        // Deduct variant stock
        variant.stock -= item.quantity;
        if (variant.priceDelta) unitPrice += variant.priceDelta;
        variantDesc = [variant.color, variant.size, variant.optionName].filter(Boolean).join(' / ');
      } else {
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
      }

      // Deduct main stock
      product.stock -= item.quantity;
      if (product.stock <= 0) {
        product.status = 'out_of_stock';
      }
      product.salesCount += item.quantity;

      const orderItem = {
        productId: product.id,
        vendorId: product.vendorId,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        variantId: item.variantId,
        variantDescription: variantDesc,
        productImage: product.images[0] || ''
      };

      orderItems.push(orderItem);
      subtotal += unitPrice * item.quantity;

      if (!itemsByVendor[product.vendorId]) {
        itemsByVendor[product.vendorId] = [];
      }
      itemsByVendor[product.vendorId].push(orderItem);
    }

    // Save updated products inventory
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    // Dynamic Delivery fee calculation based on state
    const deliveryZones = this.getDeliveryZones();
    const matchedZone = deliveryZones.find(
      (z) => z.state.toLowerCase() === orderData.deliveryAddress.state.toLowerCase()
    );
    const deliveryFee = matchedZone ? matchedZone.fee : 4000;
    const total = subtotal + deliveryFee;

    // 2. Create Vendor Sub-orders
    const subOrders = this.getSubOrders();
    const subOrderIds: string[] = [];

    Object.entries(itemsByVendor).forEach(([vendorId, vItems], index) => {
      const subOrderId = `sub-${parentOrderId}-v${index + 1}`;
      const vSubtotal = vItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);

      const subOrder: VendorSubOrder = {
        id: subOrderId,
        parentOrderId,
        orderTicketId: ticketId,
        vendorId,
        items: vItems,
        subtotal: vSubtotal,
        vendorFulfillmentStatus: 'pending',
        updatedAt: timestamp
      };

      subOrders.push(subOrder);
      subOrderIds.push(subOrderId);

      // Notify vendor about new order
      const vendor = this.getVendorById(vendorId);
      if (vendor) {
        this.createNotification({
          targetUserId: vendor.userId,
          title: `New Order Placed: Ticket ${ticketId}`,
          message: `Customer ${orderData.customer.fullName} placed an order with ${vItems.length} item(s) totaling ₦${vSubtotal.toLocaleString()}. Awaiting admin payment confirmation.`,
          type: 'order',
          linkId: ticketId
        });
      }
    });

    saveToStorage(STORAGE_KEYS.SUBORDERS, subOrders);

    // 3. Create Parent Order
    const newOrder: Order = {
      id: parentOrderId,
      ticketId,
      customerId: orderData.customer.id,
      customerName: orderData.customer.fullName,
      customerEmail: orderData.customer.email,
      customerPhone: orderData.customer.phone,
      deliveryAddress: orderData.deliveryAddress,
      items: orderItems,
      vendorSubOrderIds: subOrderIds,
      subtotal,
      deliveryFee,
      total,
      paymentStatus: 'awaiting_payment',
      orderStatus: 'pending',
      timeline: [
        {
          timestamp,
          title: 'Order Created',
          description: `Order ticket ${ticketId} generated. Waiting for manual bank transfer payment.`,
          actor: 'customer'
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    // Notify customer
    this.createNotification({
      targetUserId: orderData.customer.id,
      title: `Order Created: Ticket ${ticketId}`,
      message: `Your order for ₦${total.toLocaleString()} is placed. Please transfer to the JAGA Zenith Bank account using ${ticketId} as narration.`,
      type: 'order',
      linkId: ticketId
    });

    return newOrder;
  },

  // Bank Transfer Payment Claim
  submitPaymentClaim(
    ticketId: string,
    claimInput: {
      bankPaidFrom: string;
      accountSenderName: string;
      transactionReference: string;
      claimedAmount: number;
      receiptImageUrl?: string;
    },
    customerId: string
  ): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.ticketId === ticketId);
    if (!order) throw new Error('Order not found with ticket ID');
    if (order.customerId !== customerId) throw new Error('Unauthorized');

    const claim: PaymentClaim = {
      id: `claim-${Date.now()}`,
      orderTicketId: ticketId,
      bankPaidFrom: claimInput.bankPaidFrom,
      accountSenderName: claimInput.accountSenderName,
      transactionReference: claimInput.transactionReference,
      claimedAmount: claimInput.claimedAmount,
      receiptImageUrl: claimInput.receiptImageUrl,
      submittedAt: new Date().toISOString()
    };

    order.paymentClaim = claim;
    order.paymentStatus = 'payment_claimed';
    order.timeline.push({
      timestamp: new Date().toISOString(),
      title: 'Payment Claim Submitted',
      description: `Customer submitted payment claim: ${claimInput.transactionReference} from ${claimInput.bankPaidFrom} (${claimInput.accountSenderName}).`,
      actor: 'customer'
    });
    order.updatedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    // Notify Admins to verify
    this.createNotification({
      targetUserId: 'admin',
      targetRole: 'admin',
      title: `Payment Claim: Ticket ${ticketId}`,
      message: `Customer ${order.customerName} claimed transfer of ₦${claimInput.claimedAmount.toLocaleString()} (Ref: ${claimInput.transactionReference}). Please verify in bank statement.`,
      type: 'payment',
      linkId: ticketId
    });

    return order;
  },

  // Admin Payment Verification
  verifyPaymentClaim(
    ticketId: string,
    decision: 'confirmed' | 'rejected',
    adminNote: string,
    adminName = 'JAGA Admin'
  ): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.ticketId === ticketId);
    if (!order) throw new Error('Order not found');

    const timestamp = new Date().toISOString();

    if (decision === 'confirmed') {
      order.paymentStatus = 'confirmed';
      order.orderStatus = 'processing';
      if (order.paymentClaim) {
        order.paymentClaim.verifiedByAdmin = adminName;
        order.paymentClaim.adminVerifierNote = adminNote;
        order.paymentClaim.verifiedAt = timestamp;
      }

      order.timeline.push({
        timestamp,
        title: 'Payment Confirmed by Admin',
        description: `Verified with bank statement. Note: ${adminNote}`,
        actor: 'admin'
      });

      // Update vendor suborders and notify vendors
      const subOrders = this.getSubOrders();
      const updatedSubOrders = subOrders.map((sub) => {
        if (sub.orderTicketId === ticketId) {
          return {
            ...sub,
            vendorFulfillmentStatus: 'accepted' as const,
            updatedAt: timestamp
          };
        }
        return sub;
      });
      saveToStorage(STORAGE_KEYS.SUBORDERS, updatedSubOrders);

      // Notify customer
      this.createNotification({
        targetUserId: order.customerId,
        title: `Payment Confirmed: Ticket ${ticketId}`,
        message: `Your payment of ₦${order.total.toLocaleString()} has been confirmed! Vendors are now preparing your items for delivery.`,
        type: 'payment',
        linkId: ticketId
      });

      // Notify each vendor
      const uniqueVendorIds = [...new Set(order.items.map((i) => i.vendorId))];
      uniqueVendorIds.forEach((vId) => {
        const vendor = this.getVendorById(vId);
        if (vendor) {
          this.createNotification({
            targetUserId: vendor.userId,
            title: `Payment Confirmed for Ticket ${ticketId}`,
            message: `Bank payment verified! Please start preparing your order items for dispatch.`,
            type: 'order',
            linkId: ticketId
          });
        }
      });

      // Audit Log
      this.addAuditLog({
        adminName,
        action: 'PAYMENT_CONFIRMED',
        details: `Confirmed payment for ticket ${ticketId} (₦${order.total.toLocaleString()}). Note: ${adminNote}`,
        targetRef: ticketId
      });
    } else {
      order.paymentStatus = 'rejected';
      if (order.paymentClaim) {
        order.paymentClaim.verifiedByAdmin = adminName;
        order.paymentClaim.adminVerifierNote = adminNote;
        order.paymentClaim.verifiedAt = timestamp;
      }

      order.timeline.push({
        timestamp,
        title: 'Payment Claim Rejected',
        description: `Admin rejected payment claim. Reason: ${adminNote}`,
        actor: 'admin'
      });

      // Notify customer
      this.createNotification({
        targetUserId: order.customerId,
        title: `Payment Verification Issue: Ticket ${ticketId}`,
        message: `We could not verify your bank transfer claim. Reason: ${adminNote}. Please check your transaction details or contact support.`,
        type: 'payment',
        linkId: ticketId
      });

      // Audit Log
      this.addAuditLog({
        adminName,
        action: 'PAYMENT_CLAIM_REJECTED',
        details: `Rejected payment claim for ticket ${ticketId}. Reason: ${adminNote}`,
        targetRef: ticketId
      });
    }

    order.updatedAt = timestamp;
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    return order;
  },

  // Vendor order fulfillment
  updateVendorSubOrderStatus(
    subOrderId: string,
    status: VendorSubOrder['vendorFulfillmentStatus'],
    vendorUserId: string,
    notes?: string
  ): VendorSubOrder {
    const vendor = this.getVendorByUserId(vendorUserId);
    if (!vendor) throw new Error('Vendor profile not found');

    const subOrders = this.getSubOrders();
    const subOrder = subOrders.find((s) => s.id === subOrderId);
    if (!subOrder) throw new Error('Sub-order not found');
    if (subOrder.vendorId !== vendor.id) throw new Error('Unauthorized');

    subOrder.vendorFulfillmentStatus = status;
    if (notes) subOrder.vendorNotes = notes;
    subOrder.updatedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.SUBORDERS, subOrders);

    // Update parent order timeline
    const orders = this.getOrders();
    const parentOrder = orders.find((o) => o.id === subOrder.parentOrderId);
    if (parentOrder) {
      parentOrder.timeline.push({
        timestamp: new Date().toISOString(),
        title: `Vendor Update: ${status.replace('_', ' ').toUpperCase()}`,
        description: `${vendor.businessName} updated fulfillment status to ${status}. ${notes ? 'Note: ' + notes : ''}`,
        actor: 'vendor'
      });
      saveToStorage(STORAGE_KEYS.ORDERS, orders);

      // Notify customer
      this.createNotification({
        targetUserId: parentOrder.customerId,
        title: `Order Update: Ticket ${parentOrder.ticketId}`,
        message: `${vendor.businessName} marked your items as "${status.replace('_', ' ')}".`,
        type: 'order',
        linkId: parentOrder.ticketId
      });
    }

    return subOrder;
  },

  // Admin Delivery Scheduling
  updateDeliverySchedule(
    ticketId: string,
    scheduledDate: string,
    courier: string,
    trackingNumber: string,
    adminName = 'JAGA Admin'
  ): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.ticketId === ticketId);
    if (!order) throw new Error('Order not found');

    order.scheduledDeliveryDate = scheduledDate;
    order.deliveryCourier = courier;
    order.trackingNumber = trackingNumber;
    order.orderStatus = 'in_transit';
    order.updatedAt = new Date().toISOString();

    order.timeline.push({
      timestamp: new Date().toISOString(),
      title: 'Delivery Scheduled & In Transit',
      description: `Estimated arrival: ${scheduledDate} via ${courier}. Tracking: ${trackingNumber || 'Available locally'}`,
      actor: 'admin'
    });

    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    // Notify customer
    this.createNotification({
      targetUserId: order.customerId,
      title: `Delivery Scheduled for Ticket ${ticketId}`,
      message: `Your order is on the way! Estimated delivery date: ${scheduledDate} via ${courier}.`,
      type: 'order',
      linkId: ticketId
    });

    // Audit
    this.addAuditLog({
      adminName,
      action: 'DELIVERY_SCHEDULED',
      details: `Scheduled delivery for ${ticketId} with ${courier} on ${scheduledDate}`,
      targetRef: ticketId
    });

    return order;
  },

  // Cancellation Rules & Stock Restoration
  cancelOrder(
    ticketId: string,
    reason: string,
    actorRole: 'customer' | 'vendor' | 'admin',
    actorUserId: string
  ): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.ticketId === ticketId);
    if (!order) throw new Error('Order not found');

    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      throw new Error(`Order cannot be cancelled in status: ${order.orderStatus}`);
    }

    // Role checks
    if (actorRole === 'customer') {
      if (order.customerId !== actorUserId) throw new Error('Unauthorized');
      if (order.orderStatus === 'in_transit') {
        throw new Error('Orders already in transit cannot be cancelled by customer directly. Please contact support.');
      }
    }

    // Restore stock in inventory
    const products = this.getProducts();
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
        if (prod.status === 'out_of_stock' && prod.stock > 0) {
          prod.status = 'published';
        }
        if (item.variantId) {
          const variant = prod.variants.find((v) => v.id === item.variantId);
          if (variant) {
            variant.stock += item.quantity;
          }
        }
      }
    });
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    const timestamp = new Date().toISOString();
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledBy = actorRole;
    if (order.paymentStatus === 'confirmed') {
      order.paymentStatus = 'refund_pending';
    }

    order.timeline.push({
      timestamp,
      title: `Order Cancelled by ${actorRole.toUpperCase()}`,
      description: `Reason: ${reason}. Inventory restored.${order.paymentStatus === 'refund_pending' ? ' Refund is pending admin processing.' : ''}`,
      actor: actorRole
    });

    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    // Notify customer & affected vendors
    this.createNotification({
      targetUserId: order.customerId,
      title: `Order Cancelled: Ticket ${ticketId}`,
      message: `Your order was cancelled by ${actorRole}. Reason: ${reason}.${order.paymentStatus === 'refund_pending' ? ' Refund request is registered.' : ''}`,
      type: 'order',
      linkId: ticketId
    });

    return order;
  },

  // Sourcing Requests
  getSourcingRequests(): ProductSourcingRequest[] {
    return getFromStorage<ProductSourcingRequest[]>(STORAGE_KEYS.SOURCING_REQUESTS, INITIAL_SOURCING_REQUESTS);
  },

  generateSourcingRequestId(): string {
    const list = this.getSourcingRequests();
    const count = list.length + 35;
    const year = new Date().getFullYear();
    return `JAG-REQ-${year}-${String(count).padStart(6, '0')}`;
  },

  createSourcingRequest(
    data: Omit<ProductSourcingRequest, 'id' | 'requestId' | 'createdAt' | 'updatedAt' | 'status'>
  ): ProductSourcingRequest {
    const list = this.getSourcingRequests();
    const requestId = this.generateSourcingRequestId();
    const timestamp = new Date().toISOString();

    const newRequest: ProductSourcingRequest = {
      ...data,
      id: `req-${Date.now()}`,
      requestId,
      status: 'submitted',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    list.unshift(newRequest);
    saveToStorage(STORAGE_KEYS.SOURCING_REQUESTS, list);

    // Notify Admin
    this.createNotification({
      targetUserId: 'admin',
      targetRole: 'admin',
      title: `New Product Request: ${requestId}`,
      message: `${data.customerName} requested sourcing for "${data.productName}" (Budget: ₦${data.expectedBudgetNgn?.toLocaleString() || 'Negotiable'}).`,
      type: 'request',
      linkId: requestId
    });

    return newRequest;
  },

  addQuotationToRequest(
    requestId: string,
    quotation: {
      quotedPriceNgn: number;
      estimatedDeliveryDays: number;
      sourcingNotes: string;
    },
    adminName = 'JAGA Admin'
  ): ProductSourcingRequest {
    const list = this.getSourcingRequests();
    const req = list.find((r) => r.requestId === requestId || r.id === requestId);
    if (!req) throw new Error('Sourcing request not found');

    const timestamp = new Date().toISOString();
    req.quotation = {
      ...quotation,
      quotedAt: timestamp,
      quotedByAdmin: adminName
    };
    req.status = 'quotation_ready';
    req.updatedAt = timestamp;

    saveToStorage(STORAGE_KEYS.SOURCING_REQUESTS, list);

    // Notify customer
    this.createNotification({
      targetUserId: req.customerId,
      title: `Quotation Ready: Request ${req.requestId}`,
      message: `Admin provided quotation of ₦${quotation.quotedPriceNgn.toLocaleString()} for your requested "${req.productName}". Click to review and accept.`,
      type: 'request',
      linkId: req.requestId
    });

    // Audit
    this.addAuditLog({
      adminName,
      action: 'SOURCING_QUOTATION_SENT',
      details: `Quoted ₦${quotation.quotedPriceNgn.toLocaleString()} for request ${req.requestId}`,
      targetRef: req.requestId
    });

    return req;
  },

  respondToQuotation(
    requestId: string,
    decision: 'accepted' | 'declined',
    customerUserId: string
  ): ProductSourcingRequest {
    const list = this.getSourcingRequests();
    const req = list.find((r) => r.requestId === requestId || r.id === requestId);
    if (!req) throw new Error('Request not found');
    if (req.customerId !== customerUserId) throw new Error('Unauthorized');

    const timestamp = new Date().toISOString();
    req.customerDecision = decision;
    req.customerDecisionDate = timestamp;

    if (decision === 'accepted') {
      req.status = 'accepted';
      // Notify admin
      this.createNotification({
        targetUserId: 'admin',
        targetRole: 'admin',
        title: `Customer Accepted Quote: ${req.requestId}`,
        message: `${req.customerName} accepted the quotation of ₦${req.quotation?.quotedPriceNgn.toLocaleString()}. Ready to proceed to payment.`,
        type: 'request',
        linkId: req.requestId
      });
    } else {
      req.status = 'closed';
      this.createNotification({
        targetUserId: 'admin',
        targetRole: 'admin',
        title: `Customer Declined Quote: ${req.requestId}`,
        message: `${req.customerName} declined the quotation.`,
        type: 'request',
        linkId: req.requestId
      });
    }

    req.updatedAt = timestamp;
    saveToStorage(STORAGE_KEYS.SOURCING_REQUESTS, list);
    return req;
  },

  // Bank Settings
  getBankSettings(): BankSettings {
    return getFromStorage<BankSettings>(STORAGE_KEYS.BANK_SETTINGS, INITIAL_BANK_SETTINGS);
  },

  updateBankSettings(settings: BankSettings, adminName = 'JAGA Admin'): BankSettings {
    saveToStorage(STORAGE_KEYS.BANK_SETTINGS, settings);
    this.addAuditLog({
      adminName,
      action: 'BANK_SETTINGS_UPDATED',
      details: `Bank settings updated to ${settings.bankName} - ${settings.accountNumber} (${settings.accountName})`,
      targetRef: 'BANK_SETTINGS'
    });
    return settings;
  },

  // Delivery Zones
  getDeliveryZones(): DeliveryZone[] {
    return getFromStorage<DeliveryZone[]>(STORAGE_KEYS.DELIVERY_ZONES, INITIAL_DELIVERY_ZONES);
  },

  // Notifications
  getNotifications(): InAppNotification[] {
    return getFromStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  getUserNotifications(userId: string, role?: string): InAppNotification[] {
    const all = this.getNotifications();
    return all.filter((n) => {
      if (n.targetUserId === userId) return true;
      if (role === 'admin' && (n.targetRole === 'admin' || n.targetUserId === 'admin')) return true;
      return false;
    });
  },

  createNotification(notif: Omit<InAppNotification, 'id' | 'read' | 'createdAt'>): InAppNotification {
    const all = this.getNotifications();
    const newNotif: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    all.unshift(newNotif);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const all = this.getNotifications();
    const notif = all.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const all = this.getNotifications();
    all.forEach((n) => {
      if (n.targetUserId === userId || n.targetUserId === 'admin') {
        n.read = true;
      }
    });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  // Audit Logs
  getAuditLogs(): AuditLogEntry[] {
    return getFromStorage<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newEntry;
  }
};
