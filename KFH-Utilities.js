//KFH-Utilities.js
function Float32Concat(first, second)
{
    var firstLength = first.length,
        result = new Float32Array(firstLength + second.length);

    result.set(first);
    result.set(second, firstLength);

    return result;
}
function getRandom(min, max, isInt){
   if( isInt == null || !isInt) 
      return Math.random() * (max - min) + min;
   else
      return Math.floor(Math.random() * (max - min+1) + min);
}

//always returns int
function getOddRandom(min, max){
   var num = Math.floor(Math.random() * (max - min+1) + min);
   if(num % 2 == 0){
      if(num == min)
         num++;
      else
         num--;
   }
   return num;
}

function getIdentity4(){
   return new Float32Array([
   1, 0, 0, 0,
   0, 1, 0, 0,
   0, 0, 1, 0,
   0, 0, 0, 1]);
}

function modelMatrixFromPos(pos){
   //return new Float32Array([
   //1, 0, 0, pos.x,
   //0, 1, 0, pos.y,
   //0, 0, 1, pos.z,
   //0, 0, 0, 0]);
   var p = new Float32Array(16);

   p[0] = 1; p[4] = 0; p[8] = 0;  p[12] = pos.x;
   p[1] = 0; p[5] = 1; p[9] = 0;  p[13] = pos.y;
   p[2] = 0; p[6] = 0; p[10] = 1; p[14] = pos.z;
   p[3] = 0; p[7] = 0; p[11] = 0; p[15] = 1;

   return p;
}

function rotationMatrixX(ang){
   var sn = Math.sin(ang*Math.PI/180);
   var cs = Math.cos(ang*Math.PI/180);

   return new Float32Array([
   1,  0,   0, 0,
   0, cs, -sn, 0,
   0, sn,  cs, 0,
   0,  0,   0, 1]);
}

function rotationMatrixY(ang){
   var sn = Math.sin(ang*Math.PI/180);
   var cs = Math.cos(ang*Math.PI/180);

   return new Float32Array([
   cs, 0, sn, 0,
    0, 1,  0, 0,
  -sn, 0, cs, 0,
    0, 0,  0, 1]);
}

function rotationMatrixZ(ang){
   var sn = Math.sin(ang*Math.PI/180);
   var cs = Math.cos(ang*Math.PI/180);

   return new Float32Array([
   cs, -sn, 0, 0,
   sn,  cs, 0, 0,
    0,   0, 1, 0,
    0,   0, 0, 1]);
}

//assumes power of 2 texture because there is no mip-mapping done here
function createTexture(gl, imagePath){
   var texture = gl.createTexture();
   var img = new Image();
   var loaded = false;
   img.onload = function(){
      //set unpacking mode
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, gl.TRUE);
      //bind texture
      gl.bindTexture(gl.TEXTURE_2D, texture);
      //send image data
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      //params
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      //unbind
      gl.bindTexture(gl.TEXTURE_2D, null);
   }
   img.src = imagePath;
   
   return texture;
}

function loadCubeMapTexture(gl, targetFace, texture, imgPath){
   var img = new Image();
   img.onload = function(){
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(targetFace, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
   }
   img.src = imgPath;
}

//TODO add error checking
function compileShaderProgram(gl, vSource, fSource){
   var program = gl.createProgram();

   var vShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vShader, vSource);
   gl.compileShader(vShader);

   var fShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fShader, fSource);
   gl.compileShader(fShader);

   //link program
   gl.attachShader(program, vShader);
   gl.attachShader(program, fShader);
   gl.linkProgram(program);

   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
       alert("Unable to link program, check console for details.");
   }

   return program;
}

