import * as THREE  from 'three'
import {SMAAEffect,BlendFunction, Effect, EffectComposer, RenderPass,EffectPass,EffectAttribute, WebGLExtension} from "postprocessing";
import { Uniform, HalfFloatType  } from "three";



const structAtmospheresBlock = `
struct Atmospheres {
  vec3 PLANET_CENTER;
  vec3 lightDir;
  float PLANET_RADIUS;
  float ATMOSPHERE_RADIUS;
  float G;
  int PRIMARY_STEPS;
  int LIGHT_STEPS;
  vec3 ulight_intensity;
  vec3 uray_light_color;
  vec3 umie_light_color;
  vec3 RAY_BETA;
  vec3 MIE_BETA;
  vec3 AMBIENT_BETA;
  vec3 ABSORPTION_BETA;
  float HEIGHT_RAY;
  float HEIGHT_MIE;
  float HEIGHT_ABSORPTION;
  float ABSORPTION_FALLOFF;
  float textureIntensity;
  float AmbientLightIntensity;
};
`
const uniformBlock = `
uniform mat4  inverseProjection;
uniform mat4  inverseView;
uniform vec3  uCameraPosition;
uniform vec3  uCameraDir;
uniform Atmospheres atmospheres[1];
`
const calculateScatteringBlock = `
vec3 calculate_scattering(
	vec3 start, 				// the start of the ray (the camera position)
    vec3 dir, 					// the direction of the ray (the camera vector)
    float max_dist, 			// the maximum distance the ray can travel (because something is in the way, like an object)
    vec3 scene_color,			// the color of the scene
    vec3 light_dir, 			// the direction of the light
    vec3 light_intensity,		// how bright the light is, affects the brightness of the atmosphere
    vec3 ray_light_color,  //mod
    vec3 mie_light_color,  //mod
    vec3 planet_position, 		// the position of the planet
    float planet_radius, 		// the radius of the planet
    float atmo_radius, 			// the radius of the atmosphere
    vec3 beta_ray, 				// the amount rayleigh scattering scatters the colors (for earth: causes the blue atmosphere)
    vec3 beta_mie, 				// the amount mie scattering scatters colors
    vec3 beta_absorption,   	// how much air is absorbed
    vec3 beta_ambient,			// the amount of scattering that always occurs, cna help make the back side of the atmosphere a bit brighter
    float g, 					// the direction mie scatters the light in (like a cone). closer to -1 means more towards a single direction
    float height_ray, 			// how high do you have to go before there is no rayleigh scattering?
    float height_mie, 			// the same, but for mie
    float height_absorption,	// the height at which the most absorption happens
    float absorption_falloff,	// how fast the absorption falls off from the absorption height
    int steps_i, 				// the amount of steps along the 'primary' ray, more looks better but slower
    int steps_l 				// the amount of steps along the light ray, more looks better but slower
) {
    // add an offset to the camera position, so that the atmosphere is in the correct position
    start -= planet_position;
    // calculate the start and end position of the ray, as a distance along the ray
    // we do this with a ray sphere intersect
    float a = dot(dir, dir);
    float b = 2.0 * dot(dir, start);
    float c = dot(start, start) - (atmo_radius * atmo_radius);
    float d = (b * b) - 4.0 * a * c;
    
    // stop early if there is no intersect
    if (d < 0.0) return scene_color;
    
    // calculate the ray length
    vec2 ray_length = vec2(
        max((-b - sqrt(d)) / (2.0 * a), 0.0),
        min((-b + sqrt(d)) / (2.0 * a), max_dist)
    );
    
    // if the ray did not hit the atmosphere, return a black color
    if (ray_length.x > ray_length.y) return scene_color;
    // prevent the mie glow from appearing if there's an object in front of the camera
    bool allow_mie = max_dist > ray_length.y;
    // make sure the ray is no longer than allowed
    ray_length.y = min(ray_length.y, max_dist);
    ray_length.x = max(ray_length.x, 0.0);
    // get the step size of the ray
    float step_size_i = (ray_length.y - ray_length.x) / float(steps_i);
    
    // next, set how far we are along the ray, so we can calculate the position of the sample
    // if the camera is outside the atmosphere, the ray should start at the edge of the atmosphere
    // if it's inside, it should start at the position of the camera
    // the min statement makes sure of that
    float ray_pos_i = ray_length.x + step_size_i * 0.5;
    
    // these are the values we use to gather all the scattered light
    vec3 total_ray = vec3(0.0); // for rayleigh
    vec3 total_mie = vec3(0.0); // for mie
    
    // initialize the optical depth. This is used to calculate how much air was in the ray
    vec3 opt_i = vec3(0.0);
    
    // also init the scale height, avoids some vec2's later on
    vec2 scale_height = vec2(height_ray, height_mie);
    
    // Calculate the Rayleigh and Mie phases.
    // This is the color that will be scattered for this ray
    // mu, mumu and gg are used quite a lot in the calculation, so to speed it up, precalculate them
    float mu = dot(dir, light_dir);
    float mumu = mu * mu;
    float gg = g * g;
    float phase_ray = 3.0 / (50.2654824574 /* (16 * pi) */) * (1.0 + mumu);
    float phase_mie = allow_mie ? 3.0 / (25.1327412287 /* (8 * pi) */) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg)) : 0.0;
    
    // now we need to sample the 'primary' ray. this ray gathers the light that gets scattered onto it
    for (int i = 0; i < steps_i; ++i) {
        
        // calculate where we are along this ray
        vec3 pos_i = start + dir * ray_pos_i;
        
        // and how high we are above the surface
        float height_i = length(pos_i) - planet_radius;
        
        // now calculate the density of the particles (both for rayleigh and mie)
        vec3 density = vec3(exp(-height_i / scale_height), 0.0);
        
        // and the absorption density. this is for ozone, which scales together with the rayleigh, 
        // but absorbs the most at a specific height, so use the sech function for a nice curve falloff for this height
        // clamp it to avoid it going out of bounds. This prevents weird black spheres on the night side
        float denom = (height_absorption - height_i) / absorption_falloff;
        density.z = (1.0 / (denom * denom + 1.0)) * density.x;
        
        // multiply it by the step size here
        // we are going to use the density later on as well
        density *= step_size_i;
        
        // Add these densities to the optical depth, so that we know how many particles are on this ray.
        opt_i += density;
        
        // Calculate the step size of the light ray.
        // again with a ray sphere intersect
        // a, b, c and d are already defined
        a = dot(light_dir, light_dir);
        b = 2.0 * dot(light_dir, pos_i);
        c = dot(pos_i, pos_i) - (atmo_radius * atmo_radius);
        d = (b * b) - 4.0 * a * c;

        // no early stopping, this one should always be inside the atmosphere
        // calculate the ray length
        float step_size_l = (-b + sqrt(d)) / (2.0 * a * float(steps_l));

        // and the position along this ray
        // this time we are sure the ray is in the atmosphere, so set it to 0
        float ray_pos_l = step_size_l * 0.5;

        // and the optical depth of this ray
        vec3 opt_l = vec3(0.0);
            
        // now sample the light ray
        // this is similar to what we did before
        for (int l = 0; l < steps_l; ++l) {

            // calculate where we are along this ray
            vec3 pos_l = pos_i + light_dir * ray_pos_l;

            // the heigth of the position
            float height_l = length(pos_l) - planet_radius;

            // calculate the particle density, and add it
            // this is a bit verbose
            // first, set the density for ray and mie
            vec3 density_l = vec3(exp(-height_l / scale_height), 0.0);
            
            // then, the absorption
            float denom = (height_absorption - height_l) / absorption_falloff;
            density_l.z = (1.0 / (denom * denom + 1.0)) * density_l.x;
            
            // multiply the density by the step size
            density_l *= step_size_l;
            
            // and add it to the total optical depth
            opt_l += density_l;
            
            // and increment where we are along the light ray.
            ray_pos_l += step_size_l;
            
        }
        
        // Now we need to calculate the attenuation
        // this is essentially how much light reaches the current sample point due to scattering
        vec3 attn = exp(-beta_ray * (opt_i.x + opt_l.x) - beta_mie * (opt_i.y + opt_l.y) - beta_absorption * (opt_i.z + opt_l.z));

        // accumulate the scattered light (how much will be scattered towards the camera)
        total_ray += density.x * attn;
        total_mie += density.y * attn;

        // and increment the position on this ray
        ray_pos_i += step_size_i;
    	
    }
    
    // calculate how much light can pass through the atmosphere
    vec3 opacity = exp(-(beta_mie * opt_i.y + beta_ray * opt_i.x + beta_absorption * opt_i.z));
    
	// calculate and return the final color
    return (
        	phase_ray * beta_ray * total_ray * ray_light_color// rayleigh color
       		+ phase_mie * beta_mie * total_mie * mie_light_color// mie
            + opt_i.x * beta_ambient // and ambient
    ) * light_intensity + scene_color * opacity; // now make sure the background is rendered correctly
}
`
const screenToWorldBlock = `
vec3 _ScreenToWorld(vec3 posS) {
  vec2 uv = posS.xy;
  float z = posS.z;
  float nearZ = 0.01;
  float farZ = cameraFar;
  float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
    vec3 direction = (inverseProjection * vec4(vUv * 2.0 - 1.0, 0.0, 1.0)).xyz; //vUv bug
    direction = (inverseView * vec4(direction, 0.0)).xyz;
    direction = normalize(direction);
  direction /= dot(direction, uCameraDir);
  return uCameraPosition + direction * depth;
}

`

