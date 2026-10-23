import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './CityWidget'
import './redesign.css'
import './expansion.css'

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
