// src/components/Header.tsx
import React from "react";

export function Header() {
  return (
    <header className="bg-brand-primary text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">ChatCast Studio 🎙️</h1>
      <nav className="space-x-4">
        <a href="#" className="hover:underline">Home</a>
        <a href="#" className="hover:underline">Voices</a>
        <a href="#" className="hover:underline">Help</a>
      </nav>
    </header>
  );
}
