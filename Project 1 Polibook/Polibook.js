// Erik Reimert - ereimertburro
//Graphics project 1


var vertices = [[]];
var newline = 0;
var fileMode = true;
let gl = null;
let color = 'black';
let shader = null;

function main()
{

	var screen = new canvas("Polibook", 500, 500, style="border:1px solid #000000;");
	gl = screen.context();
	document.getElementById("webgl").appendChild(screen.gc());

	//initialize the shaders
	shader = new shady(screen, "screen", "vshader", "fshader");
  shader.use(); // use the shader


	// Add input handling
	document.addEventListener("click", onclick, false);
	document.addEventListener("keypress", keyPress, false);
	document.getElementById("file").addEventListener('change', ReadDAT, false);
	document.addEventListener("keyup", keyUp, false);
	document.addEventListener("keydown", keyDown, false);

	// Setup default uniforms
	shader.setUnifVec4("fColor", [0.0,0.0,0.0,1.0]);  // Set color to black

	//start up in file mode
	fm();

	//start drawing loop
	loop();
}

//sets the file mode on and makes the filemode input visible
function fm() {
	fileMode = true;
	// delete lines
	vertices = [[]];

	document.getElementById("mode").innerHTML = "File Mode";
	document.getElementById("file").style.visibility = "visible";
}

//sets the write mode on and sets the filemode input invisible
function wm() {
	// init matrix
  shader.setUnifMat4("projMatrix", flatten(ortho(0.0, 500.0, 500.0, 0.0, 0.0, 1.0)));

	//sets file mode to false
	fileMode = false;

	// clear vertices
	vertices = [[]];

	document.getElementById("mode").innerHTML = "Draw Mode";
	document.getElementById("file").style.visibility = "hidden";
}

// Handles key presses
//
// changes colors, modes, clears canvas
//
function keyPress(e){
	let key = e.key;

	if (key === "d") {
		wm();//into draw mode
	}

	else if (key === "f") {
		fm();//into file mode
	}

	else if (key === "x") {
		vertices = [[]]; //clear vertices
	}

	else if (key === "c") {
		if (color === "black") {
			color = "red";
			shader.setUnifVec4("fColor", [1.0, 0.0, 0.0, 1.0]);//swaps to black lines
		}
		else if (color === "red") {
			color = "green";
			shader.setUnifVec4("fColor", [0.0, 1.0, 0.0, 1.0]);//swaps to green lines
		}
		else if (color === "green") {
			color = "blue";
			shader.setUnifVec4("fColor", [0.0, 0.0, 1.0, 1.0]);//swaps to blue lines
		}
		else {
			color = "black";
			shader.setUnifVec4("fColor", [0.0, 0.0, 0.0, 1.0]);//swaps to black lines
		}
	}
}
// Manages when the b key is not being pressed
function keyUp (e) {
	let key = e.key;

	if (key === 'b'){
		newline = 0;
	}
}

// Manages when the b key is being pressed
function keyDown (e) {
	let key = e.key;

	if (key === 'b'){
		newline = 1;
	}
}

//handles the mouse onclick
// if mouse is clicked new vertex point is added to vertices []
function onclick(e){
	if (fileMode === false){
		var line = gl.canvas.getBoundingClientRect();

		//scan for exact x,y coordinates of the click
		var x = e.clientX - line.left;
		var y = e.clientY - line.top;

		//check if inside canvas
		if (y >= 0 && y < 600 && x >= 0 && x < 600){

			//checks if a new line has to be made and if the line has reached 100 POINTS
			if (vertices[vertices.length - 1].length === 100 || newline === 1) {
				vertices.push([]);// pushes empty spot to vertices so the new vertex appends to nothing
			}
			// add the vertex to the array
			vertices[vertices.length - 1].push([x, y]);

		}
	}
}
//rendering loop for showing real time lines being drawing
function loop() {
  gl.clearColor (1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);  // Clear the color buffer

  dline();

  requestAnimationFrame(loop);
}
//drawing lines functions
function dline() {
	//create buffer
	var vertexBuffer = gl.createBuffer();

  for(let i = 0; i < vertices.length; i++) {
    let line = vertices[i];

    // bind the vBuffer for drawing
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

    // determine whether it is a line or point
    if (line.length == 1) {
			gl.bufferData(gl.ARRAY_BUFFER, flatten(line), gl.STATIC_DRAW);

			// Tell OpenGL how to process the vBuffer data in the shader program
			shader.setAttribPointer("vPos", 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, line.length);
    }
    else if (line.length > 1) {
      gl.bufferData(gl.ARRAY_BUFFER, flatten(line), gl.STATIC_DRAW);

			// Tell OpenGL how to process the vBuffer data in the shader program
			shader.setAttribPointer("vPos", 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINE_STRIP, 0, line.length);
    }
  }
}

