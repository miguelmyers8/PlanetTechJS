import * as NODE      from 'three/nodes';
import * as THREE     from 'three';
import renderer       from './render';
import Sphere         from './PlanetTech/sphere/sphere'
import { Planet }     from './PlanetTech/celestialBodies/planet';
import { Moon }     from './PlanetTech/celestialBodies/moon';

import { nodeFrame }  from 'three/addons/renderers/webgl-legacy/nodes/WebGLNodes.js';
import { Atmosphere } from './WorldSpace/Shaders/atmosphereScattering';
import { FirstPersonControls }      from 'three/examples/jsm/controls/FirstPersonControls';
import { getRandomColor,hexToRgbA } from './PlanetTech/engine/utils'
import { CubeMap } from './cubeMap/cubeMap';
import { Space } from './WorldSpace/space';
import {SMAAEffect} from "postprocessing";
import * as Shaders  from  './PlanetTech/shaders/index.js'
import { TileMap } from './cubeMap/tileMap';

 console.log(NODE)

let D = [
  new THREE.TextureLoader().load('./planet2/r_image.png'),
  new THREE.TextureLoader().load('./planet2/l_image.png'),
  new THREE.TextureLoader().load('./planet2/t_image.png'),
  new THREE.TextureLoader().load('./planet2/bo_image.png'),
  new THREE.TextureLoader().load('./planet2/f_image.png'),
  new THREE.TextureLoader().load('./planet2/b_image.png'),
  ]
let N = [
  new THREE.TextureLoader().load('./planet2/nr_image.png'),
  new THREE.TextureLoader().load('./planet2/nl_image.png'),
  new THREE.TextureLoader().load('./planet2/nt_image.png'),
  new THREE.TextureLoader().load('./planet2/nbo_image.png'),
  new THREE.TextureLoader().load('./planet2/nf_image.png'),
  new THREE.TextureLoader().load('./planet2/nb_image.png'),
]

class ViewGL {
  constructor() {
  }
  
  render(canvasViewPort) {
    this.rend = renderer;
    this.rend.WebGLRenderer(canvasViewPort);
    this.rend.antialias = false
    this.rend.stencil   = false
    this.rend.depth     = false
    this.rend.scene();
    this.rend.stats();
    this.rend.camera();
    this.rend.updateCamera(0,0,12756000*1.2)
    this.rend.orbitControls()
    this.rend.renderer.setClearColor('white');
    this.space = new Space()
  }
  
  initViewPort(canvasViewPort) {
  this.canvasViewPort = canvasViewPort;
  }

  async initCubeMapPlanet() {
    const download = false
    const tileMapDownload = false

    /*const displacmentMaps = new CubeMap(false)
    displacmentMaps.build(2512,this.rend.renderer)
    displacmentMaps.simplexNoiseFbm({
      inScale:            4.5,
      scale:              4.5,
      seed:               0.0,
      normalScale:        .08,
      redistribution:      2.,
      persistance:        .35,
      lacunarity:          2.,
      iteration:           10,
      terbulance:       false,
      ridge:            false,
    })
    displacmentMaps.snapShot(download)
    
    let tileMap = new TileMap(2,3,false)
    tileMap.build(2512,displacmentMaps.rtt.renderer_)
    tileMap.addTextures(displacmentMaps.textuerArray) 
    tileMap.snapShot(tileMapDownload)
    this.textuerArray = tileMap.textuerArray
    let D = tileMap.textuerArray*/
    //----------------
    const normalMaps = new CubeMap(true)
    normalMaps.build(1512,this.rend.renderer)
    normalMaps.simplexFbm({
      inScale:          4.5,
      scale_:           4.5,
      seed_:            0.0,
      normalScale:      .08,
      redistribution_:   2.,
      persistance_:     .35,
      lacunarity_:       2.,
      iteration_:        10,
      terbulance_:    false,
      ridge_:         false,
    })
    normalMaps.simplexFbm({
      inScale:             2.5,
      scale_:              2.5,
      seed_:               0.0,
      normalScale:        .08,
      redistribution_:      2.,
      persistance_:        .35,
      lacunarity_:          3.,
      iteration_:           15,
      terbulance_:       true,
      ridge_:            false,
    },
    (previous,current)=>{
      current = NODE.float(1).sub(current)
      let t1 = NODE.mix(current,previous,previous)
      return   t1  
    })
    normalMaps.snapShot(download,{
      scale:    2.25,  
      epsilon: 0.0025,  
      strength:   1.,    
      })
    let tileMapN = new TileMap(2,4,true)
    tileMapN.build(1512,normalMaps.rtt.renderer_)
    tileMapN.addTextures(normalMaps.textuerArray) 
    tileMapN.snapShot(tileMapDownload)
    let N = tileMapN.textuerArray
    //-----------------

    this.moon = new Moon({
      size:                21000,
      polyCount:              30,
      quadTreeDimensions:      1,
      levels:                  5,
      radius:           12756000,
      displacmentScale:  20000.0,
      lodDistanceOffset:   818.0,
      material: new NODE.MeshBasicNodeMaterial(),
    })
    this.moon.textuers(N,N)
    this.moon.light(NODE.vec3(0.0,-8.5,8.5))
    this.quads = this.moon.getAllInstance()
    this.rend.scene_.add( this.moon.sphere);
    const light = new THREE.AmbientLight( 0x404040,35 ); // soft white light
    this.rend.scene_.add( light );
    console.log(this.moon.metaData())
  }
  
