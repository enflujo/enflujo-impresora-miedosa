#include <AFMotor.h>

AF_Stepper motorX(48, 1);
AF_Stepper motorY(48, 2);

// Variables de posición
float Xpos = 0.0;
float Ypos = 0.0;
float StepsPerMillimeterX = 100.0;
float StepsPerMillimeterY = 100.0;

void setup() {
  Serial.begin(9600);
  motorX.setSpeed(100);
  motorY.setSpeed(100);

  Serial.println("Comandos:");
  Serial.println("G1 Xnn Ynn - Mover a posición en mm");
  Serial.println("M114 - Reportar posición");
  Serial.println("M500 Xnn o M500 Ynn - Calibrar motor con nnn pasos");
  Serial.println("Ingrese el comando:");
}

void loop() {
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();

    if (comando.startsWith("G1")) {
      moverMotores(comando);
    } else if (comando == "M114") {
      reportarPosicion();
    } else if (comando.startsWith("M500")) {
      calibrarMotor(comando);
    } else {
      Serial.println("Comando no reconocido.");
    }
  }
}

void moverMotores(String comando) {
  int indexX = comando.indexOf('X');
  int indexY = comando.indexOf('Y');

  float nuevoX = Xpos;
  float nuevoY = Ypos;

  if (indexX != -1) {
    nuevoX = comando.substring(indexX + 1).toFloat();
  }
  if (indexY != -1) {
    nuevoY = comando.substring(indexY + 1).toFloat();
  }

  long pasosX = (nuevoX - Xpos) * StepsPerMillimeterX;
  long pasosY = (nuevoY - Ypos) * StepsPerMillimeterY;

  int direccionX = pasosX > 0 ? FORWARD : BACKWARD;
  int direccionY = pasosY > 0 ? FORWARD : BACKWARD;

  pasosX = abs(pasosX);
  pasosY = abs(pasosY);

  Serial.print("Moviendo X: ");
  Serial.print(pasosX);
  Serial.print(" pasos, Y: ");
  Serial.println(pasosY);

  for (long i = 0; i < pasosX; ++i) {
    motorX.onestep(direccionX, MICROSTEP);
    delay(2);
  }

  for (long i = 0; i < pasosY; ++i) {
    motorY.onestep(direccionY, MICROSTEP);
    delay(2);
  }

  Xpos = nuevoX;
  Ypos = nuevoY;

  Serial.println("Movimiento completado.");
}

void reportarPosicion() {
  Serial.print("Posición actual -> X: ");
  Serial.print(Xpos);
  Serial.print(" mm, Y: ");
  Serial.print(Ypos);
  Serial.println(" mm");
}

void calibrarMotor(String comando) {
  if (comando.indexOf('X') != -1) {
    Serial.println("Calibrando motor X... Moviendo 1000 pasos.");
    for (int i = 0; i < 1000; ++i) {
      motorX.onestep(FORWARD, MICROSTEP);
      delay(2);
    }
    Serial.println("Ingrese la distancia recorrida en milímetros:");
  } else if (comando.indexOf('Y') != -1) {
    Serial.println("Calibrando motor Y... Moviendo 1000 pasos.");
    for (int i = 0; i < 1000; ++i) {
      motorY.onestep(FORWARD, MICROSTEP);
      delay(2);
    }
    Serial.println("Ingrese la distancia recorrida en milímetros:");
  } else {
    Serial.println("Comando inválido para M500. Use M500 X o M500 Y.");
    return;
  }

  while (!Serial.available()) {}

  float distancia = Serial.readStringUntil('\n').toFloat();

  if (distancia > 0) {
    float pasosPorMM = 1000.0 / distancia;
    if (comando.indexOf('X') != -1) {
      StepsPerMillimeterX = pasosPorMM;
      Serial.print("Nuevo valor para X: ");
    } else {
      StepsPerMillimeterY = pasosPorMM;
      Serial.print("Nuevo valor para Y: ");
    }
    Serial.print(pasosPorMM);
    Serial.println(" pasos por milímetro");
  } else {
    Serial.println("Valor inválido. Intente nuevamente.");
  }
}