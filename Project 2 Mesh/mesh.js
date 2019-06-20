// Erik Reimert - ereimertburro
//Graphics project 2




/////////////////////////////////////////////////////////////////////////////
//Variables (global)
/////////////////////////////////////////////////////////////////////////////

var vertices = []; //vertices in mesh
let poly = []; //polys in mesh
let gl = null; //initialized canvas variable
let shader = null; //shader variable
let buff = null; //buffer variable

//display matrix
let model;
let proj;
let view;

//moving values
let spin = 0; //rotation value
let tx = 0; //translation on x value
let ty = 0; //translation on y value
let tz = 0; //translation on z value
let pulse = 0; //pulse value

// movement
let pulseDistance = 0.2;
let pulseSpeed = 0.002;
let movementSpeed = 0.03;


//transform matrix
let rm;
let tm;

let bounds = {
    Xmax: 0,
    Ymax: 0,
    Zmax: 0,
    Xmin: 0,
    Ymin: 0,
    Zmin: 0,
};

let state = {
  pulsing: false,
  x: 0, // can be -1 or 1
  y: 0, // can be -1 or 1
  z: 0, // can be -1 or 1
  rotating: false
};

// perspective projection parts
const FOVY = 45;
const ASPECT_RATIO = 1;
const UP = vec3(0.0, 1.0, 0.0);

let eye;

/////////////////////////////////////////////////////////////////////////////

function main(){
	//get the div from html and add canvas to it
	var screen = new canvas("Mesh", 600, 600);
	gl = screen.context();
	document.getElementById("webgl").appendChild(screen.gc());

	//initialize the shaders
	shader = new shady(screen, "screen", "vshader", "fshader");
  shader.use(); // use the shader


	// Add input handling
	document.addEventListener("keypress", keyPress, false);
	document.getElementById("file").addEventListener('change', readPly, false);

	//setup buffer
	buff = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buff)

	shader.setAttribPointer("vPos", 4, gl.FLOAT, false, 0, 0);


	// Setup default uniforms
	shader.setUnifVec4("fColor", [1.0,1.0,1.0,1.0]);  // Set color to white

	//start loop
	loop();
}


//rendering loop for the mesh
function loop() {
  gl.clearColor (0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear the color buffer

  polygonize();

  requestAnimationFrame(loop);
}

// goes through the polygons and extracts vertices and renders on screen
function polygonize(){

  // default rotation 0 along x axis
  if (state.rotating) spin = spin + 0.5;
  tx = tx + movementSpeed * state.x;
  ty = ty + movementSpeed * state.y;
  tz = tz + movementSpeed * state.z;

  rm  = rotate(spin, vec3(1, 0, 0));
  tm  = translate(tx, ty, tz);

  let modelMatrix = mult(tm, rm);

  // position eye at center of bounding box x, y, but away from the z axis
  let mid = bbMidpoint();

  const A = ((bounds.Ymax - mid.y) / Math.tan(FOVY / 2)) + (bounds.Zmax * 3);

  const B = ((bounds.Xmax - mid.x) / Math.tan(FOVY / 2)) + 	(bounds.Zmax * 3);

  //get the eye in the right spot
  const eyeZ = (A > B ? A : B);

  eye = vec3(mid.x, mid.y, eyeZ);
  const at = vec3(mid.x, mid.y, mid.z);

  view = lookAt(eye, at, UP);

  // update model matrix
  shader.setUnifMat4("modelMatrix", flatten(modelMatrix));

  // update mvMatrix matrix
  shader.setUnifMat4("viewMatrix", flatten(view));

  // cycle polygons
  poly.forEach((polygon) => {

      if (state.pulse)
      {
          let pm = translate(tPulse(polygon.normal));

          shader.setUnifMat4("pulseMatrix", flatten(pm));
      }
      else
          shader.setUnifMat4("pulseMatrix", flatten(translate(0,0,0)));


      // extract vertices
      let a, b, c;
      a = vertices[polygon.a];
      b = vertices[polygon.b];
      c = vertices[polygon.c];

      let points = [a, b, c];

      // fill array
      gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW)
      // draw
      gl.drawArrays(gl.LINE_LOOP, 0, points.length);

  });
  }

//reads the Ply files
function readPly(e) {
  let file = e.target.files[0]; // Get the file

  let reader = new FileReader();

  reader.onload = (function(e) {
      return function(evt) {
          let data = evt.target.result;
          data = data.split("\n");

          // reset array
          poly = [];
          vertices = [];

          let vNum = 0;
          let pNum = 0;

          // parse header
          let index = 0;
          let line = data[index];
          let isFileValid = true;

          if (!line.includes("ply")) {
              console.error("FILE DOES NOT START WITH PLY");
              console.error(`First line: ${line}`);
              isFileValid = false;
          }

          if (isFileValid)
          {

              bbUpdate(0.0, 0.0, 0.0, true);

              while (!line.includes("end_header")) {

                  if (line.includes("element vertex")) {
                      vNum = parseInt(line.split(' ')[2]);
                  }
                  else if (line.includes("element face")) {
                      pNum = parseInt(line.split(' ')[2]);
                  }

                  line = data[index++];
              }

              const loop1Limit = index + vNum;
              for (let i = index; i < loop1Limit; i++, index++)
              {
                  line = data[index];


                  let pts = (line.split(' ')).map((point) => parseFloat(point))
                  let points = vec4(pts[0], pts[1], pts[2], 1.0);

                  bbUpdate(pts[0], pts[1], pts[2]);

                  vertices.push(points);
              }

              const loop2Limit = index + pNum;
              for (let i = index; i < loop2Limit; i++, index++)
              {
                  line = data[index];

                  let faceInfo = line.split(' ');

                  const thisA = parseInt(faceInfo[1]);
                  const thisB = parseInt(faceInfo[2]);
                  const thisC = parseInt(faceInfo[3]);

                  poly.push({
                      a: thisA,
                      b: thisB,
                      c: thisC,
                      normal: norm(thisA, thisB, thisC)
                  });
              }

          }

          // also set variables for camera projection
          proj = perspective(FOVY, ASPECT_RATIO, bounds.Zmin,bounds.Zmax);
          shader.setUnifMat4("projMatrix", flatten(proj));
      }
  })(file);

  reader.readAsText(file);
}

