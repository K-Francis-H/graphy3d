/******************************************************
*   LINEAR FOG SHADERS
******************************************************/
var FOG_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_Model;\n' +
  'uniform mat4 u_View;\n' +
  'uniform mat4 u_Projection;\n' +
  'uniform vec4 u_Eye;\n' +     // Position of eye point (world coordinates)
  'uniform vec4 u_Color;\n'+
  'varying vec4 v_Color;\n' +
  'varying float v_Dist;\n' +
  'void main() {\n' +
  '  mat4 mvp = u_Projection * u_View * u_Model;\n' +
  '  gl_Position = mvp * a_Position ;\n' +
  '  v_Color = u_Color;\n' +
     // Calculate the distance to each vertex from eye point
  '  v_Dist = distance(u_View * a_Position, u_Eye);//gl_Position.w;//distance(u_Model * a_Position, u_Eye);\n' +
  '}\n';

// Fog Fragment shader program
var FOG_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_FogColor;\n' + // Color of Fog
  'uniform vec2 u_FogDist;\n' +  // Distance of Fog (starting point, end point)
  'varying vec4 v_Color;\n' +
  'varying float v_Dist;\n' +
  'void main() {\n' +
  '  float fogFactor = ((2.0 - v_Dist)/(2.0-0.5));//exp2( -density * density * z * z * LOG2);\n'+
  '  fogFactor = clamp(fogFactor, 0.0, 1.0);\n'+
  '  gl_FragColor = mix( vec4(0,0,0,1.0), v_Color, fogFactor);//vec4(color, 0.2);\n' +
  '}\n';


/*************************************************************
*   TEXTURE SHADERS
*************************************************************/
// Texture Vertex shader program
var TEXTURE_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_Model;\n' +
  'uniform mat4 u_View;\n' +
  'uniform mat4 u_Projection;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  mat4 mvp = u_Projection * u_View * u_Model;\n' +
  '  gl_Position =  mvp * a_Position ;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Texture Fragment shader program
var TEXTURE_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);// + vec4(1.0, 0.34, 0.45, 1.0);\n' +
  '}\n';


/*****************************************************************
*    SOLID COLOR SHADERS
*****************************************************************/
//No-Texture Vertex Shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_Model;\n' +
  'uniform mat4 u_View;\n' +
  'uniform mat4 u_Projection;\n' +
  'uniform vec4 u_Color;\n'+
  'uniform bool u_Using_a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  mat4 mvp = u_Projection * u_View * u_Model;\n' +
  '  gl_Position =  mvp * a_Position ;\n' +
  '  if(u_Using_a_Color == true){\n' +
  '     v_Color =  a_Color;//vec4(u_Color.x, u_Color.y, a_Position.y*0.5, 1.0);//u_Color;\n' +
  '  }else{\n' +
  '     v_Color = u_Color;\n' +
  '  }\n' +
  '}\n';

// No-Texture Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '     gl_FragColor = v_Color;\n' +
  '  //gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n' +
  '}\n';

