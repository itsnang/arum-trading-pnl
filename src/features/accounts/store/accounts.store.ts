import { create } from 'zustand'

interface SelectedAccountState {
  selectedAccountId: string | null
  setSelectedAccountId: (id: string) => void
}

export const useSelectedAccountStore = create<SelectedAccountState>()((set) => ({
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}))
