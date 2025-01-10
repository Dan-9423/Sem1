import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Bem-vindo ao Sistema de Relatórios</h1>
        <p className="text-gray-600 mb-8">
          Gere relatórios personalizados com facilidade e eficiência.
        </p>
        <Link
          to="/relatorio"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText size={20} />
          <span>Criar Relatório</span>
        </Link>
      </div>
    </div>
  );
}