//reads the DAT files
function ReadDAT(e) {
  let file = e.target.files[0]; // Get the file

  let reader = new FileReader();

  reader.onload = (function(file_object) {
    return function(evt) {
      data = evt.target.result;
      data = data.split("\n");

      // reset array
      vertices = [[]];

      // init matrix
      shader.setUnifMat4("projMatrix", flatten(ortho(0.0, 600.0, 0.0, 600.0, 0.0, 1.0)));

      for (let i = 1; i < data.length; i++) {
        let line = data[i];

        let entry = line.split(' ');
        entry = entry.filter(function (e1) {
          return e1 !== "";
        });

        if (entry.length === 1) {
          // need new polyline
          vertices.push([]);
        }
        else if(entry.length === 2) {
          // point in current line
          vertices[vertices.length - 1].push(
              [ parseFloat(entry[0]),
                parseFloat(entry[1]) ]
          );
        }
        else if(entry.length === 4) {
          // 4 arguments = projection matrix
          shader.setUnifMat4("projMatrix", flatten(
            ortho( parseFloat(entry[0]),
                   parseFloat(entry[2]),
                   parseFloat(entry[3]),
                   parseFloat(entry[1]), 0, 1)
          ));
        }
      }
    }
  })(file); // execute this function with the loaded file

  reader.readAsText(file);
}

//streamlines the shader initializations
class shady {
  constructor(screen, name, vs, fs) {
    this.name = name;
    this.gl = screen.context(); //sets up webGl
    this.id = initShaders(screen.context(), vs, fs);
    this.vec4Variables = new Map();
    this.mat4Variables = new Map();
  }

  use() {
    this.gl.useProgram(this.id);
  }
  setUnifFloat(name, value) {
   this.gl.uniform1f(this.gl.getUniformLocation(this.id, name), value);
  }

  setUnifVec4(name, value) {
    // check map
    let location = this.vec4Variables.get(name);

    // if not on map, get and store
    if (location === undefined)
    {
      location = this.gl.getUniformLocation(this.id, name);
      this.vec4Variables.set(name, location);
    }

    this.gl.uniform4fv(location, value);
  }

  setUnifMat4(name, value) {
    let location = this.mat4Variables.get(name);

    // if not on map get and store
    if (location === undefined)
    {
      location = this.gl.getUniformLocation(this.id, name);
      this.mat4Variables.set(name, location);
    }

    this.gl.uniformMatrix4fv(location, false, value);
  }

//enables attribute pointer
  setAttribPointer(name, size, type, normalized, stride, offset) {
    var position = this.gl.getAttribLocation(this.id, name);

    this.gl.vertexAttribPointer(
        position,
        size,
        type,
        normalized,
        stride,
        offset
    );

    this.gl.enableVertexAttribArray(position);
  }
}

class canvas {
	constructor(name, width, height, style){
		var canvas = document.createElement('canvas');  // Build a new canvas
		canvas.id = name;
		canvas.width = width;
		canvas.height = height;
		canvas.style = style;


		this.canvas = canvas;
    this.gl = WebGLUtils.setupWebGL(canvas, undefined);

    if (!this.gl) {
      console.error("ERROR: WebGL failed!");
      throw new Error("ERROR: WebGL failed!");
    }

		this.sv(0, 0, width, height); // Set the default viewport here
	}

		context() {
	    return this.gl;
	  }
		gc() {
	    return this.canvas;
	  }
		sv(x, y, width, height) {
	    this.gl.viewport(x, y, width, height);
	  }

}