const postFragmentShader =
  `
  ${structAtmospheresBlock}

  ${uniformBlock}
  
  ${calculateScatteringBlock}
  
  ${screenToWorldBlock}

  vec2 ray_sphere_intersect(
    vec3 start, // starting position of the ray
    vec3 dir, // the direction of the ray
    float radius // and the sphere radius
) {
    // ray-sphere intersection that assumes
    // the sphere is centered at the origin.
    // No intersection when result.x > result.y
    float a = dot(dir, dir);
    float b = 2.0 * dot(dir, start);
    float c = dot(start, start) - (radius * radius);
    float d = (b*b) - 4.0*a*c;
    if (d < 0.0) return vec2(1e5,-1e5);
    return vec2(
        (-b - sqrt(d))/(2.0*a),
        (-b + sqrt(d))/(2.0*a)
    );
}


vec3 skylight(vec3 sample_pos, vec3 surface_normal, vec3 light_dir, vec3 background_col) {

  surface_normal = normalize(mix(surface_normal, light_dir, 0.6));
  Atmospheres currentAtmospheres = atmospheres[0];

  return calculate_scattering(
    sample_pos,						// the position of the camera
      surface_normal, 				// the camera vector (ray direction of this pixel)
      3.0 * currentAtmospheres.ATMOSPHERE_RADIUS, 			// max dist, since nothing will stop the ray here, just use some arbitrary value
      background_col,					// scene color, just the background color here
      light_dir,						// light direction
      currentAtmospheres.ulight_intensity,						// light intensity, 40 looks nice
      currentAtmospheres.uray_light_color,
      currentAtmospheres.umie_light_color,
      currentAtmospheres.PLANET_CENTER,						// position of the planet
      currentAtmospheres.PLANET_RADIUS,                  // radius of the planet in meters
      currentAtmospheres.ATMOSPHERE_RADIUS,                   // radius of the atmosphere in meters
      currentAtmospheres.RAY_BETA,						// Rayleigh scattering coefficient
      currentAtmospheres.MIE_BETA,                       // Mie scattering coefficient
      currentAtmospheres.ABSORPTION_BETA,                // Absorbtion coefficient
      currentAtmospheres.AMBIENT_BETA,					// ambient scattering, turned off for now. This causes the air to glow a bit when no light reaches it
      currentAtmospheres.G,                          	
      currentAtmospheres.HEIGHT_RAY,                     
      currentAtmospheres.HEIGHT_MIE,                     
      currentAtmospheres.HEIGHT_ABSORPTION,
      currentAtmospheres.ABSORPTION_FALLOFF,				
      currentAtmospheres.PRIMARY_STEPS, 					
      currentAtmospheres.LIGHT_STEPS 		
  );
}



  vec4 render_scene(vec3 pos, vec3 dir, vec3 light_dir, vec3 addColor, vec3 PLANET_POS, float PLANET_RADIUS, float AmbientLightIntensity) {
    
    // the color to use, w is the scene depth
    vec4 color = vec4(addColor, 1e25);
    
    // add a sun, if the angle between the ray direction and the light direction is small enough, color the pixels white
    //color.xyz = vec3(dot(dir, light_dir) > 0.9998 ? 3.0 : 0.0);
    
    // get where the ray intersects the planet
    vec2 planet_intersect = ray_sphere_intersect(pos - PLANET_POS, dir, PLANET_RADIUS); 
    
    // if the ray hit the planet, set the max distance to that ray
    if (0.0 < planet_intersect.y) {
    	//color.w = max(planet_intersect.x, 0.0);
        
        // sample position, where the pixel is
        vec3 sample_pos = pos + (dir * planet_intersect.x) - PLANET_POS;
        
        // and the surface normal
        vec3 surface_normal = normalize(sample_pos);
        
        // get the color of the sphere
        color.xyz = addColor; 
        
        // get wether this point is shadowed, + how much light scatters towards the camera according to the lommel-seelinger law
        vec3 N = surface_normal;
        vec3 V = -dir;
        vec3 L = light_dir;
        float dotNV = max(1e-6, dot(N, V));
        float dotNL = max(1e-6, dot(N, L));
        float shadow = dotNL / (dotNL + dotNV);
        
        // apply the shadow
        color.xyz *= shadow + AmbientLightIntensity;
        
        // apply skylight
        //color.xyz += clamp(skylight(sample_pos, surface_normal, light_dir, vec3(0.0)) * addColor, 0.0, 1.0);
    }
    
	return color;
}


  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {

    float d           = texture2D(depthBuffer, uv).x;
    vec3 posWS        = _ScreenToWorld(vec3(uv, d));
    vec3 rayOrigin    = uCameraPosition;
    vec3 rayDirection = normalize(posWS - uCameraPosition);
    float sceneDepth  = length(posWS.xyz - uCameraPosition);
    vec3 addColor     = inputColor.xyz;
    vec3 col          = vec3(0.0);

    Atmospheres currentAtmospheres = atmospheres[0];
    vec3 lightDirection = normalize(currentAtmospheres.lightDir);

    addColor *= currentAtmospheres.textureIntensity;

    /*addColor = render_scene(
      rayOrigin, 
      rayDirection, 
      lightDirection,
      addColor,
      currentAtmospheres.PLANET_CENTER,
      currentAtmospheres.PLANET_RADIUS,
      currentAtmospheres.AmbientLightIntensity
      ).rgb;*/

    col += calculate_scattering(
      rayOrigin,
      rayDirection,
      sceneDepth,
      addColor,
      lightDirection,
      currentAtmospheres.ulight_intensity,
      currentAtmospheres.uray_light_color,
      currentAtmospheres.umie_light_color,
      currentAtmospheres.PLANET_CENTER,
      currentAtmospheres.PLANET_RADIUS,
      currentAtmospheres.ATMOSPHERE_RADIUS,
      currentAtmospheres.RAY_BETA,
      currentAtmospheres.MIE_BETA,
      currentAtmospheres.ABSORPTION_BETA,                
      currentAtmospheres.AMBIENT_BETA,					
      currentAtmospheres.G,                          	
      currentAtmospheres.HEIGHT_RAY,                     
      currentAtmospheres.HEIGHT_MIE,                     
      currentAtmospheres.HEIGHT_ABSORPTION,
      currentAtmospheres.ABSORPTION_FALLOFF,				
      currentAtmospheres.PRIMARY_STEPS, 					
      currentAtmospheres.LIGHT_STEPS 					
    );

    col = 1.0 - exp(-col);

    outputColor = vec4(col, 1.0);
  }
`;

