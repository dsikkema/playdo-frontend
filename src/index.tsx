import { createRoot } from 'react-dom/client'
import 'tailwindcss/tailwind.css'
import App from 'components/App'
import { AuthProvider } from './context/AuthContext'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
