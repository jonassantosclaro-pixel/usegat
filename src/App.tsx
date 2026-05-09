/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetails from './pages/ProductDetails';
import Customizer from './pages/Customizer';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import { AuthProvider } from './lib/AuthContext';
import { CartProvider } from './lib/CartContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entrar" element={<Auth />} />
              <Route path="/produto/:id" element={<ProductDetails />} />
              <Route path="/customizar/:id" element={<Customizer />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/categoria/:id" element={<Category />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
