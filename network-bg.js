if (window.innerWidth < 768) {
  canvas.style.display = "none";
  return;
}

const canvas = document.getElementById("bg-network");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ===== CONFIG =====
const NODE_COUNT = Math.floor((w * h) / 15000);
const MAX_DIST = 140;
const MOUSE_RADIUS = 180;

// ===== MOUSE =====
const mouse = { x: null, y: null };
window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener("mouseout", () => {
  mouse.x = null;
  mouse.y = null;
});

// ===== NODE =====
class Node {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;

    if (mouse.x) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS) {
        this.x += dx / dist;
        this.y += dy / dist;
      }
    }
  }
}

const nodes = Array.from({ length: NODE_COUNT }, () => new Node());

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];
    n1.move();

    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAX_DIST) {
        const alpha = 1 - dist / MAX_DIST;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

draw();
