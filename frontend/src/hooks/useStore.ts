import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export {
  FRAME_PRESETS,
  parseFrameStudioTokens,
  buildFrameCssClass,
  type FramePresetMeta,
  type FrameStudioTokens,
  type FrameRingStyle,
  type FrameThickness,
  type FrameGlowLevel,
  type FrameShape,
  type FrameOrnament,
} from '../components/common/AvatarWithFrame';
export {
  NICKNAME_PRESETS,
  parseNicknameStudioTokens,
  buildNicknameCssClass,
  type NicknamePresetMeta,
  type NicknameStudioTokens,
  type NicknameFillMode,
  type NicknameTextFx,
} from '../components/common/StyledNickname';

/* ==========================================================================
   Types
   ========================================================================== */

export type StoreItemType = 'AVATAR_FRAME' | 'NICKNAME';
export type StoreItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type CoinTransactionType =
  | 'EARNED_FROM_POINTS'
  | 'REDEEMED_ITEM'
  | 'ADMIN_GRANT'
  | 'ADMIN_DEDUCT';

export interface StoreItem {
  id: string;
  type: StoreItemType;
  rarity: StoreItemRarity;
  isActive: boolean;
  sortOrder: number;
  coinCost: number;

  nameEn: string;
  nameHe: string;
  nameAr: string;
  descEn?: string | null;
  descHe?: string | null;
  descAr?: string | null;

  // Avatar frame properties
  frameImageUrl?: string | null;
  frameAnimated: boolean;
  frameCssClass?: string | null;
  frameBorderColor?: string | null;
  frameBorderRadius?: string | null;

  // Nickname properties
  nicknameColor?: string | null;
  nicknameGlow: boolean;
  nicknameGlowColor?: string | null;
  nicknameFont?: string | null;
  nicknameBadgeIcon?: string | null;
  nicknameCssClass?: string | null;

  createdAt: string;
  updatedAt: string;
  createdById?: string | null;
}

export interface StudentStoreItem {
  id: string;
  studentId: string;
  storeItemId: string;
  redeemedAt: string;
  isEquipped: boolean;
  storeItem: StoreItem;
}

export interface CoinTransaction {
  id: string;
  studentId: string;
  amount: number;
  coinsAfter: number;
  type: CoinTransactionType;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
  storeItem?: StoreItem | null;
  student?: {
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
      avatarUrl?: string | null;
    };
  };
}

export interface MyCoinsResponse {
  coins: number;
  transactions: CoinTransaction[];
  totalEarned?: number;
  totalSpent?: number;
}

export interface StoreItemsFilter {
  type?: StoreItemType;
  rarity?: StoreItemRarity;
  maxCost?: number;
  activeOnly?: boolean;
}

