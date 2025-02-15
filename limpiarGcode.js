import * as fs from 'fs';

const UMBRAL = 0.3; // Umbral mínimo de movimiento en mm

// Expresión regular para detectar movimientos
const MOVIMIENTOS_XY = /G0[0123] X([-0-9.]+) Y([-0-9.]+)(?: Z([-0-9.]+))?(?: I([-0-9.]+) J([-0-9.]+))?/;
const MOVIMIENTO_Z = /^G0[01] Z([-0-9.]+)/;
const COMENTARIOS = /\(.*?\)/g; // Elimina comentarios dentro de paréntesis

function procesarTrayectos(trayectos) {
  const lineas = trayectos.split('\n');
  let ultimoX = null;
  let ultimoY = null;
  let hayMovimientoXY = false;
  const resultado = [];

  for (let i = 0; i < lineas.length; i++) {
    let linea = lineas[i].trim();
    if (!linea) continue; // Evitar líneas vacías

    // Eliminar comentarios en paréntesis
    linea = linea.replace(COMENTARIOS, '').trim();
    if (!linea) continue; // Si la línea quedó vacía tras quitar el comentario, omitirla

    const matchXY = linea.match(MOVIMIENTOS_XY);
    const matchZ = linea.match(MOVIMIENTO_Z);

    if (matchXY) {
      const x = matchXY[1] ? parseFloat(matchXY[1]) : ultimoX;
      const y = matchXY[2] ? parseFloat(matchXY[2]) : ultimoY;
      const z = matchXY[3] ? parseFloat(matchXY[3]) : null;
      const iVal = matchXY[4] ? parseFloat(matchXY[4]) : null;
      const jVal = matchXY[5] ? parseFloat(matchXY[5]) : null;

      // ❌ Eliminar arcos con movimiento en Z
      if ((iVal !== null || jVal !== null) && z !== null) {
        console.warn(`Eliminando arco inválido: ${linea}`);
        continue;
      }

      // ✅ Validar arcos bien definidos
      if ((iVal !== null && isNaN(iVal)) || (jVal !== null && isNaN(jVal))) {
        console.warn(`Eliminando arco malformado: ${linea}`);
        continue;
      }

      // Filtrar movimientos XY pequeños
      if (ultimoX !== null && ultimoY !== null && x !== null && y !== null) {
        const distancia = Math.hypot(x - ultimoX, y - ultimoY);
        if (distancia < UMBRAL && iVal === null && jVal === null) {
          continue;
        }
      }

      ultimoX = x;
      ultimoY = y;
      hayMovimientoXY = true;
    } else if (matchZ) {
      // Si hay un movimiento en Z pero no ha habido movimientos XY antes, lo descartamos
      if (!hayMovimientoXY) {
        console.warn(`Eliminando movimiento Z aislado: ${linea}`);
        continue;
      }
      hayMovimientoXY = false; // Reiniciar flag de movimiento XY después de un Z
    }

    resultado.push(linea);
  }

  return resultado.join('\n');
}

// Cargar, procesar y guardar el G-code
const nombreArchivo = 'I_airplane_40_0001';
const extension = '.ngc';
const base = './estaticos/gcodes/';
const archivoInicial = `${base}${nombreArchivo}${extension}`;
const archivoFinal = `${base}${nombreArchivo}_O${extension}`;

fs.readFile(archivoInicial, 'utf8', (err, datos) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const trayectosOptimizados = procesarTrayectos(datos);

  fs.writeFile(archivoFinal, trayectosOptimizados, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Optimized G-code saved to', archivoFinal);
    }
  });
});
