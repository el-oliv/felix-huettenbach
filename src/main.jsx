import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

createRoot(document.getElementById('root')).render(<App />)
