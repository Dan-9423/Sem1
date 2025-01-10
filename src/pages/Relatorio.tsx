import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, GripHorizontal } from 'lucide-react';
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
  const [variaveisPosicionadas, setVariaveisPosicionadas] = useState<VariavelPosicionada[]>([]);
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgBackground && previewContainerRef.current) {
      const container = previewContainerRef.current;
      const containerWidth = container.clientWidth;
      const newScale = containerWidth / svgBackground.width;
      setScale(Math.min(newScale, 0.2));
    }
  }, [svgBackground]);

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
    
    // Criar um blob com o SVG
    const blob = new Blob([relatorioFinal], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link temporário e simular o clique para download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar a URL do objeto
    URL.revokeObjectURL(url);
  };

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
          <h2 className="text-2xl font-bold mb-6">Preview do Template</h2>
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
              <div 
                ref={previewRef}
                className="relative"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: svgBackground.svg }}
                  className="absolute inset-0"
                />
                {variaveisPosicionadas.map((variavel) => (
                  <div
                    key={variavel.id}
                    className="absolute cursor-move"
                    style={{
                      left: `${variavel.x}px`,
                      top: `${variavel.y}px`,
                      fontSize: `${variavel.fontSize}px`,
                      color: variavel.color,
                    }}
                  >
                    {variavel.text || `[${variavel.label}]`}
                  </div>
                ))}
              </div>
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
    </div>
  );
}