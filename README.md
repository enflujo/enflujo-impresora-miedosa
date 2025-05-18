# GROUND TRUTH

![Estilo Código](https://github.com/enflujo/enflujo-impresora-miedosa/actions/workflows/estilo-codigo.yml/badge.svg)
![Tamaño](https://img.shields.io/github/repo-size/enflujo/enflujo-impresora-miedosa?color=%235757f7&label=Tama%C3%B1o%20repo&logo=open-access&logoColor=white)
![Licencia](https://img.shields.io/github/license/enflujo/enflujo-impresora-miedosa?label=Licencia&logo=open-source-initiative&logoColor=white)

## Convertir imágenes a SVG

https://picsvg.com/

## Partes para construir la impresora

Para crear las ilustraciones del libro usamos una pequeña impresora CNC creada con estos elementos:

### Electrónica

- 2 x unidades de DVD viejas, de allí sacamos los motores con varilla roscada.
- 1 x Arduino Uno.
- 1 x Controlador de motores HW - 130 (o cualquiera con L293D, hay variaciones de estos por ahí).
  - Cuando tiene el puente, los motores y Arduino comparten la corriente, por ejemplo, el cable USB conectado al computador que da 5V.
  - Sin el puente, se debe conectar una fuente de poder externa para los motores ya que no comparte la fuente de poder con el Arduino. Esto sirve para darle suficiente poder a los motores sin usar la del USB que ya alimenta el Arduino. Acá usamos esta configuración.
- 1 x Fuente de poder conectada a "EXT_PWR". La placa acepta fuente desde 4.5 a 25V DC. Una fuente pequeña es suficiente, de 5V está bien.
- Cable 22 AWG para conectar los motores a la placa.
- 1 x adaptador de corriente a cable.

### Partes mecánicas

- Partes 3D: Luego de probar varias versiones de este diseño, nos quedamos con esta versión que funciona relativamente bien: https://www.thingiverse.com/thing:6203330
- 5 x varilla lisa: 2 para el eje X, 2 para el eje Y y 1 para el eje Z. Estas varillas las sacamos de las unidades de DVD de donde sacamos los motores.
- 4 x tornillos M4 para sujetar los brazos laterales a la base.
