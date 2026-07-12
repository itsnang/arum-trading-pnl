import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SelectedAccountState {
  selectedAccountId: string | null
  setSelectedAccountId: (id: string) => void
}

export const useSelectedAccountStore = create<SelectedAccountState>()(
  persist(
    (set) => ({
      selectedAccountId: null,
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),
    }),
    {
      name: 'pipfolio-selected-account',
      skipHydration: true,
    },
  ),
)
