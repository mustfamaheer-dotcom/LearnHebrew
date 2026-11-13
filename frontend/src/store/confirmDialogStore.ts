import { create } from 'zustand';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogOptions {
  title?: string;
  titleHe?: string;
  message: string;
  messageHe?: string;
  confirmText?: string;
  confirmTextHe?: string;
  cancelText?: string;
  cancelTextHe?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((confirmed: boolean) => void) | null;
  open: (options: ConfirmDialogOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  open: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        options,
        resolve,
      });
    });
  },
  handleConfirm: () => {
    const { resolve } = get();
    if (resolve) resolve(true);
    set({ isOpen: false, options: null, resolve: null });
  },
  handleCancel: () => {
    const { resolve } = get();
    if (resolve) resolve(false);
    set({ isOpen: false, options: null, resolve: null });
  },
}));

/**
 * Universal confirm modal helper usable in any component or event handler
 */
export const confirmDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
  return useConfirmDialogStore.getState().open(options);
};
