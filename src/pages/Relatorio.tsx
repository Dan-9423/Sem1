import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, GripHorizontal, Maximize2, X, Type, Minus, RotateCcw } from 'lucide-react';
import { ReportGenerator, ReportBackground, ReportVariable } from '../utils/reportGenerator';

interface VariaveisRelatorio {
  titulo: string;
  data: string;
  responsavel: string;
  descricao: string;
  local: string;
}

interface VariavelPosicionada extends ReportVariable {
  id: string;
  label: string;
}

export function Relatorio() {
  const [variaveis, setVariaveis] = useState<VariaveisRelatorio>({
    titulo: '',
    data: '',
    responsavel: '',
    descricao: '',
    local: ''
  });
  const [svgBackground, setSvgBackground] = useState<ReportBackground | null>(null);
  const [scale, setScale] = useState(0.2);
  const [modalScale, setModalScale] = useState(0.6);
  const [variaveisPosicionadas, setVariaveisPosicionadas] = useState<VariavelPosicionada[]>([]);
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeElement, setActiveElement] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const modalPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgBackground && previewContainerRef.current) {
      const container = previewContainerRef.current;
      const containerWidth = container.clientWidth;
      const newScale = containerWidth / svgBackground.width;
      setScale(Math.min(newScale, 0.2));
    }
  }, [svgBackground]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && activeElement) {
        e.preventDefault();
        const container = isModalOpen ? modalPreviewRef.current : previewRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const currentScale = isModalOpen ? modalScale : scale;
        
        const x = (e.clientX - rect.left - dragOffset.x) / currentScale;
        const y = (e.clientY - rect.top - dragOffset.y) / currentScale;

        setVariaveisPosicionadas(prev =>
          prev.map(v => v.id === activeElement ? { ...v, x, y } : v)
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveElement(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activeElement, isModalOpen, modalScale, scale, dragOffset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVariaveis(prev => ({ ...prev, [name]: value }));
    
    setVariaveisPosicionadas(prev => 
      prev.map(v => v.id === name ? { ...v, text: value } : v)
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgContent = event.target?.result as string;
        setSvgBackground({
          svg: svgContent,
          width: 2480,
          height: 3508
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDragStart = (e: React.DragEvent, variableId: string) => {
    setDraggingVariable(variableId);
  };

  const handleElementDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setActiveElement(id);
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingVariable || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const existingVariable = variaveisPosicionadas.find(v => v.id === draggingVariable);
    
    if (existingVariable) {
      setVariaveisPosicionadas(prev =>
        prev.map(v => v.id === draggingVariable ? { ...v, x, y } : v)
      );
    } else {
      const novaVariavel: VariavelPosicionada = {
        id: draggingVariable,
        label: draggingVariable.charAt(0).toUpperCase() + draggingVariable.slice(1),
        text: variaveis[draggingVariable as keyof VariaveisRelatorio] || '',
        x,
        y,
        fontSize: 24,
        color: '#000000'
      };
      setVariaveisPosicionadas(prev => [...prev, novaVariavel]);
    }
    
    setDraggingVariable(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFontSizeChange = (id: string, change: number) => {
    setVariaveisPosicionadas(prev =>
      prev.map(v => v.id === id ? {
        ...v,
        fontSize: Math.max(8, Math.min(72, (v.fontSize || 24) + change))
      } : v)
    );
  };

  const handleResetFontSize = (id: string) => {
    setVariaveisPosicionadas(prev =>
      prev.map(v => v.id === id ? { ...v, fontSize: 24 } : v)
    );
  };

  const handleGerarRelatorio = () => {
    if (!svgBackground) {
      alert('Por favor, faça upload de um SVG primeiro');
      return;
    }

    const generator = new ReportGenerator();
    generator.setBackground(svgBackground);
    
    variaveisPosicionadas.forEach(variavel => {
      generator.addVariable(variavel);
    });

    const relatorioFinal = generator.generateReport();
    
    const blob = new Blob([relatorioFinal], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const renderPreview = (containerRef: React.RefObject<HTMLDivElement>, currentScale: number) => (
    <div
      ref={containerRef}
      className="relative"
      style={{
        transform: `scale(${currentScale})`,
        transformOrigin: 'top left',
        width: `${100 / currentScale}%`,
        height: `${100 / currentScale}%`
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: svgBackground?.svg || '' }}
        className="absolute inset-0"
      />
      {variaveisPosicionadas.map((variavel) => (
        <div key={variavel.id} className="absolute">
          <div
            className={`cursor-move select-none group ${
              activeElement === variavel.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              fontSize: `${variavel.fontSize}px`,
              color: variavel.color,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              position: 'relative',
              left: `${variavel.x}px`,
              top: `${variavel.y}px`,
            }}
            onMouseDown={(e) => handleElementDragStart(e, variavel.id)}
          >
            {variavel.text || `[${variavel.label}]`}
            
            {/* Controles de tamanho da fonte */}
            <div
              className={`absolute -top-10 left-0 bg-white shadow-lg rounded-lg p-1 flex items-center gap-1 ${
                activeElement === variavel.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } transition-opacity`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleFontSizeChange(variavel.id, -2)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Diminuir fonte"
              >
                <Minus size={16} />
              </button>
              <div className="flex items-center gap-1 px-2 border-x">
                <Type size={16} />
                <span className="text-sm min-w-[2rem] text-center">
                  {variavel.fontSize}
                </span>
              </div>
              <button
                onClick={() => handleFontSizeChange(variavel.id, 2)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Aumentar fonte"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => handleResetFontSize(variavel.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Resetar tamanho"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Gerar Relatório</h2>
          
          <div className="space-y-4">
            {/* Upload SVG */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template SVG
              </label>
              <input
                type="file"
                accept=".svg"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {svgBackground ? (
                  <>
                    <Plus size={20} />
                    <span>Trocar template SVG</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload template SVG</span>
                  </>
                )}
              </button>
            </div>

            {/* Variáveis arrastáveis */}
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(variaveis).map((key) => (
                <div
                  key={key}
                  className="relative"
                  draggable
                  onDragStart={(e) => handleDragStart(e, key)}
                >
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <GripHorizontal size={20} />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  {key === 'descricao' ? (
                    <textarea
                      name={key}
                      value={variaveis[key as keyof VariaveisRelatorio]}
                      onChange={handleChange}
                      rows={4}
                      className="w-full p-2 border rounded-md pr-10"
                    />
                  ) : (
                    <input
                      type={key === 'data' ? 'date' : 'text'}
                      name={key}
                      value={variaveis[key as keyof VariaveisRelatorio]}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md pr-10"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleGerarRelatorio}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={!svgBackground}
            >
              <Download size={20} />
              <span>Gerar Relatório</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Preview do Template</h2>
            {svgBackground && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Maximize2 size={20} />
                <span>Expandir</span>
              </button>
            )}
          </div>
          <div 
            ref={previewContainerRef}
            className="w-full bg-gray-100 rounded-lg overflow-hidden relative"
            style={{
              height: svgBackground ? `${3508 * scale}px` : '400px'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {svgBackground ? (
              renderPreview(previewRef, scale)
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <p>Faça upload de um template SVG para visualizar</p>
              </div>
            )}
          </div>
          {svgBackground && (
            <div className="mt-2 text-sm text-gray-500 text-center">
              Escala: {Math.round(scale * 100)}% do tamanho original
            </div>
          )}
        </div>
      </div>

      {/* Modal de Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Preview Ampliado</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div 
                className="min-w-full bg-gray-100 rounded-lg overflow-auto relative"
                style={{
                  height: svgBackground ? `${3508 * modalScale}px` : '90vh',
                  width: svgBackground ? `${2480 * modalScale}px` : '100%'
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {svgBackground && renderPreview(modalPreviewRef, modalScale)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}