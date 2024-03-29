import * as NODE    from 'three/nodes';
import * as THREE   from 'three';

export function getRandomColor() {
  /*
  this function is use to create a random color for better visualization
  */
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
  color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
  }

export function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [((c>>16)&255)/256, ((c>>8)&255)/256, (c&255)/256].map(x=> x.toFixed(5))
    }
    throw new Error('Bad Hex');
}

export function norm(val, max, min) { return (val - min) / (max - min); }

export function levelColor(levels){
  var colorArray = []
  for (var i = 0; i < levels; i++) {
    colorArray.push(hexToRgbA(getRandomColor()))
  }
  return colorArray
}


export function getRandomRGBColor() {
  var r, g, b;
  
  do {
    r = Math.floor(Math.random() / 256); // Random value for red (0-255)
    g = Math.floor(Math.random() / 256); // Random value for green (0-255)
    b = Math.floor(Math.random() / 256); // Random value for blue (0-255)
  } while (r === 255 && g === 255 && b === 255); // Repeat if the color is white
  
  return [r,g,b];
}

//https://discourse.threejs.org/t/vertex-shader-sphere-projection-and-cpu-distance-calculation/56270/17
export function project( v, r, center )
{
	v.sub( center )
	.setLength( r )
	.add( center );
}


export class QuadWorker {
  constructor(_worker,data) {
    this.worker = _worker
  }
  
  sendWork(payload) {
    this.worker.postMessage(payload)
  }

  getWork(quad,positionBuffer,normalBuffer,idx,stringUv){
    
    this.worker.onmessage =(_)=>{
      let webWorkerGeometry  = new THREE.BufferGeometry()
      webWorkerGeometry.type = 'webWorkerGeometry';
      quad.plane.geometry    =  webWorkerGeometry

      webWorkerGeometry.setIndex(idx);
      webWorkerGeometry.setAttribute('position', new THREE.Float32BufferAttribute( positionBuffer, 3 ));
      webWorkerGeometry.setAttribute('normal', new THREE.Float32BufferAttribute( normalBuffer, 3 ));
      webWorkerGeometry.setAttribute('uv', new THREE.Float32BufferAttribute( JSON.parse("[" + stringUv + "]"), 2 ));

      const box3 = new THREE.Box3();
      box3.setFromObject(quad.plane,true)
      quad.plane.geometry.boundingBox=box3
      quad.plane.material = (quad.plane.material.clone())
    }
  }
}

let frustumObj = new THREE.Frustum()
export function quadTreeFrustCulling(camera_,scene_){
  let frustum = frustumObj.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices(  camera_.projectionMatrix,  camera_.matrixWorldInverse ) );
  scene_.traverse( node => {
      if(( node.isMesh)){
          if(node.geometry.type == "webWorkerGeometry"){
          if(( frustum.intersectsBox ( node.geometry.boundingBox ) )){
            //node.material.visible = true
          }else{
            //console.log(node.side,node.w,node.idx)
            // node.material.visible = false
          }
        }
      }
  })
}
