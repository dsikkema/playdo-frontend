import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode
} from 'react'

type AuthContextType = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_STORAGE_KEY = 'playdo_auth_token'

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [token, setToken] = useState<string | null>(null)

  // On mount, check for existing token in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const login = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
