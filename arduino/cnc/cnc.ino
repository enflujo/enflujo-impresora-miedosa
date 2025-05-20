/* 
  Basado en: https://raw.githubusercontent.com/fmdavid/miniCNC/refs/heads/master/CNC_code.ino
  - Código en español.
  - Invertí los motores, en mi caso el X está en el 1 y el Y en el 2.

  Diccionario de comandos:
  G1: Mover. Ejemplo: G1 X10, G1 X10 Y10, etc...
  G4: Esperar. Ejemplo: G4 P300 espera 150ms.
  M300 S30: Baja el eje Z.
  M300 S50: Sube el eje Z.
  M2: Libera los motores y fin del programa.
  M5 o M18: Libera los motores.
  M114: Reporta la posición actual.
*/

#include <Servo.h>
#include <AFMotor.h>

#define MAX_DATOS 512
char PASO = MICROSTEP;

const int zArriba = 60;
const int zAbajo = 20;
const int pinServo = 10;
const int pasosPorRevolucion = 48;
const int velocidadMicrosegundos = 500;

Servo motorZ;
AF_Stepper motorX(pasosPorRevolucion, 1);
AF_Stepper motorY(pasosPorRevolucion, 2);

struct Punto {
  float x;
  float y;
  float z;
  float p;
  float s;
};

Punto posicionActual = {0, 0, 0, 0, 0};
const int incrementoPaso = 1;
int pausaZ = 50;

// Usar el programa "calibrar.ino" para obtener estos valores
float pasosPorMilimetroX = 108.70;
float pasosPorMilimetroY = 108.70;

float Xmin =  0.0;
float Xmax = 40.0;
float Ymin = 0.0;
float Ymax = 40.0;
float Zmin = 0.0;
float Zmax = 1.0;

float Xpos = Xmin;
float Ypos = Ymin;
float Zpos = Zmax;

void setup() {
  Serial.begin(9600);

  motorZ.attach(pinServo);
  motorZ.write(zArriba);
  delay(100);

  // Si se calientan mucho los motores se puede bajar la velocidad
  motorX.setSpeed(600);
  motorY.setSpeed(600);

  Serial.println(F("..:: Impresora lista ::.."));
  Serial.print("X tiene rango de ");
  Serial.print(Xmin);
  Serial.print(" a ");
  Serial.print(Xmax);
  Serial.println(" mm.");
  Serial.print("Y tiene rango de ");
  Serial.print(Ymin);
  Serial.print(" a ");
  Serial.print(Ymax);
  Serial.println(" mm.");
}

void loop() {
  delay(100);
  static char linea[MAX_DATOS];
  char caracter;
  int indiceLinea = 0;
  bool esComentario = false;
  bool esPuntoYComa = false;

  while (1) {
    while (Serial.available() > 0) {
      caracter = Serial.read();

      if ((caracter == '\n') || (caracter == '\r')) {  // Fin de línea
        if (indiceLinea > 0) {                         // Línea completa: procesar
          linea[indiceLinea] = '\0';                  // Terminar cadena
          procesarLinea(linea, indiceLinea);
          indiceLinea = 0;
        }
        esComentario = false;
        esPuntoYComa = false;
        Serial.println("..::::..");
      } else {
        if (esComentario || esPuntoYComa) {
          if (caracter == ')') esComentario = false;  // Fin de comentario
        } else {
          if (caracter <= ' ') {
            // Ignorar espacios en blanco y caracteres de control
          } else if (caracter == '/') {
            // Ignorar: eliminación por bloque no soportada
          } else if (caracter == '(') {
            esComentario = true;  // Iniciar comentario
          } else if (caracter == ';') {
            esPuntoYComa = true;  // Iniciar comentario por punto y coma
          } else if (indiceLinea >= MAX_DATOS - 1) {
            Serial.println("ERROR - Desbordamiento del búfer de línea");
            esComentario = false;
            esPuntoYComa = false;
          } else if (caracter >= 'a' && caracter <= 'z') {
            linea[indiceLinea++] = caracter - 'a' + 'A';  // Convertir a mayúscula
          } else {
            linea[indiceLinea++] = caracter;  // Agregar carácter válido
          }
        }
      }
    }
  }
}

void actualizarPosicion(char* linea) {
  // Verificamos si existen los parámetros en la línea
  char* x = strchr(linea, 'X');
  char* y = strchr(linea, 'Y');
  char* z = strchr(linea, 'Z');
  char* p = strchr(linea, 'P');
  char* s = strchr(linea, 'S');

  // Si existe el parámetro, lo actualizamos
  if (x) posicionActual.x = atof(x + 1);
  if (y) posicionActual.y = atof(y + 1);
  if (z) posicionActual.z = atof(z + 1);
  if (p) posicionActual.p = atof(p + 1);
  if (s) posicionActual.s = atof(s + 1);
}

