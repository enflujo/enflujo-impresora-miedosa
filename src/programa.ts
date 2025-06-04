// import { cargarImagenes, categorias } from './categorias';
import { categorias } from './categorias';
import { buscarImagen } from './componentes/BuscarImagenes';
import { conectarDispositivo, eleminiarPuerto, obtenerPuerto, puertoAbierto } from './componentes/Impresora';
import { crearMenuCategorias } from './componentes/MenuCategorias';
import VisorTrayectos from './componentes/VisorTrayectos';
import './scss/estilos.scss';

const previsualizador = new VisorTrayectos(document.getElementById('previsualizador') as HTMLCanvasElement);
let buscarImgs = false;
crearMenuCategorias(cargarCategoria);

function cargarCategoria(nombre: string) {
  previsualizador.limpiar();
  cargarCodigo(`I_${nombre}_40_O.ngc`, 40, true);
  if (buscarImgs) buscarImagen(nombre);
}

async function cargarCodigo(nombre: string, proporcion: number = 40, mostrarTitulo: boolean = false) {
  try {
    const respuesta = await fetch(`/gcodes/${nombre}`);
    if (!respuesta.ok) {
      throw new Error(`Error al cargar el archivo: ${respuesta.statusText}`);
    }
    const codigo = await respuesta.text();

    if (mostrarTitulo) {
      const partes = nombre.split('_');
      const nombreTitulo = `T_${partes[1]}_${partes[2]}.ngc`;
      const restitulo = await fetch(`/gcodes/${nombreTitulo}`);

      if (restitulo.ok) {
        const codigotitulo = await restitulo.text();
        previsualizador.previsualizarCodigo(codigotitulo, proporcion);
      }
    }
    previsualizador.previsualizarCodigo(codigo, proporcion);
  } catch (error) {
    console.error('Error al obtener el archivo GCode:', error);
    throw error;
  }
}

const categoria = categorias[Math.floor(Math.random() * categorias.length)];
const elemento = document.querySelector(`[data-categoria="${categoria}"]`) as HTMLLIElement;
elemento.click();
cargarCategoria(categoria);

// cargarCodigo('T_ground_truth_40.ngc', 40, false);

const conectar = document.getElementById('conectar') as HTMLDivElement;

conectar.addEventListener('click', async () => {
  const puerto = obtenerPuerto();
  console.log(puertoAbierto());

  try {
    if (puertoAbierto()) {
      console.log('Desconectando...');
      await puerto?.close();
      eleminiarPuerto();
      conectar.textContent = 'Conectar';
    } else {
      console.log('Conectando...');
      await conectarDispositivo();
      conectar.textContent = 'Desconectar';
    }
  } catch (error) {
    console.error('Error al conectar:', error);
  }
});
