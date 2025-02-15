import { createApi, type ColorId } from 'unsplash-js';
import { createClient } from 'pexels';
import { pexelsLlave, unsplashLlaveAcceso } from './secretos';

/**https://universe.roboflow.com/microsoft/coco/health?ref=blog.roboflow.com */

export const categorias = [
  'traffic light',
  'car',
  'truck',
  'zebra',
  'person',
  'sports ball',
  'baseball glove',
  'bottle',
  'dining table',
  'knife',
  'bowl',
  'oven',
  'cup',
  'broccoli',
  'spoon',
  'carrot',
  'sink',
  'cell phone',
  'toilet',
  'book',
  'motorcycle',
  'dog',
  'frisbee',
  'airplane',
  'cat',
  'bed',
  'laptop',
  'boat',
  'tv',
  'tie',
  'bus',
  'tennis racket',
  'sheep',
  'train',
  'clock',
  'remote',
  'pizza',
  'potted plant',
  'microwave',
  'skateboard',
  'bench',
  'chair',
  'hot dog',
  'umbrella',
  'handbag',
  'backpack',
  'apple',
  'orange',
  'baseball bat',
  'vase',
  'bicycle',
  'mouse',
  'keyboard',
  'couch',
  'fork',
  'wine glass',
  'snowboard',
  'kite',
  'surfboard',
  'giraffe',
  'fire hydrant',
  'banana',
  'cake',
  'scissors',
  'refrigerator',
  'bird',
  'skis',
  'donut',
  'sandwich',
  'stop sign',
  'elephant',
  'teddy bear',
  'horse',
  'suitcase',
  'cow',
  'bear',
  'parking meter',
  'toothbrush',
  'hair drier',
  'toaster',
].sort();

export const otrasCategorias = ['turtle', 'egg'];

export function cargarImagenes(
  categoria: string,
  numeroImgsUnsplash: number = 5,
  numeroImgsPexels: number = 5,
  colorUnsplash: ColorId | null = 'white',
  colorPexels: string | null = 'colorUnsplash'
): void {
  const nombre = document.createElement('h2');
  nombre.textContent = categoria;
  document.body.appendChild(nombre);

  if (numeroImgsUnsplash && numeroImgsUnsplash > 0) {
    imagenesUnsplash(categoria, numeroImgsUnsplash, colorUnsplash)
      .then(() => {
        console.log('Unsplash imágenes cargadas');
      })
      .catch((error) => {
        console.log('Error al cargar imágenes de Unsplash:', error);
      });
  }
  if (numeroImgsPexels && numeroImgsPexels > 0) {
    imagenesPexels(categoria, numeroImgsPexels, colorPexels)
      .then(() => {
        console.log('Pexels imágenes cargadas');
      })
      .catch((error) => {
        console.log('Error al cargar imágenes de Pexels:', error);
      });
  }
}

export function imagenesUnsplash(categoria: string, cantidad: number, color: ColorId | null): Promise<void> {
  const nombre = document.createElement('h3');
  const contenedor = document.createElement('div');
  nombre.textContent = 'Unsplash';
  contenedor.appendChild(nombre);

  document.body.appendChild(contenedor);

  return new Promise(async (resolver, rechazar) => {
    try {
      const unsplash = createApi({ accessKey: unsplashLlaveAcceso });

      const res = await unsplash.search.getPhotos({
        query: categoria,
        perPage: cantidad, //orderBy: 'relevant'
        color: color ? color : undefined,
      });
      let imagenesCargadas = 0;

      if ('response' in res && res.response?.results.length) {
        res.response.results.forEach((foto) => {
          const img = new Image();
          img.onload = () => {
            img.style.width = '200px';
            contenedor.appendChild(img);
            imagenesCargadas++;

            if (imagenesCargadas === res.response.results.length) {
              console.log('Todas las imágenes cargadas');
              resolver();
            }
          };
          console.log(foto);
          img.src = foto.urls.raw;
        });
      } else {
        console.log('No se encontraron imágenes');
        resolver();
      }
    } catch (error) {
      console.log('Error al cargar imágenes de Unsplash:', error);
      rechazar();
    }
  });
}

export function imagenesPexels(categoria: string, cantidad: number, color: string | null): Promise<void> {
  const nombre = document.createElement('h3');
  const contenedor = document.createElement('div');
  nombre.textContent = 'Pexels';
  contenedor.appendChild(nombre);
  document.body.appendChild(contenedor);

  return new Promise((resolver, rechazar) => {
    try {
      const pexels = createClient(pexelsLlave);
      pexels.photos.search({ query: categoria, per_page: cantidad, color: color ? color : undefined }).then((res) => {
        if ('photos' in res && res.photos.length) {
          res.photos.forEach((foto) => {
            const img = new Image();
            img.onload = () => {
              img.style.width = '200px';
              contenedor.appendChild(img);
            };
            img.src = foto.src.original;
          });

          resolver();
        } else {
          console.log('No se encontraron imágenes');
          resolver();
        }
      });
    } catch (error) {
      console.log('Error al cargar imágenes de Pexels:', error);
      rechazar();
    }
  });
}
