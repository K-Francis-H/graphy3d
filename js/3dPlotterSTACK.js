//3dPlotter.js

/*TODO
allow user to plot multiple 3dsurfaces
allow user to find intersection points
allow user to find roots, etc

TODO WAY WAY TOO SLOW FOR ROTATION, must save verts!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! TODO

*/


//globals
var gl = null;
var cam = null;
var verts = null;

//function holder for switching between
var plotFunctions = new Array();
plotFunctions['surface']=surfacePlot;
plotFunctions['paraCurve']=paraCurvePlot;
plotFunctions['paraSurf']=paraSurfPlot;
plotFunctions['cylindrical']=cylindPlot;
plotFunctions['spherical']=spherePlot

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
var NUM_X = 20; //number of x values per plot TODO make user controlled in future
var NUM_Y = 20;
var NUM_Z = 20;
var PRECISION = 8;
var RAD_PRECISION = 128;

//aliases for math functions to improve user friendliness
function asin(x){return Math.asin(x)}
function acos(x){return Math.acos(x)}
function atan(x){return Math.atan(x)}
function sin(x){return Math.sin(x)}
function cos(x){return Math.cos(x)}
function tan(x){return Math.tan(x)}
function pow(x,n){return Math.pow(x,n)}
function ln(x){return Math.log(x)}
function abs(x){return Math.abs(x)}
function exp(x){return Math.exp(x)}
function sqrt(x){return Math.sqrt(x)}
var TAN = tan;
var SQRT = sqrt;
var e = Math.E;
var E = Math.E;
var PI = Math.PI;
var pi = Math.PI;

