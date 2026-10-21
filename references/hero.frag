// Фрагментный шейдер первого экрана (из утверждённого наброска).
// Uniforms: uRes — размер в px, uMouse — позиция мыши в px (Y снизу),
// uHover 0..1, uAccent / uGlow — цвета (0..1), uIntensity — яркость линий.
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uAccent;
uniform vec3 uGlow;
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;

  // Притяжение к курсору
  float d = length(p - m);
  float pull = exp(-d * d * 7.0) * uHover;
  vec2 q = p * 1.5 + (m - p) * pull * 0.45;

  // Доменное искажение шума
  float t = uTime * 0.05;
  vec2 w = vec2(fbm(q + vec2(t, -t)), fbm(q + vec2(5.2, 1.3) - t));
  float f = fbm(q + 2.4 * w + vec2(t * 2.0, -t));

  // Изолинии («топография»)
  float iso = abs(fract(f * 6.0) - 0.5);
  float lines = smoothstep(0.07, 0.0, iso);

  vec3 col = vec3(0.043, 0.043, 0.051);
  col = mix(col, uGlow * 0.42, smoothstep(0.35, 0.95, w.y) * 0.7);
  col += uAccent * lines * (0.16 + pull * 1.3) * uIntensity;
  col += uAccent * pull * 0.07 * uIntensity;

  // Виньетка и зерно
  col *= 1.0 - 0.6 * smoothstep(0.35, 1.15, length((uv - 0.5) * vec2(1.3, 1.0)));
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
