// Erik Reimert - ereimertburro
//Graphics project 3



//Variables (global)
/////////////////////////////////////////////////////////////////////////////

var gl; // webgl context
var vertices = [];
var buff; //buffer

var red = vec4(1,0,0,1);
var green = vec4(0,1,0,1);
var blue = vec4(0,0,1,1);
var rg = vec4(1,1,0,1);
var rb = vec4(1,0,1,1);
var bg = vec4(0,1,1,1);
var rgb = vec4(1,1,1,1);
var shade = vec4(0.0, 0.0, 0.0, 0.5);
var colors = [red, blue, green, rg, rb, bg, rgb];

var vNum  = 36;

var fovy = 45.0;  // field of view
var aspect;       // Viewport aspect ratio

// model-view and projection matrices
var mvMatrix, pMatrix;
var modelView, projection;

// camera settings
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// stack for hierarchical movement
var stack = [];

// example material settings
var materialAmbient = vec4( 1.0, 1.0, 1.0, 0.5 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 50.0;

// example light settings
var lightPosition = vec4( 1.0, 7.0, 0.0, 1.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var index = 0; //amount of triangles being made

var pointsArray = [];
var normalsArray = [];
var triangleArray = [];

// state
var useFlat = false;

var theta = 0;

var angle = 0.75;

// texture configs
var useTexture = 0.0;
var minT = 0.0;
var maxT = 1.0;

var texCoordsArray = [];
var textCoord = [
    vec2(minT, minT),
    vec2(minT, maxT),
    vec2(maxT, maxT),
    vec2(maxT, minT)
];
var vTexCoord;

// connector settings
var lineA = [vec4(2.75, -1.25, 0.0, 1.0), vec4(-2.75, -1.25, 0.0, 1.0)];
var lineB = [vec4(2.75, -1.25, 0.0, 1.0), vec4(2.75, -1.75, 0.0, 1.0)];
var lineC = [vec4(-2.75, -1.25, 0.0, 1.0), vec4(-2.75, -1.75, 0.0, 1.0)];

var lineD = [vec4(1.5, -1.25, 0.0, 1.0), vec4(-1.5, -1.25, 0.0, 1.0)];
var lineE = [vec4(1.5, -1.25, 0.0, 1.0), vec4(1.5, -1.75, 0.0, 1.0)];
var lineF = [vec4(-1.5, -1.25, 0.0, 1.0), vec4(-1.5, -1.75, 0.0, 1.0)];
var lineG = [vec4(0.0, -0.75, 0.0, 1.0), vec4(0.0, -1.25, 0.0, 1.0)];

// arrays
var cNormals;
var cfNormals;
var pNormals;
var pfNormals;
var sNormals;
var sfNormals;

// example sphere creation
var numTimesToSubdivide = 5;
const va = vec4(0.0, 0.0, -1.0, 1);
const vb = vec4(0.0, 0.942809, 0.333333, 1);
const vc = vec4(-0.816497, -0.471405, 0.333333, 1);
const vd = vec4(0.816497, -0.471405, 0.333333, 1);
const sphere = tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

var texture = {
    a: null,
    aIsLoaded: false,
    b: null,
    bIsLoaded: false
};

var floor, wall;
var floorShadow = true;
var textures = true;

/////////////////////////////////////////////////////////////////////////////

function main(){
	//get the div from html and add canvas to it
	//doesnt work with my div turned canvas for some reason
	// var screen = new canvas("Kinetic Sculpture", 800, 600);
	// gl = screen.context();
	// document.getElementById("webgl").appendChild(screen.gc());

	var screen = document.getElementById('webgl');

	// Get the starting context for WebGL
  gl = WebGLUtils.setupWebGL(screen, undefined);

	//Check that the return value is not null.
	if (!gl)
	{
		console.log('Failed to get the starting context for WebGL');
		return;
	}

  aspect = screen.width/screen.height;

	//initialize the shaders
	shader = new shady(screen, "screen", "vshader", "fshader");
  shader.use(); // use the shader

  //setting the clear color
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

	var diffuseProduct = mult(lightDiffuse, materialDiffuse);
	var specularProduct = mult(lightSpecular, materialSpecular);
	var ambientProduct = mult(lightAmbient, materialAmbient);

	gl.uniform4fv(gl.getUniformLocation(shader.id,"diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(shader.id,"specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(shader.id,"ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(shader.id,"lightPosition"), flatten(lightPosition));
	gl.uniform1f(gl.getUniformLocation(shader.id,"shininess"), materialShininess);

	gl.uniform1i(gl.getUniformLocation(shader.id,"useTexture"), useTexture);

	gl.vertexAttrib1f(gl.getAttribLocation(shader.id, "angle"), angle);

	projection = gl.getUniformLocation(shader.id, "projectionMatrix");
	modelView = gl.getUniformLocation(shader.id, "modelViewMatrix");

	//setup buffer
	buff = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buff)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW)



	var vTexCoord = gl.getAttribLocation( shader.id, "vTexCoord" );
	gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vTexCoord );


  floor = new Image();
  floor.crossOrigin = "";
  floor.src = "http://web.cs.wpi.edu/~jmcuneo/grass.bmp";
  floor.onload = () => {
    configureTexture(floor, "floor");
    texture.aIsLoaded = true;
  };

  wall = new Image();
	wall.crossOrigin = "";
	wall.src = "http://web.cs.wpi.edu/~jmcuneo/stones.bmp";
	wall.onload = () => {
			configureTexture(wall, "wall");
			texture.aIsLoaded = true;
	};


  // Add input handling
  document.addEventListener("keypress", keyPress, false);

  //start loop
	start();
}

function start() {
    var wallPlane = plane(25);
    var floorPlane = plane(25);
    var mainCube = cube();
    var tempMatrix = null;

    cNormals = calcGouraud(mainCube);
    cfNormals = calcFlat(mainCube);
    pNormals = calcGouraud(wallPlane);
    pfNormals = calcFlat(wallPlane);
    sNormals = calcGouraud(pointsArray);
    sfNormals = calcFlat(pointsArray);

    pMatrix = perspective(fovy, aspect, .1, 50);
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

    eye = vec3(0, 2.7, 12);
    mvMatrix = lookAt(eye, at , up);

    // wall right
    stack.push(mvMatrix);
    mvMatrix = mult(mvMatrix, rotateY(-45));
    mvMatrix = mult(translate(2.5, 0, -18), mvMatrix);
    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    pDraw(wallPlane, vec4(0.0, 0.0, 1.0, 1.0), "wall");

    // wall left
    mvMatrix = stack.pop();
    stack.push(mvMatrix);
    mvMatrix = mult(mvMatrix, rotateY(45)); // rotate so it's visible
    mvMatrix = mult(translate(-2.5, 0, -18), mvMatrix);
    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    pDraw(wallPlane, vec4(0.0, 0.0, 1.0, 1.0), "wall");

    // floor
    mvMatrix = stack.pop();
    stack.push(mvMatrix);
    mvMatrix = mult(mvMatrix, rotateX(-90));
    mvMatrix = mult(translate(0, -10, -10), mvMatrix);
    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    pDraw(floorPlane,  vec4(0.5, 0.5, 0.5, 1.0), "floor");

    mvMatrix = stack.pop();


    ////////////////
    //Order of Shapes and rendering
    ///////////////

    theta += 1;
    mvMatrix = mult(mvMatrix, translate(0.0, 3.0, 0));
    mvMatrix = mult(mvMatrix, rotateY(theta*1.5));

/////////////////Top
    stack.push(mvMatrix);
        gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

        // Top Red Cube
        cDraw(mainCube, colors[0]);

        // CONNECTOR
        drawLine(lineA);
        drawLine(lineB);
        drawLine(lineC);
        drawLine(lineG);

        if (floorShadow) {
            gl.uniform1f(gl.getUniformLocation(shader.id,
                "shininess"), 500.0);
            stack.push(mvMatrix);

            createShadow(mvMatrix, 0);
            cDraw(mainCube, shade);

            mvMatrix = stack.pop();
            gl.uniform1f(gl.getUniformLocation(shader.id,
                "shininess"), materialShininess);
        }

///////////////////Middle
        stack.push(mvMatrix);
            mvMatrix = mult(mvMatrix, translate(2.75, -2.5, 0));
            mvMatrix = mult(mvMatrix, rotateY(-theta*2));
            gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

            // CONNECTOR
            drawLine(lineD);
            drawLine(lineE);
            drawLine(lineF);
            drawLine(lineG);

            stack.push(mvMatrix);

            mvMatrix = mult(mvMatrix, rotateY(theta*2.3));
            gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

            // Middle Blue Sphere
            sDraw(colors[1]);

            if (floorShadow) {
                gl.uniform1f(gl.getUniformLocation(shader.id,
                    "shininess"), 500.0);
                stack.push(mvMatrix);

                createShadow(mvMatrix, 1);
                sDraw(shade);

                mvMatrix = stack.pop();
                gl.uniform1f(gl.getUniformLocation(shader.id,
                    "shininess"), materialShininess);
            }

            mvMatrix = stack.pop();

/////////////////////Bottom
            stack.push(mvMatrix);
                mvMatrix = mult(mvMatrix, translate(1.5, -2.5, 0));
                mvMatrix = mult(mvMatrix, rotateY(theta*3));
                gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

                // Bottom Green Cube
                cDraw(mainCube, colors[2]);

                if (floorShadow) {
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), 500.0);
                    stack.push(mvMatrix);

                    createShadow(mvMatrix, 2);
                    cDraw(mainCube, shade);

                    mvMatrix = stack.pop();
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), materialShininess);
                }

                mvMatrix = stack.pop();
                mvMatrix = mult(mvMatrix, translate(-1.5, -2.5, 0));
                mvMatrix = mult(mvMatrix, rotateY(theta*3));
                gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

                // Bottom Yellow Sphere
                sDraw(colors[3]);

                if (floorShadow) {
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), 500.0);
                    stack.push(mvMatrix);

                    createShadow(mvMatrix, 2);
                    sDraw(shade);

                    mvMatrix = stack.pop();
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), materialShininess);
                }


