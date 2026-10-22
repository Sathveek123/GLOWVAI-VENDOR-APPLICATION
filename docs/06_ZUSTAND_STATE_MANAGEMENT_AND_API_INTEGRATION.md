# ⚡ Zustand State Management & Client API Integration

## 🧠 Overview
Client-side state management in the GlowVAI Vendor mobile app (`mobile/src/store/useVendorStore.ts`) is architected using **Zustand**.

Zustand handles global state for:
1. Vendor details & store credentials
2. Online/Duty status (`isOnline`)
3. Real-time orders collection & active offer modal
4. Inventory catalog & low-stock alerts
5. System push notifications log

---

## 🗄️ 1. Zustand Global Store Schema (`useVendorStore`)

```typescript
interface VendorState {
  // Vendor Metadata
  vendorId: string;
  storeId: string;
  vendorProfile: VendorProfile | null;
  isOnline: boolean;
  
  // Realtime Orders State
  orders: Order[];
  incomingOffer: OrderOffer | null;
  activeOrder: Order | null;
  
  // Inventory Catalog State
  inventory: InventoryItem[];
  searchQuery: string;
  selectedCategory: string;
  
  // Notification Log
  notifications: AppNotification[];
  
  // State Mutators
  setVendorId: (id: string) => void;
  setOnlineStatus: (status: boolean) => Promise<void>;
  fetchOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  fetchInventory: () => Promise<void>;
  updateStock: (productId: string, newStock: number) => Promise<void>;
  setIncomingOffer: (offer: OrderOffer | null) => void;
  dismissOffer: (orderId: string) => void;
}
```

---

## 🔌 2. REST API Integration Layer (`mobile/src/services/api.ts`)

The mobile client communicates with the backend via a centralized Axios HTTP instance:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_VENDOR_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Core API Methods:
- `api.get('/api/vendors/:id')`: Loads store profile and bank details.
- `api.patch('/api/vendors/:id/status', { isOnline })`: Updates store duty status.
- `api.get('/api/orders?storeId=...')`: Syncs orders list.
- `api.patch('/api/orders/:id/status', { status })`: Advances order through picking lifecycle.
- `api.patch('/api/inventory/:productId', { stockOnHand })`: Updates stock level.

---

## 📡 3. Socket.IO Listener Hook Integration (`mobile/src/services/socket.ts`)

On app launch, `socket.ts` connects to the Node.js backend and registers global listeners that push changes straight into the Zustand store:

```typescript
import { io } from 'socket.io-client';
import { useVendorStore } from '../store/useVendorStore';

const socket = io(process.env.EXPO_PUBLIC_VENDOR_API_URL || 'http://localhost:4000', {
  transports: ['websocket'],
});

export const initSocketListeners = () => {
  const store = useVendorStore.getState();

  // Register vendor room
  socket.emit('vendor:register', {
    vendorId: store.vendorId,
    storeId: store.storeId,
  });

  // Handle incoming order offers
  socket.on('ORDER_OFFER', (data) => {
    store.setIncomingOffer(data.order);
  });

  // Handle dismissal if claimed by another store
  socket.on('ORDER_CLAIMED_BY_OTHER', (data) => {
    if (store.incomingOffer?.orderId === data.orderId) {
      store.dismissOffer(data.orderId);
    }
  });

  // Real-time stock sync
  socket.on('inventory:stockUpdated', (data) => {
    store.updateLocalStock(data.productId, data.availableStock);
  });
};
```

---

## 💾 4. Local Storage Persistence

Critical operational preferences (such as `vendorId`, `storeId`, and offline draft edits) are automatically persisted using `@react-native-async-storage/async-storage`. This allows dark store operators to resume session context instantly even after an app restart or network drop.
