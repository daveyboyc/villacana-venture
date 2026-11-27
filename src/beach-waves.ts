import type { ShaderMaterial } from "three";

// Phase increases seaward, so each low crest travels towards the sand.
// One cycle lasts about six seconds at the scene's water clock rate.
const beachWave = `
  float wavePhase(float along, float t) {
    return 3.0*t + 0.085*along + 0.85*sin(along*0.079) + 0.34*sin(t*0.41 + along*0.16);
  }
  float waveEnvelope(float offshore) {
    return smoothstep(-0.6, 1.4, offshore) * (1.0 - smoothstep(5.0, 12.0, offshore));
  }
  float waterline(float phase, float along) {
    float reach = 0.82 + 0.19*sin(along*0.19);
    return -reach*cos(phase - 0.72) + 0.10*sin(2.0*phase);
  }
`;

export function applyBeachWaves(material: ShaderMaterial): void {
  // Blend the sand through the same pixels that draw the advancing swash.
  material.transparent = true;
  material.depthWrite = false;
  material.vertexShader = beachWave + "varying vec2 shoreCoord;\n" + material.vertexShader
    .replace("mirrorCoord = modelMatrix", `
      shoreCoord = uv;
      vec3 surface = position;
      surface.z += 0.065 * waveEnvelope(uv.y) * cos(wavePhase(uv.x, time) + 1.05*uv.y);
      mirrorCoord = modelMatrix`)
    .replaceAll("vec4( position, 1.0 )", "vec4( surface, 1.0 )");
  material.fragmentShader = beachWave + "varying vec2 shoreCoord;\n" + material.fragmentShader
    .replace("vec3( 1.5, 1.0, 1.5 )", "vec3( 0.48, 1.0, 0.48 )")
    .replace("vec3 diffuseLight = ", `
      vec3 swellNormal = normalize(cross(dFdx(worldPosition.xyz), dFdy(worldPosition.xyz)));
      surfaceNormal = normalize(surfaceNormal + vec3(swellNormal.x, 0.0, swellNormal.z));
      vec3 diffuseLight = `)
    .replace("gl_FragColor = vec4( outgoingLight, alpha );", `
      if (shoreCoord.y > 12.0) {
        gl_FragColor = vec4(outgoingLight, alpha);
      } else {
        float along = shoreCoord.x;
        float offshore = shoreCoord.y;
        float phase = wavePhase(along, time);
        float edge = waterline(phase, along);
        float depth = offshore - edge;
        float aa = max(0.08, fwidth(depth));
        float covered = smoothstep(-aa, aa, depth);
        // Cross-shore distance tracks the sloping seabed. Keep the fade anchored
        // to that bed while the foam and advancing edge move above it.
        float deepWater = smoothstep(0.5, 8.0, offshore);

        // Short broken crests form just offshore, spread onto sand, then dissolve.
        float localPhase = phase + 1.05*offshore;
        float crest = smoothstep(0.76, 1.0, cos(localPhase));
        float group = smoothstep(-0.56, 0.68, sin(along*0.24 + time*0.55) + 0.48*sin(along*0.71 - time));
        float breaker = crest * waveEnvelope(offshore) * (1.0 - smoothstep(1.4,3.8,offshore));
        float fringe = 1.0 - smoothstep(0.06, 0.32 + aa, abs(depth - 0.15));
        float runup = smoothstep(-0.55, 0.8, cos(phase - 0.25));
        float foam = group * (0.60*breaker + 0.71*fringe*runup);
        foam *= 0.78 + 0.22*sin(3.1*along + 4.0*depth + time);

        // The last run-up leaves a thin reflective film behind the retreating edge.
        float recentEdge = min(waterline(phase - 0.65, along), waterline(phase - 1.4, along));
        float film = (1.0-covered) * smoothstep(-0.18, 0.20, offshore - recentEdge);
        vec3 shallow = mix(outgoingLight, vec3(0.12,0.36,0.36), 0.28);
        vec3 water = mix(shallow, outgoingLight, smoothstep(1.5, 8.0, depth));
        float surfaceTint = mix(0.06, 0.14, pow(1.0 - theta, 3.0));
        float waterAlpha = covered * mix(surfaceTint, 1.0, deepWater);
        float filmAlpha = 0.23*film;
        float opacity = max(waterAlpha, foam) + filmAlpha;
        vec3 sheen = mix(vec3(0.095,0.080,0.064), reflectionSample, 0.22);
        vec3 waterAndFoam = mix(water, vec3(0.86,0.93,0.93), foam);
        vec3 color = (waterAndFoam*max(waterAlpha,foam) + sheen*filmAlpha) / max(opacity,0.001);
        gl_FragColor = vec4(color, min(opacity,1.0));
      }
    `);
}
