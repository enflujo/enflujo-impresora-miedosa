// import { cargarImagenes, categorias } from './categorias';
import { buscarImagen } from './componentes/BuscarImagenes';
import { crearMenuCategorias } from './componentes/MenuCategorias';
import VisorTrayectos from './componentes/VisorTrayectos';
import './scss/estilos.scss';

const previsualizador = new VisorTrayectos(document.getElementById('previsualizador') as HTMLCanvasElement);
let buscarImgs = true;
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

// cargarCodigo('I_Cow_40_0001_O.ngc', 40, true);
