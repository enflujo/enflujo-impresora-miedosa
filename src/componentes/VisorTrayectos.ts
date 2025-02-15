export default class VisorTrayectos {
  lienzo: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  largoEje: number;
  zActual: number = 0;

  constructor(lienzo: HTMLCanvasElement, largoEje = 400) {
    this.lienzo = lienzo;
    this.ctx = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
    this.largoEje = largoEje;
    this.escalar();
  }

  escalar(largoEje: number = this.largoEje) {
    this.largoEje = largoEje;
    this.lienzo.width = this.lienzo.height = largoEje;
    Object.assign(this.lienzo.style, {
      width: `${largoEje}px`,
      height: `${largoEje}px`,
    });

    this.ctx.lineWidth = 1;
    this.limpiar();
    this.ctx.strokeStyle = '#3283c9';
  }

  extraerValoresLinea(linea: string) {
    const partes = linea.match(/G0?([012])X([0-9.-]+)Y([0-9.-]+)/);

    if (partes) {
      return {
        tipo: partes[1],
        x: parseFloat(partes[2]),
        y: parseFloat(partes[3]),
      };
    }

    return null;
  }

  limpiar() {
    this.ctx.fillStyle = '#f7f7ed'; // Fondo color crema
    this.ctx.fillRect(0, 0, this.largoEje, this.largoEje);
  }

  extraerValoresArco(linea: string) {
    const tipo = linea.match(/G0?([23])/);
    const movX = linea.match(/X([0-9.-]+)/);
    const movY = linea.match(/Y([0-9.-]+)/);
    const centroX = linea.match(/I([0-9.-]+)/);
    const centroY = linea.match(/J([0-9.-]+)/);

    // const partes = linea.match(/G0?([23])X([0-9.-]+)Y([0-9.-]+)I([0-9.-]+)J([0-9.-]+)J([0-9.-]+)/);

    // if (partes) {
    //   return {
    //     tipo: partes[1],
    //     x: parseFloat(partes[2]),
    //     y: parseFloat(partes[3]),
    //     i: parseFloat(partes[4]),
    //     j: parseFloat(partes[5]),
    //   };

    if (movX && movY && centroX && centroY) {
      const res = {
        x: 0,
        y: 0,
        i: 0,
        j: 0,
        tipo: tipo ? tipo[1] : '2',
      };

      if (movX) res.x = parseFloat(movX[1]);
      if (movY) res.y = parseFloat(movY[1]);
      if (centroX) res.i = parseFloat(centroX[1]);
      if (centroY) res.j = parseFloat(centroY[1]);

      return res;
    }

    return null;
  }

  previsualizarCodigo(codigo: string, ejeEnCm: number) {
    if (this.largoEje !== ejeEnCm * 10) {
      this.escalar(ejeEnCm * 10);
    }

    const ctx = this.ctx;
    // ctx.fillRect(0, 0, this.largoEje, this.largoEje);

    const lineas = codigo.split('\n');
    const escala = 10;
    let puntoAnterior = { x: 0, y: 0, z: -2 };

    lineas.forEach((linea) => {
      linea = linea.replaceAll(' ', '');
      const tipoComando = linea.match(/G0?([0123])/);

      if (tipoComando) {
        if (tipoComando[1] === '0') {
          ctx.strokeStyle = '#3283c9';
        } else {
          ctx.strokeStyle = '#ed2158';
        }

        if (tipoComando[1] === '0' || tipoComando[1] === '1') {
          const punto = this.extraerValoresLinea(linea);

          if (punto) {
            ctx.beginPath();
            ctx.moveTo(puntoAnterior.x, this.largoEje - puntoAnterior.y);
            ctx.lineTo(punto.x * escala, this.largoEje - punto.y * escala);
            ctx.stroke();
            puntoAnterior.x = punto.x * escala;
            puntoAnterior.y = punto.y * escala;
          } else {
            // console.log('sin punto', linea);
          }
        } else {
          // TODO: Implementar arcos
          const punto = this.extraerValoresArco(linea);
          if (punto) {
            ctx.beginPath();
            ctx.moveTo(puntoAnterior.x, this.largoEje - puntoAnterior.y);
            ctx.lineTo(punto.x * escala, this.largoEje - punto.y * escala);
            ctx.stroke();
            // const centroX = puntoAnterior.x / escala + punto.i;
            // const centroY = puntoAnterior.y / escala + punto.j;
            // const radio = Math.sqrt(punto.i * punto.i + punto.j * punto.j) * escala;

            // const anguloInicio = Math.atan2(puntoAnterior.y / escala - centroY, puntoAnterior.x / escala - centroX);
            // const anguloFinal = Math.atan2(punto.y - centroY, punto.x - centroX);

            // const sentidoHorario = punto.tipo === '2'; // G2: horario, G3: antihorario

            // ctx.beginPath();
            // ctx.arc(
            //   centroX * escala,
            //   this.largoEje - centroY * escala,
            //   radio,
            //   anguloInicio,
            //   anguloFinal,
            //   sentidoHorario
            // );
            // ctx.stroke();

            puntoAnterior.x = punto.x * escala;
            puntoAnterior.y = punto.y * escala;
          }
        }
      }
    });
  }
}
