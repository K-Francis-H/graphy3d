//3dPlotter.js

/*TODO
allow user to plot multiple 3dsurfaces
allow user to find intersection points
allow user to find roots, etc


*/


//globals
var gl = null;
var cam = null;

//function holder for switching between
var plotFunctions = new Array();
plotFunctions['surface']=surfacePlot;
plotFunctions['parametric']=paraPlot;
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
var NUM_X = 10; //number of x values per plot TODO make user controlled in future
var NUM_Y = 10;
var NUM_Z = 10;
var PRECISION = 8;
var RAD_PRECISION = 128;

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
var TAN = tan;
var SQRT = sqrt;
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
   
   document.getElementById("mode").onchange=function(){
      var selectedIndex = document.getElementById("mode").selectedIndex;
      var mode = document.getElementById("mode")[selectedIndex];
      var allModes = document.getElementById("mode");
      for(var i=0; i < allModes.length; i++){
         if(allModes[i].value === mode.value){
            document.getElementById(allModes[i].value+"Input").style="";//display
            document.getElementById("plotButton").onclick=plotFunctions[mode.value];//set correct plotting function to active
         }
         else //hide element
            document.getElementById(allModes[i].value+"Input").style="display : none";            
      }
   }
   //TODO perhaps only gen heightmap and from that construct the vertex arrays as with Terrain.js
   document.getElementById("plotButton").onclick = surfacePlot;

}


//TODO add support for exponentiation x^n, x^(n+m) ==> pow(x,n), pow(x, n+m)...
//do this before implicit multiplication
function cleanExpression(expression){
   //temporarily make 'tan', 'sqrt' unmatchable ('t' is a variable name)
   //hide functions inside of parentheses to make identification easier
   //expression = expression.replace( /(tan|sin|cos|sqrt|pow|arctan|arcsin|arccos)\(.*?\)/g, "($&)");

   expression = expression.replace( /tan/g, "TAN")
                          .replace( /sqrt/g, "SQRT")
                          .replace( /pow/g, "POW");
   //alert(expression.match(/\(.*?\)[\+\-\*\/]\(.*?\)/));//doesn not work... ^2 throws a wrench in it
/*   if( expression.match( /([xytpw]|[0-9]*|\(.*\))\^(\(.*\)|[xytpw0-9]*)/g ) ){
       var matchExp = expression.match( /([xytpw]|[0-9]*|\([xyptw0-9][\+\-\*\/xyptw0-9]*\)|sin\(.*\)|cos\(.*\))\^(\(.*\)|[xytpw]|[0-9]*)/g ); //TODO the parenthesis match is too general, allows multiple parentheses to be contained in eachother
       var str = new String(matchExp);
       alert(str);
       var matches = str.split(",");//(/\(.*\)[\+\-\*\/]\(.*\)/);
       alert(matches);
       for(var i=0; i < matches.length; i++){
          var pieces = matches[i].split("^");
          alert(matches[i]);
          alert(pieces);
          var replaceStr = "POW("+pieces[0]+","+pieces[1]+")";
          expression = expression.replace( matches[i], replaceStr);
       }
       alert(expression);
   }*/
   //alert(expression.match( /([xytpw]|[0-9])([^*+-/,).0-9])/ ));
   //matches for implicit multiplication
   //PATTERN = if (var | constant) not followed by (operation | end parenthesis | comma | decimal | constant) then insert *
   //TODO pattern works fine for representations such as 9x, but not x9...
   if( expression.match( /([xytpw)]|[0-9])(?=[^\^*+-/,).0-9])/ ) ){
      //alert(expression.match( /([xytpw)]|[0-9])(?=[^*+-/,).0-9])/g));
      expression = expression.replace( /([xytpw)]|[0-9])(?=[^\^*+-/,).0-9])/g, '$&*' );
      alert(expression);
   }
   //restore tan, sqrt and return
   expression = expression.replace( /TAN/g, "tan")
                    .replace( /SQRT/g, "sqrt")
                    .replace( /POW/g, "pow");
   alert(expression);
   return expression;
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
   //TODO issue is that a_Color is being used need to disable
   gl.drawArrays(gl.POINTS, 0, verts.length/3);//TODO no more than 6 points can be displayed...
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function plotWireFrame(gl, heights){
   alert("works!!!");
}

function plotTriangles(gl, heights){

}

function surfacePlot(){
      
      var verts = new Float32Array(3*NUM_X*NUM_Y*PRECISION*PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      //var expression = cleanExpression(document.getElementById("expression").value);
      var expression = document.getElementById("expression").value;
      expression = cleanExpression(expression);
      for(var x=0; x < NUM_X; x+=1/PRECISION){
         for( var y=0; y < NUM_Y; y+=1/PRECISION){
            //here we are switching the y & z values to reflect WebGL practice which is z -> depth, y -> height, my application flips this convention
            verts[index++] = x-NUM_X*0.5; //TODO offset not working... has to do with loop
            verts[index++] = eval(expression);//TODO maybe provide a syntax check on the expression and print out errors to the user
            verts[index++] = y-NUM_Y*0.5;

         }
      }


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
      //plotTriangles(gl, verts);
}
function paraPlot(){
      
      var verts = new Float32Array(3*NUM_X*NUM_Y*PRECISION*PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      var x_expression = document.getElementById("x-expression").value;
      var y_expression = document.getElementById("y-expression").value;
      var z_expression = document.getElementById("z-expression").value;
      
      for( var t=0; t < NUM_X*NUM_Y; t+=1/PRECISION){
         //here we are switching the y & z values to reflect WebGL practice which is z -> depth, y -> height, my application flips this convention
         verts[index++] = eval(x_expression);//-NUM_X*0.5; //TODO offset not working... has to do with loop
         verts[index++] = eval(z_expression);//TODO maybe provide a syntax check on the expression and print out errors to the user
         verts[index++] = eval(y_expression);//y-NUM_Y*0.5;
      }



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
      //plotTriangles(gl, verts);
}
//iterate thru r, t and convert if needed
function cylindPlot(){
      var verts = new Float32Array(3*NUM_Z*PRECISION*2*RAD_PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      var expression = document.getElementById("cylindrical-expression").value;
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
      //plotTriangles(gl, verts);
}
function spherePlot(){
      var verts = new Float32Array(3*RAD_PRECISION*2*RAD_PRECISION); //3 values for each point, 100 points
      //alert(verts.length);
      var index = 0; //keeps track of current vertex value
      var expression = document.getElementById("spherical-expression").value;
      //expression = expression.replace(new RegExp("tan", "g"), "TAN")
      //                       .replace(new RegExp("sqrt", "g"), "SQRT");

      for( p=0; p < PI*2-PI/RAD_PRECISION; p+=PI/RAD_PRECISION){ //theta
         for( w=0; w<PI-PI/RAD_PRECISION; w+=PI/RAD_PRECISION){ //phi
            var r = eval(expression); //ro
            verts[index++] = r*sin(w)*cos(p);
            verts[index++] = r*cos(w);
            verts[index++] = r*sin(w)*sin(p);
         }
      }


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
      //plotTriangles(gl, verts);
}

