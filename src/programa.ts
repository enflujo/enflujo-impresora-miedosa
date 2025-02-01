import './scss/estilos.scss';

const entrada = document.getElementById('entradaImg') as HTMLInputElement;
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const previsualizador = document.getElementById('previsualizador') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
const ctxPrevisualizador = previsualizador.getContext('2d') as CanvasRenderingContext2D;
const lienzoImg = document.getElementById('lienzoImg') as HTMLCanvasElement;
const ctxImg = lienzoImg.getContext('2d') as CanvasRenderingContext2D;
const codigo = document.getElementById('codigo') as HTMLPreElement;
const maximoX = 400;
const maximoY = 400;
const velocidad = 3500;

entrada.addEventListener('change', cargarImagen);

function cargarImagen(evento: Event) {
  const archivo = (evento.target as HTMLInputElement).files?.[0];

  if (archivo) {
    const lector = new FileReader();
    lector.onload = () => {
      const imagen = new Image();
      imagen.onload = function () {
        escalarImg(imagen);
      };
      imagen.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  }
}

function escalarImg(imagen: HTMLImageElement) {
  const escalaX = maximoX / imagen.width;
  const escalaY = maximoY / imagen.height;
  const escala = Math.min(escalaX, escalaY);
  const ancho = imagen.width * escala;
  const alto = imagen.height * escala;

  lienzo.width = ancho;
  lienzo.height = alto;
  previsualizador.width = lienzoImg.width = maximoX;
  previsualizador.height = lienzoImg.height = maximoY;

  ctx.drawImage(imagen, 0, 0, ancho, alto);
  ctxImg.drawImage(imagen, 0, 0, ancho, alto);

  procesarImagen();
  generarTrayectos();
  previsualizarCodigo(codigo.textContent as string);
}

function procesarImagen() {
  const imageData = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  const data = imageData.data;

  // Convertimos la imagen a escala de grises y luego aplicamos un filtro de Sobel para detectar bordes
  const bordes = aplicarFiltroSobel(data, lienzo.width, lienzo.height);

  // Actualizamos la imagen en el lienzo con los bordes detectados
  ctx.putImageData(bordes, 0, 0);
}

function aplicarFiltroSobel(data: Uint8ClampedArray, ancho: number, alto: number): ImageData {
  const bordes = new ImageData(ancho, alto);
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      let gradX = 0;
      let gradY = 0;

      // Aplicamos el filtro de Sobel
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * ancho + (x + kx)) * 4;
          const brillo = (data[idx] + data[idx + 1] + data[idx + 2]) / 3; // Promedio de RGB para luminosidad

          gradX += brillo * sobelX[ky + 1][kx + 1];
          gradY += brillo * sobelY[ky + 1][kx + 1];
        }
      }

      // Calculamos el valor total del gradiente (magnitud)
      const magnitud = Math.sqrt(gradX * gradX + gradY * gradY);

      // Aplicamos un umbral para detectar bordes
      const umbral = 100; // Ajusta este valor según el resultado que desees
      const valorBorde = magnitud > umbral ? 255 : 0;

      const idx = (y * ancho + x) * 4;
      bordes.data[idx] = valorBorde; // Rojo
      bordes.data[idx + 1] = valorBorde; // Verde
      bordes.data[idx + 2] = valorBorde; // Azul
      bordes.data[idx + 3] = 255; // Opacidad
    }
  }

  return bordes;
}

function generarTrayectos() {
  let gcode = 'G21 ; Unidades en mm\nG90 ; Posición absoluta\nG92 X0.00 Y0.00 ; Establecer posición actual\n';
  gcode += 'G4 P150 ; Esperar de 150 ms\n';
  gcode += 'M18 ; Desbloquear motores\n';
  gcode += 'M01 ; Pausa\n';
  gcode += 'M17 ; Bloquear motores\n';
  gcode += `G1 F${velocidad} ; Establecer velocidad\n`;

  // Convertir la imagen a escala de grises y aplicar filtro de Sobel
  const imageData = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  const data = imageData.data;

  let puntoAnterior = { x: 0, y: 0 };
  const umbral = 100; // Ajusta este valor para un mejor filtrado

  for (let y = 0; y < lienzo.height; y++) {
    for (let x = 0; x < lienzo.width; x++) {
      const idx = (y * lienzo.width + x) * 4;
      const brillo = data[idx]; // Escala de grises

      // Si el píxel está por encima del umbral de gris, lo consideramos parte del contorno
      if (brillo > umbral) {
        const dx = (x * 0.1).toFixed(2);
        const dy = (y * 0.1).toFixed(2);

        // Verificamos si el punto actual es distinto al anterior para evitar duplicados
        if (puntoAnterior.x !== +dx || puntoAnterior.y !== +dy) {
          if (puntoAnterior.x !== 0 && puntoAnterior.y !== 0) {
            gcode += `G1 X${dx} Y${dy} F${velocidad}\n`;
          } else {
            gcode += `G1 X${dx} Y${dy} F${velocidad}\n`;
          }

          puntoAnterior = { x: +dx, y: +dy };
        }
      }
    }
  }

  gcode += 'G4 P150 ; Esperar de 150 ms\n';
  gcode += 'G1 X0.00 Y0.00 F3500 ; Volver al origen\n';
  gcode += 'M18 ; Desbloquear motores\n';

  codigo.textContent = gcode;
}

function previsualizarCodigo(codigo: string) {
  ctxPrevisualizador.clearRect(0, 0, previsualizador.width, previsualizador.height);

  ctxPrevisualizador.strokeStyle = '#FF5733'; // Color de las líneas
  ctxPrevisualizador.lineWidth = 0.1;

  const lineas = codigo.split('\n');
  let puntoAnterior = { x: 0, y: 0 };

  lineas.forEach((linea) => {
    const puntos = linea.match(/G1 X([0-9.-]+) Y([0-9.-]+)/);
    if (puntos) {
      const x = parseFloat(puntos[1]);
      const y = parseFloat(puntos[2]);

      if (puntoAnterior.x !== 0 || puntoAnterior.y !== 0) {
        ctxPrevisualizador.beginPath();
        ctxPrevisualizador.moveTo(puntoAnterior.x * 100, puntoAnterior.y + 100);
        ctxPrevisualizador.lineTo(x * 100, y * 100);
        ctxPrevisualizador.stroke();
      }

      puntoAnterior = { x, y };
    }
  });
}
