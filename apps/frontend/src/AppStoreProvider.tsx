import { useState, type PropsWithChildren } from 'react'
import { AppStore, AppStoreContext } from './app-store'

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new AppStore())

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
}
