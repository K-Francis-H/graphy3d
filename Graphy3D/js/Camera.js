//Camera.js
//requires Vector3.js, Matrix4.js

function Camera(eye, look, up){
   this.eye = eye;
   this.look = look;
   //n = eye - look
   this.n = new Vector3( (eye.x - look.x), (eye.y - look.y), (eye.z - look.z) );
   //u = up x n ==> u is perpendicular to up, n
   this.u = up.cross(this.n);
   //normalization
   this.u.normalize();
   this.n.normalize();
   // v = n x u => v is perpendicular to n, u
   this.v = this.n.cross(this.u);

   //2 4x4 matrices
   //to access do not call directly use the getter methods
   //the getters will make sure that the ModelView and Projection
   //matrices are not null or zeros.
   this.View = new Float32Array(16);
   this.Projection = new Float32Array(16);
   
   //set ModelView Matrix with these vectors
   
   //methods
   this.set = set;
   this.lookAt = lookAt;
   this.rotateAbout = rotateAbout; //TODO Alternatively you could use the set function to acheive this...
   //add rotateAbout function
   this.setShape = setShape;
   this.roll = roll;
   this.pitch = pitch;
   this.yaw = yaw;
   this.FPSyaw = FPSyaw;
   this.slide = slide;
   //this.scale = scale;
   this.setFrustum = setFrustum;
   //this.setPerspective = setPerspective; setShape
   this.setOrtho = setOrtho; 
   this.setViewMatrix = setViewMatrix;//sets modelview matrix, loads uniform into vertex shader

   //set the View Matrix from vectors
   this.setViewMatrix();
}
//implement methods here
function set(eye, look, up){
   this.eye = eye;
   this.look = look;
   //n = eye - look
   this.n = new Vector3( (eye.x - look.x), (eye.y - look.y), (eye.z - look.z) );
   //u = up x n ==> u is perpendicular to up, n
   this.u = up.cross(this.n);
   //normalization
   this.u.normalize();
   this.n.normalize();
   // v = n x u => v is perpendicular to n, u
   this.v = this.n.cross(this.u);

   //set View
   this.setViewMatrix();
}

function lookAt(look, y, z){
 
   if( !(look instanceof Vector3) ){//if look is an x coord not a Vector3 object
      this.look = new Vector3( look, y, z);

   }
   else{//look is a vector
      this.look = look;
   }
   this.n = new Vector3( (this.eye.x - look.x), (this.eye.y - look.y), (this.eye.z - look.z) );
   var up = new Vector3(0,1,0); //TODO start storing up in Camera object in case we want axis skew
   this.u = up.cross(this.n);
   this.u.normalize();
   this.n.normalize();
   this.v = this.n.cross(this.u);
   this.setViewMatrix();
}

//TODO
function rotateAbout(point, y, z, angle){
   //subtract point from camera position (origin)
   
   //rotate with sin and cosine in xz plane (do not modify y value
}

function roll(angle){
   var cs = Math.cos(angle*(Math.PI/180));
   var sn = Math.sin(angle*(Math.PI/180));
   var t = this.u; //tmp Vector3 t = u
   this.u.set3f( (cs*t.x - sn*this.v.x), (cs*t.y - sn*this.v.y), (cs*t.z - sn*this.v.z));
   this.v.set3f( (sn*t.x + cs*this.v.x), (sn*t.y + cs*this.v.y), (sn*t.z + cs*this.v.z));
   this.setViewMatrix(); //update modelview matrix
}

function pitch(angle){
   var cs = Math.cos(angle*(Math.PI/180));
   var sn = Math.sin(angle*(Math.PI/180));
   var t = this.n; //tmp Vector3 t = n
   this.n.set3f( (cs*t.x - sn*this.v.x), (cs*t.y - sn*this.v.y), (cs*t.z - sn*this.v.z));
   this.v.set3f( (sn*t.x + cs*this.v.x), (sn*t.y + cs*this.v.y), (sn*t.z + cs*this.v.z));
   this.setViewMatrix();
}

