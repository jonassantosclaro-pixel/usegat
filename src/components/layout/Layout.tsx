import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from '../cart/CartSidebar';
import ChatAI from '../ChatAI';
import { NewsletterPopup } from '../ui/NewsletterPopup';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Header />
      <CartSidebar />
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <Footer />
      <NewsletterPopup />
      
      <ChatAI />
    </div>
  );
}