  initPlanet() {
    this.planet = new Planet({
      size:            10000,
      polyCount:          30,
      quadTreeDimensions:  1,
      levels:              5,
      radius:          80000,
      displacmentScale: 80.5,
      lodDistanceOffset: 12.4,
      material: new NODE.MeshPhysicalNodeMaterial(),
        },'Terranox')
    this.planet.textuers(N,D)
    this.planet.light   (NODE.vec3(0.0,8.0,8.0))

    this.space.initComposer()
    this.space.addPlanets(this.planet,{
      PLANET_CENTER:      this.planet.metaData().cnt.clone(),
      PLANET_RADIUS:      this.planet.metaData().radius,
      ATMOSPHERE_RADIUS:  50000*2.0,
      lightDir:           new THREE.Vector3(0,0,1),
      ulight_intensity:   new THREE.Vector3(7.0,7.0,7.0),
      uray_light_color:   new THREE.Vector3(5,5,5),
      umie_light_color:   new THREE.Vector3(5,5,5),
      RAY_BETA:           new THREE.Vector3(5.5e-6, 13.0e-6, 22.4e-6),
      MIE_BETA:           new THREE.Vector3(21e-6, 21e-6, 21e-6),
      AMBIENT_BETA:       new THREE.Vector3(0.0),
      ABSORPTION_BETA:    new THREE.Vector3(2.04e-5, 4.97e-5, 1.95e-6),
      HEIGHT_RAY:        .5e3,
      HEIGHT_MIE:       .25e3,
      HEIGHT_ABSORPTION: 30e3,
      ABSORPTION_FALLOFF: 4e3,
      PRIMARY_STEPS:        8,
      LIGHT_STEPS:          4,
      G:                  0.7,
    })
    this.space.setAtmosphere()
    this.space.addEffects([new SMAAEffect()])

    const light = new THREE.AmbientLight( 0x404040,35 ); // soft white light
    this.rend.scene_.add( light );
    this.rend.scene_.add( this.planet.sphere );
  }
  
  initPlayer(){
    var boxGeometry        = new THREE.BoxGeometry( 10.1, 10.1, 10.1, 1 )
    var boxMaterial        = new THREE.MeshBasicMaterial({color:'red'});
    this.player            = new THREE.Mesh( boxGeometry, boxMaterial );
    this.player.position.z = this.rend.camera_.position.z
    this.controls               = new FirstPersonControls( this.player, document.body );
    this.controls.movementSpeed = 500*250
    this.controls.lookSpeed     = 0
    this.clock = new THREE.Clock();
    this.rend.scene_.add(this.player)
  }
  
  start() {
    this.render(this.canvasViewPort);
    this.initCubeMapPlanet()
    this.initPlayer()
    this.update();
  }
  

  onWindowResize(vpW, vpH) {
    this.rend.renderer.setSize(vpW, vpH);
  }

  update(t) {
    requestAnimationFrame(this.update.bind(this));
    if(this.moon){
      this.controls.update(this.clock.getDelta())
      //this.moon.update(this.player)
    }
    nodeFrame.update();
    this.rend.renderer.render(this.rend.scene_, this.rend.camera_);
  }

}
  
  
  var viewGL = new ViewGL();
  export default viewGL;