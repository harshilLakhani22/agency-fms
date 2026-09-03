'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SandboxState {
  isSandbox: boolean;
  setSandbox: (isSandbox: boolean) => void;
  toggleSandbox: () => void;
}

export const useSandboxStore = create<SandboxState>()(
  persist(
    (set) => ({
      isSandbox: process.env.NEXT_PUBLIC_SANDBOX_MODE === 'true',
      setSandbox: (isSandbox: boolean) => set({ isSandbox }),
      toggleSandbox: () => set((state) => ({ isSandbox: !state.isSandbox })),
    }),
    {
      name: 'fintracker_sandbox_mode',
    }
  )
);
