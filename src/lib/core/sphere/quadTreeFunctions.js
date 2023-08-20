import * as THREE          from 'three';
import {norm}              from './utils'
import * as NODE from 'three/nodes';
import {
  lightv2
} from  './../shaders/analyticalNormals'

var lighting = NODE.func(`
float light_(vec4 n, vec3 ld, vec3 cp ) {
  return lightv2(n,ld,cp);
}
`,[lightv2])



export function frontsetData(obj){
    console.log('f')
    var position = obj.config.position
    var scale = obj.config.scale
    var p = new THREE.Vector3(position.x,position.y,position.z)
    var radius = obj.config.radius
    var wp = new THREE.Vector3();
    obj.child.plane.localToWorld(wp)
    wp = wp.sub(p).divideScalar(scale)

    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNode = NODE.texture( obj.texture,newUV)
    var p = obj.child.plane
    var cnt = obj.cnt.clone()
    p.worldToLocal(cnt)
    const displace = textureNode.w.mul(obj.config.displacmentScale).mul(NODE.positionLocal.sub(cnt).normalize())
    p.material.positionNode = p.material.positionNode.add( displace );
    p.material.colorNode = textureNode.xyz
    p.material.colorNode = lighting.call({n:p.material.colorNode,ld:NODE.vec3(100.,100.,100.),cp:NODE.vec3(0.,0.,0.)})
  }  


  export function  backsetData(obj){
    console.log('b')
    var scale = obj.config.scale
    var position = obj.config.position
    var p = new THREE.Vector3(position.x,position.y,position.z)
    var radius = obj.config.radius
    var wp = new THREE.Vector3();
    obj.child.plane.localToWorld(wp)
    wp = wp.sub(p).divideScalar(scale)
    wp.x = - wp.x
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNode = NODE.texture( obj.texture,newUV)
    var p = obj.child.plane
    var cnt = obj.cnt
    p.worldToLocal(obj.cnt)
    const displace = textureNode.w.mul(obj.config.displacmentScale).mul(NODE.positionLocal.sub(cnt).normalize())
    p.material.positionNode = p.material.positionNode.add( displace );
    p.material.colorNode = textureNode.xyz
    p.material.colorNode = lighting.call({n:p.material.colorNode,ld:NODE.vec3(100.,100.,100.),cp:NODE.vec3(0.,0.,0.)})
  }
  
  
  export function rightsetData(obj){
    console.log('r')
    var scale = obj.config.scale
    var position = obj.config.position
    var p = new THREE.Vector3(position.x,position.y,position.z)
    var radius = obj.config.radius
    var wp = new THREE.Vector3();
    obj.child.plane.localToWorld(wp)
    wp = wp.sub(p)
    wp.x = -1*(wp.x + wp.z)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNode = NODE.texture( obj.texture,newUV)
    var p = obj.child.plane
    var cnt = obj.cnt
    p.worldToLocal(obj.cnt)
    const displace = textureNode.w.mul(obj.config.displacmentScale).mul(NODE.positionLocal.sub(cnt).normalize())
    p.material.positionNode = p.material.positionNode.add( displace );
    p.material.colorNode = textureNode.xyz
    p.material.colorNode = lighting.call({n:p.material.colorNode,ld:NODE.vec3(100.,100.,100.),cp:NODE.vec3(0.,0.,0.)})
  } 
  
  
  export function  leftsetData(obj){
    console.log('l')
    var scale = obj.config.scale
    var position = obj.config.position
    var p = new THREE.Vector3(position.x,position.y,position.z)
    var radius = obj.config.radius
    var wp = new THREE.Vector3();
    obj.child.plane.localToWorld(wp)
    wp = wp.sub(p)
    wp.x = (wp.z - wp.x)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNode = NODE.texture( obj.texture,newUV)
    var p = obj.child.plane
    var cnt = obj.cnt
    p.worldToLocal(obj.cnt)
    const displace = textureNode.w.mul(obj.config.displacmentScale).mul(NODE.positionLocal.sub(cnt).normalize())
    p.material.positionNode = p.material.positionNode.add( displace );
    p.material.colorNode = textureNode.xyz
    p.material.colorNode = lighting.call({n:p.material.colorNode,ld:NODE.vec3(100.,100.,100.),cp:NODE.vec3(0.,0.,0.)})
  } 
  
  
  export function topsetData(obj){
    console.log('t')
    var scale = obj.config.scale
    var position = obj.config.position
    var p = new THREE.Vector3(position.x,position.y,position.z)
    var radius = obj.config.radius
    var wp = new THREE.Vector3();
    obj.child.plane.localToWorld(wp)
    wp = wp.sub(p)
    wp.y = -1*(wp.z + wp.y)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNode = NODE.texture( obj.texture,newUV)
    var p = obj.child.plane
    var cnt = obj.cnt
    p.worldToLocal(obj.cnt)
    const displace = textureNode.w.mul(obj.config.displacmentScale).mul(NODE.positionLocal.sub(cnt).normalize())
    p.material.colorNode = textureNode.xyz
    p.material.colorNode = lighting.call({n:p.material.colorNode,ld:NODE.vec3(100.,100.,100.),cp:NODE.vec3(0.,0.,0.)})
    var newP = NODE.float(radius).mul((NODE.positionLocal.sub(cnt).normalize())).add(cnt)
    p.material.positionNode = newP.add( displace );
  } 
  
  export function  bottomsetData(obj){
    console.log('bo')
    var scale = obj.config.scale
    var position = obj.config.position
    var p = new THREE.Vector3(position.x,position.y,position.z)
    var radius = obj.config.radius
    var wp = new THREE.Vector3();
    obj.child.plane.localToWorld(wp)
    wp = wp.sub(p)
    wp.y = (-wp.y + wp.z)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNode = NODE.texture( obj.texture,newUV)
    var p = obj.child.plane
    var cnt = obj.cnt
    p.worldToLocal(obj.cnt)
    const displace = textureNode.w.mul(obj.config.displacmentScale).mul(NODE.positionLocal.sub(cnt).normalize())
    p.material.positionNode = p.material.positionNode.add( displace );
    p.material.colorNode = textureNode.xyz
    p.material.colorNode = lighting.call({n:p.material.colorNode,ld:NODE.vec3(100.,100.,100.),cp:NODE.vec3(0.,0.,0.)})
  }

