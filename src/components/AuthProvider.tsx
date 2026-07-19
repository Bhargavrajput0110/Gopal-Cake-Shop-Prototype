'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  appRole: string | null
  branchId: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, appRole: null, branchId: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appRole, setAppRole] = useState<string | null>(null)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setAppRole(session.user.user_metadata?.role || null)
        setBranchId(session.user.user_metadata?.branchId || null)
      }
      setLoading(false)
    }

    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setAppRole(session.user.user_metadata?.role || null)
        setBranchId(session.user.user_metadata?.branchId || null)
      } else {
        setUser(null)
        setAppRole(null)
        setBranchId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, appRole, branchId, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