/////////////////////////Middle
            mvMatrix = stack.pop();
            mvMatrix = mult(mvMatrix, translate(-2.75, -2.5, 0));
            mvMatrix = mult(mvMatrix, rotateY(- theta * 2));
            gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

            // CONNECTOR
            drawLine(lineD);
            drawLine(lineE);
            drawLine(lineF);
            drawLine(lineG);

            stack.push(mvMatrix);

            mvMatrix = mult(mvMatrix, rotateY(theta*2.3));
            gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));

            // Middle Purple Cube
            cDraw(mainCube, colors[4]);

            if (floorShadow) {
                gl.uniform1f(gl.getUniformLocation(shader.id,
                    "shininess"), 500.0);
                stack.push(mvMatrix);

                createShadow(mvMatrix, 1);
                cDraw(mainCube, shade);

                mvMatrix = stack.pop();
                gl.uniform1f(gl.getUniformLocation(shader.id,
                    "shininess"), materialShininess);
            }

            mvMatrix = stack.pop();

//////////////////////Bottom
            stack.push(mvMatrix);
                mvMatrix = mult(mvMatrix, translate(1.5, -2.5, 0));
                mvMatrix = mult(mvMatrix, rotateY(theta*3));
                gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

                // Bottom Cyan Cube
                cDraw(mainCube, colors[5]);

                if (floorShadow) {
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), 500.0);
                    stack.push(mvMatrix);

                    createShadow(mvMatrix, 2);
                    cDraw(mainCube, shade);

                    mvMatrix = stack.pop();
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), materialShininess);
                }

                mvMatrix = stack.pop();
                mvMatrix = mult(mvMatrix, translate(-1.5, -2.5, 0));
                mvMatrix = mult(mvMatrix, rotateY(theta*3));
                gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );

                // Bottom White Sphere
                sDraw(colors[6]);

                if (floorShadow) {
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), 500.0);
                    stack.push(mvMatrix);

                    createShadow(mvMatrix, 2);
                    sDraw(shade);

                    mvMatrix = stack.pop();
                    gl.uniform1f(gl.getUniformLocation(shader.id,
                        "shininess"), materialShininess);
                }

    // loop
    requestAnimationFrame(start);
}

