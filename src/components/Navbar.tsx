import React from 'react';
import { FileText, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">Sistema de Relatórios</div>
        <div className="flex gap-4">
          <Link to="/" className="flex items-center gap-2 hover:text-gray-300">
            <Home size={20} />
            <span>Home</span>
          </Link>
          <Link to="/relatorio" className="flex items-center gap-2 hover:text-gray-300">
            <FileText size={20} />
            <span>Relatório</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}