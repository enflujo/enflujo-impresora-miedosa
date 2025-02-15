import TransformadorDatos from './Transformadordatos';

/**
 * import java.awt.event.KeyEvent;
import javax.swing.JOptionPane;
import processing.serial.*;

Serial port = null;

// select and modify the appropriate line for your operating system
// leave as null to use interactive port (press 'p' in the program)
String portname = null;
//String portname = Serial.list()[0]; // Mac OS X
//String portname = "/dev/ttyUSB0"; // Linux
//String portname = "COM6"; // Windows

boolean streaming = false;
float speed = 0.001;
String[] gcode;
int i = 0;

void openSerialPort()
{
  if (portname == null) return;
  if (port != null) port.stop();
  
  port = new Serial(this, portname, 9600);
  
  port.bufferUntil('\n');
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
  size(500, 250);
  openSerialPort();
}

void draw()
{
  background(0);  
  fill(255);
  int y = 24, dy = 12;
  text("INSTRUCTIONS", 12, y); y += dy;
  text("p: select serial port", 12, y); y += dy;
  text("1: set speed to 0.001 inches (1 mil) per jog", 12, y); y += dy;
  text("2: set speed to 0.010 inches (10 mil) per jog", 12, y); y += dy;
  text("3: set speed to 0.100 inches (100 mil) per jog", 12, y); y += dy;
  text("arrow keys: jog in x-y plane", 12, y); y += dy;
  text("page up & page down: jog in z axis", 12, y); y += dy;
  text("$: display grbl settings", 12, y); y+= dy;
  text("h: go home", 12, y); y += dy;
  text("0: zero machine (set home to the current location)", 12, y); y += dy;
  text("g: stream a g-code file", 12, y); y += dy;
  text("x: stop streaming g-code (this is NOT immediate)", 12, y); y += dy;
  y = height - dy;
  text("current jog speed: " + speed + " inches per step", 12, y); y -= dy;
  text("current serial port: " + portname, 12, y); y -= dy;
}

void keyPressed()
{
  if (key == '1') speed = 0.001;
  if (key == '2') speed = 0.01;
  if (key == '3') speed = 0.1;
  
  if (!streaming) {
    if (keyCode == LEFT) port.write("G91\nG20\nG00 X-" + speed + " Y0.000 Z0.000\n");
    if (keyCode == RIGHT) port.write("G91\nG20\nG00 X" + speed + " Y0.000 Z0.000\n");
    if (keyCode == UP) port.write("G91\nG20\nG00 X0.000 Y" + speed + " Z0.000\n");
    if (keyCode == DOWN) port.write("G91\nG20\nG00 X0.000 Y-" + speed + " Z0.000\n");
    if (keyCode == KeyEvent.VK_PAGE_UP) port.write("G91\nG20\nG00 X0.000 Y0.000 Z" + speed + "\n");
    if (keyCode == KeyEvent.VK_PAGE_DOWN) port.write("G91\nG20\nG00 X0.000 Y0.000 Z-" + speed + "\n");
    if (key == 'h') port.write("G90\nG20\nG00 X0.000 Y0.000 Z0.000\n");
    if (key == 'v') port.write("$0=75\n$1=74\n$2=75\n");
    //if (key == 'v') port.write("$0=100\n$1=74\n$2=75\n");
    if (key == 's') port.write("$3=10\n");
    if (key == 'e') port.write("$16=1\n");
    if (key == 'd') port.write("$16=0\n");
    if (key == '0') openSerialPort();
    if (key == 'p') selectSerialPort();
    if (key == '$') port.write("$$\n");
  }
  
  if (!streaming && key == 'g') {
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

void stream()
{
  if (!streaming) return;
  
  while (true) {
    if (i == gcode.length) {
      streaming = false;
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
  println(s.trim());
  
  if (s.trim().startsWith("ok")) stream();
  if (s.trim().startsWith("error")) stream(); // XXX: really?
}
 */
const frecuencia = 9600;
let puerto: SerialPort | null = null;
let emisor: WritableStreamDefaultWriter<string> | null = null;
const eventos: { [nombre: string]: ((datos: string | null) => void)[] } = {};

function puertoAbierto() {
  return puerto && puerto.readable && puerto.writable;
}

export async function conectarDispositivo() {
  if (puertoAbierto()) throw new Error('Conexión con el dispositivo ya fue creada.');

  try {
    if (!navigator.serial) {
      throw new Error('Serial no está soportado por el navegador.');
    }

    const puerto = await navigator.serial.requestPort();
    await puerto.open({ baudRate: frecuencia });
  } catch (error) {
    throw new Error(error as any);
  }

  const codificador = new TextEncoderStream();
  emisor = codificador.writable.getWriter();
  const decodificador = new TextDecoderStream();
  // TODO create methods to close the connection and release the port using these
  // const writableStreamClosed = codificador.readable.pipeTo(puerto.writable);
  // const readableStreamClosed = puerto.readable.pipeTo(decodificador.writable);
  const inputStream = decodificador.readable;
  const lector = inputStream.pipeThrough(new TransformStream(new TransformadorDatos())).getReader();

  bucle(lector)
    .then((respuesta) => {
      console.log(respuesta, 'bucle finalizado');
    })
    .catch((e) => {
      console.error(
        'No se puede leer los datos del puerto serial. Asegúrate de usar la misma frecuencia que se usa en el dispositivo (En Arduino cuando se utiliza Serial.begin()), actualmente es: ',
        frecuencia,
        'Si estás enviando muchos datos es probable que necesites usar un delay() más alto al final del código de Arduino para resolver este problema.'
      );
      console.error(e);
    });
}

async function bucle(lector: ReadableStreamDefaultReader<string>) {
  while (true) {
    const { value, done } = await lector.read();
    if (value) {
      let json = null;
      try {
        json = JSON.parse(value);
      } catch {
        // Ignore bad reads
      }
      if (json) {
        // If it's an array, handle accordingly
        if (typeof json === 'object') {
          if (json[0] === '_w') {
            console.warn('[ARDUINO] ' + json[1]);
            continue;
          }

          if (json[0] === '_l') {
            console.log('[ARDUINO] ' + json[1]);
            continue;
          }

          if (json[0] === '_e') {
            console.error('[ARDUINO] ' + json[1]);
            continue;
          }

          // Reserved event name 'd': Data transfer. Register a listener "data" to listen to it.
          if (json[0] === '_d') {
            emitir('data', json[1]);
            continue;
          }

          emitir(json[0], json[1]);
        }

        // If it's just a string, just call the event
        else if (typeof json === 'string') {
          emitir(json, null);
        }
      }
    }

    if (done) {
      console.log('[readLoop] DONE', done);
      lector.releaseLock();
      break;
    }
  }
}

function emitir(nombre: string, data: string | null) {
  if (!eventos[nombre]) {
    return console.warn('Evento ' + nombre + ' recibido pero no se ha registrado en los eventos.');
  }

  eventos[nombre].forEach((callback: (datos: string | null) => void) => callback(data));
}
