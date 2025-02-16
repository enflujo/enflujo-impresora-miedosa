import { createClient } from 'pexels';
import { pexelsLlave, unsplashLlaveAcceso } from '../secretos';
import { type ColorId, createApi } from 'unsplash-js';

const contenedor = document.getElementById('imagenesGenericas') as HTMLDivElement;
const coloresImgs = document.getElementById('coloresImgs') as HTMLSelectElement;
let color: ColorId | null = null;
let termino: string | null = null;
let numeroImgsPexels = 5;
let numeroImgsUnsplash = 5;

coloresImgs.addEventListener('change', () => {
  color = coloresImgs.value.length ? (coloresImgs.value as ColorId) : null;
  buscar();
});

export function buscarImagen(nombre: string, numPexels = 5, numUnsplash = 5) {
  termino = nombre;
  numeroImgsPexels = numPexels;
  numeroImgsUnsplash = numUnsplash;
  buscar();
}

function buscar() {
  if (!termino) return;
  contenedor.innerHTML = '';
  buscarImagenesPexels(termino, numeroImgsPexels);
  buscarImagenesUnsplash(termino, numeroImgsUnsplash);
}

async function buscarImagenesPexels(categoria: string, cantidad: number) {
  const pexels = createClient(pexelsLlave);
  const nombre = document.createElement('h3');
  const contenedorImgs = document.createElement('div');

  contenedorImgs.classList.add('imagenes');
  nombre.textContent = 'Pexels';
  contenedorImgs.appendChild(nombre);
  contenedor.appendChild(contenedorImgs);

  const res = await pexels.photos.search({ query: categoria, per_page: cantidad, color: color ? color : undefined });
  if ('photos' in res && res.photos.length) {
    res.photos.forEach((foto) => {
      const img = new Image();
      img.onload = () => {
        img.style.height = '200px';
        contenedorImgs.appendChild(img);
      };
      img.src = foto.src.original;
    });
  } else {
    console.log('No se encontraron imágenes');
  }
}

async function buscarImagenesUnsplash(categoria: string, cantidad: number) {
  try {
    const api = createApi({ accessKey: unsplashLlaveAcceso });
    const res = await api.search.getPhotos({ query: categoria, perPage: cantidad, color: color ? color : undefined });
    const nombre = document.createElement('h3');
    const contenedorImgs = document.createElement('div');

    contenedorImgs.classList.add('imagenes');
    nombre.textContent = 'Unsplash';
    contenedorImgs.appendChild(nombre);
    contenedor.appendChild(contenedorImgs);

    if ('response' in res && res.response?.results.length) {
      res.response.results.forEach((foto) => {
        const img = new Image();
        img.onload = () => {
          img.style.height = '200px';
          contenedorImgs.appendChild(img);
        };
        img.src = foto.urls.raw;
      });
    } else {
      console.log('No se encontraron imágenes');
    }
  } catch (error) {
    console.log('Error al cargar imágenes de Unsplash:', error);
  }
}
