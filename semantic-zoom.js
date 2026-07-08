const {
  useEffect,
  useMemo,
  useRef,
  useState
} = React;

// ---------- math helpers ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = t => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const band = (v, a, b) => smoothstep((v - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- document layout (x,y,w,h in % of page; e = embedding coords in [-1,1]) ----------
// In production this array comes straight from Docling/PaddleOCR JSON + UMAP of bge-m3 vectors.
const ELEMENTS = [{
  id: "title",
  type: "Title",
  x: 8,
  y: 4.5,
  w: 84,
  h: 7,
  c: "#818CF8",
  e: [-0.12, 0.66],
  tok: 18
}, {
  id: "meta",
  type: "Meta",
  x: 8,
  y: 13,
  w: 64,
  h: 3.5,
  c: "#22D3EE",
  e: [0.46, 0.52],
  tok: 12
}, {
  id: "habs",
  type: "Header",
  x: 8,
  y: 19.5,
  w: 22,
  h: 3.2,
  c: "#A78BFA",
  e: [0.04, 0.5],
  tok: 4
}, {
  id: "abs",
  type: "Text",
  x: 8,
  y: 24,
  w: 84,
  h: 10,
  c: "#34D399",
  e: [-0.5, -0.02],
  tok: 96
}, {
  id: "p1",
  type: "Text",
  x: 8,
  y: 37.5,
  w: 40,
  h: 15,
  c: "#34D399",
  e: [-0.64, -0.22],
  tok: 340
}, {
  id: "p2",
  type: "Text",
  x: 8,
  y: 54.5,
  w: 40,
  h: 13,
  c: "#34D399",
  e: [-0.38, -0.32],
  tok: 310
}, {
  id: "tbl",
  type: "Table",
  x: 8,
  y: 69.5,
  w: 40,
  h: 16,
  c: "#F87171",
  e: [0.58, -0.52],
  tok: 210
}, {
  id: "cap1",
  type: "Caption",
  x: 8,
  y: 87,
  w: 40,
  h: 3,
  c: "#22D3EE",
  e: [0.62, 0.3],
  tok: 22
}, {
  id: "p3",
  type: "Text",
  x: 52,
  y: 37.5,
  w: 40,
  h: 10,
  c: "#34D399",
  e: [-0.52, -0.46],
  tok: 280
}, {
  id: "fig",
  type: "Figure",
  x: 52,
  y: 49.5,
  w: 40,
  h: 15.5,
  c: "#FBBF24",
  e: [0.76, -0.16],
  tok: 64
}, {
  id: "cap2",
  type: "Caption",
  x: 52,
  y: 66.5,
  w: 40,
  h: 3,
  c: "#22D3EE",
  e: [0.38, 0.42],
  tok: 19
}, {
  id: "p4",
  type: "Text",
  x: 52,
  y: 71.5,
  w: 40,
  h: 19,
  c: "#34D399",
  e: [-0.28, -0.1],
  tok: 295
}];
const L_MAX = 5;
const STAGES = [{
  at: 0.0,
  name: "PDF page",
  sub: "PyMuPDF · 3–4× DPI render"
}, {
  at: 1.5,
  name: "Layout detection",
  sub: "Docling / PaddleOCR bounding boxes"
}, {
  at: 2.9,
  name: "Chunks → embeddings",
  sub: "bge-m3 · 1024-d vectors"
}, {
  at: 4.2,
  name: "Vector space",
  sub: "Qdrant · this page inside the corpus"
}];
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace";

