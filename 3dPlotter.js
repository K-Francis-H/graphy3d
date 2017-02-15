//3dPlotter.js

/*TODO
allow user to plot multiple 3dsurfaces
allow user to find intersection points
allow user to find roots, etc


*/


//globals
var gl = null;
var cam = null;

var axes = new Float32Array([
  -100,    0,    0, 100,   0,   0, //x-axis
     0, -100,    0,   0, 100,   0, //y-axis
     0,    0, -100,   0,   0, 100  //z-axis
   ]);
var axisColors = new Float32Array([
   1, 0, 0, 1, 0, 0, //red x-axis
   0, 1, 0, 0, 1, 0, //green y-axis
   0, 0, 1, 0, 0, 1  //blue z-axis
   ]);

//constants
var NUM_X = 10; //number of x values per plot TODO make user controlled in future
var NUM_Y = 10;

//aliases for math functions to improve user friendliness
function arcsin(x){return Math.asin(x)}
function arccos(x){return Math.acos(x)}
function arctan(x){return Math.atan(x)}
function sin(x){return Math.sin(x)}
function cos(x){return Math.cos(x)}
function tan(x){return Math.tan(x)}
function pow(x,n){return Math.pow(x,n)}
function ln(x){return Math.log(x)}
function abs(x){return Math.abs(x)}
function exp(x){return Math.exp(x)}
function sqrt(x){return Math.sqrt(x)}
var e = Math.E;
var E = Math.E;
var PI = Math.PI;
var pi = Math.PI;

window.onload = function(){

   //get WebGL context
   var canvas = document.getElementById("canvas");
   try{
       //keep this line if you want to save canvas images else they are cleared by the next frame buffer
       gl = canvas.getContext("webgl", {preserveDrawingBuffer : true}) || canvas.getContext("experimental-webgl", {preserveDrawingBuffer : true});
   }catch(e){}
   //tell user if unavailable
   if(!gl){
      console.log("WebGL failed or unavailable...");
   }
   alert(gl);
  

   //init basic shaders only (solid color);
   /*var program = compileShaderProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
   program.u_Model = gl.getUniformLocation(program, "u_Model");
   program.u_View = gl.getUniformLocation(program, "u_View");
   program.u_Projection = gl.getUniformLocation(program, "u_Projection");
   program.a_Position = gl.getAttributeLocation(program, "a_Position");
   program.a_Color = gl.getAttributeLocation(program, "a_Color");
   //do some error checks for these
   gl.useProgram(program);
   gl.program = program; //also bind program to gl Object here to access attributes and uniforms
   gl.clearColor(0, 0, 0, 1); //Black, TODO consider using white...
   gl.enable(gl.DEPTH_TEST);*/

   //init other stuff

   //init camera
   var eye = new Vector3(11, 11, 11);
   //and add rotation
   var look = new Vector3(0, 0, 0);
   var up = new Vector3(0,1,0);
   cam = new Camera(eye, look, up);
   cam.setShape(60, canvas.width/canvas.height, 0.125, 50);
   
   //TODO perhaps only gen heightmap and from that construct the vertex arrays as with Terrain.js
   document.getElementById("plotButton").onclick = function(){
      alert("here");
      var verts = new Float32Array(3*NUM_X*NUM_Y); //3 values for each point, 100 points
      var index = 0; //keeps track of current vertex value
      var expression = document.getElementById("expression").value;
      
      for(var x=0; x < NUM_X; x++){
         for( var y=0; y < NUM_Y; y++){
            //here we are switching the y & z values to reflect WebGL practice which is z -> depth, y -> height, my application flips this convention
            verts[index++] = x;
            verts[index++] = eval(expression);//TODO maybe provide a syntax check on the expression and print out errors to the user
            verts[index++] = y;
         }
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //set uniforms
      gl.uniformMatrix4fv(gl.program.u_Model, gl.FALSE, getIdentity4());
      gl.uniformMatrix4fv(gl.program.u_View, gl.FALSE, cam.View);
      gl.uniformMatrix4fv(gl.program.u_Projection, gl.FALSE, cam.Projection);
      //decide on plotting method
      drawAxes(gl);
      //plotPoints(gl, verts);
      //plotWireFrame(gl, verts);
      //plotTriangles(gl, verts);
   }
}

function drawAxes(gl){

   var axesBuf = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, axesBuf);
   gl.bufferData(gl.ARRAY_BUFFER, axes, gl.STATIC_DRAW);
   gl.vertexAttribPointer(gl.program.a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(a_Position);

   var colorBuf = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
   gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);   
   gl.vertexAttribPointer(gl.program.a_Color, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(a_Color);

   gl.drawArrays(gl.LINES, 0, axes.length/3);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);

}

function plotPoints(gl, verts){

}

function plotTriangles(gl, verts){

}