window.onload = function(){


   
   var canvas = document.getElementById("canvas");
   //position canvas
   var rawHeight = window.screen.height;//window.screen.availHeight;
   var rawWidth = window.screen.width;//window.screen.availWidth;
   var dimensions = 0.8 * rawWidth; //0.9 * 320; current value just for simulator (returns 0 screen Width):(
   console.log(dimensions);
   canvas.width = dimensions;
   canvas.height = dimensions;


   //get WebGL context
   try{
       //keep this line if you want to save canvas images else they are cleared by the next frame buffer
       gl = canvas.getContext("webgl", {preserveDrawingBuffer : true}) || canvas.getContext("experimental-webgl", {preserveDrawingBuffer : true});
   }catch(e){}
   //tell user if unavailable
   if(!gl){
      console.log("WebGL failed or unavailable...");
   }

   gl.enable(gl.DEPTH_TEST);
  

   //init basic shaders only (solid color);
   var program = compileShaderProgram(gl,VSHADER_SOURCE, FSHADER_SOURCE);
   program.u_Model = gl.getUniformLocation(program, "u_Model");
   program.u_View = gl.getUniformLocation(program, "u_View");
   program.u_Projection = gl.getUniformLocation(program, "u_Projection");
   program.u_Using_a_Color = gl.getUniformLocation(program, "u_Using_a_Color");
   program.a_Position = gl.getAttribLocation(program, "a_Position");
   program.a_Color = gl.getAttribLocation(program, "a_Color");
   //do some error checks for these
   gl.useProgram(program);
   gl.program = program; //also bind program to gl Object here to access attributes and uniforms
   gl.clearColor(0, 0, 0, 1); //Black, TODO consider using white...
   gl.enable(gl.DEPTH_TEST);

   //init other stuff

   //init camera
   var eye = new Vector3(11, 11, 11);
   //and add rotation
   var look = new Vector3(0, 0, 0);
   var up = new Vector3(0,1,0);
   cam = new Camera(eye, look, up);
   cam.setShape(60, canvas.width/canvas.height, 0.125, 50);
   

   //draw axes
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //set uniforms
      var ang = canvas.xAng;
      var rotationMat = Matrix4.mul(rotationMatrixX(-canvas.yAng), rotationMatrixY(-canvas.xAng));//defies explanation but it works...
      //actually it has to do with the rotationMatrix functions they rotate about that axis so yAng is used to rotate about x-axis, etc...
      //console.log(rotationMat);
      //console.log("in draw, ang = "+ang);
      gl.uniformMatrix4fv(gl.program.u_Model, gl.FALSE, getIdentity4());
      gl.uniformMatrix4fv(gl.program.u_View, gl.FALSE, cam.View);
      gl.uniformMatrix4fv(gl.program.u_Projection, gl.FALSE, cam.Projection);
      //decide on plotting method
      gl.uniform1i(gl.program.u_Using_a_Color, 1);
      drawAxes(gl);

   /*MOUSE ROTATION*/
   canvas.ROTATION_FACTOR=360/canvas.width;
   canvas.xAng = 0;
   canvas.yAng = 0;
   canvas.onmousedown = function(event){
      this.curX = event.clientX;
      this.curY = event.clientY;
      var rect = event.target.getBoundingClientRect();
      //if mouse on screen
      if( rect.left <= this.curX && this.curX < rect.right && rect.top <= this.curY && this.curY < rect.bottom ){
         this.lastX = this.curX;
         this.lastY = this.curY;
         this.mouseDown = true;
      }
   }
   canvas.onmouseup = function(event){this.mouseDown = false;};//stops rotation on mouse up
   canvas.onmousemove = function(event){
      this.curX = event.clientX;
      this.curY = event.clientY; 
      if(this.mouseDown){
         var dx = this.ROTATION_FACTOR * (this.curX - this.lastX);
         var dy = this.ROTATION_FACTOR * (this.curY - this.lastY);
         this.xAng += dx;
         this.yAng = Math.max(Math.min(this.yAng + dy, 90.0), -90.0)
         draw(gl, verts);
       }
       this.lastX = this.curX;
       this.lastY = this.curY;
       document.getElementById("xAng").innerHTML="X-Angle="+this.xAng;
       document.getElementById("yAng").innerHTML="Y-Angle="+this.yAng;
   }
   /*END MOUSE ROTATION*/

   /*TOUCH EVENT ROTATION HANDLER*/
   canvas.addEventListener("touchstart", function(event){
      //alert("here");
      event.preventDefault();
      var touch = event.changedTouches[0];
      this.curX = touch.clientX;
      this.curY = touch.clientY;
      var rect = event.target.getBoundingRect();
      if( rect.left <= this.curX && this.curX < rect.right && rect.top <= this.curY && this.curY < rect.bottom ){
         this.lastX = this.curX;
         this.lastY = this.curY;
         this.touchDown = true;
      }
   }, false);

   canvas.addEventListener("touchend", function(event){this.touchDown = false}, false);
   canvas.addEventListener("touchmove", function(event){
      event.preventDefault();//ignores mouse movement...
      var touch = event.changedTouches[0];
      this.curX = touch.clientX;
      this.curY = touch.clientY;
      if(true){//this.touchDown){
         var dx = this.ROTATION_FACTOR * (this.curX - this.lastX);
         var dy = this.ROTATION_FACTOR * (this.curY - this.lastY);
         this.xAng += dx;
         this.yAng = Math.max(Math.min(this.yAng + dy, 90.0), -90.0)
         draw(gl, verts);
       }
       this.lastX = this.curX;
       this.lastY = this.curY;
       document.getElementById("xAng").innerHTML="X-Angle="+this.xAng;
       document.getElementById("yAng").innerHTML="Y-Angle="+this.yAng;
   }, false);
   /*END TOUCH ROTATION*/


   //TODO does not function on Chrome, Chromium browsers onchange() problems...
   //maybe change to onclick, and keep state on my side...
   document.getElementById("mode").addEventListener("change", function(){
      var selectedIndex = document.getElementById("mode").selectedIndex;
      var mode = document.getElementById("mode")[selectedIndex];
      var allModes = document.getElementById("mode");
      //remove error string
      document.getElementById("errorString").innerHTML="";
      for(var i=0; i < allModes.length; i++){
         if(allModes[i].value === mode.value){
            document.getElementById(allModes[i].value+"Input").style="";//display
            document.getElementById("plotButton").onclick=plotFunctions[mode.value];//set correct plotting function to active
            //document.getElementById("rotate").onchange = plotFunctions[mode.value];
         }
         else //hide element
            document.getElementById(allModes[i].value+"Input").style="display : none";            
      }
   }, false);
   //TODO perhaps only gen heightmap and from that construct the vertex arrays as with Terrain.js
   document.getElementById("plotButton").onclick = surfacePlot;
   document.getElementById("helpButton").onclick = function(){window.open("help.html", "_self")};
}