// ---------- small render pieces for the fake paper ----------
function GreekLines({
  seed,
  gap,
  h
}) {
  const rnd = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({
      length: 40
    }, () => 0.62 + r() * 0.38);
  }, [seed]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap,
      height: "100%",
      overflow: "hidden"
    }
  }, rnd.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: h,
      flex: "0 0 auto",
      width: `${(i % 7 === 6 ? 0.55 : 1) * w * 100}%`,
      background: "#D8D6CC",
      borderRadius: 2
    }
  })));
}
function MiniTable({
  u
}) {
  const cell = {
    border: `${Math.max(0.5, u * 0.15)}px solid #C8C6BC`,
    padding: u * 0.5
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr",
      height: "100%",
      fontSize: 0
    }
  }, Array.from({
    length: 15
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...cell,
      background: i < 3 ? "#ECEAE0" : "#FFFFFF"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: u * 0.7,
      width: i < 3 ? "70%" : `${45 + i * 37 % 40}%`,
      background: i < 3 ? "#B9B7AC" : "#DDDBD1",
      borderRadius: 2
    }
  }))));
}
function MiniChart({
  u
}) {
  const bars = [0.45, 0.7, 0.55, 0.85, 0.65, 0.95, 0.8];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      background: "#F4F3EC",
      borderRadius: u * 0.4,
      display: "flex",
      alignItems: "flex-end",
      gap: u * 0.6,
      padding: u
    }
  }, bars.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: `${b * 100}%`,
      background: i === 5 ? "#8B93E8" : "#C3C8EE",
      borderRadius: `${u * 0.3}px ${u * 0.3}px 0 0`
    }
  })));
}
function SemanticZoomRAG() {
  const [dims, setDims] = useState({
    w: 1280,
    h: 800
  });
  const [L, setL] = useState(0);
  const [flyState, setFlyState] = useState(0);
  const targetRef = useRef(0);
  const curRef = useRef(0);
  const flyRef = useRef(0);
  const rootRef = useRef(null);
  const pointers = useRef(new Map());
  const pinchDist = useRef(0);
  const setFly = v => {
    flyRef.current = v;
    setFlyState(v);
  };

  // viewport
  useEffect(() => {
    const upd = () => setDims({
      w: window.innerWidth,
      h: window.innerHeight
    });
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  // wheel — covers mouse wheel AND trackpad pinch (browsers deliver pinch as ctrl+wheel)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      flyRef.current = 0;
      setFlyState(0);
      const k = e.ctrlKey ? 0.0048 : 0.0022;
      targetRef.current = clamp(targetRef.current - e.deltaY * k, 0, L_MAX);
    };
    el.addEventListener("wheel", onWheel, {
      passive: false
    });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // touch pinch
  const pDist = () => {
    const p = [...pointers.current.values()];
    return Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
  };
  const onPointerDown = e => {
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 2) pinchDist.current = pDist();
  };
  const onPointerMove = e => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 2) {
      const d = pDist();
      if (pinchDist.current > 0) {
        flyRef.current = 0;
        setFlyState(0);
        targetRef.current = clamp(targetRef.current + Math.log2(d / pinchDist.current) * 1.35, 0, L_MAX);
      }
      pinchDist.current = d;
    }
  };
  const onPointerUp = e => {
    pointers.current.delete(e.pointerId);
    pinchDist.current = 0;
  };

  // keyboard: R = reset, F/Space = fly
  useEffect(() => {
    const onKey = e => {
      if (e.key === "r" || e.key === "R") {
        targetRef.current = 0;
        setFly(0);
      }
      if (e.key === "f" || e.key === "F" || e.key === " ") {
        e.preventDefault();
        if (flyRef.current !== 0) setFly(0);else setFly(curRef.current < L_MAX / 2 ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // animation loop — one number (L) drives every layer
  useEffect(() => {
    let raf;
    const tick = () => {
      if (flyRef.current !== 0) {
        targetRef.current = clamp(targetRef.current + flyRef.current * 0.0105, 0, L_MAX);
        if (targetRef.current <= 0 || targetRef.current >= L_MAX) {
          flyRef.current = 0;
          setFlyState(0);
        }
      }
      curRef.current += (targetRef.current - curRef.current) * 0.075;
      setL(curRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const {
    w: vw,
    h: vh
  } = dims;

  // ---------- stage timings (all pure functions of L → zoom out reverses for free) ----------
  const tB = band(L, 0.7, 1.5); // bboxes fade in
  const tC = band(L, 2.2, 3.3); // bboxes dissolve into points
  const tD = band(L, 3.5, 4.4); // deep space: corpus, grid, axes
  const tE = band(L, 2.25, 2.95) * (1 - band(L, 3.3, 3.9)); // encoder motif bump
  const deepExtra = 1 + Math.max(0, L - 4.4) * 0.55; // keep travelling inside the cloud

  const pageH = Math.min(vh * 0.74, 780);
  const pageW = pageH * 0.75;
  const u = pageW * 0.01; // 1% of page width, used as a sizing unit
  const pageScale = Math.pow(2, Math.min(L, 2.6) * 0.52) * (1 + tC * 1.7);
  const pageOpacity = 1 - tC;
  const spreadX = vw * 0.36 * deepExtra;
  const spreadY = vh * 0.33 * deepExtra;
  const tCe = smoothstep(tC);
  const chunks = ELEMENTS.map(el => {
    const bx = vw / 2 + ((el.x + el.w / 2) / 100 - 0.5) * pageW * pageScale;
    const by = vh / 2 + ((el.y + el.h / 2) / 100 - 0.5) * pageH * pageScale;
    const sx = vw / 2 + el.e[0] * spreadX;
    const sy = vh / 2 - el.e[1] * spreadY;
    return {
      ...el,
      dx: lerp(bx, sx, tCe),
      dy: lerp(by, sy, tCe)
    };
  });

  // corpus points (two parallax depths)
  const corpus = useMemo(() => {
    const rnd = mulberry32(42);
    const mk = n => Array.from({
      length: n
    }, () => {
      const a = rnd() * Math.PI * 2,
        r = Math.sqrt(rnd());
      return {
        x: Math.cos(a) * r * 1000,
        y: Math.sin(a) * r * 1000,
        s: 1.4 + rnd() * 2.4,
        o: 0.2 + rnd() * 0.5
      };
    });
    return {
      far: mk(70),
      near: mk(85)
    };
  }, []);
  const stageIdx = L < 0.9 ? 0 : L < 2.3 ? 1 : L < 3.7 ? 2 : 3;
  const stage = STAGES[stageIdx];
  const btn = {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: "0.04em",
    color: "#DCE3F2",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 8,
    padding: "7px 14px",
    cursor: "pointer"
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: rootRef,
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp,
    style: {
      position: "fixed",
      inset: 0,
      overflow: "hidden",
      touchAction: "none",
      userSelect: "none",
      background: "radial-gradient(1200px 800px at 50% 42%, #101830 0%, #0A0F1F 55%, #070B16 100%)",
      color: "#E4E9F4",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: vw,
    height: vh,
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("g", {
    opacity: tD * 0.13
  }, Array.from({
    length: Math.ceil(vw / 90) + 1
  }, (_, i) => /*#__PURE__*/React.createElement("line", {
    key: "v" + i,
    x1: i * 90,
    y1: 0,
    x2: i * 90,
    y2: vh,
    stroke: "#8B96AF",
    strokeWidth: 0.5
  })), Array.from({
    length: Math.ceil(vh / 90) + 1
  }, (_, i) => /*#__PURE__*/React.createElement("line", {
    key: "h" + i,
    x1: 0,
    y1: i * 90,
    x2: vw,
    y2: i * 90,
    stroke: "#8B96AF",
    strokeWidth: 0.5
  }))), /*#__PURE__*/React.createElement("g", {
    opacity: tD * 0.85,
    transform: `translate(${vw / 2},${vh / 2}) scale(${spreadX / 1000 * Math.pow(deepExtra, -0.35)},${spreadY / 1000 * Math.pow(deepExtra, -0.35)})`
  }, corpus.far.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: p.x,
    cy: p.y,
    r: p.s * 1.6,
    fill: "#5A6580",
    opacity: p.o * 0.55
  }))), /*#__PURE__*/React.createElement("g", {
    opacity: tD * 0.9,
    transform: `translate(${vw / 2},${vh / 2}) scale(${spreadX / 1000 * Math.pow(deepExtra, 0.45)},${spreadY / 1000 * Math.pow(deepExtra, 0.45)})`
  }, corpus.near.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: p.x,
    cy: p.y,
    r: p.s * 1.9,
    fill: "#7E8AA8",
    opacity: p.o * 0.7
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 26,
      bottom: 74,
      opacity: tD,
      fontFamily: MONO,
      fontSize: 11,
      color: "#8B96AF",
      letterSpacing: "0.08em"
    }
  }, "DIM-2 \u2191"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 62,
      bottom: 46,
      opacity: tD,
      fontFamily: MONO,
      fontSize: 11,
      color: "#8B96AF",
      letterSpacing: "0.08em"
    }
  }, "DIM-1 \u2192 \xA0\xB7\xA0 UMAP OF 1024-D EMBEDDINGS"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: vw / 2,
      top: vh / 2,
      width: pageW,
      height: pageH,
      transform: `translate(-50%,-50%) scale(${pageScale})`,
      opacity: pageOpacity,
      visibility: pageOpacity < 0.02 ? "hidden" : "visible",
      willChange: "transform, opacity"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "#FBFAF6",
      borderRadius: 3,
      boxShadow: "0 30px 90px rgba(0,0,0,0.55), 0 4px 18px rgba(0,0,0,0.4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "4.5%",
      width: "84%",
      height: "7%",
      color: "#1C1B18",
      fontWeight: 700,
      fontSize: u * 3.4,
      lineHeight: 1.15,
      letterSpacing: "-0.01em"
    }
  }, "Attention-Guided Retrieval for Multi-Tenant Document QA"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "13%",
      width: "64%",
      fontSize: u * 1.9,
      color: "#6B6A63"
    }
  }, "U. Prathipati, et al. \xB7 Document Analyzer Group \xB7 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "19.5%",
      fontSize: u * 1.9,
      fontWeight: 700,
      letterSpacing: "0.14em",
      color: "#3B3A34"
    }
  }, "ABSTRACT"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "24%",
      width: "84%",
      height: "10%",
      fontSize: u * 1.75,
      lineHeight: 1.45,
      color: "#4A4942",
      textAlign: "justify",
      overflow: "hidden"
    }
  }, "We present a tiered extraction pipeline that routes each page through PyMuPDF, Docling, or OCR via a difficulty classifier. Detected layout regions are chunked, embedded with bge-m3, and indexed per tenant in Qdrant. Retrieval fuses BM25 and dense scores with reciprocal rank fusion."), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "37.5%",
      width: "40%",
      height: "15%"
    }
  }, /*#__PURE__*/React.createElement(GreekLines, {
    seed: 7,
    gap: u * 0.8,
    h: u * 0.8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "54.5%",
      width: "40%",
      height: "13%"
    }
  }, /*#__PURE__*/React.createElement(GreekLines, {
    seed: 19,
    gap: u * 0.8,
    h: u * 0.8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "69.5%",
      width: "40%",
      height: "16%"
    }
  }, /*#__PURE__*/React.createElement(MiniTable, {
    u: u
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "8%",
      top: "87%",
      width: "40%",
      fontSize: u * 1.5,
      fontStyle: "italic",
      color: "#807F76"
    }
  }, "Table 1: Tier routing accuracy by document class."), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "52%",
      top: "37.5%",
      width: "40%",
      height: "10%"
    }
  }, /*#__PURE__*/React.createElement(GreekLines, {
    seed: 31,
    gap: u * 0.8,
    h: u * 0.8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "52%",
      top: "49.5%",
      width: "40%",
      height: "15.5%"
    }
  }, /*#__PURE__*/React.createElement(MiniChart, {
    u: u
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "52%",
      top: "66.5%",
      width: "40%",
      fontSize: u * 1.5,
      fontStyle: "italic",
      color: "#807F76"
    }
  }, "Figure 2: Recall@10 across fusion weights."), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "52%",
      top: "71.5%",
      width: "40%",
      height: "19%"
    }
  }, /*#__PURE__*/React.createElement(GreekLines, {
    seed: 53,
    gap: u * 0.8,
    h: u * 0.8
  }))), ELEMENTS.map(el => /*#__PURE__*/React.createElement("div", {
    key: el.id,
    style: {
      position: "absolute",
      left: `${el.x}%`,
      top: `${el.y}%`,
      width: `${el.w}%`,
      height: `${el.h}%`,
      border: `${Math.max(0.75, u * 0.18)}px solid ${el.c}`,
      background: el.c + "1F",
      borderRadius: 2,
      opacity: tB,
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -u * 2.4,
      left: -Math.max(0.75, u * 0.18),
      background: el.c,
      color: "#0B1020",
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: u * 1.3,
      padding: `${u * 0.15}px ${u * 0.6}px`,
      borderRadius: 2,
      whiteSpace: "nowrap"
    }
  }, el.type.toUpperCase())))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: vh * 0.14,
      transform: "translateX(-50%)",
      opacity: tE,
      textAlign: "center",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 150,
    height: 64,
    viewBox: "0 0 150 64"
  }, [0, 1, 2].map(li => {
    const xs = [14, 75, 136];
    const counts = [3, 4, 3];
    const ys = n => Array.from({
      length: n
    }, (_, i) => 32 + (i - (n - 1) / 2) * 15);
    if (li === 2) return null;
    return ys(counts[li]).map((y1, a) => ys(counts[li + 1]).map((y2, b) => /*#__PURE__*/React.createElement("line", {
      key: `${li}-${a}-${b}`,
      x1: xs[li],
      y1: y1,
      x2: xs[li + 1],
      y2: y2,
      stroke: "#66738F",
      strokeWidth: 0.7,
      opacity: 0.65
    })));
  }), [[14, 3], [75, 4], [136, 3]].map(([x, n], li) => Array.from({
    length: n
  }, (_, i) => /*#__PURE__*/React.createElement("circle", {
    key: `${li}-${i}`,
    cx: x,
    cy: 32 + (i - (n - 1) / 2) * 15,
    r: 4.2,
    fill: "#A9B4CE"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: MONO,
      fontSize: 12,
      color: "#B9C2D8",
      letterSpacing: "0.06em",
      marginTop: 2
    }
  }, "bge-m3 encoder \xB7 chunks \u2192 1024-d vectors")), chunks.map(el => {
    const size = lerp(24, 13, tCe);
    return /*#__PURE__*/React.createElement("div", {
      key: el.id,
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${el.dx}px, ${el.dy}px, 0)`,
        opacity: tC,
        pointerEvents: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        background: el.c,
        transform: "translate(-50%,-50%)",
        boxShadow: `0 0 ${10 + 16 * tD}px ${el.c}, 0 0 3px #fff inset`
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        top: size / 2 + 5,
        transform: "translateX(-50%)",
        fontFamily: MONO,
        fontSize: 10,
        color: "#C6CEE2",
        opacity: tD,
        whiteSpace: "nowrap",
        letterSpacing: "0.03em"
      }
    }, el.type.toLowerCase(), " \xB7 ", el.tok, " tok"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 26,
      bottom: 46,
      opacity: tD,
      fontFamily: MONO,
      fontSize: 11,
      color: "#9AA4BC",
      lineHeight: 1.9
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: "#34D399",
      marginRight: 8,
      boxShadow: "0 0 8px #34D399"
    }
  }), "this page's chunks"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: "#7E8AA8",
      marginRight: 8
    }
  }), "rest of the corpus")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 26,
      top: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: "0.22em",
      color: "#7E89A3"
    }
  }, "STAGE ", stageIdx + 1, "/4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 650,
      letterSpacing: "-0.01em",
      marginTop: 4
    }
  }, stage.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: MONO,
      fontSize: 12,
      color: "#8B96AF",
      marginTop: 4
    }
  }, stage.sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 26,
      top: 22,
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: btn,
    onClick: () => flyState !== 0 ? setFly(0) : setFly(curRef.current < L_MAX / 2 ? 1 : -1)
  }, flyState !== 0 ? "⏸ pause" : curRef.current < L_MAX / 2 ? "⏵ fly in" : "⏴ fly out"), /*#__PURE__*/React.createElement("button", {
    style: btn,
    onClick: () => {
      targetRef.current = 0;
      setFly(0);
    }
  }, "reset")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      bottom: 40,
      transform: "translateX(-50%)",
      width: Math.min(420, vw * 0.6)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 2,
      background: "rgba(255,255,255,0.14)",
      borderRadius: 1
    }
  }, STAGES.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: "absolute",
      left: `${s.at / L_MAX * 100}%`,
      top: -3,
      width: 8,
      height: 8,
      borderRadius: "50%",
      transform: "translateX(-50%)",
      background: stageIdx >= i ? "#DCE3F2" : "rgba(255,255,255,0.25)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: `${L / L_MAX * 100}%`,
      top: -5,
      width: 12,
      height: 12,
      borderRadius: "50%",
      transform: "translateX(-50%)",
      background: "#818CF8",
      boxShadow: "0 0 12px #818CF8"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 14,
      fontFamily: MONO,
      fontSize: 11,
      color: "#7E89A3",
      letterSpacing: "0.05em"
    }
  }, "scroll / pinch to travel \xB7 F fly \xB7 R reset")));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(SemanticZoomRAG, null));