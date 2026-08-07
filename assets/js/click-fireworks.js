(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return;

  const colors = ["#ff3b6b", "#ff9f1c", "#ffd60a", "#2ec4b6", "#3a86ff", "#9b5de5"];
  const particles = [];
  const rings = [];
  const isCompactScreen = window.matchMedia("(max-width: 575px)");
  let animationFrame = null;
  let previousTime = 0;
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;

  canvas.id = "click-fireworks";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(canvas);

  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    canvas.width = Math.round(viewportWidth * pixelRatio);
    canvas.height = Math.round(viewportHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const createBurst = (x, y) => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const particleCount = isCompactScreen.matches ? 22 : 36;

    rings.push({ x, y, color, radius: 4, life: 0.35, maxLife: 0.35 });

    for (let index = 0; index < particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / particleCount + (Math.random() - 0.5) * 0.18;
      const speed = 130 + Math.random() * 250;
      const life = 0.65 + Math.random() * 0.45;

      particles.push({
        x,
        y,
        previousX: x,
        previousY: y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color: Math.random() < 0.78 ? color : colors[Math.floor(Math.random() * colors.length)],
        size: 1.4 + Math.random() * 2.2,
        life,
        maxLife: life,
      });
    }

    if (particles.length > 320) particles.splice(0, particles.length - 320);
  };

  const drawFrame = (time) => {
    const deltaTime = Math.min((time - previousTime) / 1000 || 0.016, 0.033);
    previousTime = time;
    context.clearRect(0, 0, viewportWidth, viewportHeight);
    context.globalCompositeOperation = "lighter";

    for (let index = rings.length - 1; index >= 0; index -= 1) {
      const ring = rings[index];
      ring.life -= deltaTime;
      ring.radius += 220 * deltaTime;

      if (ring.life <= 0) {
        rings.splice(index, 1);
        continue;
      }

      context.globalAlpha = ring.life / ring.maxLife;
      context.strokeStyle = ring.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      context.stroke();
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        particles.splice(index, 1);
        continue;
      }

      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.velocityX *= Math.pow(0.985, deltaTime * 60);
      particle.velocityY = particle.velocityY * Math.pow(0.985, deltaTime * 60) + 260 * deltaTime;
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;

      const opacity = particle.life / particle.maxLife;
      context.globalAlpha = opacity;
      context.strokeStyle = particle.color;
      context.lineWidth = particle.size;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(particle.previousX, particle.previousY);
      context.lineTo(particle.x, particle.y);
      context.stroke();

      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * 0.65, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";

    if (particles.length || rings.length) {
      animationFrame = window.requestAnimationFrame(drawFrame);
    } else {
      animationFrame = null;
      previousTime = 0;
    }
  };

  const startBurst = (event) => {
    if (reduceMotion.matches || (event.pointerType === "mouse" && event.button !== 0)) return;

    createBurst(event.clientX, event.clientY);
    if (!animationFrame) animationFrame = window.requestAnimationFrame(drawFrame);
  };

  const updateMotionPreference = () => {
    canvas.style.display = reduceMotion.matches ? "none" : "block";
    if (!reduceMotion.matches) return;

    particles.length = 0;
    rings.length = 0;
    context.clearRect(0, 0, viewportWidth, viewportHeight);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
    previousTime = 0;
  };

  resizeCanvas();
  updateMotionPreference();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("pointerdown", startBurst, { passive: true });
  reduceMotion.addEventListener("change", updateMotionPreference);
})();
