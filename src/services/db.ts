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
  PaymentClaim,
  UserRole,
  VendorApplication,
  VendorApplicationStatus
} from '../types';

import {
  INITIAL_VENDORS,
  INITIAL_PRODUCTS,
  INITIAL_BANK_SETTINGS,
  INITIAL_DELIVERY_ZONES
} from './seedData';

import {
  db as firestoreDb,
  auth,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection
} from '../firebase';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';

// In-memory reactive state synchronized directly from Cloud Firestore
let memoryProducts: Product[] = [];
let memoryVendors: VendorProfile[] = [];
let memoryBankSettings: BankSettings = INITIAL_BANK_SETTINGS;
let memoryDeliveryZones: DeliveryZone[] = INITIAL_DELIVERY_ZONES;

export const db = {
  // Test Firestore connectivity
  async checkConnection(): Promise<boolean> {
    return await testFirestoreConnection();
  },

  // 1. PRODUCTS (Live Cloud Firestore)
  getProducts(): Product[] {
    return memoryProducts;
  },

  getPublicMarketplaceProducts(): Product[] {
    const approvedVendorIds = new Set(
      memoryVendors.filter((v) => v.kycStatus === 'approved').map((v) => v.id)
    );

    return memoryProducts.filter((p) => {
      // Products with approved vendor status or platform-verified catalog
      const isApproved = approvedVendorIds.size === 0 || approvedVendorIds.has(p.vendorId);
      const isPublished = p.status === 'published' || p.status === 'out_of_stock';
      return isApproved && isPublished;
    });
  },

  getProductById(id: string): Product | undefined {
    return memoryProducts.find((p) => p.id === id);
  },

  // Real-time Firestore Subscription for Products (Cross-browser synchronization)
  subscribeProducts(callback: (products: Product[]) => void): Unsubscribe {
    const productsColl = collection(firestoreDb, 'products');
    return onSnapshot(
      productsColl,
      (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((d) => {
          prods.push(d.data() as Product);
        });
        memoryProducts = prods;
        callback(prods);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
        callback(memoryProducts);
      }
    );
  },

  // Direct fetch from Cloud Firestore
  async fetchLiveProducts(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'products'));
      const prods: Product[] = [];
      snap.forEach((d) => prods.push(d.data() as Product));
      memoryProducts = prods;
      return prods;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'products');
      return memoryProducts;
    }
  },

  async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'salesCount' | 'rating' | 'status'>,
    vendorUserId: string
  ): Promise<Product> {
    if (!auth.currentUser) {
      throw new Error('Authentication required: You must be logged into Firebase to upload products.');
    }

    const vendor = this.getVendorByUserId(vendorUserId);
    if (!vendor) {
      throw new Error('Registered vendor profile required to upload products.');
    }
    if (vendor.kycStatus !== 'approved') {
      throw new Error('Vendor KYC is pending approval. Only verified merchants can publish products.');
    }
    if (!productData.images || productData.images.length === 0) {
      throw new Error('At least one product image is required.');
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      vendorId: vendor.id,
      vendorBusinessName: vendor.businessName,
      vendorLocation: `${vendor.businessAddress}, ${vendor.state}`,
      status: 'published',
      salesCount: 0,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    // Write directly to Cloud Firestore
    try {
      await setDoc(doc(firestoreDb, 'products', newProduct.id), newProduct);
      memoryProducts.unshift(newProduct);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `products/${newProduct.id}`);
      throw err;
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>, requestingVendorUserId?: string): Promise<Product> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    const product = memoryProducts.find((p) => p.id === id);
    if (!product) throw new Error('Product not found in Firestore.');

    if (requestingVendorUserId) {
      const vendor = this.getVendorByUserId(requestingVendorUserId);
      if (!vendor || product.vendorId !== vendor.id) {
        throw new Error('Unauthorized: You can only edit your own merchant products.');
      }
    }

    const updatedStock = updates.stock !== undefined ? updates.stock : product.stock;
    let nextStatus = updates.status || product.status;
    if (updatedStock === 0 && nextStatus === 'published') {
      nextStatus = 'out_of_stock';
    } else if (updatedStock > 0 && nextStatus === 'out_of_stock') {
      nextStatus = 'published';
    }

    const merged = {
      ...product,
      ...updates,
      stock: updatedStock,
      status: nextStatus
    };

    try {
      await updateDoc(doc(firestoreDb, 'products', id), merged);
      const index = memoryProducts.findIndex((p) => p.id === id);
      if (index !== -1) memoryProducts[index] = merged;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
      throw err;
    }

    return merged;
  },

  async deleteProduct(id: string, requestingVendorUserId?: string): Promise<boolean> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    const product = memoryProducts.find((p) => p.id === id);
    if (!product) return false;

    if (requestingVendorUserId) {
      const vendor = this.getVendorByUserId(requestingVendorUserId);
      if (!vendor || product.vendorId !== vendor.id) {
        throw new Error('Unauthorized: You can only delete your own products.');
      }
    }

    try {
      await deleteDoc(doc(firestoreDb, 'products', id));
      memoryProducts = memoryProducts.filter((p) => p.id !== id);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      throw err;
    }
  },

  // 2. VENDORS (Live Cloud Firestore)
  getVendors(): VendorProfile[] {
    return memoryVendors;
  },

  getVendorById(id: string): VendorProfile | undefined {
    return memoryVendors.find((v) => v.id === id);
  },

  getVendorByUserId(userId: string): VendorProfile | undefined {
    return memoryVendors.find((v) => v.userId === userId);
  },

  subscribeVendors(callback: (vendors: VendorProfile[]) => void): Unsubscribe {
    const vendorsColl = collection(firestoreDb, 'vendors');
    return onSnapshot(
      vendorsColl,
      (snapshot) => {
        const vends: VendorProfile[] = [];
        snapshot.forEach((d) => {
          vends.push(d.data() as VendorProfile);
        });
        memoryVendors = vends;
        callback(vends);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'vendors');
        callback(memoryVendors);
      }
    );
  },

  async createVendorProfile(
    profileData: Omit<VendorProfile, 'id' | 'kycStatus' | 'rating' | 'totalSales' | 'joinedDate'>
  ): Promise<VendorProfile> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    const vendorId = `vend-${Date.now()}`;
    const newVendor: VendorProfile = {
      ...profileData,
      id: vendorId,
      kycStatus: 'pending',
      rating: 5.0,
      totalSales: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    // Public vendor profile in /vendors/{vendorId}
    try {
      await setDoc(doc(firestoreDb, 'vendors', vendorId), {
        id: vendorId,
        userId: newVendor.userId,
        businessName: newVendor.businessName,
        ownerName: newVendor.ownerName,
        email: newVendor.email,
        phone: newVendor.phone,
        businessAddress: newVendor.businessAddress,
        state: newVendor.state,
        lga: newVendor.lga,
        category: newVendor.category,
        kycStatus: 'pending',
        rating: 5.0,
        totalSales: 0,
        joinedDate: newVendor.joinedDate
      });

      // Private PII Isolation in /vendors/{vendorId}/private/kyc
      await setDoc(doc(firestoreDb, `vendors/${vendorId}/private`, 'kyc'), {
        cacNumber: profileData.cacNumber || '',
        tinNumber: profileData.tinNumber || '',
        idType: profileData.kycDocuments.idType || 'NIN National Identity',
        cacCertificateUrl: profileData.kycDocuments.cacCertificateUrl || '',
        governmentIdUrl: profileData.kycDocuments.governmentIdUrl || '',
        utilityBillUrl: profileData.kycDocuments.utilityBillUrl || '',
        submittedAt: new Date().toISOString()
      });

      memoryVendors.push(newVendor);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `vendors/${vendorId}`);
      throw err;
    }

    return newVendor;
  },

  // 2.1 VENDOR APPLICATIONS LIFECYCLE (Customer -> Application -> Review -> Vendor)
  async submitVendorApplication(
    data: {
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
    },
    userId: string
  ): Promise<VendorApplication> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('Authentication required: You must be signed in to apply as a vendor.');
    }

    const timestamp = new Date().toISOString();
    const appId = `app-${userId}`;

    // Read any existing application to maintain history
    let existingHistory: any[] = [];
    try {
      const existingDoc = await getDoc(doc(firestoreDb, 'vendor_applications', appId));
      if (existingDoc.exists()) {
        const prev = existingDoc.data() as VendorApplication;
        existingHistory = prev.history || [];
      }
    } catch (e) {
      // ignore
    }

    const newHistoryEntry = {
      status: 'pending' as const,
      notes: 'Application submitted by customer for compliance review',
      timestamp
    };

    const application: VendorApplication = {
      ...data,
      id: appId,
      userId,
      status: 'pending',
      submittedAt: timestamp,
      updatedAt: timestamp,
      history: [...existingHistory, newHistoryEntry]
    };

    try {
      // 1. Write the application document to /vendor_applications/{appId}
      await setDoc(doc(firestoreDb, 'vendor_applications', appId), application);

      // 2. Store sensitive KYC and payout documents in private isolated subcollection
      await setDoc(doc(firestoreDb, `vendor_applications/${appId}/private`, 'details'), {
        userId,
        legalName: data.legalName,
        phone: data.phone,
        cacNumber: data.cacNumber || '',
        tinNumber: data.tinNumber || '',
        idType: data.idType,
        idDocumentUrl: data.idDocumentUrl,
        cacCertificateUrl: data.cacCertificateUrl || '',
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        submittedAt: timestamp
      });

      // 3. Log audit event
      await this.addAuditLog({
        adminName: data.legalName,
        action: 'VENDOR_APPLICATION_SUBMITTED',
        details: `Customer ${data.legalName} (${data.phone}) submitted vendor application for "${data.businessName}".`,
        targetRef: appId
      });

      return application;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vendor_applications/${appId}`);
      throw err;
    }
  },

  async getVendorApplication(userId: string): Promise<VendorApplication | null> {
    if (!auth.currentUser) return null;
    try {
      const appId = `app-${userId}`;
      const snap = await getDoc(doc(firestoreDb, 'vendor_applications', appId));
      if (snap.exists()) {
        return snap.data() as VendorApplication;
      }
      return null;
    } catch (err) {
      console.warn('Could not fetch vendor application:', err);
      return null;
    }
  },

  subscribeVendorApplication(
    userId: string,
    callback: (app: VendorApplication | null) => void
  ): Unsubscribe {
    if (!userId || !auth.currentUser) {
      callback(null);
      return () => {};
    }

    const appId = `app-${userId}`;
    const docRef = doc(firestoreDb, 'vendor_applications', appId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as VendorApplication);
        } else {
          callback(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `vendor_applications/${appId}`);
        callback(null);
      }
    );
  },

  subscribeAllVendorApplications(
    callback: (apps: VendorApplication[]) => void
  ): Unsubscribe {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }

    const coll = collection(firestoreDb, 'vendor_applications');
    return onSnapshot(
      coll,
      (snapshot) => {
        const apps: VendorApplication[] = [];
        snapshot.forEach((d) => {
          apps.push(d.data() as VendorApplication);
        });
        callback(apps);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'vendor_applications');
        callback([]);
      }
    );
  },

  async reviewVendorApplication(
    applicationId: string,
    decision: VendorApplicationStatus,
    notes: string,
    adminUid: string,
    adminEmail: string,
    adminName: string = 'JAGA Compliance Admin'
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Admin authentication required.');
    }

    const timestamp = new Date().toISOString();
    const appRef = doc(firestoreDb, 'vendor_applications', applicationId);
    const snap = await getDoc(appRef);

    if (!snap.exists()) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const app = snap.data() as VendorApplication;
    const historyEntry = {
      status: decision,
      notes,
      adminUid,
      adminEmail,
      timestamp
    };

    try {
      // 1. Update Vendor Application Status & Audit History
      await updateDoc(appRef, {
        status: decision,
        adminNotes: notes,
        reviewedByAdminUid: adminUid,
        reviewedByAdminEmail: adminEmail,
        reviewedAt: timestamp,
        updatedAt: timestamp,
        history: [...(app.history || []), historyEntry]
      });

      const vendorId = `vend-${app.userId}`;

      // 2. Perform Role Updates based on Decision
      if (decision === 'approved') {
        // Upgrade User Role to 'vendor' in /users/{userId}
        await updateDoc(doc(firestoreDb, 'users', app.userId), {
          role: 'vendor'
        });

        // Create or update approved public profile in /vendors/{vendorId}
        await setDoc(
          doc(firestoreDb, 'vendors', vendorId),
          {
            id: vendorId,
            userId: app.userId,
            businessName: app.businessName,
            ownerName: app.legalName,
            email: adminEmail ? app.userId : '',
            phone: app.phone,
            businessAddress: app.businessAddress,
            state: app.state,
            lga: app.lga || 'Lagos Island',
            category: app.category,
            kycStatus: 'approved',
            rating: 5.0,
            totalSales: 0,
            joinedDate: timestamp.split('T')[0]
          },
          { merge: true }
        );
      } else if (decision === 'suspended') {
        // Suspend vendor: Demote user role back to 'customer' so vendor features lock
        await updateDoc(doc(firestoreDb, 'users', app.userId), {
          role: 'customer'
        });

        // Mark vendor document as suspended
        try {
          await updateDoc(doc(firestoreDb, 'vendors', vendorId), {
            kycStatus: 'suspended'
          });
        } catch (e) {
          // Vendor doc might not exist yet
        }
      } else if (decision === 'rejected') {
        // Ensure user remains 'customer'
        await updateDoc(doc(firestoreDb, 'users', app.userId), {
          role: 'customer'
        });

        try {
          await updateDoc(doc(firestoreDb, 'vendors', vendorId), {
            kycStatus: 'rejected'
          });
        } catch (e) {
          // ignore
        }
      } else if (decision === 'needs_changes') {
        // Keep as 'customer' until changes provided and re-approved
        await updateDoc(doc(firestoreDb, 'users', app.userId), {
          role: 'customer'
        });
      }

      // 3. Write System Audit Log
      await this.addAuditLog({
        adminName,
        action: `VENDOR_APPLICATION_${decision.toUpperCase()}`,
        details: `Admin ${adminEmail || adminName} reviewed application for "${app.businessName}" (${app.legalName}). Decision: ${decision.toUpperCase()}. Notes: ${notes || 'None'}`,
        targetRef: applicationId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vendor_applications/${applicationId}`);
      throw err;
    }
  },

  async ensureAdminAuthorization(user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  }): Promise<boolean> {
    const isTargetAdmin =
      user.email === 'sadiqmuhammadibrahim1436@gmail.com' ||
      user.email === 'admin@jaga.ng';

    if (!isTargetAdmin) {
      // Check if document already exists in /admins/{uid}
      try {
        const adminDoc = await getDoc(doc(firestoreDb, 'admins', user.uid));
        return adminDoc.exists();
      } catch (e) {
        return false;
      }
    }

    try {
      const timestamp = new Date().toISOString();
      await setDoc(doc(firestoreDb, 'admins', user.uid), {
        adminId: user.uid,
        email: user.email,
        authorizedAt: timestamp,
        role: 'super_admin'
      }, { merge: true });

      await setDoc(doc(firestoreDb, 'users', user.uid), {
        userId: user.uid,
        email: user.email,
        fullName: user.displayName || 'Authorized Admin',
        role: 'admin',
        createdAt: timestamp
      }, { merge: true });

      return true;
    } catch (err) {
      console.warn('ensureAdminAuthorization notice:', err);
      return false;
    }
  },

  // 3. ORDERS & ESCROW PAYMENTS (Live Cloud Firestore)
  generateOrderTicketId(): string {
    const currentYear = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestampSlice = Date.now().toString().slice(-4);
    return `JAG-${currentYear}-${timestampSlice}${randomHex}`;
  },

  // Real-time Orders Subscription
  subscribeOrders(
    userId: string | null,
    role: UserRole | null,
    callback: (orders: Order[]) => void
  ): Unsubscribe {
    if (!userId || !auth.currentUser) {
      callback([]);
      return () => {};
    }

    let q;
    if (role === 'admin') {
      // Super Admin reads all orders
      q = collection(firestoreDb, 'orders');
    } else {
      // Customer reads their own orders
      q = query(collection(firestoreDb, 'orders'), where('customerId', '==', userId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((d) => orders.push(d.data() as Order));
        callback(orders);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
        callback([]);
      }
    );
  },

  // Real-time Suborders Subscription (for Vendors and Admins)
  subscribeSubOrders(
    vendorUserId: string | null,
    role: UserRole | null,
    callback: (suborders: VendorSubOrder[]) => void
  ): Unsubscribe {
    if (!vendorUserId || !auth.currentUser) {
      callback([]);
      return () => {};
    }

    let q;
    if (role === 'admin') {
      q = collection(firestoreDb, 'suborders');
    } else {
      q = query(collection(firestoreDb, 'suborders'), where('vendorUserId', '==', vendorUserId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const subs: VendorSubOrder[] = [];
        snapshot.forEach((d) => subs.push(d.data() as VendorSubOrder));
        callback(subs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'suborders');
        callback([]);
      }
    );
  },

  async createOrder(orderData: {
    customer: User;
    deliveryAddress: Order['deliveryAddress'];
    cartItems: {
      productId: string;
      variantId?: string;
      quantity: number;
    }[];
  }): Promise<Order> {
    if (!auth.currentUser) {
      throw new Error('Authentication required: You must be logged in to place an order.');
    }

    const ticketId = this.generateOrderTicketId();
    const parentOrderId = `ord-${Date.now()}`;
    const timestamp = new Date().toISOString();

    let subtotal = 0;
    const orderItems: Order['items'] = [];
    const itemsByVendor: Record<string, Order['items']> = {};
    const vendorUserIdsSet = new Set<string>();

    for (const item of orderData.cartItems) {
      const product = memoryProducts.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      let unitPrice = product.price;
      let variantDesc = '';

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) throw new Error(`Selected variant not found for ${product.name}`);
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${variant.stock}`);
        }
        variant.stock -= item.quantity;
        if (variant.priceDelta) unitPrice += variant.priceDelta;
        variantDesc = [variant.color, variant.size, variant.optionName].filter(Boolean).join(' / ');
      } else {
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
      }

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

      const vendor = memoryVendors.find((v) => v.id === product.vendorId);
      if (vendor) {
        vendorUserIdsSet.add(vendor.userId);
      }
    }

    // Update product stock in Firestore
    try {
      const batch = writeBatch(firestoreDb);
      for (const item of orderData.cartItems) {
        const prod = memoryProducts.find((p) => p.id === item.productId);
        if (prod) {
          batch.update(doc(firestoreDb, 'products', prod.id), {
            stock: prod.stock,
            status: prod.status,
            salesCount: prod.salesCount,
            variants: prod.variants
          });
        }
      }
      await batch.commit();
    } catch (stockErr) {
      console.warn('Stock update batch notice:', stockErr);
    }

    const deliveryZones = memoryDeliveryZones;
    const matchedZone = deliveryZones.find(
      (z) => z.state.toLowerCase() === orderData.deliveryAddress.state.toLowerCase()
    );
    const deliveryFee = matchedZone ? matchedZone.fee : 4000;
    const total = subtotal + deliveryFee;

    const subOrderIds: string[] = [];

    // Create suborders for each vendor with proper vendorUserId so vendor ABAC rules work
    for (const [vId, vItems] of Object.entries(itemsByVendor)) {
      const subOrderId = `sub-${parentOrderId}-v${subOrderIds.length + 1}`;
      const vSubtotal = vItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
      const vendor = memoryVendors.find((v) => v.id === vId);

      const subOrder: VendorSubOrder = {
        id: subOrderId,
        parentOrderId,
        orderTicketId: ticketId,
        vendorId: vId,
        vendorUserId: vendor ? vendor.userId : '',
        customerId: orderData.customer.id,
        items: vItems,
        subtotal: vSubtotal,
        vendorFulfillmentStatus: 'pending',
        updatedAt: timestamp
      };

      subOrderIds.push(subOrderId);

      // Write suborder to Firestore
      try {
        await setDoc(doc(firestoreDb, 'suborders', subOrderId), subOrder);
      } catch (subErr) {
        handleFirestoreError(subErr, OperationType.CREATE, `suborders/${subOrderId}`);
      }
    }

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
      vendorUserIds: Array.from(vendorUserIdsSet),
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

    // Write parent order to Firestore
    try {
      await setDoc(doc(firestoreDb, 'orders', parentOrderId), newOrder);
    } catch (orderErr) {
      handleFirestoreError(orderErr, OperationType.CREATE, `orders/${parentOrderId}`);
      throw orderErr;
    }

    return newOrder;
  },

  // Submit Bank Transfer Payment Claim
  async submitPaymentClaim(
    ticketId: string,
    arg2: any,
    arg3?: any,
    arg4?: string
  ): Promise<Order> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    let orderId = '';
    let claimInput: {
      bankPaidFrom: string;
      accountSenderName: string;
      transactionReference: string;
      claimedAmount: number;
      receiptImageUrl?: string;
    };
    let customerId = '';

    if (typeof arg2 === 'string') {
      orderId = arg2;
      claimInput = arg3;
      customerId = arg4 || auth.currentUser.uid;
    } else {
      claimInput = arg2;
      customerId = arg3 || auth.currentUser.uid;
    }

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

    const timestamp = new Date().toISOString();

    // If orderId was not provided, look it up by ticketId
    if (!orderId) {
      const q = query(collection(firestoreDb, 'orders'), where('ticketId', '==', ticketId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        orderId = snap.docs[0].id;
      } else {
        throw new Error(`Order with ticket ID ${ticketId} not found in Firestore.`);
      }
    }

    try {
      // 1. Isolate sensitive bank receipt evidence in /orders/{orderId}/private/payment
      await setDoc(doc(firestoreDb, `orders/${orderId}/private`, 'payment'), claim);

      // 2. Update order status and append to timeline
      const orderRef = doc(firestoreDb, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) throw new Error('Order not found in Firestore.');
      const orderData = snap.data() as Order;

      const updatedTimeline = [
        ...(orderData.timeline || []),
        {
          timestamp,
          title: 'Payment Claim Submitted',
          description: `Payment claimed: ${claimInput.transactionReference} from ${claimInput.bankPaidFrom} (${claimInput.accountSenderName}).`,
          actor: 'customer' as const
        }
      ];

      await updateDoc(orderRef, {
        paymentStatus: 'payment_claimed',
        timeline: updatedTimeline,
        updatedAt: timestamp
      });

      return {
        ...orderData,
        paymentStatus: 'payment_claimed',
        timeline: updatedTimeline,
        updatedAt: timestamp,
        paymentClaim: claim
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}/private/payment`);
      throw err;
    }
  },

  // Admin Payment Verification
  async verifyPaymentClaim(
    arg1: string,
    arg2: any,
    arg3?: any,
    arg4?: any,
    arg5?: string
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Admin authentication required.');
    }

    let orderId = '';
    let ticketId = '';
    let decision: 'confirmed' | 'rejected';
    let adminNote = '';
    let adminName = 'JAGA Admin';

    if (arg5 !== undefined) {
      orderId = arg1;
      ticketId = arg2;
      decision = arg3;
      adminNote = arg4;
      adminName = arg5;
    } else {
      ticketId = arg1;
      decision = arg2;
      adminNote = arg3 || '';
      adminName = arg4 || 'JAGA Admin';
    }

    if (!orderId) {
      const q = query(collection(firestoreDb, 'orders'), where('ticketId', '==', ticketId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        orderId = snap.docs[0].id;
      } else {
        throw new Error(`Order ${ticketId} not found.`);
      }
    }

    const timestamp = new Date().toISOString();
    const orderRef = doc(firestoreDb, 'orders', orderId);

    try {
      const snap = await getDoc(orderRef);
      if (!snap.exists()) throw new Error('Order not found');
      const orderData = snap.data() as Order;

      const isConfirmed = decision === 'confirmed';
      const updatedTimeline = [
        ...(orderData.timeline || []),
        {
          timestamp,
          title: isConfirmed ? 'Payment Confirmed by Admin' : 'Payment Claim Rejected',
          description: isConfirmed
            ? `Verified with bank statement. Note: ${adminNote}`
            : `Admin rejected payment claim. Reason: ${adminNote}`,
          actor: 'admin' as const
        }
      ];

      await updateDoc(orderRef, {
        paymentStatus: isConfirmed ? 'confirmed' : 'rejected',
        orderStatus: isConfirmed ? 'processing' : orderData.orderStatus,
        timeline: updatedTimeline,
        updatedAt: timestamp
      });

      // Update related suborders
      if (orderData.vendorSubOrderIds && orderData.vendorSubOrderIds.length > 0) {
        for (const subId of orderData.vendorSubOrderIds) {
          try {
            await updateDoc(doc(firestoreDb, 'suborders', subId), {
              vendorFulfillmentStatus: isConfirmed ? 'accepted' : 'pending',
              updatedAt: timestamp
            });
          } catch (e) {
            console.warn('Suborder status update notice:', e);
          }
        }
      }

      await this.addAuditLog({
        adminName,
        action: isConfirmed ? 'PAYMENT_CONFIRMED' : 'PAYMENT_CLAIM_REJECTED',
        details: `${decision.toUpperCase()} payment for ticket ${ticketId}. Note: ${adminNote}`,
        targetRef: ticketId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      throw err;
    }
  },

  // Vendor order fulfillment
  async updateVendorSubOrderStatus(
    subOrderId: string,
    status: VendorSubOrder['vendorFulfillmentStatus'],
    vendorUserId: string,
    notes?: string
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    const timestamp = new Date().toISOString();

    try {
      await updateDoc(doc(firestoreDb, 'suborders', subOrderId), {
        vendorFulfillmentStatus: status,
        vendorNotes: notes || '',
        updatedAt: timestamp
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `suborders/${subOrderId}`);
      throw err;
    }
  },

  // Admin Delivery Scheduling
  async updateDeliverySchedule(
    arg1: string,
    arg2: any,
    arg3?: any,
    arg4?: any,
    arg5?: any,
    arg6?: string
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Admin authentication required.');
    }

    let orderId = '';
    let ticketId = '';
    let scheduledDate = '';
    let courier = '';
    let trackingNumber = '';
    let adminName = 'JAGA Admin';

    if (arg6 !== undefined) {
      orderId = arg1;
      ticketId = arg2;
      scheduledDate = arg3;
      courier = arg4;
      trackingNumber = arg5;
      adminName = arg6;
    } else {
      ticketId = arg1;
      scheduledDate = arg2;
      courier = arg3;
      trackingNumber = arg4;
      adminName = arg5 || 'JAGA Admin';
    }

    if (!orderId) {
      const q = query(collection(firestoreDb, 'orders'), where('ticketId', '==', ticketId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        orderId = snap.docs[0].id;
      } else {
        throw new Error(`Order ${ticketId} not found.`);
      }
    }

    const timestamp = new Date().toISOString();
    const orderRef = doc(firestoreDb, 'orders', orderId);

    try {
      const snap = await getDoc(orderRef);
      if (!snap.exists()) throw new Error('Order not found');
      const order = snap.data() as Order;

      const updatedTimeline = [
        ...(order.timeline || []),
        {
          timestamp,
          title: 'Delivery Scheduled & In Transit',
          description: `Estimated arrival: ${scheduledDate} via ${courier}. Tracking: ${trackingNumber || 'Available locally'}`,
          actor: 'admin' as const
        }
      ];

      await updateDoc(orderRef, {
        scheduledDeliveryDate: scheduledDate,
        deliveryCourier: courier,
        trackingNumber,
        orderStatus: 'in_transit',
        updatedAt: timestamp,
        timeline: updatedTimeline
      });

      await this.addAuditLog({
        adminName,
        action: 'DELIVERY_SCHEDULED',
        details: `Scheduled delivery for ${ticketId} with ${courier} on ${scheduledDate}`,
        targetRef: ticketId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      throw err;
    }
  },

  // Order Cancellation & Stock Restoration
  async cancelOrder(
    arg1: string,
    arg2: string,
    arg3?: string,
    arg4?: any,
    arg5?: string
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    let orderId = '';
    let ticketId = '';
    let reason = '';
    let actorRole: 'customer' | 'vendor' | 'admin' = 'customer';
    let actorUserId = '';

    if (arg5 !== undefined) {
      orderId = arg1;
      ticketId = arg2;
      reason = arg3 || '';
      actorRole = arg4;
      actorUserId = arg5;
    } else {
      ticketId = arg1;
      reason = arg2;
      actorRole = (arg3 as any) || 'customer';
      actorUserId = arg4 || auth.currentUser.uid;
    }

    if (!orderId) {
      const q = query(collection(firestoreDb, 'orders'), where('ticketId', '==', ticketId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        orderId = snap.docs[0].id;
      } else {
        throw new Error(`Order ${ticketId} not found.`);
      }
    }

    const timestamp = new Date().toISOString();
    const orderRef = doc(firestoreDb, 'orders', orderId);

    try {
      const snap = await getDoc(orderRef);
      if (!snap.exists()) throw new Error('Order not found');
      const order = snap.data() as Order;

      if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
        throw new Error(`Order cannot be cancelled in status: ${order.orderStatus}`);
      }

      // Restore inventory in Firestore
      const batch = writeBatch(firestoreDb);
      for (const item of order.items) {
        const prod = memoryProducts.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
          if (prod.status === 'out_of_stock' && prod.stock > 0) {
            prod.status = 'published';
          }
          batch.update(doc(firestoreDb, 'products', prod.id), {
            stock: prod.stock,
            status: prod.status
          });
        }
      }
      await batch.commit();

      const nextPaymentStatus = order.paymentStatus === 'confirmed' ? 'refund_pending' : order.paymentStatus;
      const updatedTimeline = [
        ...(order.timeline || []),
        {
          timestamp,
          title: `Order Cancelled by ${actorRole.toUpperCase()}`,
          description: `Reason: ${reason}. Inventory restored.${nextPaymentStatus === 'refund_pending' ? ' Refund is pending admin processing.' : ''}`,
          actor: actorRole
        }
      ];

      await updateDoc(orderRef, {
        orderStatus: 'cancelled',
        cancellationReason: reason,
        cancelledBy: actorRole,
        paymentStatus: nextPaymentStatus,
        updatedAt: timestamp,
        timeline: updatedTimeline
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      throw err;
    }
  },

  // 4. SOURCING REQUESTS (Live Cloud Firestore)
  generateSourcingTicketId(): string {
    const currentYear = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JAG-REQ-${currentYear}-${randomHex}`;
  },

  subscribeSourcingRequests(
    userId: string | null,
    role: UserRole | null,
    callback: (reqs: ProductSourcingRequest[]) => void
  ): Unsubscribe {
    if (!userId || !auth.currentUser) {
      callback([]);
      return () => {};
    }

    let q;
    if (role === 'admin') {
      q = collection(firestoreDb, 'sourcing_requests');
    } else {
      q = query(collection(firestoreDb, 'sourcing_requests'), where('customerId', '==', userId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const reqs: ProductSourcingRequest[] = [];
        snapshot.forEach((d) => reqs.push(d.data() as ProductSourcingRequest));
        callback(reqs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'sourcing_requests');
        callback([]);
      }
    );
  },

  async createSourcingRequest(
    requestData: any,
    customerArg?: User
  ): Promise<ProductSourcingRequest> {
    if (!auth.currentUser) {
      throw new Error('Authentication required to submit sourcing requests.');
    }

    const ticketId = this.generateSourcingTicketId();
    const reqId = `req-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const customerId = customerArg?.id || requestData.customerId || auth.currentUser.uid;
    const customerName = customerArg?.fullName || requestData.customerName || auth.currentUser.displayName || 'Customer';
    const customerPhone = customerArg?.phone || requestData.customerPhone || '';
    const customerEmail = customerArg?.email || requestData.customerEmail || auth.currentUser.email || '';

    const newReq: ProductSourcingRequest = {
      ...requestData,
      id: reqId,
      requestId: ticketId,
      ticketId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      status: 'submitted',
      createdAt: timestamp
    };

    try {
      await setDoc(doc(firestoreDb, 'sourcing_requests', reqId), newReq);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `sourcing_requests/${reqId}`);
      throw err;
    }

    return newReq;
  },

  async submitQuotation(
    requestId: string,
    quotedPrice: number,
    estimatedDays: number,
    adminNotes: string,
    adminName = 'JAGA Admin'
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Admin authentication required.');
    }

    const timestamp = new Date().toISOString();

    try {
      await updateDoc(doc(firestoreDb, 'sourcing_requests', requestId), {
        quotedPrice,
        estimatedDeliveryDays: estimatedDays,
        adminNotes,
        status: 'quoted',
        updatedAt: timestamp
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sourcing_requests/${requestId}`);
      throw err;
    }
  },

  async addQuotationToRequest(
    requestId: string,
    quote: {
      quotedPriceNgn: number;
      estimatedDeliveryDays: number;
      sourcingNotes: string;
    },
    adminName = 'JAGA Admin'
  ): Promise<void> {
    return this.submitQuotation(
      requestId,
      quote.quotedPriceNgn,
      quote.estimatedDeliveryDays,
      quote.sourcingNotes,
      adminName
    );
  },

  createNotification(notif: any): void {
    // Notifications helper
  },

  markNotificationAsRead(notifId: string): void {
    // Mark notification read helper
  },

  async respondToQuotation(
    requestId: string,
    decision: 'accepted' | 'declined',
    customerId: string
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Authentication required.');
    }

    const timestamp = new Date().toISOString();

    try {
      await updateDoc(doc(firestoreDb, 'sourcing_requests', requestId), {
        customerDecision: decision,
        status: decision === 'accepted' ? 'accepted' : 'closed',
        updatedAt: timestamp
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sourcing_requests/${requestId}`);
      throw err;
    }
  },

  // 5. SETTINGS & DELIVERY ZONES
  getBankSettings(): BankSettings {
    return memoryBankSettings;
  },

  subscribeBankSettings(callback: (settings: BankSettings) => void): Unsubscribe {
    const bankDoc = doc(firestoreDb, 'settings', 'bank');
    return onSnapshot(
      bankDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          memoryBankSettings = snapshot.data() as BankSettings;
          callback(memoryBankSettings);
        } else {
          callback(INITIAL_BANK_SETTINGS);
        }
      },
      () => {
        callback(INITIAL_BANK_SETTINGS);
      }
    );
  },

  async updateBankSettings(newSettings: BankSettings, adminName = 'JAGA Admin'): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Admin authentication required.');
    }

    try {
      await setDoc(doc(firestoreDb, 'settings', 'bank'), newSettings);
      memoryBankSettings = newSettings;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/bank');
      throw err;
    }
  },

  getDeliveryZones(): DeliveryZone[] {
    return memoryDeliveryZones;
  },

  // 6. AUDIT LOGS
  async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logId = `log-${Date.now()}`;
      await setDoc(doc(firestoreDb, 'audit_logs', logId), {
        ...entry,
        id: logId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Audit log write notice:', e);
    }
  },

  // 7. CATALOG INITIALIZATION (Seeds verified Nigerian products & vendors into Firestore)
  async seedInitialCatalogToFirestore(): Promise<{ count: number; message: string }> {
    if (!auth.currentUser) {
      throw new Error('Admin authentication required: Please sign in as Administrator to initialize catalog.');
    }

    try {
      const batch = writeBatch(firestoreDb);

      // Seed Nigerian Vendors
      for (const vendor of INITIAL_VENDORS) {
        const vRef = doc(firestoreDb, 'vendors', vendor.id);
        batch.set(vRef, {
          id: vendor.id,
          userId: vendor.userId,
          businessName: vendor.businessName,
          ownerName: vendor.ownerName,
          email: vendor.email,
          phone: vendor.phone,
          businessAddress: vendor.businessAddress,
          state: vendor.state,
          lga: vendor.lga,
          category: vendor.category,
          kycStatus: vendor.kycStatus,
          rating: vendor.rating,
          totalSales: vendor.totalSales,
          joinedDate: vendor.joinedDate
        });
      }

      // Seed Nigerian Products
      for (const prod of INITIAL_PRODUCTS) {
        const pRef = doc(firestoreDb, 'products', prod.id);
        batch.set(pRef, prod);
      }

      // Seed Bank Settings
      const bankRef = doc(firestoreDb, 'settings', 'bank');
      batch.set(bankRef, INITIAL_BANK_SETTINGS);

      await batch.commit();

      // Refresh in-memory list
      memoryProducts = [...INITIAL_PRODUCTS];
      memoryVendors = [...INITIAL_VENDORS];
      memoryBankSettings = INITIAL_BANK_SETTINGS;

      return {
        count: INITIAL_PRODUCTS.length,
        message: `Successfully seeded ${INITIAL_PRODUCTS.length} authentic Nigerian products and verified vendors into Cloud Firestore!`
      };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'seedInitialCatalogToFirestore');
      throw err;
    }
  }
};
