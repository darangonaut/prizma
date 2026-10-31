import { Filter, GlProgram, defaultFilterVert } from 'pixi.js';

/**
 * Neónová obrazovka: žiara okolo jasných čiar, chromatická aberácia (rastie pri presune
 * medzi realitami), riadky CRT, šum a vinetácia. Pri glitchi sa pásy obrazu posúvajú.
 */
const FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform float uTime;
uniform float uGlitch;
uniform float uGlow;
uniform float uScale;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 bright(vec2 uv) {
  vec3 c = texture(uTexture, uv).rgb;
  float l = max(c.r, max(c.g, c.b));
  return c * smoothstep(0.25, 0.9, l);
}

void main(void) {
  vec2 uv = vTextureCoord;
  vec2 px = uInputSize.zw;
  // Glitch: vodorovné pásy sa posunú a rozdelia farby.
  float band = floor(uv.y * 38.0 + uTime * 3.0);
  float g = uGlitch * step(0.72, hash(vec2(band, floor(uTime * 24.0))));
  uv.x += (hash(vec2(band, 3.0)) - 0.5) * 0.06 * g;
  float ca = (0.9 + uGlitch * 7.0 + g * 10.0) * uScale;
  vec3 col;
  col.r = texture(uTexture, uv + vec2(ca, 0.0) * px).r;
  col.g = texture(uTexture, uv).g;
  col.b = texture(uTexture, uv - vec2(ca, 0.0) * px).b;

  // Žiara: dva kruhy vzoriek okolo bodu, len zo svetlých miest.
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236 + 0.26;
    vec2 d = vec2(cos(a), sin(a)) * px * uScale;
    glow += bright(uv + d * 3.0) * 0.55;
    glow += bright(uv + d * 7.5) * 0.35;
    glow += bright(uv + d * 14.0) * 0.18;
  }
  col += glow / 12.0 * uGlow;

  // Riadky obrazovky a jemný šum.
  vec2 screen = uv * uInputSize.xy;
  float scan = 0.93 + 0.07 * sin(screen.y / uScale * 3.14159);
  col *= scan;
  col += (hash(screen + uTime) - 0.5) * 0.035;
  // Vinetácia.
  vec2 v = vTextureCoord - 0.5;
  col *= 1.0 - dot(v, v) * 0.9;
  finalColor = vec4(col, 1.0);
}
`;

export class NeonPost {
  readonly filter: Filter;

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: FRAGMENT,
        name: 'neon-post',
        preferredFragmentPrecision: 'highp',
      }),
      resources: {
        neon: {
          uTime: { value: 0, type: 'f32' },
          uGlitch: { value: 0, type: 'f32' },
          uGlow: { value: 1.1, type: 'f32' },
          uScale: { value: 1, type: 'f32' },
        },
      },
      resolution: 'inherit',
      antialias: 'off',
    });
  }

  update(time: number, glitch: number, scale: number): void {
    const u = this.filter.resources.neon.uniforms;
    u.uTime = time;
    u.uGlitch = glitch;
    u.uScale = scale;
  }
}
