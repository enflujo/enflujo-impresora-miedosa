import javax.swing.JOptionPane;
import processing.serial.*;

Serial port = null;

String portname = null;

boolean streaming = false;
float jog = 1.0;
String[] gcode;
int i = 0;
float x = 0;
float y = 0;
final float MIN_X = 0;
final float MAX_X = 40;
final float MIN_Y = 0;
final float MAX_Y = 40;

void openSerialPort()
{
  if (portname == null) return;
  if (port != null) port.stop();

  port = new Serial(this, portname, 9600);
  port.bufferUntil('\n');
  println("Serial conectado en " + portname);
}

void selectSerialPort()
{
  String result = (String) JOptionPane.showInputDialog(null,
    "Select the serial port that corresponds to your Arduino board.",
    "Select serial port",
    JOptionPane.QUESTION_MESSAGE,
    null,
    Serial.list(),
    0);
    
  if (result != null) {
    portname = result;
    openSerialPort();
  }
}

void setup()
{
  size(600, 400);
  openSerialPort();
}

void draw()
{
  background(0);  
  fill(255);
  int ty = 24, dy = 16;
  text("IMPRESORA MIEDOSA", 12, ty); ty += dy * 2;
  text("p: seleccionar puerto serial", 12, ty); ty += dy;
  text("1 / 2 / 3: paso manual 0.5 / 1 / 5 mm", 12, ty); ty += dy;
  text("flechas: mover X/Y", 12, ty); ty += dy;
  text("u / d: subir / bajar lapicero", 12, ty); ty += dy;
  text("h: ir a origen X0 Y0", 12, ty); ty += dy;
  text("m: reportar posicion", 12, ty); ty += dy;
  text("r: liberar motores", 12, ty); ty += dy;
  text("g: imprimir archivo gcode", 12, ty); ty += dy;
  text("x: detener envio despues de la linea actual", 12, ty); ty += dy;
  ty = height - dy * 4;
  text("puerto: " + (portname == null ? "sin seleccionar" : portname), 12, ty); ty += dy;
  text("paso: " + jog + " mm", 12, ty); ty += dy;
  text("posicion local: X" + nf(x, 0, 2) + " Y" + nf(y, 0, 2), 12, ty); ty += dy;
  text("estado: " + (streaming ? "imprimiendo " + i + "/" + gcode.length : "listo"), 12, ty);
}

void keyPressed()
{
  if (key == 'p') selectSerialPort();
  if (key == '1') jog = 0.5;
  if (key == '2') jog = 1.0;
  if (key == '3') jog = 5.0;

  if (!streaming) {
    if (keyCode == LEFT) moverA(x - jog, y);
    if (keyCode == RIGHT) moverA(x + jog, y);
    if (keyCode == UP) moverA(x, y + jog);
    if (keyCode == DOWN) moverA(x, y - jog);
    if (key == 'u') enviar("U");
    if (key == 'd') enviar("D");
    if (key == 'h') moverA(0, 0);
    if (key == 'm') enviar("M114");
    if (key == 'r') enviar("M18");
  }

  if (!streaming && key == 'g') {
    if (!serialListo()) return;
    gcode = null; i = 0;
    File file = null; 
    println("Loading file...");
    selectInput("Select a file to process:", "fileSelected", file);
  }
  
  if (key == 'x') streaming = false;
}

void fileSelected(File selection) {
  if (selection == null) {
    println("Window was closed or the user hit cancel.");
  } else {
    println("User selected " + selection.getAbsolutePath());
    gcode = loadStrings(selection.getAbsolutePath());
    if (gcode == null) return;
    streaming = true;
    stream();
  }
}

boolean serialListo()
{
  if (port == null) {
    println("Selecciona un puerto primero con la tecla p.");
    return false;
  }
  return true;
}

void enviar(String comando)
{
  if (!serialListo()) return;
  println("> " + comando);
  port.write(comando + '\n');
}

void moverA(float nx, float ny)
{
  nx = constrain(nx, MIN_X, MAX_X);
  ny = constrain(ny, MIN_Y, MAX_Y);
  x = nx;
  y = ny;
  enviar("G00 X" + nf(x, 0, 3) + " Y" + nf(y, 0, 3));
}

void stream()
{
  if (!streaming) return;
  if (!serialListo()) {
    streaming = false;
    return;
  }
  
  while (true) {
    if (i == gcode.length) {
      streaming = false;
      println("Impresion finalizada.");
      return;
    }
    
    if (gcode[i].trim().length() == 0) i++;
    else break;
  }
  
  println(gcode[i]);
  port.write(gcode[i] + '\n');
  i++;
}

void serialEvent(Serial p)
{
  String s = p.readStringUntil('\n');
  if (s == null) return;
  s = s.trim();
  println(s);
  
  if (s.startsWith("..::::..")) stream();
  if (s.startsWith("ERROR")) stream();
}
