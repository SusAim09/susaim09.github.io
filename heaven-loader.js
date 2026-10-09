
(() => {
  "use strict";

  // HEAVEN — Liquid Celestial Portal
  // Self-contained loader: no external libraries required.

  if (window.__heavenPortalStarted) return;
  window.__heavenPortalStarted = true;

  const style = document.createElement("style");
  style.textContent = `
    #heaven-portal-loader {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: #030207;
      opacity: 1;
      visibility: visible;
      transition: opacity .65s ease, visibility .65s ease;
      isolation: isolate;
    }

    #heaven-portal-loader.hp-exit {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    #heaven-portal-loader canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    #heaven-portal-loader .hp-vignette {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at center,
          transparent 10%, rgba(0,0,0,.12) 48%,
          rgba(0,0,0,.8) 100%);
      pointer-events: none;
    }

    #heaven-portal-loader .hp-brand {
      position: relative;
      z-index: 2;
      text-align: center;
      pointer-events: none;
      animation: hp-arrive 1.1s cubic-bezier(.16,1,.3,1) both;
    }

    #heaven-portal-loader .hp-title {
      margin: 0;
      padding-left: .19em;
      color: #fff8df;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(42px, 11vw, 86px);
      font-weight: 500;
      letter-spacing: .19em;
      text-shadow:
        0 0 12px rgba(255,231,165,.8),
        0 0 42px rgba(229,169,54,.7),
        0 0 100px rgba(219,143,29,.35);
    }

    #heaven-portal-loader .hp-subtitle {
      margin-top: 17px;
      color: rgba(255,233,186,.8);
      font: 10px/1.5 Arial, sans-serif;
      letter-spacing: .42em;
    }

    #heaven-portal-loader .hp-progress {
      width: 112px;
      height: 2px;
      margin: 22px auto 0;
      overflow: hidden;
      background: rgba(255,224,157,.15);
    }

    #heaven-portal-loader .hp-progress::after {
      content: "";
      display: block;
      width: 40%;
      height: 100%;
      background: #ffe5a0;
      box-shadow: 0 0 12px #e7b74f;
      animation: hp-progress 1.3s ease-in-out infinite;
    }

    @keyframes hp-progress {
      from { transform: translateX(-110%); }
      to { transform: translateX(360%); }
    }

    @keyframes hp-arrive {
      from { opacity: 0; transform: scale(.84); filter: blur(9px); }
      to { opacity: 1; transform: scale(1); filter: blur(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      #heaven-portal-loader *,
      #heaven-portal-loader *::before {
        animation-duration: .01ms !important;
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "heaven-portal-loader";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-label", "Entering Heaven store");

  overlay.innerHTML = `
    <canvas aria-hidden="true"></canvas>
    <div class="hp-vignette"></div>
    <div class="hp-brand">
      <h1 class="hp-title">HEAVEN</h1>
      <div class="hp-subtitle">A LITTLE CLOSER TO PARADISE</div>
      <div class="hp-progress"></div>
    </div>
  `;

  function mount() {
    if (!document.body || overlay.isConnected) return;
    document.body.appendChild(overlay);
    startGraphics();
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  }

  let finished = false;
  let animationFrame = 0;

  function dismiss() {
    if (finished) return;
    finished = true;

    if (animationFrame) cancelAnimationFrame(animationFrame);

    overlay.classList.add("hp-exit");

    setTimeout(() => {
      overlay.remove();
      style.remove();
    }, 750);
  }

  // The storefront must never be blocked indefinitely.
  const safetyTimer = setTimeout(dismiss, 3200);

  function startGraphics() {
    const canvas = overlay.querySelector("canvas");
    let gl;

    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power"
      });
    } catch (_) {
      gl = null;
    }

    if (!gl) return;

    const vertexSource = `
      attribute vec2 position;
      varying vec2 v_uv;

      void main() {
        v_uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;

      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7)))
          * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)),
              hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;

        for (int i = 0; i < 4; i++) {
          value += amp * noise(p);
          p = p * 2.03 + vec2(13.7, 9.2);
          amp *= 0.5;
        }

        return value;
      }

      void main() {
        vec2 uv = v_uv;
        vec2 p = (uv - 0.5) *
          vec2(u_resolution.x / u_resolution.y, 1.0);

        float t = u_time * 0.65;
        float r = length(p);
        float a = atan(p.y, p.x);

        float n1 = fbm(p * 3.2 + vec2(t, -t * 0.7));
        float n2 = fbm(p * 4.5 - vec2(t * 0.6, t));

        // Turbulent, twisting liquid surface.
        vec2 q = p;
        q += 0.18 * vec2(
          fbm(p * 3.0 + t) - 0.5,
          fbm(p * 3.0 - t) - 0.5
        );

        float twist = a + 1.4 / (r + 0.12) - t * 1.7;
        q += 0.10 * vec2(cos(twist), sin(twist));

        float marbling = fbm(q * 8.0 + vec2(-t, t * 0.8));

        // Broad ribbons with animated edges.
        float r1 = abs(r - (
          0.25 + 0.07 * sin(a * 3.0 - t * 1.8 + n1 * 5.0)
        ));
        float r2 = abs(r - (
          0.37 + 0.08 * sin(a * 2.0 + t * 1.4 + n2 * 5.0)
        ));
        float r3 = abs(r - (
          0.46 + 0.045 * sin(a * 4.0 - t + marbling * 5.0)
        ));

        float f1 = exp(-r1 * 20.0);
        float f2 = exp(-r2 * 16.0);
        float f3 = exp(-r3 * 19.0);
        float fluid = clamp(f1 + f2 + f3, 0.0, 1.0);

        float streak = pow(max(0.0,
          sin(a * 8.0 - log(r + 0.13) * 7.0
            - t * 2.0 + marbling * 7.0)
        ), 6.0);

        float polish = 0.35 + 0.65 *
          fbm(q * 12.0 + vec2(t, -t));

        // Uneven, glowing celestial ring.
        float radius = 0.205 + 0.025 * sin(t * 0.8);
        float warp = (n1 - 0.5) * 0.045
                   + (n2 - 0.5) * 0.025;
        float d = abs(r - radius - warp);

        float halo = exp(-d * 8.0);
        float glow = exp(-d * 28.0);
        float core = exp(-d * 100.0);

        vec3 col = vec3(0.003, 0.003, 0.009);

        // Gold reflected across liquid ribbons.
        col += vec3(0.30, 0.105, 0.018) * fluid;
        col += vec3(0.78, 0.39, 0.065) * fluid * polish;
        col += vec3(1.0, 0.77, 0.35) * fluid * streak * 1.4;

        // Pearl-white specular edges.
        float edge = clamp(
          f1 * exp(-abs(sin(a * 9.0 - t * 2.0)) * 7.0)
          + f2 * exp(-abs(cos(a * 7.0 + t * 1.5)) * 7.0),
          0.0, 1.0
        );

        col += vec3(0.75, 0.68, 0.52) * edge * 0.8;
        col += vec3(1.0, 0.96, 0.84) * edge * edge;

        col += vec3(0.38, 0.19, 0.035) * halo;
        col += vec3(1.0, 0.61, 0.16) * glow;
        col += vec3(1.0, 0.96, 0.83) * core * 1.2;

        // Small moving celestial sparks.
        vec2 cell = floor(uv * 135.0);
        float seed = hash(cell);
        float spark = step(0.993, seed)
          * (0.5 + 0.5 * sin(t * 4.0 + seed * 20.0));

        col += vec3(1.0, 0.79, 0.39) * spark;

        float vignette = 1.0 - smoothstep(0.3, 0.85, r);
        col *= 0.65 + 0.35 * vignette;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error("Portal shader compilation failed");
      }

      return shader;
    }

    let program;

    try {
      const vs = compile(gl.VERTEX_SHADER, vertexSource);
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);

      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      gl.deleteShader(vs);
      gl.deleteShader(fs);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Portal program linking failed");
      }
    } catch (error) {
      console.warn("HEAVEN portal fallback:", error);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const start = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(1, Math.floor(innerWidth * dpr));
      const h = Math.max(1, Math.floor(innerHeight * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(resolution, w, h);
      }
    }

    function draw(now) {
      if (finished || !overlay.isConnected) return;

      resize();
      gl.uniform1f(time, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = requestAnimationFrame(draw);
    }

    resize();
    animationFrame = requestAnimationFrame(draw);
  }

  // Show the portal briefly, then reveal the existing storefront.
  window.addEventListener("load", () => {
    clearTimeout(safetyTimer);
    setTimeout(dismiss, 2100);
  }, { once: true });

  // Also dismiss if the load event has already happened.
  if (document.readyState === "complete") {
    clearTimeout(safetyTimer);
    setTimeout(dismiss, 2100);
  }
})();
