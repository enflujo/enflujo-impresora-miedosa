import { categorias, otrasCategorias } from '../categorias';

export function crearMenuCategorias(cargarcategoria: (nombre: string) => void) {
  const contenedorCategorias = document.getElementById('listaCategorias') as HTMLUListElement;
  const contenedorOtrasCategorias = document.getElementById('listaOtrasCategorias') as HTMLUListElement;

  categorias.forEach((categoria) => {
    construirCategoria(categoria, contenedorCategorias);
  });
  otrasCategorias.forEach((categoria) => {
    construirCategoria(categoria, contenedorOtrasCategorias);
  });

  function construirCategoria(categoria: string, contenedor: HTMLUListElement) {
    const elemento = document.createElement('li');
    elemento.textContent = categoria;

    contenedor.appendChild(elemento);
    elemento.classList.add('categoria');

    elemento.addEventListener('click', () => {
      cargarcategoria(categoria);

      const seleccionado = contenedor.querySelector('.seleccionado');

      if (seleccionado) {
        seleccionado.classList.remove('seleccionado');
      }

      elemento.classList.add('seleccionado');
    });
  }
}