// calculates how displaced the x,y,z points will be from their origin in order to generate the pulsating look, it will return the values x,y,z needed for translation
function tPulse(normal) {
    if (pulse < Math.PI)
        pulse += pulseSpeed;
    else pulse = 0;

    const fraction = Math.sin(pulse);

    return vec3(normal[0] * fraction * pulseDistance,
                normal[1] * fraction * pulseDistance,
                normal[2] * fraction * pulseDistance);
}

//function that gets the normal vec3
function norm(a, b, c) {

    // extract vertices
    const pA = vertices[a];
    const pB = vertices[b];
    const pC = vertices[c];

    // organize arrays of each component
    const xNum = [pA[0], pB[0], pC[0]];
    const yNum = [pA[1], pB[1], pC[1]];
    const zNum = [pA[2], pB[2], pC[2]];

    // newell method

    // calculate x component, using y and z
    let mx = 0;
    for ( let i = 0; i <= 3; i++ )
    {
        mx += ((yNum[i % 3] - yNum[(i + 1) % 3]) * (zNum[i % 3] + zNum[(i + 1) % 3]));
    }

    // calculate y component, using z and x
    let my = 0;
    for ( let i = 0; i <= 3; i++ )
    {
        my += ((zNum[i % 3] - zNum[(i + 1) % 3]) * (xNum[i % 3] + xNum[(i + 1) % 3]));
    }

    // calculate z component, using x and y
    let mz = 0;
    for ( let i = 0; i <= 3; i++ )
    {
        mz += ((xNum[i % 3] - xNum[(i + 1) % 3]) * (yNum[i % 3] + yNum[(i + 1) % 3]));
    }
		    return normalize(vec3(mx, my, mz));
	}

//function to get midpoint of bounding box
function bbMidpoint() {
    let midpoint = {x: 0, y: 0, z: 0};

    midpoint.x = (bounds.Xmax + bounds.Xmin) / 2;
    midpoint.y = (bounds.Ymax + bounds.Ymin) / 2;
    midpoint.z = (bounds.Zmax + bounds.Zmin) / 2;

    return midpoint;
}

//function to update bounding box if needed
function bbUpdate(x, y, z, reset = false){
	const { Xmax, Xmin, Ymax, Ymin, Zmax, Zmin } = bounds;

	if (reset){
		bounds.Xmax = bounds.Xmin = x;
		bounds.Ymax = bounds.Ymin  = y;
		bounds.Zmax = bounds.Zmin = z;
}
else
{
		if (x > Xmax) bounds.Xmax = x;
		if (x < Xmin) bounds.Xmin = x;

		if (y > Ymax) bounds.Ymax = y;
		if (y < Ymin) bounds.Ymin = y;

		if (z > Zmax) bounds.Zmax = z;
		if (z < Zmin) bounds.Zmin = z;
	}
}

//function to change the speed of the pulse to the new input
function updatePS() {
    let value = parseFloat(document.getElementById("ps").value);

        pulseSpeed = value;
}

//function to change the distance of the pulse to the new input
function updatePD() {
    let value = parseFloat(document.getElementById("pd").value);

        pulseDistance = value;

}

//function to change the speed of the translations to the new input
function updateMS() {
    let value = parseFloat(document.getElementById("ms").value);

        movementSpeed = value;
}


/////////////////////////////////////////////////////////////////////////////
// classes to make my life easier and event handling stuff
/////////////////////////////////////////////////////////////////////////////

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

//creates canvas
class canvas {
	constructor(name, width, height){
		var canvas = document.createElement('canvas');  // Build a new canvas
		canvas.id = name;
		canvas.width = width;
		canvas.height = height;


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

// Handles key presses
function keyPress(e){
	let key = e.key;

		switch (key) {
			case 'x':
			state.x = 1 * !state.x;
					break;

			case 'c':
			state.x = -(!state.x); // this logic alternates between 0 and -1
					break;

			case 'y':
			state.y = 1 * !state.y;
					break;

			case 'u':
			state.y = -(!state.y);
					break;

			case 'z':
			state.z = 1 * !state.z;
					break;

			case 'a':
			state.z = -(!state.z);
					break;

			case 'r':
			state.rotating = !state.rotating;
					break;

			case 'b':
			state.pulse = !state.pulse;
					break;

			case 'Enter':
			updatePS();
			updatePD();
			updateMS();
					break;
			}
}