function yaw(angle){
   var cs = Math.cos(angle*(Math.PI/180));
   var sn = Math.sin(angle*(Math.PI/180));
   var t = this.n; // tmp Vector3 t = n
   this.n.set3f( (cs*t.x - sn*this.u.x), (cs*t.y - sn*this.u.y), (cs*t.z - sn*this.u.z));
   this.u.set3f( (sn*t.x + cs*this.u.x), (sn*t.y + cs*this.u.y), (sn*t.z + cs*this.u.z));
   this.setViewMatrix();
}

/**
*FPSyaw() - rotates u,v, and n about the y axis (0, 1, 0);
*
*/
function FPSyaw(angle){
   var cs = Math.cos(angle*(Math.PI/180));
   var sn = Math.sin(angle*(Math.PI/180));

   //temp vectors
   var tn = this.n;
   var tu = this.u;
   var tv = this.v;

   //rotate each about y-axis
   this.n.set3f( (cs*this.n.x - sn*this.n.z), this.n.y, (sn*this.n.x + cs*this.n.z) );
   this.u.set3f( (cs*this.u.x - sn*this.u.z), this.u.y, (sn*this.u.x + cs*this.u.z) );
   this.v.set3f( (cs*this.v.x - sn*this.v.z), this.v.y, (sn*this.v.x + cs*this.v.z) );

   this.setViewMatrix();
}

function slide(delU, delV, delN){
    this.eye.x += (delU * this.u.x) + (delV * this.v.x) + (delN * this.n.x);
    this.eye.y += (delU * this.u.y) + (delV * this.v.y) + (delN * this.n.y);
    this.eye.z += (delU * this.u.z) + (delV * this.v.z) + (delN * this.n.z);

    this.setViewMatrix();
}

function setShape(viewAngle, aspectRatio, near, far){
  //set Projection matrix
  var p = this.Projection;
  var fov = Math.PI * viewAngle / 180 / 2;
  var ct = Math.cos(fov)/Math.sin(fov);

  //need assertions to avoid errors or bad matrix

  p[0] = ct/aspectRatio; p[4] = 0;  p[8] = 0;                       p[12] = 0;
  p[1] = 0;              p[5] = ct; p[9] = 0;                       p[13] = 0;
  p[2] = 0;              p[6] = 0;  p[10] = -(far+near)/(far-near); p[14] = (-2*near*far)/(far-near);
  p[3] = 0;              p[7] = 0;  p[11] = -1;                     p[15] = 0;
  
  this.Projection = p;
}

function setFrustum(left, right, top, bottom, near, far){
  //set Projection Matrix
 //need assertions to avoid errors or bad matrix
  var p = this.Projection;
  p[0] = (2*near)/(right-left); p[4] = 0;                     p[8] = (right+left)/(right-left); p[12] = 0;
  p[1] = 0;                     p[5] = (2*near)/(top-bottom); p[9] = (top+bottom)/(top-bottom); p[13] = 0;
  p[2] = 0;                     p[6] = 0;                     p[10] = -1;                       p[14] = -2*near;
  p[3] = 0;                     p[7] = 0;                     p[11] = -1;                       p[15] = 0;

  this.Projection = p;
}

//not working right now...
function setOrtho( left, right, bottom, top, near, far){
   var p = this.Projection;
 //need assertions to avoid errors or bad matrix

   p[0] = 2/(right-left); p[4] = 0;              p[8] = 0;              p[12] = -(right+left)/(right-left);
   p[1] = 0;              p[5] = 2/(top-bottom); p[9] = 0;              p[13] = -(top+bottom)/(top-bottom);
   p[2] = 0;              p[6] = 0;              p[10] = -2/(far-near); p[14] = -(far+near)/(far-near);
   p[3] = 0;              p[7] = 0;              p[11] = 0;             p[15] = 1;

   this.Projection = p;
}

function setViewMatrix(){
   var v = this.View;
   
   v[0] = this.u.x; v[4] = this.u.y; v[8] = this.u.z;  v[12] = -this.eye.dot(this.u);
   v[1] = this.v.x; v[5] = this.v.y; v[9] = this.v.z;  v[13] = -this.eye.dot(this.v);
   v[2] = this.n.x; v[6] = this.n.y; v[10] = this.n.z; v[14] = -this.eye.dot(this.n);
   v[3] = 0;        v[7] = 0;        v[11] = 0;        v[15] = 1;

   this.View = v;
} 