export interface TransactionsFilter {
  page?: number;
  limit?: number;
  studentId?: string;
  type?: CoinTransactionType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedTransactionsResponse {
  transactions: CoinTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStoreItemPayload {
  type: StoreItemType;
  rarity: StoreItemRarity;
  isActive?: boolean;
  sortOrder?: number;
  coinCost: number;
  nameEn: string;
  nameHe: string;
  nameAr: string;
  descEn?: string | null;
  descHe?: string | null;
  descAr?: string | null;
  frameImageUrl?: string | null;
  frameAnimated?: boolean;
  frameCssClass?: string | null;
  frameBorderColor?: string | null;
  frameBorderRadius?: string | null;
  nicknameColor?: string | null;
  nicknameGlow?: boolean;
  nicknameGlowColor?: string | null;
  nicknameFont?: string | null;
  nicknameBadgeIcon?: string | null;
  nicknameCssClass?: string | null;
}

export type UpdateStoreItemPayload = Partial<CreateStoreItemPayload>;

export interface RedeemItemPayload {
  storeItemId: string;
}

export interface EquipItemPayload {
  storeItemId: string;
  equip: boolean;
}

export interface GrantCoinsPayload {
  studentId: string;
  amount: number;
  reason: string;
}

/* ==========================================================================
   Query Keys
   ========================================================================== */

export const STORE_QUERY_KEYS = {
  items: (filters?: StoreItemsFilter) => ['store-items', filters ?? {}] as const,
  item: (id: string) => ['store-item', id] as const,
  myCoins: ['my-coins'] as const,
  myInventory: ['my-inventory'] as const,
  transactions: (filters?: TransactionsFilter) => ['store-transactions', filters ?? {}] as const,
  studentTransactions: (studentId: string) => ['store-transactions', 'student', studentId] as const,
};

/* ==========================================================================
   API Client Functions
   ========================================================================== */

export const storeApi = {
  getItems: async (filters?: StoreItemsFilter): Promise<StoreItem[]> => {
    const res = await api.get('/store/items', { params: filters });
    return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  },

  getItemById: async (id: string): Promise<StoreItem> => {
    const res = await api.get(`/store/items/${id}`);
    return res.data;
  },

  getMyCoins: async (): Promise<MyCoinsResponse> => {
    const res = await api.get('/store/my-coins');
    return res.data;
  },

  getMyInventory: async (): Promise<StudentStoreItem[]> => {
    const res = await api.get('/store/my-inventory');
    return Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.inventory ?? [];
  },

  redeemItem: async (payload: RedeemItemPayload): Promise<{ success: boolean; coinsAfter: number; item: StoreItem }> => {
    const res = await api.post('/store/redeem', payload);
    return res.data;
  },

  equipItem: async (payload: EquipItemPayload): Promise<{ success: boolean }> => {
    const res = await api.post('/store/equip', payload);
    return res.data;
  },

  createItem: async (payload: CreateStoreItemPayload): Promise<StoreItem> => {
    const res = await api.post('/store/items', payload);
    return res.data;
  },

  updateItem: async (id: string, payload: UpdateStoreItemPayload): Promise<StoreItem> => {
    const res = await api.put(`/store/items/${id}`, payload);
    return res.data;
  },

  deleteItem: async (id: string): Promise<{ success?: boolean; item?: StoreItem }> => {
    const res = await api.delete(`/store/items/${id}`);
    return res.data;
  },

  grantCoins: async (payload: GrantCoinsPayload): Promise<{ success: boolean; coinsAfter: number; transaction?: CoinTransaction }> => {
    const res = await api.post('/store/grant-coins', payload);
    return res.data;
  },

  getTransactions: async (filters?: TransactionsFilter): Promise<PaginatedTransactionsResponse> => {
    const res = await api.get('/store/transactions', { params: filters });
    const data = res.data;
    if (Array.isArray(data)) {
      return {
        transactions: data,
        total: data.length,
        page: filters?.page ?? 1,
        limit: filters?.limit ?? data.length,
        totalPages: 1,
      };
    }
    return {
      transactions: data?.transactions ?? data?.items ?? data?.data ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? filters?.page ?? 1,
      limit: data?.limit ?? filters?.limit ?? 20,
      totalPages: data?.totalPages ?? 1,
    };
  },

  getStudentTransactions: async (studentId: string): Promise<CoinTransaction[]> => {
    const res = await api.get(`/store/transactions/${studentId}`);
    return Array.isArray(res.data) ? res.data : res.data?.transactions ?? [];
  },
};

/* ==========================================================================
   TanStack Query Hooks
   ========================================================================== */

export const useStoreItems = (filters?: StoreItemsFilter, enabled = true) => {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.items(filters),
    queryFn: () => storeApi.getItems(filters),
    enabled,
  });
};

export const useStoreItem = (id?: string) => {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.item(id ?? ''),
    queryFn: () => storeApi.getItemById(id!),
    enabled: Boolean(id),
  });
};

export const useMyCoins = (enabled = true) => {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.myCoins,
    queryFn: storeApi.getMyCoins,
    enabled,
  });
};

export const useMyInventory = (enabled = true) => {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.myInventory,
    queryFn: storeApi.getMyInventory,
    enabled,
  });
};

export const useRedeemItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storeApi.redeemItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.myCoins });
      queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.myInventory });
      queryClient.invalidateQueries({ queryKey: ['store-items'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useEquipItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storeApi.equipItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.myInventory });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useCreateStoreItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storeApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] });
    },
  });
};

export const useUpdateStoreItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreItemPayload }) =>
      storeApi.updateItem(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] });
      queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.item(variables.id) });
    },
  });
};

export const useDeleteStoreItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storeApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] });
    },
  });
};

export const useGrantCoins = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storeApi.grantCoins,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-transactions'] });
      queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.myCoins });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });
};

export const useStoreTransactions = (filters?: TransactionsFilter, enabled = true) => {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.transactions(filters),
    queryFn: () => storeApi.getTransactions(filters),
    enabled,
  });
};

export const useStudentTransactions = (studentId?: string) => {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.studentTransactions(studentId ?? ''),
    queryFn: () => storeApi.getStudentTransactions(studentId!),
    enabled: Boolean(studentId),
  });
};
