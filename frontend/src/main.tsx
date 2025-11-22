import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import ProductDetail from './ProductDetail.tsx'
import Login from './Login.tsx'
import AdminPanel from './AdminPanel.tsx'
import Register from './Register.tsx'
import Cart from './Cart.tsx'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
