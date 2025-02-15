export default class TransformadorDatos {
  pedazos: string;

  constructor() {
    this.pedazos = '';
  }

  async transform(pedazo: string, controlador: TransformStreamDefaultController<string>) {
    try {
      this.pedazos += pedazo;
      const lineas = this.pedazos.split('\r\n');
      const ultimaLinea = lineas.pop();
      console.log('ultimaLinea', ultimaLinea);
      this.pedazos = ultimaLinea ? ultimaLinea : '';
      lineas.forEach((linea) => controlador.enqueue(linea));
    } catch (error) {
      console.error(`Error en la transformación: ${error}`);
    }
  }

  flush(controlador: TransformStreamDefaultController<string>) {
    try {
      controlador.enqueue(this.pedazos);
    } catch (error) {
      console.error(`Error limpiando tubería: ${error}`);
    }
  }
}
