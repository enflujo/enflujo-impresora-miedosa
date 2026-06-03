/* 
  Basado en: https://raw.githubusercontent.com/fmdavid/miniCNC/refs/heads/master/CNC_code.ino
  - Código en español.
  - Invertí los motores, en mi caso el X está en el 1 y el Y en el 2.

  Diccionario de comandos:
  G0/G1: Mover. Ejemplo: G1 X10, G1 X10 Y10, etc...
  G2/G3: Arcos tratados como línea hasta el punto final.
  G4: Esperar. Ejemplo: G4 P300 espera 300ms.
  G20/G21: Pulgadas/mm. G20 solo se ignora con aviso; la maquina trabaja en mm.
  G90/G91: Posicion absoluta/relativa.
  G92: Define la posicion actual sin mover motores.
  U o M300 S50: Sube el eje Z.
  D o M300 S30: Baja el eje Z.
  M2: Libera los motores y fin del programa.
  M3: Sin accion.
  M5/M18: Libera los motores.
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
bool modoRelativo = false;

void setup() {
  Serial.begin(9600);

  motorZ.attach(pinServo);
  motorZ.write(zArriba);
  pinMode(15, OUTPUT);
  pinMode(16, OUTPUT);
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

int leerCodigo(char* linea, int& indice, int cantidadCaracteres) {
  char buffer[8];
  int i = 0;

  while (indice < cantidadCaracteres && isdigit(linea[indice]) && i < 7) {
    buffer[i++] = linea[indice++];
  }

  buffer[i] = '\0';
  if (i == 0) return -1;
  return atoi(buffer);
}

bool tieneParametro(char* linea, char parametro) {
  return strchr(linea, parametro) != NULL;
}

float leerParametro(char* linea, char parametro, float valorPorDefecto) {
  char* posicion = strchr(linea, parametro);
  if (!posicion) return valorPorDefecto;
  return atof(posicion + 1);
}

void reportarPosicion() {
  Serial.print("Posición actual: X = ");
  Serial.print(Xpos);
  Serial.print("  -  Y = ");
  Serial.print(Ypos);
  Serial.print("  -  Z = ");
  Serial.println(Zpos);
}

void liberarMotores(const char* codigo) {
  motorX.release();
  motorY.release();
  Serial.print("Motores liberados (");
  Serial.print(codigo);
  Serial.println(")");
}

void moverDesdeGcode(char* linea, bool esArco) {
  bool tieneX = tieneParametro(linea, 'X');
  bool tieneY = tieneParametro(linea, 'Y');

  if (!tieneX && !tieneY) {
    Serial.println("Movimiento sin X/Y; no se mueven motores.");
    actualizarPosicion(linea);
    return;
  }

  float destinoX = tieneX ? leerParametro(linea, 'X', Xpos) : Xpos;
  float destinoY = tieneY ? leerParametro(linea, 'Y', Ypos) : Ypos;

  if (modoRelativo) {
    if (tieneX) destinoX = Xpos + destinoX;
    if (tieneY) destinoY = Ypos + destinoY;
  }

  Serial.println(esArco ? "Arco tratado como línea" : "Movimiento lineal");
  dibujarLinea(destinoX, destinoY);
  if (tieneParametro(linea, 'Z')) posicionActual.z = leerParametro(linea, 'Z', posicionActual.z);
  if (tieneParametro(linea, 'P')) posicionActual.p = leerParametro(linea, 'P', posicionActual.p);
  if (tieneParametro(linea, 'S')) posicionActual.s = leerParametro(linea, 'S', posicionActual.s);
}

void procesarLinea(char* linea, int cantidadCaracteres) {
  int indice = 0;

  while (indice < cantidadCaracteres) {
    switch (linea[indice++]) {
      case 'U':
        subir();
        break;
      case 'D':
        bajar();
        break;
      case 'G': {
        int codigoG = leerCodigo(linea, indice, cantidadCaracteres);

        Serial.print("Código G leído: G");
        Serial.println(codigoG);

        switch (codigoG) {
          case 0:  // G0 o G00 - Movimiento rápido
          case 1:  // G1 o G01 - Movimiento lineal
            moverDesdeGcode(linea, false);
            break;

          case 2:  // G2 o G02 - Arco horario (tratado como línea)
          case 3:  // G3 o G03 - Arco antihorario (igual)
            moverDesdeGcode(linea, true);
            break;

          case 4:  // G4 - Esperar
            posicionActual.p = leerParametro(linea, 'P', 0);
            Serial.print("Esperando ");
            Serial.print(posicionActual.p);
            Serial.println(" ms");
            delay((unsigned long) posicionActual.p);
            break;

          case 20:  // G20 - Pulgadas
            Serial.println("G20 recibido; se ignora porque la maquina trabaja en mm.");
            break;

          case 21:  // G21 - Milimetros
            Serial.println("Unidades en milimetros (G21)");
            break;

          case 90:  // G90 - Posicion absoluta
            modoRelativo = false;
            Serial.println("Modo absoluto (G90)");
            break;

          case 91:  // G91 - Posicion relativa
            modoRelativo = true;
            Serial.println("Modo relativo (G91)");
            break;

          case 92:  // G92 - Definir posicion actual
            if (tieneParametro(linea, 'X')) Xpos = leerParametro(linea, 'X', Xpos);
            if (tieneParametro(linea, 'Y')) Ypos = leerParametro(linea, 'Y', Ypos);
            posicionActual.x = Xpos;
            posicionActual.y = Ypos;
            Serial.println("Posición actual redefinida (G92)");
            reportarPosicion();
            break;

          default:
            Serial.print("Comando G no soportado: G");
            Serial.println(codigoG);
            break;
        }
        break;
      }

      case 'M': {
        int codigoM = leerCodigo(linea, indice, cantidadCaracteres);

        switch (codigoM) {
          case 300: {
              float valorS = leerParametro(linea, 'S', -1);
              if (valorS == 30) {
                bajar();
              }
              if (valorS == 50) {
                subir();
              }
              break;
            }

          case 114:  // M114 - Reportar posición actual
            reportarPosicion();
            break;

          case 2:  // M2 - Fin del programa (liberar motores)
            liberarMotores("M2");
            Serial.println("..:: FIN ::..");
            break;

          case 3:  // M3 - Placeholder, sin acción definida
            Serial.println("Comando M3 recibido (sin acción)");
            break;

          case 5:  // M5 - Detener motores
          case 18: // M18 - También detener motores
            liberarMotores(codigoM == 5 ? "M5" : "M18");
            break;

          default:
            Serial.print("Comando M no reconocido: M");
            Serial.println(codigoM);
        }
        break;
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
