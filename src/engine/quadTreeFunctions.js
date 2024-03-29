import * as THREE  from 'three';
import {norm}      from './utils.js'
import * as NODE   from 'three/nodes';
import * as Shaders from '../shaders/index.js';
import { getRandomColor,hexToRgbA  } from './utils.js';


function tileTransformer(obj){
  let position = obj.config.position
  let initTileRotation = obj.config.dataTransfer[obj.child.side][obj.child.idx].rotation.clone()
  let planetPosition   = new THREE.Vector3(position.x,position.y,position.z) 
  let initTilePosition = obj.config.dataTransfer[obj.child.side][obj.child.idx].position.clone()
  let fposition = initTilePosition.multiplyScalar(obj.config.scale).applyEuler(initTileRotation).add(planetPosition)
  return fposition
}

export function frontsetData(obj){
    console.log('f')
    var position = (obj.config.isTiles) ? tileTransformer(obj) : obj.config.position
    var scale = obj.config.scale
    var wp =  obj.child.plane.localToWorld(new THREE.Vector3())
    wp = wp.sub(position).divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNodeN = NODE.texture(obj.texture[0],newUV)
    var textureNodeD = NODE.texture(obj.texture[1],newUV).r
    var p = obj.child.plane
    const displace = textureNodeD.mul(obj.config.displacmentScale).mul(NODE.normalLocal).add(NODE.positionLocal)
    p.material.positionNode = displace;
    p.material.colorNode = textureNodeN.xyz//.mul(NODE.vec3(...hexToRgbA(getRandomColor())))
    //p.material.colorNode = Shaders.defualtLight({normalMap:p.material.colorNode,lightPosition:obj.config.light.ld,cP:NODE.vec3(0.,0.,0.)})
  }  


  export function  backsetData(obj){
    console.log('b')
    var position = (obj.config.isTiles) ? tileTransformer(obj) : obj.config.position
    var scale = obj.config.scale
    var wp =  obj.child.plane.localToWorld(new THREE.Vector3())
    wp = wp.sub(position).divideScalar(scale)
    wp.x = - wp.x
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNodeN = NODE.texture(obj.texture[0],newUV)
    var textureNodeD = NODE.texture(obj.texture[1],newUV).r
    var p = obj.child.plane
    const displace = textureNodeD.mul(obj.config.displacmentScale).mul(NODE.normalLocal).add(NODE.positionLocal)
    p.material.positionNode = displace;
    p.material.colorNode = textureNodeN.xyz//.mul(NODE.vec3(...hexToRgbA(getRandomColor())))
    //p.material.colorNode = Shaders.defualtLight({normalMap:p.material.colorNode,lightPosition:obj.config.light.ld,cP:NODE.vec3(0.,0.,0.)})
  }
  
  
  export function rightsetData(obj){
    console.log('r')
    var position = (obj.config.isTiles) ? tileTransformer(obj) : obj.config.position
    var scale = obj.config.scale
    var wp =  obj.child.plane.localToWorld(new THREE.Vector3())
    wp = wp.sub(position)
    wp.x = -1*(wp.x + wp.z)
    wp.divideScalar(scale) 
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNodeN = NODE.texture(obj.texture[0],newUV)
    var textureNodeD = NODE.texture(obj.texture[1],newUV).r
    var p = obj.child.plane
    const displace = textureNodeD.mul(obj.config.displacmentScale).mul(NODE.normalLocal).add(NODE.positionLocal)
    p.material.positionNode = displace;
    p.material.colorNode = textureNodeN.xyz//.mul(NODE.vec3(...hexToRgbA(getRandomColor())))
    //p.material.colorNode = Shaders.defualtLight({normalMap:p.material.colorNode,lightPosition:obj.config.light.ld,cP:NODE.vec3(0.,0.,0.)})
  } 
  
  
  export function  leftsetData(obj){
    console.log('l')
    var position = (obj.config.isTiles) ? tileTransformer(obj) : obj.config.position
    var scale = obj.config.scale
    var wp =  obj.child.plane.localToWorld(new THREE.Vector3())
    wp = wp.sub(position)
    wp.x = (wp.z - wp.x)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNodeN = NODE.texture(obj.texture[0],newUV)
    var textureNodeD = NODE.texture(obj.texture[1],newUV).r
    var p = obj.child.plane
    const displace = textureNodeD.mul(obj.config.displacmentScale).mul(NODE.normalLocal).add(NODE.positionLocal)
    p.material.positionNode = displace;
    p.material.colorNode = textureNodeN.xyz//.mul(NODE.vec3(...hexToRgbA(getRandomColor())))
   // p.material.colorNode = Shaders.defualtLight({normalMap:p.material.colorNode,lightPosition:obj.config.light.ld,cP:NODE.vec3(0.,0.,0.)})
  } 
  
  
  export function topsetData(obj){
    console.log('t')
    var position = (obj.config.isTiles) ? tileTransformer(obj) : obj.config.position
    var scale = obj.config.scale
    var wp =  obj.child.plane.localToWorld(new THREE.Vector3())
    wp = wp.sub(position)
    wp.y = -1*(wp.z + wp.y)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNodeN = NODE.texture(obj.texture[0],newUV)
    var textureNodeD = NODE.texture(obj.texture[1],newUV).r
    var p = obj.child.plane
    const displace = textureNodeD.mul(obj.config.displacmentScale).mul(NODE.normalLocal).add(NODE.positionLocal)
    p.material.positionNode = displace;
    p.material.colorNode = textureNodeN.xyz//.mul(NODE.vec3(...hexToRgbA(getRandomColor())))
    //p.material.colorNode = Shaders.defualtLight({normalMap:p.material.colorNode,lightPosition:obj.config.light.ld,cP:NODE.vec3(0.,0.,0.)})
  } 
  
  export function  bottomsetData(obj){
    console.log('bo')
    var position = (obj.config.isTiles) ? tileTransformer(obj) : obj.config.position
    var scale = obj.config.scale
    var wp =  obj.child.plane.localToWorld(new THREE.Vector3())
    wp = wp.sub(position)
    wp.y = (-wp.y + wp.z)
    wp.divideScalar(scale)
    var nxj = norm(wp.x,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var nyj = norm(wp.y,Math.abs(obj.starting/2),-Math.abs(obj.starting/2))
    var offSets = NODE.vec2(nxj-obj.halfScale,nyj-obj.halfScale)
    var newUV = NODE.uv().mul(obj.scaling).add(offSets)
    var textureNodeN = NODE.texture(obj.texture[0],newUV)
    var textureNodeD = NODE.texture(obj.texture[1],newUV).r
    var p = obj.child.plane
    const displace = textureNodeD.mul(obj.config.displacmentScale).mul(NODE.normalLocal).add(NODE.positionLocal)
    p.material.positionNode = displace;
    p.material.colorNode = textureNodeN.xyz//.mul(NODE.vec3(...hexToRgbA(getRandomColor())))
    //p.material.colorNode = Shaders.defualtLight({normalMap:p.material.colorNode,lightPosition:obj.config.light.ld,cP:NODE.vec3(0.,0.,0.)})
  }

