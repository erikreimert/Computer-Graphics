// Erik Reimert - ereimertburro
//Graphics project 1
function main()
{
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = WebGLUtils.setupWebGL(canvas);

	//Check that the return value is not null.
	if (!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	//Set up the viewport
    gl.viewport( 0, 0, canvas.width, canvas.height );

    // Set clear color
  	gl.clearColor(0.0, 0.0, 0.0, 1.0);

  	// Clear <canvas> by clearning the color buffer
  	gl.clear(gl.COLOR_BUFFER_BIT);

  	// Draw a point
  	gl.drawArrays(gl.POINTS, 0, points.length);
}
<!DOCTYPE html>
<html>
<head>


</head>

<body>
    <h1>Polibook Erik Reimert</h1>
    <h2 id = "val"> Read</h2>
//add open gl box
  <form>
    <input type="file" name = "draw">
  </form>

</body>

<script>
window.addEventListener("keydown", checkKeyPressed, false);
function checkKeyPressed(e) {
    if (e.keyCode == "70" || e.keyCode == "68") {
        mode()
    }
}

function mode(){ //changes the mode from read to write
    if(document.getElementById('val').innerHTML = 'Read'){
        return document.getElementById('val').innerHTML = 'Write';
        //change mode to write
      } else {
        return document.getElementById('val').innerHTML = 'Read';
        //change mode to Read
      }
    }
</script>
</html>