void procesarLinea(char* linea, int cantidadCaracteres) {
  int indice = 0;
  char buffer[64];

  while (indice < cantidadCaracteres) {
    switch (linea[indice++]) {
      case 'U':
        subir();
        break;
      case 'D':
        bajar();
        break;
      case 'G':
        // Leer hasta dos caracteres para capturar códigos como G01, G02, G03
        buffer[0] = linea[indice++];
        if (isdigit(linea[indice])) {
          buffer[1] = linea[indice++];
          buffer[2] = '\0';
        } else {
          buffer[1] = '\0';
        }

        int codigoG = atoi(buffer);

        Serial.print("Código G leído: G");
        Serial.println(codigoG);

        switch (codigoG) {
          case 0:  // G0 o G00 - Movimiento rápido
          case 1:  // G1 o G01 - Movimiento lineal
            Serial.println("Movimiento lineal (G0/G1)");
            actualizarPosicion(linea);
            dibujarLinea(posicionActual.x, posicionActual.y);
            break;

          case 2:  // G2 o G02 - Arco horario (tratado como línea)
          case 3:  // G3 o G03 - Arco antihorario (igual)
            Serial.println("Arco (G2/G3) tratado como lineal");
            actualizarPosicion(linea);
            dibujarLinea(posicionActual.x, posicionActual.y);
            break;

          default:
            Serial.print("Comando G no soportado: G");
            Serial.println(codigoG);
            break;
        }
        break;

      case 'M':
        buffer[0] = linea[indice++];  // /!\ Aproximado – solo funciona con comandos de 3 dígitos
        buffer[1] = linea[indice++];
        buffer[2] = linea[indice++];
        buffer[3] = '\0';

        switch (atoi(buffer)) {
          case 300: {
              char* posicionS = strchr(linea + indice, 'S');
              float valorS = atof(posicionS + 1);
              if (valorS == 30) {
                bajar();
              }
              if (valorS == 50) {
                subir();
              }
              break;
            }

          case 114:  // M114 - Reportar posición actual
            Serial.print("Posición actual: X = ");
            Serial.print(posicionActual.x);
            Serial.print("  -  Y = ");
            Serial.println(posicionActual.y);
            break;

          case 2:  // M2 - Fin del programa (liberar motores)
            motorX.release();
            motorY.release();
            Serial.println("Motores liberados (M2)");
            Serial.println("..:: FIN ::..");
            break;

          case 3:  // M3 - Placeholder, sin acción definida
            Serial.println("Comando M3 recibido (sin acción)");
            break;

          case 5:  // M5 - Detener motores
          case 18: // M18 - También detener motores
            motorX.release();
            motorY.release();
            Serial.print("Motores liberados (M");
            Serial.print(buffer);
            Serial.println(")");
            break;

          default:
            Serial.print("Comando M no reconocido: M");
            Serial.println(buffer);
        }
    }
  }
}

void dibujarLinea(float x1, float y1) {
  if (x1 >= Xmax) x1 = Xmax;
  if (x1 <= Xmin) x1 = Xmin;
  if (y1 >= Ymax) y1 = Ymax;
  if (y1 <= Ymin) y1 = Ymin;

  //  Convertir coordenadas a pasos
  int pasosX = (int)(x1 * pasosPorMilimetroX);
  int pasosY = (int)(y1 * pasosPorMilimetroY);
  long x0 = (long)(Xpos * pasosPorMilimetroX);
  long y0 = (long)(Ypos * pasosPorMilimetroY);

  long dx = abs(pasosX - x0);
  long dy = abs(pasosY - y0);
  int sx = x0 < pasosX ? incrementoPaso : -incrementoPaso;
  int sy = y0 < pasosY ? incrementoPaso : -incrementoPaso;

  long i;
  long over = 0;

  if (dx > dy) {
    for (i = 0; i < dx; ++i) {
      motorX.onestep(sx, PASO);
      over += dy;
      if (over >= dx) {
        over -= dx;
        motorY.onestep(sy, PASO);
      }
      delayMicroseconds(velocidadMicrosegundos);

    }
  } else {
    for (i = 0; i < dy; ++i) {
      motorY.onestep(sy, PASO);
      over += dx;
      if (over >= dy) {
        over -= dy;
        motorX.onestep(sx, PASO);
      }
      delayMicroseconds(velocidadMicrosegundos);
    }
  }

  // Actualización de las posiciones
  Xpos = x1;
  Ypos = y1;
  posicionActual.x = Xpos;
  posicionActual.y = Ypos;
}

void subir() {
  motorZ.write(zArriba);
  delay(pausaZ);
  Zpos = Zmax;
  digitalWrite(15, LOW);
  digitalWrite(16, HIGH);
}

void bajar() {
  motorZ.write(zAbajo);
  delay(pausaZ);
  Zpos = Zmin;
  digitalWrite(15, HIGH);
  digitalWrite(16, LOW);
}