function drawAxes(gl){

   var axesBuf = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, axesBuf);
   gl.bufferData(gl.ARRAY_BUFFER, axes, gl.STATIC_DRAW);
   gl.vertexAttribPointer(gl.program.a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(gl.program.a_Position);

   var colorBuf = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
   gl.bufferData(gl.ARRAY_BUFFER, axisColors, gl.STATIC_DRAW);   
   gl.vertexAttribPointer(gl.program.a_Color, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(gl.program.a_Color);

   gl.drawArrays(gl.LINES, 0, axes.length/3);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
   gl.disableVertexAttribArray(gl.program.a_Color);

}

function plotPoints(gl, verts){
   
   var vbo = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
   gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
   gl.vertexAttribPointer(gl.program.a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(gl.program.a_Position);
   gl.disableVertexAttribArray(gl.program.a_Color);
   //TODO issue is that a_Color is being used need to disable
   gl.drawArrays(gl.LINES, 0, verts.length/3);//TODO no more than 6 points can be displayed...
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
   //alert("finished drawing");
}

function plotWireFrame(gl, heights){
   alert("works!!!");
}

function plotTriangles(gl, heights){

}

function surfacePlot(){
      //alert("called surfacePlot()");
      resetRotation(); 
      document.getElementById("errorString").innerHTML=""; //clear errors     
      verts = new Float32Array(3*NUM_X*NUM_Y*PRECISION*PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      //var expression = cleanExpression(document.getElementById("expression").value);
      var expression = document.getElementById("expression").value;
      //alert("expression= "+expression);
      alg = new Algebra(expression);
      if(alg.isError()){
         console.log(alg.getErrorString());
         document.getElementById("errorString").innerHTML=alg.getErrorString();
      }
      expression = alg.getJS();
      //alert("js expression = "+expression);
      console.log("expression: "+expression);
      for(var x=0; x < NUM_X; x+=1/PRECISION){
         for( var y=0; y < NUM_Y; y+=1/PRECISION){
            //here we are switching the y & z values to reflect WebGL practice which is z -> depth, y -> height, my application flips this convention
            verts[index++] = x-NUM_X*0.5; //TODO offset not working... has to do with loop
            var loopX = x;
            var loopY = y;
            x = x-NUM_X*0.5;
            y = y-NUM_Y*0.5;
            verts[index++] = eval(expression);//TODO maybe provide a syntax check on the expression and print out errors to the user
            verts[index++] = y-NUM_Y*0.036125;

	    x = loopX;
            y = loopY;

         }
      }

      draw(gl, verts);/*
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //set uniforms
      gl.uniformMatrix4fv(gl.program.u_Model, gl.FALSE, getIdentity4());
      gl.uniformMatrix4fv(gl.program.u_View, gl.FALSE, cam.View);
      gl.uniformMatrix4fv(gl.program.u_Projection, gl.FALSE, cam.Projection);
      //decide on plotting method
      gl.uniform1i(gl.program.u_Using_a_Color, 1);
      drawAxes(gl);

      gl.uniform1i(gl.program.u_Using_a_Color, 0);
      gl.uniform3f(gl.program.u_Color, 1, 1, 1); //white points
      plotPoints(gl, verts);
      //plotWireFrame(gl, verts);
      //plotTriangles(gl, verts);*/
}
function paraCurvePlot(){
      resetRotation();    
      document.getElementById("errorString").innerHTML=""; //clear errors 
  
      verts = new Float32Array(3*NUM_X*NUM_Y*PRECISION*PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      var algX = new Algebra(document.getElementById("pcx-expression").value);
      var algY = new Algebra(document.getElementById("pcy-expression").value);
      var algZ = new Algebra(document.getElementById("pcz-expression").value);
      if(algX.isError() || algY.isError() || algZ.isError()){
         console.log("x(t): "+algX.getErrorString()+"y(t): "+algY.getErrorString()+"z(t): "+algZ.getErrorString());
         document.getElementById("errorString").innerHTML="x(t): "+algX.getErrorString()
                                                          +"<br>y(t): "+algY.getErrorString()
                                                          +"<br>z(t): "+algZ.getErrorString();
      }
      var x_expression = algX.getJS();
      var y_expression = algY.getJS();
      var z_expression = algZ.getJS();
      
      for( var t=0; t < NUM_X*NUM_Y; t+=1/PRECISION){
         //here we are switching the y & z values to reflect WebGL practice which is z -> depth, y -> height, my application flips this convention
         var loopT = t;
         t = t - 0.5*NUM_X*NUM_Y;
         verts[index++] = eval(x_expression);//-NUM_X*0.5; //TODO offset not working... has to do with loop
         verts[index++] = eval(z_expression);//TODO maybe provide a syntax check on the expression and print out errors to the user
         verts[index++] = eval(y_expression);//y-NUM_Y*0.5;
         t = loopT;
      }


      draw(gl, verts);

}

function paraSurfPlot(){
   resetRotation();
   document.getElementById("errorString").innerHTML=""; //clear errors 

   verts = new Float32Array(3*NUM_X*NUM_Y*PRECISION*PRECISION);
   var index = 0;
   //var x_expression = new Algebra(document.getElementById("psx-expression").value).getJS();
   //var y_expression = new Algebra(document.getElementById("psy-expression").value).getJS();
   //var z_expression = new Algebra(document.getElementById("psz-expression").value).getJS();

      var algX = new Algebra(document.getElementById("psx-expression").value);
      var algY = new Algebra(document.getElementById("psy-expression").value);
      var algZ = new Algebra(document.getElementById("psz-expression").value);
      if(algX.isError() || algY.isError() || algZ.isError()){
         console.log("x(s,t): "+algX.getErrorString()+"y(s,t): "+algY.getErrorString()+"z(s,t): "+algZ.getErrorString());
         document.getElementById("errorString").innerHTML="x(s,t): "+algX.getErrorString()//TODO need to have new lines between errors
                                                          +"<br>y(s,t): "+algY.getErrorString()
                                                          +"<br>z(s,t): "+algZ.getErrorString();
      }
      var x_expression = algX.getJS();
      var y_expression = algY.getJS();
      var z_expression = algZ.getJS();

   for(var t=-0.5*NUM_X; t < 0.5*NUM_X; t+=1/PRECISION){
      for(var s=-0.5*NUM_Y; s < 0.5*NUM_Y; s+=1/PRECISION){//TODO s not working in Algebra.js...
         verts[index++] = eval(x_expression);
         verts[index++] = eval(z_expression);
         verts[index++] = eval(y_expression);
      }
   }
   draw(gl, verts);
}
//iterate thru r, t and convert if needed
function cylindPlot(){
      resetRotation();
      document.getElementById("errorString").innerHTML=""; //clear errors 

      verts = new Float32Array(3*NUM_Z*PRECISION*2*RAD_PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      var alg = new Algebra(document.getElementById("cylindrical-expression").value);
      if(alg.isError()){
         console.log("r(\u03b8): "+alg.getErrorString());
         document.getElementById("errorString").innerHTML="r(\u03b8): "+alg.getErrorString();
      }
      var expression = alg.getJS();
      //expression = expression.replace(new RegExp("tan", "g"), "TAN")
      //                       .replace(new RegExp("sqrt", "g"), "SQRT");

      for( t=0; t < PI*2-PI/RAD_PRECISION; t+=PI/RAD_PRECISION){
         for( z=0; z<NUM_Z; z+=1/PRECISION){
            var r = eval(expression);
            verts[index++] = r*cos(t);
            verts[index++] = z-NUM_Z*0.5;
            verts[index++] = r*sin(t);
         }
      }

      draw(gl, verts);/*
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //set uniforms
      gl.uniformMatrix4fv(gl.program.u_Model, gl.FALSE, getIdentity4());
      gl.uniformMatrix4fv(gl.program.u_View, gl.FALSE, cam.View);
      gl.uniformMatrix4fv(gl.program.u_Projection, gl.FALSE, cam.Projection);
      //decide on plotting method
      gl.uniform1i(gl.program.u_Using_a_Color, 1);
      drawAxes(gl);

      gl.uniform1i(gl.program.u_Using_a_Color, 0);
      gl.uniform3f(gl.program.u_Color, 1, 1, 1); //white points
      plotPoints(gl, verts);
      //plotWireFrame(gl, verts);
      //plotTriangles(gl, verts);*/
}
function spherePlot(){
      resetRotation();
      document.getElementById("errorString").innerHTML=""; //clear errors 

      verts = new Float32Array(3*RAD_PRECISION*2*RAD_PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
     // var expression = new Algebra(document.getElementById("spherical-expression").value).getJS();

      var alg = new Algebra(document.getElementById("spherical-expression").value);
      if(alg.isError()){
         console.log("r(\u03b8,\u03d5): "+alg.getErrorString());
         document.getElementById("errorString").innerHTML="r(\u03b8,\u03d5): "+alg.getErrorString();
      }
      var expression = alg.getJS();
      //expression = expression.replace(new RegExp("tan", "g"), "TAN")
      //                       .replace(new RegExp("sqrt", "g"), "SQRT");

      for( t=0; t < PI*2-PI/RAD_PRECISION; t+=PI/RAD_PRECISION){ //theta
         for( p=0; p<PI-PI/RAD_PRECISION; p+=PI/RAD_PRECISION){ //phi
            var r = eval(expression); //ro
            verts[index++] = r*sin(p)*cos(t);
            verts[index++] = r*cos(p);
            verts[index++] = r*sin(p)*sin(t);
         }
      }

      draw(gl, verts);
      /*gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //set uniforms
      gl.uniformMatrix4fv(gl.program.u_Model, gl.FALSE, getIdentity4());
      gl.uniformMatrix4fv(gl.program.u_View, gl.FALSE, cam.View);
      gl.uniformMatrix4fv(gl.program.u_Projection, gl.FALSE, cam.Projection);
      //decide on plotting method
      gl.uniform1i(gl.program.u_Using_a_Color, 1);
      drawAxes(gl);

      gl.uniform1i(gl.program.u_Using_a_Color, 0);
      gl.uniform3f(gl.program.u_Color, 1, 1, 1); //white points
      plotPoints(gl, verts);
      //plotWireFrame(gl, verts);
      //plotTriangles(gl, verts);*/
}

function draw(gl, verts){
      //alert("enetered draw()\n gl="+gl+"verts="+verts+" verts len="+verts.length);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //set uniforms
      var ang = document.getElementById("canvas").xAng;
      var rotationMat = Matrix4.mul(rotationMatrixX(-canvas.yAng), rotationMatrixY(-canvas.xAng));//defies explanation but it works...
      //actually it has to do with the rotationMatrix functions they rotate about that axis so yAng is used to rotate about x-axis, etc...
      //console.log(rotationMat);
      //console.log("in draw, ang = "+ang);
      gl.uniformMatrix4fv(gl.program.u_Model, gl.FALSE, rotationMat);
      gl.uniformMatrix4fv(gl.program.u_View, gl.FALSE, cam.View);
      gl.uniformMatrix4fv(gl.program.u_Projection, gl.FALSE, cam.Projection);
      //decide on plotting method
      gl.uniform1i(gl.program.u_Using_a_Color, 1);
      drawAxes(gl);

      gl.uniform1i(gl.program.u_Using_a_Color, 0);
      gl.uniform3f(gl.program.u_Color, 1, 1, 1); //white points
      plotPoints(gl, verts);
      //plotWireFrame(gl, verts);
      //plotTriangles(gl, verts);
}

function resetRotation(){
   canvas.xAng = 0;
   canvas.yAng = 0;
}

