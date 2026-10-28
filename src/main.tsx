if (import.meta.env.PROD) {
  const s = document.createElement('script')
  s.src = 'https://t.contentsquare.net/uxa/487ea3fabae50.js'
  document.head.appendChild(s)
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
