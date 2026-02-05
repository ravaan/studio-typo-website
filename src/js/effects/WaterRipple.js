/**
 * WaterRipple - WebGL shader-based water ripple effect
 * Elegant, tactile distortion on click/hover
 */

export class WaterRipple {
  constructor(container, options = {}) {
    this.container = container;

    // Configuration
    this.imageSrc = options.image || null;
    this.rippleSpeed = options.rippleSpeed || 0.03;
    this.rippleDecay = options.rippleDecay || 0.97;
    this.rippleStrength = options.rippleStrength || 0.02;

    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.ripples = [];
    this.maxRipples = 10;
    this.time = 0;
    this.width = 0;
    this.height = 0;
    this.isDisposed = false;
    this.animationId = null;

    this.init();
  }

  async init() {
    this.container.classList.add("waterripple-container");

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.className = "waterripple-canvas";

    this.container.appendChild(this.canvas);

    // Get WebGL context
    this.gl =
      this.canvas.getContext("webgl") ||
      this.canvas.getContext("experimental-webgl");

    if (!this.gl) {
      console.warn("WebGL not supported, falling back to simple effect");
      this.createFallback();
      return;
    }

    // Set size
    this.resize();

    // Initialize shaders
    this.initShaders();

    // Load image or create default
    if (this.imageSrc) {
      await this.loadImage(this.imageSrc);
    } else {
      this.createDefaultTexture();
    }

    // Event listeners
    this.onResize = this.resize.bind(this);
    this.onClick = this.handleClick.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener("resize", this.onResize);
    this.canvas.addEventListener("click", this.onClick);
    this.canvas.addEventListener("mousemove", this.onMouseMove);

    // Start animation
    this.animate();
  }

  createFallback() {
    // Simple CSS fallback for browsers without WebGL
    this.container.innerHTML = `
      <div class="waterripple-fallback" style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.875rem;
      ">
        Click to interact
      </div>
    `;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 300;
    this.height = rect.height || 200;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  initShaders() {
    const gl = this.gl;

    // Vertex shader
    const vertexSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment shader with ripple effect
    const fragmentSource = `
      precision mediump float;

      uniform sampler2D u_texture;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec4 u_ripples[10];
      uniform float u_rippleStrength;

      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord;
        vec2 displacement = vec2(0.0);

        for (int i = 0; i < 10; i++) {
          vec4 ripple = u_ripples[i];
          if (ripple.z > 0.01) {
            vec2 center = ripple.xy;
            float radius = ripple.z;
            float strength = ripple.w;

            float dist = distance(uv, center);
            float wave = sin(dist * 30.0 - radius * 15.0) * exp(-dist * 4.0);
            wave *= smoothstep(radius + 0.1, radius, dist);
            wave *= smoothstep(0.0, 0.05, dist);
            wave *= strength;

            vec2 dir = normalize(uv - center + 0.0001);
            displacement += dir * wave * u_rippleStrength;
          }
        }

        vec2 finalUV = uv + displacement;
        vec4 color = texture2D(u_texture, finalUV);

        // Add subtle highlight on displacement
        float highlight = length(displacement) * 10.0;
        color.rgb += highlight * 0.5;

        gl_FragColor = color;
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fragmentSource,
    );

    // Create program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    // Set up geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // TexCoord buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    this.uniforms = {
      texture: gl.getUniformLocation(this.program, "u_texture"),
      time: gl.getUniformLocation(this.program, "u_time"),
      resolution: gl.getUniformLocation(this.program, "u_resolution"),
      ripples: gl.getUniformLocation(this.program, "u_ripples"),
      rippleStrength: gl.getUniformLocation(this.program, "u_rippleStrength"),
    };
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  async loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.createTexture(img);
        resolve();
      };
      img.onerror = () => {
        this.createDefaultTexture();
        resolve();
      };
      img.src = src;
    });
  }

  createTexture(source) {
    const gl = this.gl;

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  createDefaultTexture() {
    // Create gradient canvas as default texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(0.5, "#764ba2");
    gradient.addColorStop(1, "#1a1a2e");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add some circles
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        100 + Math.random() * 312,
        100 + Math.random() * 312,
        20 + Math.random() * 40,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    this.createTexture(canvas);
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.width;
    const y = 1 - (e.clientY - rect.top) / this.height; // Flip Y

    this.addRipple(x, y, 1.0);
  }

  handleMouseMove(e) {
    // Add small ripples on mouse move
    if (Math.random() < 0.1) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.width;
      const y = 1 - (e.clientY - rect.top) / this.height;

      this.addRipple(x, y, 0.3);
    }
  }

  addRipple(x, y, strength) {
    // Find an empty slot or replace oldest
    let slot = this.ripples.findIndex((r) => r.strength < 0.01);
    if (slot === -1) {
      slot = 0;
      let minStrength = this.ripples[0]?.strength || 0;
      for (let i = 1; i < this.ripples.length; i++) {
        if (this.ripples[i].strength < minStrength) {
          minStrength = this.ripples[i].strength;
          slot = i;
        }
      }
    }

    this.ripples[slot] = { x, y, radius: 0, strength };
  }

  animate() {
    if (this.isDisposed) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    if (!this.gl || !this.program) return;

    const gl = this.gl;

    this.time += this.rippleSpeed;

    // Update ripples
    this.ripples.forEach((ripple) => {
      if (ripple.strength > 0.01) {
        ripple.radius += this.rippleSpeed;
        ripple.strength *= this.rippleDecay;
      }
    });

    // Pad ripples array to 10
    while (this.ripples.length < this.maxRipples) {
      this.ripples.push({ x: 0, y: 0, radius: 0, strength: 0 });
    }

    // Set uniforms
    gl.uniform1i(this.uniforms.texture, 0);
    gl.uniform1f(this.uniforms.time, this.time);
    gl.uniform2f(this.uniforms.resolution, this.width, this.height);
    gl.uniform1f(this.uniforms.rippleStrength, this.rippleStrength);

    // Set ripple data
    const rippleData = [];
    for (let i = 0; i < this.maxRipples; i++) {
      const r = this.ripples[i] || { x: 0, y: 0, radius: 0, strength: 0 };
      rippleData.push(r.x, r.y, r.radius, r.strength);
    }
    gl.uniform4fv(this.uniforms.ripples, new Float32Array(rippleData));

    // Draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    this.isDisposed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize);
    this.canvas?.removeEventListener("click", this.onClick);
    this.canvas?.removeEventListener("mousemove", this.onMouseMove);

    if (this.gl) {
      this.gl.deleteProgram(this.program);
      this.gl.deleteTexture(this.texture);
    }

    this.container.innerHTML = "";
  }
}
