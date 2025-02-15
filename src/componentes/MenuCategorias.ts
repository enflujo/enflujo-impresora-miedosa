import { categorias } from '../categorias';

export function crearMenuCategorias(cargarcategoria: (nombre: string) => void) {
  const contenedorCategorias = document.getElementById('listaCategorias') as HTMLUListElement;

  categorias.forEach((categoria) => {
    const elemento = document.createElement('li');
    elemento.textContent = categoria;
    contenedorCategorias.appendChild(elemento);
    elemento.classList.add('categoria');

    elemento.addEventListener('click', () => {
      cargarcategoria(categoria);

      const seleccionado = contenedorCategorias.querySelector('.seleccionado');

      if (seleccionado) {
        seleccionado.classList.remove('seleccionado');
      }

      elemento.classList.add('seleccionado');
    });
  });
}