//sets buffer and draws a sphere
function sDraw(color) {

  useTexture = 0.0;
  gl.vertexAttrib1f(gl.getAttribLocation(shader.id, "useTexture"), useTexture);

  var pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(shader.id,  "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var vBuffer2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
  if (useFlat)
  {
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sfNormals), gl.STATIC_DRAW);
  } else {
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sNormals), gl.STATIC_DRAW);
  }

  var vNormal = gl.getAttribLocation( shader.id, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var diffuseProductLoc = gl.getUniformLocation(shader.id, "diffuseProduct");
  gl.uniform4fv(diffuseProductLoc, flatten(mult(lightDiffuse, color)));

  var i;
  for(i=0; i<index; i+=3){
    gl.drawArrays( gl.TRIANGLES, i, 3 );
  }

}

//sets buffer and draws cubes
function cDraw(cube, color) {

  //cube is gray without this
    useTexture = 0.0;
    gl.vertexAttrib1f(gl.getAttribLocation(shader.id, "useTexture"), useTexture);

    gl.disableVertexAttribArray(vTexCoord);

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(shader.id,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    if (useFlat)
    {
        gl.bufferData(gl.ARRAY_BUFFER, flatten(cfNormals), gl.STATIC_DRAW);
    } else {
        gl.bufferData(gl.ARRAY_BUFFER, flatten(cNormals), gl.STATIC_DRAW);
    }

    var vNormal = gl.getAttribLocation( shader.id, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var diffuseProductLoc = gl.getUniformLocation(shader.id, "diffuseProduct");
    gl.uniform4fv(diffuseProductLoc, flatten(mult(lightDiffuse, color)));

    gl.drawArrays( gl.TRIANGLES, 0, vNum );
}

//sets buffer and draws a plane
function pDraw(plane, color, category = "wall") {

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(plane), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(shader.id,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pfNormals), gl.STATIC_DRAW);


    var vNormal = gl.getAttribLocation( shader.id, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var diffuseProductLoc = gl.getUniformLocation(shader.id, "diffuseProduct");
    gl.uniform4fv(diffuseProductLoc, flatten(mult(lightDiffuse, color)));

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    vTexCoord = gl.getAttribLocation( shader.id, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vTexCoord );


    if (textures) {
        useTexture = 1.0;
        gl.vertexAttrib1f(gl.getAttribLocation(shader.id, "useTexture"), useTexture);
    }

    gl.drawArrays( gl.TRIANGLES, 0, plane.length );
}

//sets buffers and draws the lines
function drawLine(line) {

  var pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(line), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(shader.id,  "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var diffuseProductLoc = gl.getUniformLocation(shader.id, "diffuseProduct");
  gl.uniform4fv(diffuseProductLoc, flatten(mult(lightDiffuse, vec4(0.0, 0.0, 0.0, 1.0))));

  gl.drawArrays( gl.LINES, 0, line.length );
}

//////// TEXTURE SETTINGS /////////
function configureTexture ( image, name = "wall" ) {
  // create texture object
  if (name === "wall") {
    texture.a = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture.a);
  }
  else {
    texture.b = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture.b);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.uniform1i(gl.getUniformLocation(shader.id, "texture"), 0);
}

/////////class stuff

//sphere example from class

function triangle(a, b, c) {

  pointsArray.push(a);
  pointsArray.push(b);
  pointsArray.push(c);

  // normals are vectors

  triangleArray.push(a[0],a[1], a[2], 0.0);
  triangleArray.push(b[0],b[1], b[2], 0.0);
  triangleArray.push(c[0],c[1], c[2], 0.0);

  index += 3;
}

function divideTriangle(a, b, c, count) {
  if ( count > 0 ) {

    var ab = mix( a, b, 0.5);
    var ac = mix( a, c, 0.5);
    var bc = mix( b, c, 0.5);

    ab = normalize(ab, true);
    ac = normalize(ac, true);
    bc = normalize(bc, true);

    divideTriangle( a, ab, ac, count - 1 );
    divideTriangle( ab, b, bc, count - 1 );
    divideTriangle( bc, c, ac, count - 1 );
    divideTriangle( ab, bc, ac, count - 1 );
  }
  else {
    triangle( a, b, c );
  }
}

function tetrahedron(a, b, c, d, n) {
  // reverse order of these vertices to allow culling
  divideTriangle(c, b, a, n);
  divideTriangle(b, c, d, n);
  divideTriangle(b, d, a, n);
  divideTriangle(d, c, a, n);
}

//cube example from class

function cube(){
    var verts = [];
    verts = verts.concat(quad( 1, 0, 3, 2 ));
    verts = verts.concat(quad( 2, 3, 7, 6 ));
    verts = verts.concat(quad( 3, 0, 4, 7 ));
    verts = verts.concat(quad( 6, 5, 1, 2 ));
    verts = verts.concat(quad( 4, 5, 6, 7 ));
    verts = verts.concat(quad( 5, 4, 0, 1 ));
    return verts;
}

function quad(a, b, c, d){
    var verts = [];

    var vertices = [
        vec4( -0.75, -0.75,  0.75, 1.0 ),
        vec4( -0.75,  0.75,  0.75, 1.0 ),
        vec4(  0.75,  0.75,  0.75, 1.0 ),
        vec4(  0.75, -0.75,  0.75, 1.0 ),
        vec4( -0.75, -0.75, -0.75, 1.0 ),
        vec4( -0.75,  0.75, -0.75, 1.0 ),
        vec4(  0.75,  0.75, -0.75, 1.0 ),
        vec4(  0.75, -0.75, -0.75, 1.0 )
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i )
    {
        verts.push( vertices[indices[i]] );
    }

    return verts;
}

function plane(size = 10) {
    // make 4 vertices, add total of 6 times for drawing 2 triangles
    var a, b, c, d;
    a = vec4((size / 2), -(size / 2), 0.0, 1.0);
    b = vec4((size / 2), (size / 2), 0.0, 1.0);
    c = vec4(-(size / 2), (size / 2), 0.0, 1.0);
    d = vec4(-(size / 2), -(size / 2), 0.0, 1.0);

    texCoordsArray = [];
    texCoordsArray.push(textCoord[0]);
    texCoordsArray.push(textCoord[1]);
    texCoordsArray.push(textCoord[2]);
    texCoordsArray.push(textCoord[0]);
    texCoordsArray.push(textCoord[2]);
    texCoordsArray.push(textCoord[3]);

    return [
        a, b, c, a, c, d
    ];
}


// calculate flat normals
function calcFlat(points) {
    normalsArray = [];

    for (var i = 0; i < points.length; i += 3){

        var polygon = [];
        polygon.push(points[i]);
        polygon.push(points[i+1]);
        polygon.push(points[i+2]);

        var n = newell(polygon);
        normalsArray.push(n);
        normalsArray.push(n);
        normalsArray.push(n);

    }
    return normalsArray;
}

function calcGouraud(points) {
    normalsArray = [];

    for (var i = 0; i < points.length; i++) {

        normalsArray.push( vec4( points[i][0],
                                 points[i][1],
                                 points[i][2],
                                 0.0));
    }
    return normalsArray;
}

//Newell method
function newell(polygon){

    var xNormal = 0;
    var yNormal = 0;
    var zNormal = 0;

    var cur, nxt;

    var i;

    for (i = 0; i < polygon.length; i++) {
        cur = vec4(polygon[i % polygon.length]);
        nxt = vec4(polygon[(i + 1) % polygon.length]);

        xNormal = (xNormal + ((cur[1]-nxt[1])*(cur[2]+nxt[2])));
        yNormal = (yNormal + ((cur[2]-nxt[2])*(cur[0]+nxt[0])));
        zNormal = (zNormal + ((cur[0]-nxt[0])*(cur[1]+nxt[1])));
    }

    return vec4(xNormal, yNormal, zNormal, 0.0);
}

//creates a shadow
function createShadow(tempMatrix, level) {
    var light = mult(inverse(tempMatrix), lightPosition);

    var m = mat4();
    m[3][3] = 0;
    m[3][1] = -1/light[1];

    var shadowModelView = tempMatrix;
    shadowModelView = mult(shadowModelView, translate(light[0], light[1], light[2]));
    shadowModelView = mult(shadowModelView, m);
    shadowModelView = mult(shadowModelView, translate(-light[0], -light[1], -light[2]));

    var scalar = -(1+((3-level)*2));

    var lightVec = normalize(vec3(lightPosition[0], lightPosition[1], lightPosition[2]));
    shadowModelView = mult(translate(scalar*1.3 * lightVec[0], scalar * lightVec[1], scalar*2 * lightVec[2]), shadowModelView);

    gl.uniformMatrix4fv(modelView, false, flatten(shadowModelView));
}

/////////////////////////////////////////////////////////////////////////////
// classes to make my life easier and event handling stuff
/////////////////////////////////////////////////////////////////////////////

//streamlines the shader initializations
class shady {
  constructor(screen, name, vs, fs) {
    this.name = name;
    this.gl = gl; //sets up webGl
    this.id = initShaders(gl, vs, fs);
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
    var location = this.vec4Variables.get(name);

    // if not on map, get and store
    if (location === undefined)
    {
      location = this.gl.getUniformLocation(this.id, name);
      this.vec4Variables.set(name, location);
    }

    this.gl.uniform4fv(location, value);
  }

  setUnifMat4(name, value) {
    var location = this.mat4Variables.get(name);

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

// Handles key presses
function keyPress(e){
	var key = e.key;

		switch (key) {

			case 'p':
      if (angle < .99){
          angle+=0.03;
          gl.vertexAttrib1f(gl.getAttribLocation(shader.id, "angle"), angle);
      }
					break;

			case 'i':
      angle-=0.03;
      gl.vertexAttrib1f(gl.getAttribLocation(shader.id, "angle"), angle);
					break;

			case 'n':
        useFlat = true;
					break;

			case 'm':
        useFlat = false;
					break;

      case 'a':
          floorShadow = !floorShadow;
          break;

      case 'b':
          textures = !textures;
          break;

			case 'c':

					break;

			case 'd':

					break;

			}
}
