export interface ReportBackground {
  svg: string;
  width: number;
  height: number;
}

export interface ReportVariable {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export class ReportGenerator {
  private background: ReportBackground | null = null;
  private variables: ReportVariable[] = [];

  setBackground(background: ReportBackground) {
    this.background = background;
  }

  addVariable(variable: ReportVariable) {
    this.variables.push(variable);
  }

  generateReport(): string {
    if (!this.background) {
      throw new Error('Background não foi definido');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.background.svg, 'image/svg+xml');
    const svgElement = doc.documentElement;

    // Garantir que o SVG tenha viewBox e dimensões corretas
    svgElement.setAttribute('width', this.background.width.toString());
    svgElement.setAttribute('height', this.background.height.toString());
    svgElement.setAttribute('viewBox', `0 0 ${this.background.width} ${this.background.height}`);

    // Adicionar as variáveis como elementos de texto
    this.variables.forEach(variable => {
      const textElement = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('x', variable.x.toString());
      textElement.setAttribute('y', variable.y.toString());
      textElement.setAttribute('font-size', (variable.fontSize || 24).toString());
      textElement.setAttribute('font-family', variable.fontFamily || 'Arial');
      textElement.setAttribute('fill', variable.color || '#000000');
      textElement.textContent = variable.text;
      
      svgElement.appendChild(textElement);
    });

    // Retornar o SVG modificado como string
    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + 
           serializer.serializeToString(svgElement);
  }
}