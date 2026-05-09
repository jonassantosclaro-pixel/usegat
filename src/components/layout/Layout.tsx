import React from 'react';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from '../cart/CartSidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />
      <CartSidebar />
      <main className="flex-grow relative">
        {/* Architectural lines for structure */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute left-[5%] top-0 bottom-0 w-px bg-brand-gray/30"></div>
          <div className="absolute right-[5%] top-0 bottom-0 w-px bg-brand-gray/30"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.03]"></div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
