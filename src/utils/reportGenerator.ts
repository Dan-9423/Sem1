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
  width?: number;
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

    svgElement.setAttribute('width', this.background.width.toString());
    svgElement.setAttribute('height', this.background.height.toString());
    svgElement.setAttribute('viewBox', `0 0 ${this.background.width} ${this.background.height}`);

    this.variables.forEach(variable => {
      const textElement = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('x', variable.x.toString());
      textElement.setAttribute('y', variable.y.toString());
      textElement.setAttribute('font-size', (variable.fontSize || 24).toString());
      textElement.setAttribute('font-family', variable.fontFamily || 'Arial');
      textElement.setAttribute('fill', variable.color || '#000000');
      
      if (variable.width) {
        // Adiciona um elemento tspan com largura definida
        const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.textContent = variable.text;
        tspan.setAttribute('x', variable.x.toString());
        textElement.appendChild(tspan);
        
        // Quebra o texto em múltiplas linhas se necessário
        const words = variable.text.split(' ');
        let line = '';
        const lineHeight = variable.fontSize || 24;
        
        words.forEach((word, index) => {
          const testLine = line + word + ' ';
          const testWidth = testLine.length * ((variable.fontSize || 24) * 0.6); // Aproximação da largura do texto
          
          if (testWidth > variable.width! && index > 0) {
            const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', variable.x.toString());
            tspan.setAttribute('dy', lineHeight.toString());
            textElement.appendChild(tspan);
            line = word + ' ';
          } else {
            line = testLine;
          }
        });
        
        if (line.length > 0) {
          const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.textContent = line;
          tspan.setAttribute('x', variable.x.toString());
          if (textElement.childNodes.length > 0) {
            tspan.setAttribute('dy', lineHeight.toString());
          }
          textElement.appendChild(tspan);
        }
      } else {
        textElement.textContent = variable.text;
      }
      
      svgElement.appendChild(textElement);
    });

    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + 
           serializer.serializeToString(svgElement);
  }
}