const cameraDir = new THREE.Vector3();

export class Atmosphere{
    constructor() {
    }
  
    createcomposer(params,camera_){
         class CustomEffect extends Effect {
          constructor() {
            camera_.getWorldDirection(cameraDir);
            super("CustomEffect", postFragmentShader, {
              uniforms: new Map([
                ["atmospheres",       new Uniform(params)],
                ["uCameraPosition",   new Uniform(camera_.position)],
                ["inverseProjection", new Uniform(camera_.projectionMatrixInverse)],
                ["inverseView",       new Uniform(camera_.matrixWorld)],
                ["uCameraDir",        new Uniform(cameraDir)],
              ]),
              attributes: EffectAttribute.DEPTH,
              extensions: new Set([WebGLExtension.DERIVATIVES]),
            });
          }
        }
        this.depthPass = new CustomEffect();
      }
      
      run(camera_) {
        camera_.getWorldDirection(cameraDir);
        this.depthPass.uniforms.get('uCameraPosition')  .value = camera_.position
        this.depthPass.uniforms.get('inverseProjection').value = camera_.projectionMatrixInverse
        this.depthPass.uniforms.get('inverseView')      .value = camera_.matrixWorld
        this.depthPass.uniforms.get('uCameraDir')       .value = cameraDir
      };

}