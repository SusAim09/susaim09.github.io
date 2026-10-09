
(() => {
  "use strict";

  const overlay = document.getElementById("heaven-loader");
  const canvas = document.getElementById("heaven-fluid");
  if (!overlay || !canvas) return;

  let closed = false;
  let raf = 0;
  let gl = null;
  let loadTimer = 0;
  let hardTimer = 0;
  const start = performance.now();

  const reducedMotion = (() => {
    try {
      return window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    } catch (_) {
      return false;
    }
  })();

  function stopGraphics() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;

    if (gl) {
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      gl = null;
    }
  }

  function closeLoader() {
    if (closed) return;
    closed = true;

    clearTimeout(loadTimer);
    clearTimeout(hardTimer);
    overlay.classList.add("heaven-loader-exit");
    stopGraphics();

    window.setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 950);
  }

  function revealWhenReady() {
    if (closed) return;

    // Keep a short intro, but never wait indefinitely.
    const elapsed = performance.now() - start;
    loadTimer = window.setTimeout(
      closeLoader,
      Math.max(0, 1750 - elapsed)
    );
  }

  // Absolute fallback even if a resource or shader fails.
  hardTimer = window.setTimeout(closeLoader, 3200);

  if (document.readyState === "complete") {
    revealWhenReady();
  } else {
    window.addEventListener("load", revealWhenReady, {
      once: true
    });
  }

  if (reducedMotion) return;

  try {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power"
    });

    if (!gl) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;

      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;

      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7)))
          * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;

        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p);
          p = p * 2.03 + vec2(13.1, 7.7);
          amplitude *= 0.5;
        }

        return value;
      }

      void main() {
        vec2 uv = v_uv;
        vec2 p = (uv - 0.5) *
          vec2(u_resolution.x / u_resolution.y, 1.0);

        float t = u_time * 0.48;
        float r = length(p);
        float a = atan(p.y, p.x);

        // Layered turbulent fluid distortion.
        float n1 = fbm(p * 3.2 + vec2(t, -t * 0.7));
        float n2 = fbm(p * 5.0 - vec2(t * 0.65, t * 0.9));

        vec2 warped = p + vec2(n1 - 0.5, n2 - 0.5) * 0.25;

        float swirl = a + t * 2.0 + 1.5 / (r + 0.15);
        warped += 0.12 * vec2(cos(swirl), sin(swirl));

        float liquid = fbm(warped * 4.8 + vec2(t, -t * 0.5));

        float veins = abs(sin(
          13.0 * r - 3.8 * a + t * 3.0 + liquid * 5.5
        ));

        veins = 1.0 - smoothstep(0.02, 0.12, veins);
        float flow = smoothstep(0.38, 0.76, liquid);

        // Portal ring: animated and slightly uneven.
        float ringRadius = 0.12 + 0.075 * smoothstep(0.0, 1.6, t);
        float edge = (n1 - 0.5) * 0.07
                   + (n2 - 0.5) * 0.025;

        float ring = abs(r - ringRadius - edge);
        float ringGlow = exp(-ring * 38.0);
        float ringCore = exp(-ring * 125.0);

        float outerRadius = ringRadius + 0.09
          + 0.022 * sin(a * 4.0 - t * 2.0 + n1 * 5.0);

        float outerFlow = exp(-abs(r - outerRadius) * 17.0);

        float spiralWave = abs(sin(
          a * 2.6 - log(r + 0.13) * 4.0 + t * 2.2 + n1
        ));

        float spiral = 1.0 - smoothstep(0.0, 0.09, spiralWave);

        float goldVein = veins * flow;

        // Black background and warm liquid-metal light.
        vec3 color = vec3(0.006, 0.005, 0.009);

        float haze = exp(-r * 3.0) * (0.04 + 0.07 * n1);
        color += vec3(0.30, 0.15, 0.035) * haze;
        color += vec3(0.42, 0.23, 0.055) * outerFlow * 0.22;
        color += vec3(0.75, 0.48, 0.14) * goldVein * 0.42;
        color += vec3(0.95, 0.68, 0.26) * ringGlow * 0.72;
        color += vec3(1.0, 0.91, 0.67) * ringCore;
        color += vec3(0.6, 0.37, 0.09) * spiral * 0.22;

        // Scattered golden sparks.
        vec2 cell = floor(uv * 180.0);
        float sparkle = step(0.997, hash(cell));
        sparkle *= 0.45 + 0.55 * sin(
          t * 3.0 + hash(cell) * 6.0
        );

        color += vec3(1.0, 0.82, 0.47) * sparkle * 0.7;

        // Gentle center glow as the portal forms.
        color += vec3(0.12, 0.075, 0.028)
          * exp(-r * 7.0) * smoothstep(0.0, 1.2, t);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error("Shader compilation failed");
      }

      return shader;
    }

    const program = gl.createProgram();

    gl.attachShader(
      program,
      compileShader(gl.VERTEX_SHADER, vertexSource)
    );

    gl.attachShader(
      program,
      compileShader(gl.FRAGMENT_SHADER, fragmentSource)
    );

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Shader linking failed");
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation =
      gl.getUniformLocation(program, "u_resolution");

    function resize() {
      if (!gl || closed) return;

      // Limit rendering resolution on mobile for performance.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.floor(innerWidth * dpr));
      const height = Math.max(1, Math.floor(innerHeight * dpr));

      canvas.width = width;
      canvas.height = height;

      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolutionLocation, width, height);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    function draw(now) {
      if (!gl || closed) return;

      gl.uniform1f(timeLocation, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

  } catch (error) {
    // Graceful fallback: keep the title and let the store appear.
    if (gl) {
      try {
        const lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
      } catch (_) {}
      gl = null;
    }
  }
})();
      
