import rn, { useState as Ue, useEffect as nn } from "react";
const sr = 30 * (Math.PI / 180), on = Math.cos(sr), tn = Math.sin(sr);
function _(e, r, n = 0) {
  return {
    screenX: (e - r) * on,
    screenY: -(e + r) * tn - n
    // Negated so +X,+Y go UP on screen
  };
}
function Ae(e, r, n, o = 0, i = 0, l = 0) {
  const t = {
    // Bottom face
    frontBottom: _(e, 0, 0),
    rightBottom: _(e, r, 0),
    backBottom: _(0, r, 0),
    leftBottom: _(0, 0, 0),
    // Top face
    frontTop: _(e, 0, n),
    rightTop: _(e, r, n),
    backTop: _(0, r, n),
    leftTop: _(0, 0, n)
  }, a = (O) => ({
    x: O.screenX + o,
    y: O.screenY + i
  }), c = Object.fromEntries(
    Object.entries(t).map(([O, $]) => [O, a($)])
  ), f = (O, $, y, k) => {
    if (k <= 0) {
      const K = _(0, 0, y), G = _(O, 0, y), P = _(O, $, y), T = _(0, $, y);
      return `M ${K.screenX + o},${K.screenY + i} L ${G.screenX + o},${G.screenY + i} L ${P.screenX + o},${P.screenY + i} L ${T.screenX + o},${T.screenY + i} Z`;
    }
    const N = Math.min(O, $) / 2, w = Math.min(k, N), R = 8, B = [], I = (K, G, P, T) => {
      for (let U = 0; U <= R; U++) {
        const X = P + (T - P) * (U / R), V = K + w * Math.cos(X), s = G + w * Math.sin(X), v = _(V, s, y);
        B.push(`${v.screenX + o},${v.screenY + i}`);
      }
    };
    return I(w, w, Math.PI, Math.PI * 1.5), I(O - w, w, Math.PI * 1.5, Math.PI * 2), I(O - w, $ - w, 0, Math.PI * 0.5), I(w, $ - w, Math.PI * 0.5, Math.PI), `M ${B[0]} L ${B.slice(1).join(" L ")} Z`;
  }, h = (O) => `M ${O.map(($) => `${$.x},${$.y}`).join(" L ")} Z`, d = (O, $, y, k, N, w) => {
    const B = [];
    for (let P = 0; P < 6; P++) {
      const T = N + (w - N) * (P / 6), U = N + (w - N) * ((P + 1) / 6), X = (T + U) / 2, V = Math.cos(X), s = Math.sin(X), E = V * -0.577 + s * -0.577 + 0 * 0.577, ie = 0.3 + Math.max(0, E + 0.4) * 0.5, oe = _(O + y * Math.cos(T), $ + y * Math.sin(T), 0), L = _(O + y * Math.cos(U), $ + y * Math.sin(U), 0), Z = _(O + y * Math.cos(T), $ + y * Math.sin(T), k), te = _(O + y * Math.cos(U), $ + y * Math.sin(U), k), ke = `M ${oe.screenX + o},${oe.screenY + i} L ${L.screenX + o},${L.screenY + i} L ${te.screenX + o},${te.screenY + i} L ${Z.screenX + o},${Z.screenY + i} Z`;
      B.push({ path: ke, intensity: ie });
    }
    return B;
  }, p = Math.min(l, Math.min(e, r) / 2), u = f(e, r, n, p);
  let m, g, b, C, A, q;
  if (p > 0) {
    const O = [
      { x: _(0, p, 0).screenX + o, y: _(0, p, 0).screenY + i },
      { x: _(0, r - p, 0).screenX + o, y: _(0, r - p, 0).screenY + i },
      { x: _(0, r - p, n).screenX + o, y: _(0, r - p, n).screenY + i },
      { x: _(0, p, n).screenX + o, y: _(0, p, n).screenY + i }
    ];
    m = h(O);
    const $ = [
      { x: _(p, 0, 0).screenX + o, y: _(p, 0, 0).screenY + i },
      { x: _(e - p, 0, 0).screenX + o, y: _(e - p, 0, 0).screenY + i },
      { x: _(e - p, 0, n).screenX + o, y: _(e - p, 0, n).screenY + i },
      { x: _(p, 0, n).screenX + o, y: _(p, 0, n).screenY + i }
    ];
    g = h($), b = d(p, p, p, n, Math.PI, Math.PI * 1.5), C = d(e - p, p, p, n, Math.PI * 1.5, Math.PI * 2), A = d(p, r - p, p, n, Math.PI * 0.5, Math.PI), q = d(e - p, r - p, p, n, 0, Math.PI * 0.5);
  } else {
    const O = [c.leftBottom, c.backBottom, c.backTop, c.leftTop], $ = [c.leftBottom, c.frontBottom, c.frontTop, c.leftTop];
    m = h(O), g = h($), b = [], C = [], A = [], q = [];
  }
  const J = `M ${c.leftBottom.x},${c.leftBottom.y} L ${c.frontBottom.x},${c.frontBottom.y} L ${c.rightBottom.x},${c.rightBottom.y} L ${c.backBottom.x},${c.backBottom.y} Z`;
  return {
    top: u,
    left: m,
    right: g,
    cornerFrontLeft: b,
    cornerFrontRight: C,
    cornerBackLeft: A,
    cornerBackRight: q,
    outline: J
  };
}
function ln(e, r = 60, n = 50) {
  return {
    top: `hsl(${e}, ${r}%, ${Math.min(n + 15, 95)}%)`,
    right: `hsl(${e}, ${r}%, ${n}%)`,
    left: `hsl(${e}, ${r}%, ${Math.max(n - 15, 15)}%)`
  };
}
const We = {
  violet: { hue: 270, saturation: 60, lightness: 55 },
  blue: { hue: 220, saturation: 70, lightness: 50 },
  cyan: { hue: 190, saturation: 80, lightness: 45 },
  emerald: { hue: 155, saturation: 65, lightness: 45 },
  amber: { hue: 40, saturation: 90, lightness: 50 },
  rose: { hue: 350, saturation: 70, lightness: 55 },
  slate: { hue: 220, saturation: 15, lightness: 50 },
  zinc: { hue: 240, saturation: 5, lightness: 50 }
};
function Uo(e) {
  const r = We[e] || We.slate;
  return ln(r.hue, r.saturation, r.lightness);
}
var ve = { exports: {} }, se = {};
var qe;
function an() {
  if (qe) return se;
  qe = 1;
  var e = /* @__PURE__ */ Symbol.for("react.transitional.element"), r = /* @__PURE__ */ Symbol.for("react.fragment");
  function n(o, i, l) {
    var t = null;
    if (l !== void 0 && (t = "" + l), i.key !== void 0 && (t = "" + i.key), "key" in i) {
      l = {};
      for (var a in i)
        a !== "key" && (l[a] = i[a]);
    } else l = i;
    return i = l.ref, {
      $$typeof: e,
      type: o,
      key: t,
      ref: i !== void 0 ? i : null,
      props: l
    };
  }
  return se.Fragment = r, se.jsx = n, se.jsxs = n, se;
}
var pe = {};
var Ke;
function cn() {
  return Ke || (Ke = 1, process.env.NODE_ENV !== "production" && (function() {
    function e(s) {
      if (s == null) return null;
      if (typeof s == "function")
        return s.$$typeof === R ? null : s.displayName || s.name || null;
      if (typeof s == "string") return s;
      switch (s) {
        case b:
          return "Fragment";
        case A:
          return "Profiler";
        case C:
          return "StrictMode";
        case $:
          return "Suspense";
        case y:
          return "SuspenseList";
        case w:
          return "Activity";
      }
      if (typeof s == "object")
        switch (typeof s.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), s.$$typeof) {
          case g:
            return "Portal";
          case J:
            return s.displayName || "Context";
          case q:
            return (s._context.displayName || "Context") + ".Consumer";
          case O:
            var v = s.render;
            return s = s.displayName, s || (s = v.displayName || v.name || "", s = s !== "" ? "ForwardRef(" + s + ")" : "ForwardRef"), s;
          case k:
            return v = s.displayName || null, v !== null ? v : e(s.type) || "Memo";
          case N:
            v = s._payload, s = s._init;
            try {
              return e(s(v));
            } catch {
            }
        }
      return null;
    }
    function r(s) {
      return "" + s;
    }
    function n(s) {
      try {
        r(s);
        var v = !1;
      } catch {
        v = !0;
      }
      if (v) {
        v = console;
        var E = v.error, F = typeof Symbol == "function" && Symbol.toStringTag && s[Symbol.toStringTag] || s.constructor.name || "Object";
        return E.call(
          v,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          F
        ), r(s);
      }
    }
    function o(s) {
      if (s === b) return "<>";
      if (typeof s == "object" && s !== null && s.$$typeof === N)
        return "<...>";
      try {
        var v = e(s);
        return v ? "<" + v + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function i() {
      var s = B.A;
      return s === null ? null : s.getOwner();
    }
    function l() {
      return Error("react-stack-top-frame");
    }
    function t(s) {
      if (I.call(s, "key")) {
        var v = Object.getOwnPropertyDescriptor(s, "key").get;
        if (v && v.isReactWarning) return !1;
      }
      return s.key !== void 0;
    }
    function a(s, v) {
      function E() {
        P || (P = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          v
        ));
      }
      E.isReactWarning = !0, Object.defineProperty(s, "key", {
        get: E,
        configurable: !0
      });
    }
    function c() {
      var s = e(this.type);
      return T[s] || (T[s] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), s = this.props.ref, s !== void 0 ? s : null;
    }
    function f(s, v, E, F, ie, oe) {
      var L = E.ref;
      return s = {
        $$typeof: m,
        type: s,
        key: v,
        props: E,
        _owner: F
      }, (L !== void 0 ? L : null) !== null ? Object.defineProperty(s, "ref", {
        enumerable: !1,
        get: c
      }) : Object.defineProperty(s, "ref", { enumerable: !1, value: null }), s._store = {}, Object.defineProperty(s._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      }), Object.defineProperty(s, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      }), Object.defineProperty(s, "_debugStack", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: ie
      }), Object.defineProperty(s, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: oe
      }), Object.freeze && (Object.freeze(s.props), Object.freeze(s)), s;
    }
    function h(s, v, E, F, ie, oe) {
      var L = v.children;
      if (L !== void 0)
        if (F)
          if (K(L)) {
            for (F = 0; F < L.length; F++)
              d(L[F]);
            Object.freeze && Object.freeze(L);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else d(L);
      if (I.call(v, "key")) {
        L = e(s);
        var Z = Object.keys(v).filter(function(ke) {
          return ke !== "key";
        });
        F = 0 < Z.length ? "{key: someKey, " + Z.join(": ..., ") + ": ...}" : "{key: someKey}", V[L + F] || (Z = 0 < Z.length ? "{" + Z.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          F,
          L,
          Z,
          L
        ), V[L + F] = !0);
      }
      if (L = null, E !== void 0 && (n(E), L = "" + E), t(v) && (n(v.key), L = "" + v.key), "key" in v) {
        E = {};
        for (var te in v)
          te !== "key" && (E[te] = v[te]);
      } else E = v;
      return L && a(
        E,
        typeof s == "function" ? s.displayName || s.name || "Unknown" : s
      ), f(
        s,
        L,
        E,
        i(),
        ie,
        oe
      );
    }
    function d(s) {
      p(s) ? s._store && (s._store.validated = 1) : typeof s == "object" && s !== null && s.$$typeof === N && (s._payload.status === "fulfilled" ? p(s._payload.value) && s._payload.value._store && (s._payload.value._store.validated = 1) : s._store && (s._store.validated = 1));
    }
    function p(s) {
      return typeof s == "object" && s !== null && s.$$typeof === m;
    }
    var u = rn, m = /* @__PURE__ */ Symbol.for("react.transitional.element"), g = /* @__PURE__ */ Symbol.for("react.portal"), b = /* @__PURE__ */ Symbol.for("react.fragment"), C = /* @__PURE__ */ Symbol.for("react.strict_mode"), A = /* @__PURE__ */ Symbol.for("react.profiler"), q = /* @__PURE__ */ Symbol.for("react.consumer"), J = /* @__PURE__ */ Symbol.for("react.context"), O = /* @__PURE__ */ Symbol.for("react.forward_ref"), $ = /* @__PURE__ */ Symbol.for("react.suspense"), y = /* @__PURE__ */ Symbol.for("react.suspense_list"), k = /* @__PURE__ */ Symbol.for("react.memo"), N = /* @__PURE__ */ Symbol.for("react.lazy"), w = /* @__PURE__ */ Symbol.for("react.activity"), R = /* @__PURE__ */ Symbol.for("react.client.reference"), B = u.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, I = Object.prototype.hasOwnProperty, K = Array.isArray, G = console.createTask ? console.createTask : function() {
      return null;
    };
    u = {
      react_stack_bottom_frame: function(s) {
        return s();
      }
    };
    var P, T = {}, U = u.react_stack_bottom_frame.bind(
      u,
      l
    )(), X = G(o(l)), V = {};
    pe.Fragment = b, pe.jsx = function(s, v, E) {
      var F = 1e4 > B.recentlyCreatedOwnerStacks++;
      return h(
        s,
        v,
        E,
        !1,
        F ? Error("react-stack-top-frame") : U,
        F ? G(o(s)) : X
      );
    }, pe.jsxs = function(s, v, E) {
      var F = 1e4 > B.recentlyCreatedOwnerStacks++;
      return h(
        s,
        v,
        E,
        !0,
        F ? Error("react-stack-top-frame") : U,
        F ? G(o(s)) : X
      );
    };
  })()), pe;
}
var Ge;
function fn() {
  return Ge || (Ge = 1, process.env.NODE_ENV === "production" ? ve.exports = an() : ve.exports = cn()), ve.exports;
}
var S = fn();
const pr = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace', un = {
  blue: { top: "#3b82f6", side: "#2563eb", front: "#1d4ed8" },
  violet: { top: "#8b5cf6", side: "#7c3aed", front: "#6d28d9" },
  cyan: { top: "#06b6d4", side: "#0891b2", front: "#0e7490" },
  emerald: { top: "#10b981", side: "#059669", front: "#047857" },
  amber: { top: "#f59e0b", side: "#d97706", front: "#b45309" },
  rose: { top: "#f43f5e", side: "#e11d48", front: "#be123c" },
  slate: { top: "#475569", side: "#334155", front: "#1e293b" }
}, sn = {
  blue: { top: "#93c5fd", side: "#60a5fa", front: "#3b82f6" },
  violet: { top: "#c4b5fd", side: "#a78bfa", front: "#8b5cf6" },
  cyan: { top: "#67e8f9", side: "#22d3ee", front: "#06b6d4" },
  emerald: { top: "#6ee7b7", side: "#34d399", front: "#10b981" },
  amber: { top: "#fcd34d", side: "#fbbf24", front: "#f59e0b" },
  rose: { top: "#fda4af", side: "#fb7185", front: "#f43f5e" },
  slate: { top: "#e2e8f0", side: "#cbd5e1", front: "#94a3b8" }
};
function ye(e, r, n) {
  const o = (f) => {
    const h = f.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }, i = o(e), l = o(r), t = Math.round(i.r + (l.r - i.r) * n), a = Math.round(i.g + (l.g - i.g) * n), c = Math.round(i.b + (l.b - i.b) * n);
  return `rgb(${t},${a},${c})`;
}
function pn({ x: e, y: r, z: n, children: o, fontSize: i = 8, color: l = "#1e293b" }) {
  const t = _(e, r, n);
  return /* @__PURE__ */ S.jsx("g", { transform: `translate(${t.screenX}, ${t.screenY})`, children: /* @__PURE__ */ S.jsx("g", { transform: "matrix(0.866, -0.5, 0.866, 0.5, 0, 0)", children: /* @__PURE__ */ S.jsx(
    "text",
    {
      x: 0,
      y: 0,
      textAnchor: "middle",
      fill: l,
      fontSize: i,
      fontWeight: 500,
      fontFamily: pr,
      style: { textTransform: "uppercase", letterSpacing: "0.08em" },
      children: o
    }
  ) }) });
}
function dn({ width: e, depth: r, elevation: n, color: o, opacity: i, borderColor: l, theme: t, isGround: a }) {
  const f = Ae(e, r, a ? 8 : 2, 0, 0), h = _(0, 0, n);
  return /* @__PURE__ */ S.jsxs("g", { transform: `translate(${h.screenX}, ${h.screenY})`, children: [
    a && /* @__PURE__ */ S.jsx("g", { transform: "translate(4, 4)", opacity: 0.2, children: /* @__PURE__ */ S.jsx("path", { d: f.top, fill: "#000" }) }),
    /* @__PURE__ */ S.jsx("path", { d: f.top, fill: o, opacity: i }),
    a && /* @__PURE__ */ S.jsxs(S.Fragment, { children: [
      /* @__PURE__ */ S.jsx("path", { d: f.left, fill: t === "dark" ? "#0f172a" : "#cbd5e1", opacity: 0.8 }),
      /* @__PURE__ */ S.jsx("path", { d: f.right, fill: t === "dark" ? "#1e293b" : "#94a3b8", opacity: 0.8 })
    ] }),
    /* @__PURE__ */ S.jsx(
      "path",
      {
        d: f.top,
        fill: "none",
        stroke: l || (t === "dark" ? "#475569" : "#94a3b8"),
        strokeWidth: a ? 1.5 : 0.75,
        opacity: a ? 1 : 0.6
      }
    )
  ] });
}
function Wo({ config: e, options: r = {}, className: n, style: o }) {
  const { interactive: i = !0, animate: l = !0, showLabels: t = !0 } = r, { theme: a, canvas: c, origin: f, tiers: h, floorSize: d, nodes: p, cornerRadius: u = 0 } = e, m = a === "dark" ? un : sn, g = a === "dark" ? "#0f172a" : "#fafafa", b = a === "dark" ? "#e2e8f0" : "#1e293b", C = a === "dark" ? "#64748b" : "#94a3b8", [A, q] = Ue(/* @__PURE__ */ new Set());
  nn(() => {
    l ? (q(/* @__PURE__ */ new Set()), h.forEach((y, k) => {
      setTimeout(() => {
        q((N) => /* @__PURE__ */ new Set([...N, k]));
      }, k * 150 + 100);
    })) : q(new Set(h.map((y, k) => k)));
  }, [e.id, l, h.length]);
  const [J, O] = Ue(null), $ = [...p].sort((y, k) => {
    const N = h[y.tier]?.elevation || 0, w = h[k.tier]?.elevation || 0;
    if (N !== w) return N - w;
    const R = y.x + y.width + (y.y + y.depth);
    return k.x + k.width + (k.y + k.depth) - R;
  });
  return /* @__PURE__ */ S.jsx("div", { className: n, style: { display: "inline-block", ...o }, children: /* @__PURE__ */ S.jsxs("svg", { width: c.width, height: c.height, style: { backgroundColor: g }, children: [
    /* @__PURE__ */ S.jsxs("defs", { children: [
      /* @__PURE__ */ S.jsx("pattern", { id: `grid-${e.id}`, width: "24", height: "24", patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ S.jsx("circle", { cx: "12", cy: "12", r: "0.5", fill: a === "dark" ? "#1e293b" : "#e2e8f0" }) }),
      /* @__PURE__ */ S.jsx("filter", { id: `glow-${e.id}`, x: "-20%", y: "-20%", width: "140%", height: "140%", children: /* @__PURE__ */ S.jsx(
        "feDropShadow",
        {
          dx: "0",
          dy: "4",
          stdDeviation: "8",
          floodColor: a === "dark" ? "#60a5fa" : "#3b82f6",
          floodOpacity: "0.3"
        }
      ) })
    ] }),
    /* @__PURE__ */ S.jsx("rect", { width: "100%", height: "100%", fill: `url(#grid-${e.id})`, opacity: "0.5" }),
    /* @__PURE__ */ S.jsx("g", { transform: `translate(${f.x}, ${f.y})`, children: h.map((y, k) => {
      const N = $.filter((T) => T.tier === k), w = A.has(k), R = i && J === k, B = w ? 0 : 60, I = w ? 1 : 0, K = R ? 1.02 : 1, G = i && J !== null && !R, P = _(d.width / 2, d.depth / 2, y.elevation);
      return /* @__PURE__ */ S.jsxs(
        "g",
        {
          onMouseEnter: () => i && O(k),
          onMouseLeave: () => i && O(null),
          style: {
            transform: `translate(${P.screenX}px, ${P.screenY + B}px) scale(${K}) translate(${-P.screenX}px, ${-P.screenY}px)`,
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out",
            opacity: I * (G ? 0.5 : 1),
            filter: R ? `url(#glow-${e.id})` : "none",
            cursor: i ? "pointer" : "default"
          },
          children: [
            /* @__PURE__ */ S.jsx(
              dn,
              {
                width: d.width,
                depth: d.depth,
                elevation: k === 0 ? -2 : y.elevation,
                color: y.floorColor || (a === "dark" ? "#0f172a" : "#f8fafc"),
                opacity: y.floorOpacity || (k === 0 ? 0.95 : 0.5),
                borderColor: y.borderColor,
                theme: a,
                isGround: k === 0
              }
            ),
            N.map((T, U) => {
              const X = y.elevation + 5, V = _(T.x, T.y, X), s = Ae(T.width, T.depth, T.height, V.screenX, V.screenY, u), v = m[T.color] || m.slate;
              return /* @__PURE__ */ S.jsxs("g", { opacity: T.opacity ?? 1, children: [
                s.cornerBackRight?.map((E, F) => /* @__PURE__ */ S.jsx(
                  "path",
                  {
                    d: E.path,
                    fill: ye(v.front, v.side, E.intensity)
                  },
                  `cbr-${F}`
                )),
                s.cornerBackLeft?.map((E, F) => /* @__PURE__ */ S.jsx(
                  "path",
                  {
                    d: E.path,
                    fill: ye(v.side, v.front, E.intensity)
                  },
                  `cbl-${F}`
                )),
                /* @__PURE__ */ S.jsx("path", { d: s.left, fill: v.side }),
                /* @__PURE__ */ S.jsx("path", { d: s.right, fill: v.front }),
                s.cornerFrontRight?.map((E, F) => /* @__PURE__ */ S.jsx(
                  "path",
                  {
                    d: E.path,
                    fill: ye(v.front, v.side, E.intensity)
                  },
                  `cfr-${F}`
                )),
                s.cornerFrontLeft?.map((E, F) => /* @__PURE__ */ S.jsx(
                  "path",
                  {
                    d: E.path,
                    fill: ye(v.front, v.side, E.intensity)
                  },
                  `cfl-${F}`
                )),
                /* @__PURE__ */ S.jsx("path", { d: s.top, fill: v.top }),
                /* @__PURE__ */ S.jsx(
                  "path",
                  {
                    d: s.top,
                    fill: "none",
                    stroke: "rgba(255,255,255,0.15)",
                    strokeWidth: "0.5",
                    strokeLinejoin: "round"
                  }
                ),
                t && T.label && /* @__PURE__ */ S.jsx(
                  pn,
                  {
                    x: T.x + T.width / 2,
                    y: T.y + T.depth / 2,
                    z: X + T.height + 2,
                    fontSize: T.width > 70 ? 8 : 7,
                    color: b,
                    children: T.label
                  }
                )
              ] }, U);
            }),
            t && /* @__PURE__ */ S.jsx(
              "text",
              {
                x: _(-25, d.depth / 2, y.elevation + 15).screenX - 35,
                y: _(-25, d.depth / 2, y.elevation + 15).screenY,
                fill: C,
                fontSize: 9,
                fontWeight: 500,
                fontFamily: pr,
                opacity: 0.6,
                style: { letterSpacing: "0.05em" },
                children: y.name
              }
            )
          ]
        },
        k
      );
    }) })
  ] }) });
}
const Xe = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace', hn = {
  blue: { top: "#3b82f6", side: "#2563eb", front: "#1d4ed8" },
  violet: { top: "#8b5cf6", side: "#7c3aed", front: "#6d28d9" },
  cyan: { top: "#06b6d4", side: "#0891b2", front: "#0e7490" },
  emerald: { top: "#10b981", side: "#059669", front: "#047857" },
  amber: { top: "#f59e0b", side: "#d97706", front: "#b45309" },
  rose: { top: "#f43f5e", side: "#e11d48", front: "#be123c" },
  slate: { top: "#475569", side: "#334155", front: "#1e293b" }
}, mn = {
  blue: { top: "#93c5fd", side: "#60a5fa", front: "#3b82f6" },
  violet: { top: "#c4b5fd", side: "#a78bfa", front: "#8b5cf6" },
  cyan: { top: "#67e8f9", side: "#22d3ee", front: "#06b6d4" },
  emerald: { top: "#6ee7b7", side: "#34d399", front: "#10b981" },
  amber: { top: "#fcd34d", side: "#fbbf24", front: "#f59e0b" },
  rose: { top: "#fda4af", side: "#fb7185", front: "#f43f5e" },
  slate: { top: "#e2e8f0", side: "#cbd5e1", front: "#94a3b8" }
};
function be(e, r, n) {
  const o = (f) => {
    const h = f.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }, i = o(e), l = o(r), t = Math.round(i.r + (l.r - i.r) * n), a = Math.round(i.g + (l.g - i.g) * n), c = Math.round(i.b + (l.b - i.b) * n);
  return `rgb(${t},${a},${c})`;
}
function xn(e) {
  const { theme: r, canvas: n, origin: o, tiers: i, floorSize: l, nodes: t, cornerRadius: a = 0 } = e, c = r === "dark" ? hn : mn, f = r === "dark" ? "#0f172a" : "#fafafa", h = r === "dark" ? "#e2e8f0" : "#1e293b", d = r === "dark" ? "#64748b" : "#94a3b8", p = [...t].sort((m, g) => {
    const b = i[m.tier]?.elevation || 0, C = i[g.tier]?.elevation || 0;
    return b !== C ? b - C : g.x + g.width + (g.y + g.depth) - (m.x + m.width + (m.y + m.depth));
  });
  let u = `<svg xmlns="http://www.w3.org/2000/svg" width="${n.width}" height="${n.height}" style="background:${f}">`;
  u += `<defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="0.5" fill="${r === "dark" ? "#1e293b" : "#e2e8f0"}"/>
    </pattern>
  </defs>`, u += '<rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>', u += `<g transform="translate(${o.x},${o.y})">`;
  for (let m = 0; m < i.length; m++) {
    const g = i[m], b = p.filter((y) => y.tier === m), C = m === 0 ? 8 : 2, A = Ae(l.width, l.depth, C, 0, 0), q = _(0, 0, m === 0 ? -2 : g.elevation), J = g.floorColor || (r === "dark" ? "#0f172a" : "#f8fafc"), O = g.floorOpacity || (m === 0 ? 0.95 : 0.5);
    u += `<g transform="translate(${q.screenX},${q.screenY})">`, m === 0 && (u += `<g transform="translate(4,4)" opacity="0.2"><path d="${A.top}" fill="#000"/></g>`), u += `<path d="${A.top}" fill="${J}" opacity="${O}"/>`, m === 0 && (u += `<path d="${A.left}" fill="${r === "dark" ? "#0f172a" : "#cbd5e1"}" opacity="0.8"/>`, u += `<path d="${A.right}" fill="${r === "dark" ? "#1e293b" : "#94a3b8"}" opacity="0.8"/>`), u += `<path d="${A.top}" fill="none" stroke="${g.borderColor || (r === "dark" ? "#475569" : "#94a3b8")}" stroke-width="${m === 0 ? 1.5 : 0.75}" opacity="${m === 0 ? 1 : 0.6}"/>`, u += "</g>";
    for (const y of b) {
      const k = g.elevation + 5, N = _(y.x, y.y, k), w = Ae(y.width, y.depth, y.height, N.screenX, N.screenY, a), R = c[y.color] || c.slate, B = y.opacity ?? 1;
      if (u += `<g opacity="${B}">`, w.cornerBackRight)
        for (const I of w.cornerBackRight)
          u += `<path d="${I.path}" fill="${be(R.front, R.side, I.intensity)}"/>`;
      if (w.cornerBackLeft)
        for (const I of w.cornerBackLeft)
          u += `<path d="${I.path}" fill="${be(R.side, R.front, I.intensity)}"/>`;
      if (u += `<path d="${w.left}" fill="${R.side}"/>`, u += `<path d="${w.right}" fill="${R.front}"/>`, w.cornerFrontRight)
        for (const I of w.cornerFrontRight)
          u += `<path d="${I.path}" fill="${be(R.front, R.side, I.intensity)}"/>`;
      if (w.cornerFrontLeft)
        for (const I of w.cornerFrontLeft)
          u += `<path d="${I.path}" fill="${be(R.front, R.side, I.intensity)}"/>`;
      if (u += `<path d="${w.top}" fill="${R.top}"/>`, u += `<path d="${w.top}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-linejoin="round"/>`, y.label) {
        const I = _(y.x + y.width / 2, y.y + y.depth / 2, k + y.height + 2), K = y.width > 70 ? 8 : 7;
        u += `<g transform="translate(${I.screenX},${I.screenY})">`, u += '<g transform="matrix(0.866,-0.5,0.866,0.5,0,0)">', u += `<text x="0" y="0" text-anchor="middle" fill="${h}" font-size="${K}" font-weight="500" font-family="${Xe}" style="text-transform:uppercase;letter-spacing:0.08em">${y.label}</text>`, u += "</g></g>";
      }
      u += "</g>";
    }
    const $ = _(-25, l.depth / 2, g.elevation + 15);
    u += `<text x="${$.screenX - 35}" y="${$.screenY}" fill="${d}" font-size="9" font-weight="500" font-family="${Xe}" opacity="0.6" style="letter-spacing:0.05em">${g.name}</text>`;
  }
  return u += "</g></svg>", u;
}
function qo(e, r) {
  e.innerHTML = xn(r);
}
function dr(e) {
  return typeof e > "u" || e === null;
}
function gn(e) {
  return typeof e == "object" && e !== null;
}
function vn(e) {
  return Array.isArray(e) ? e : dr(e) ? [] : [e];
}
function yn(e, r) {
  var n, o, i, l;
  if (r)
    for (l = Object.keys(r), n = 0, o = l.length; n < o; n += 1)
      i = l[n], e[i] = r[i];
  return e;
}
function bn(e, r) {
  var n = "", o;
  for (o = 0; o < r; o += 1)
    n += e;
  return n;
}
function An(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
var _n = dr, Cn = gn, En = vn, wn = bn, Sn = An, Tn = yn, j = {
  isNothing: _n,
  isObject: Cn,
  toArray: En,
  repeat: wn,
  isNegativeZero: Sn,
  extend: Tn
};
function hr(e, r) {
  var n = "", o = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (n += 'in "' + e.mark.name + '" '), n += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !r && e.mark.snippet && (n += `

` + e.mark.snippet), o + " " + n) : o;
}
function he(e, r) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = r, this.message = hr(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
he.prototype = Object.create(Error.prototype);
he.prototype.constructor = he;
he.prototype.toString = function(r) {
  return this.name + ": " + hr(this, r);
};
var H = he;
function Oe(e, r, n, o, i) {
  var l = "", t = "", a = Math.floor(i / 2) - 1;
  return o - r > a && (l = " ... ", r = o - a + l.length), n - o > a && (t = " ...", n = o + a - t.length), {
    str: l + e.slice(r, n).replace(/\t/g, "→") + t,
    pos: o - r + l.length
    // relative position
  };
}
function Fe(e, r) {
  return j.repeat(" ", r - e.length) + e;
}
function kn(e, r) {
  if (r = Object.create(r || null), !e.buffer) return null;
  r.maxLength || (r.maxLength = 79), typeof r.indent != "number" && (r.indent = 1), typeof r.linesBefore != "number" && (r.linesBefore = 3), typeof r.linesAfter != "number" && (r.linesAfter = 2);
  for (var n = /\r?\n|\r|\0/g, o = [0], i = [], l, t = -1; l = n.exec(e.buffer); )
    i.push(l.index), o.push(l.index + l[0].length), e.position <= l.index && t < 0 && (t = o.length - 2);
  t < 0 && (t = o.length - 1);
  var a = "", c, f, h = Math.min(e.line + r.linesAfter, i.length).toString().length, d = r.maxLength - (r.indent + h + 3);
  for (c = 1; c <= r.linesBefore && !(t - c < 0); c++)
    f = Oe(
      e.buffer,
      o[t - c],
      i[t - c],
      e.position - (o[t] - o[t - c]),
      d
    ), a = j.repeat(" ", r.indent) + Fe((e.line - c + 1).toString(), h) + " | " + f.str + `
` + a;
  for (f = Oe(e.buffer, o[t], i[t], e.position, d), a += j.repeat(" ", r.indent) + Fe((e.line + 1).toString(), h) + " | " + f.str + `
`, a += j.repeat("-", r.indent + h + 3 + f.pos) + `^
`, c = 1; c <= r.linesAfter && !(t + c >= i.length); c++)
    f = Oe(
      e.buffer,
      o[t + c],
      i[t + c],
      e.position - (o[t] - o[t + c]),
      d
    ), a += j.repeat(" ", r.indent) + Fe((e.line + c + 1).toString(), h) + " | " + f.str + `
`;
  return a.replace(/\n$/, "");
}
var On = kn, Fn = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], $n = [
  "scalar",
  "sequence",
  "mapping"
];
function In(e) {
  var r = {};
  return e !== null && Object.keys(e).forEach(function(n) {
    e[n].forEach(function(o) {
      r[String(o)] = n;
    });
  }), r;
}
function Rn(e, r) {
  if (r = r || {}, Object.keys(r).forEach(function(n) {
    if (Fn.indexOf(n) === -1)
      throw new H('Unknown option "' + n + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = r, this.tag = e, this.kind = r.kind || null, this.resolve = r.resolve || function() {
    return !0;
  }, this.construct = r.construct || function(n) {
    return n;
  }, this.instanceOf = r.instanceOf || null, this.predicate = r.predicate || null, this.represent = r.represent || null, this.representName = r.representName || null, this.defaultStyle = r.defaultStyle || null, this.multi = r.multi || !1, this.styleAliases = In(r.styleAliases || null), $n.indexOf(this.kind) === -1)
    throw new H('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var D = Rn;
function ze(e, r) {
  var n = [];
  return e[r].forEach(function(o) {
    var i = n.length;
    n.forEach(function(l, t) {
      l.tag === o.tag && l.kind === o.kind && l.multi === o.multi && (i = t);
    }), n[i] = o;
  }), n;
}
function Ln() {
  var e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, r, n;
  function o(i) {
    i.multi ? (e.multi[i.kind].push(i), e.multi.fallback.push(i)) : e[i.kind][i.tag] = e.fallback[i.tag] = i;
  }
  for (r = 0, n = arguments.length; r < n; r += 1)
    arguments[r].forEach(o);
  return e;
}
function Ie(e) {
  return this.extend(e);
}
Ie.prototype.extend = function(r) {
  var n = [], o = [];
  if (r instanceof D)
    o.push(r);
  else if (Array.isArray(r))
    o = o.concat(r);
  else if (r && (Array.isArray(r.implicit) || Array.isArray(r.explicit)))
    r.implicit && (n = n.concat(r.implicit)), r.explicit && (o = o.concat(r.explicit));
  else
    throw new H("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  n.forEach(function(l) {
    if (!(l instanceof D))
      throw new H("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (l.loadKind && l.loadKind !== "scalar")
      throw new H("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (l.multi)
      throw new H("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), o.forEach(function(l) {
    if (!(l instanceof D))
      throw new H("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var i = Object.create(Ie.prototype);
  return i.implicit = (this.implicit || []).concat(n), i.explicit = (this.explicit || []).concat(o), i.compiledImplicit = ze(i, "implicit"), i.compiledExplicit = ze(i, "explicit"), i.compiledTypeMap = Ln(i.compiledImplicit, i.compiledExplicit), i;
};
var mr = Ie, xr = new D("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), gr = new D("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), vr = new D("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), yr = new mr({
  explicit: [
    xr,
    gr,
    vr
  ]
});
function Nn(e) {
  if (e === null) return !0;
  var r = e.length;
  return r === 1 && e === "~" || r === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function Mn() {
  return null;
}
function jn(e) {
  return e === null;
}
var br = new D("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: Nn,
  construct: Mn,
  predicate: jn,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function Pn(e) {
  if (e === null) return !1;
  var r = e.length;
  return r === 4 && (e === "true" || e === "True" || e === "TRUE") || r === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function Dn(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function Yn(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var Ar = new D("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: Pn,
  construct: Dn,
  predicate: Yn,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function Bn(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function Hn(e) {
  return 48 <= e && e <= 55;
}
function Un(e) {
  return 48 <= e && e <= 57;
}
function Wn(e) {
  if (e === null) return !1;
  var r = e.length, n = 0, o = !1, i;
  if (!r) return !1;
  if (i = e[n], (i === "-" || i === "+") && (i = e[++n]), i === "0") {
    if (n + 1 === r) return !0;
    if (i = e[++n], i === "b") {
      for (n++; n < r; n++)
        if (i = e[n], i !== "_") {
          if (i !== "0" && i !== "1") return !1;
          o = !0;
        }
      return o && i !== "_";
    }
    if (i === "x") {
      for (n++; n < r; n++)
        if (i = e[n], i !== "_") {
          if (!Bn(e.charCodeAt(n))) return !1;
          o = !0;
        }
      return o && i !== "_";
    }
    if (i === "o") {
      for (n++; n < r; n++)
        if (i = e[n], i !== "_") {
          if (!Hn(e.charCodeAt(n))) return !1;
          o = !0;
        }
      return o && i !== "_";
    }
  }
  if (i === "_") return !1;
  for (; n < r; n++)
    if (i = e[n], i !== "_") {
      if (!Un(e.charCodeAt(n)))
        return !1;
      o = !0;
    }
  return !(!o || i === "_");
}
function qn(e) {
  var r = e, n = 1, o;
  if (r.indexOf("_") !== -1 && (r = r.replace(/_/g, "")), o = r[0], (o === "-" || o === "+") && (o === "-" && (n = -1), r = r.slice(1), o = r[0]), r === "0") return 0;
  if (o === "0") {
    if (r[1] === "b") return n * parseInt(r.slice(2), 2);
    if (r[1] === "x") return n * parseInt(r.slice(2), 16);
    if (r[1] === "o") return n * parseInt(r.slice(2), 8);
  }
  return n * parseInt(r, 10);
}
function Kn(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !j.isNegativeZero(e);
}
var _r = new D("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: Wn,
  construct: qn,
  predicate: Kn,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
}), Gn = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function Xn(e) {
  return !(e === null || !Gn.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function zn(e) {
  var r, n;
  return r = e.replace(/_/g, "").toLowerCase(), n = r[0] === "-" ? -1 : 1, "+-".indexOf(r[0]) >= 0 && (r = r.slice(1)), r === ".inf" ? n === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : r === ".nan" ? NaN : n * parseFloat(r, 10);
}
var Vn = /^[-+]?[0-9]+e/;
function Zn(e, r) {
  var n;
  if (isNaN(e))
    switch (r) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (r) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (r) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (j.isNegativeZero(e))
    return "-0.0";
  return n = e.toString(10), Vn.test(n) ? n.replace("e", ".e") : n;
}
function Qn(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || j.isNegativeZero(e));
}
var Cr = new D("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: Xn,
  construct: zn,
  predicate: Qn,
  represent: Zn,
  defaultStyle: "lowercase"
}), Er = yr.extend({
  implicit: [
    br,
    Ar,
    _r,
    Cr
  ]
}), wr = Er, Sr = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), Tr = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function Jn(e) {
  return e === null ? !1 : Sr.exec(e) !== null || Tr.exec(e) !== null;
}
function ei(e) {
  var r, n, o, i, l, t, a, c = 0, f = null, h, d, p;
  if (r = Sr.exec(e), r === null && (r = Tr.exec(e)), r === null) throw new Error("Date resolve error");
  if (n = +r[1], o = +r[2] - 1, i = +r[3], !r[4])
    return new Date(Date.UTC(n, o, i));
  if (l = +r[4], t = +r[5], a = +r[6], r[7]) {
    for (c = r[7].slice(0, 3); c.length < 3; )
      c += "0";
    c = +c;
  }
  return r[9] && (h = +r[10], d = +(r[11] || 0), f = (h * 60 + d) * 6e4, r[9] === "-" && (f = -f)), p = new Date(Date.UTC(n, o, i, l, t, a, c)), f && p.setTime(p.getTime() - f), p;
}
function ri(e) {
  return e.toISOString();
}
var kr = new D("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: Jn,
  construct: ei,
  instanceOf: Date,
  represent: ri
});
function ni(e) {
  return e === "<<" || e === null;
}
var Or = new D("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: ni
}), je = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function ii(e) {
  if (e === null) return !1;
  var r, n, o = 0, i = e.length, l = je;
  for (n = 0; n < i; n++)
    if (r = l.indexOf(e.charAt(n)), !(r > 64)) {
      if (r < 0) return !1;
      o += 6;
    }
  return o % 8 === 0;
}
function oi(e) {
  var r, n, o = e.replace(/[\r\n=]/g, ""), i = o.length, l = je, t = 0, a = [];
  for (r = 0; r < i; r++)
    r % 4 === 0 && r && (a.push(t >> 16 & 255), a.push(t >> 8 & 255), a.push(t & 255)), t = t << 6 | l.indexOf(o.charAt(r));
  return n = i % 4 * 6, n === 0 ? (a.push(t >> 16 & 255), a.push(t >> 8 & 255), a.push(t & 255)) : n === 18 ? (a.push(t >> 10 & 255), a.push(t >> 2 & 255)) : n === 12 && a.push(t >> 4 & 255), new Uint8Array(a);
}
function ti(e) {
  var r = "", n = 0, o, i, l = e.length, t = je;
  for (o = 0; o < l; o++)
    o % 3 === 0 && o && (r += t[n >> 18 & 63], r += t[n >> 12 & 63], r += t[n >> 6 & 63], r += t[n & 63]), n = (n << 8) + e[o];
  return i = l % 3, i === 0 ? (r += t[n >> 18 & 63], r += t[n >> 12 & 63], r += t[n >> 6 & 63], r += t[n & 63]) : i === 2 ? (r += t[n >> 10 & 63], r += t[n >> 4 & 63], r += t[n << 2 & 63], r += t[64]) : i === 1 && (r += t[n >> 2 & 63], r += t[n << 4 & 63], r += t[64], r += t[64]), r;
}
function li(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var Fr = new D("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: ii,
  construct: oi,
  predicate: li,
  represent: ti
}), ai = Object.prototype.hasOwnProperty, ci = Object.prototype.toString;
function fi(e) {
  if (e === null) return !0;
  var r = [], n, o, i, l, t, a = e;
  for (n = 0, o = a.length; n < o; n += 1) {
    if (i = a[n], t = !1, ci.call(i) !== "[object Object]") return !1;
    for (l in i)
      if (ai.call(i, l))
        if (!t) t = !0;
        else return !1;
    if (!t) return !1;
    if (r.indexOf(l) === -1) r.push(l);
    else return !1;
  }
  return !0;
}
function ui(e) {
  return e !== null ? e : [];
}
var $r = new D("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: fi,
  construct: ui
}), si = Object.prototype.toString;
function pi(e) {
  if (e === null) return !0;
  var r, n, o, i, l, t = e;
  for (l = new Array(t.length), r = 0, n = t.length; r < n; r += 1) {
    if (o = t[r], si.call(o) !== "[object Object]" || (i = Object.keys(o), i.length !== 1)) return !1;
    l[r] = [i[0], o[i[0]]];
  }
  return !0;
}
function di(e) {
  if (e === null) return [];
  var r, n, o, i, l, t = e;
  for (l = new Array(t.length), r = 0, n = t.length; r < n; r += 1)
    o = t[r], i = Object.keys(o), l[r] = [i[0], o[i[0]]];
  return l;
}
var Ir = new D("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: pi,
  construct: di
}), hi = Object.prototype.hasOwnProperty;
function mi(e) {
  if (e === null) return !0;
  var r, n = e;
  for (r in n)
    if (hi.call(n, r) && n[r] !== null)
      return !1;
  return !0;
}
function xi(e) {
  return e !== null ? e : {};
}
var Rr = new D("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: mi,
  construct: xi
}), Pe = wr.extend({
  implicit: [
    kr,
    Or
  ],
  explicit: [
    Fr,
    $r,
    Ir,
    Rr
  ]
}), re = Object.prototype.hasOwnProperty, _e = 1, Lr = 2, Nr = 3, Ce = 4, $e = 1, gi = 2, Ve = 3, vi = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, yi = /[\x85\u2028\u2029]/, bi = /[,\[\]\{\}]/, Mr = /^(?:!|!!|![a-z\-]+!)$/i, jr = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function Ze(e) {
  return Object.prototype.toString.call(e);
}
function z(e) {
  return e === 10 || e === 13;
}
function ne(e) {
  return e === 9 || e === 32;
}
function W(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function ce(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function Ai(e) {
  var r;
  return 48 <= e && e <= 57 ? e - 48 : (r = e | 32, 97 <= r && r <= 102 ? r - 97 + 10 : -1);
}
function _i(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function Ci(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function Qe(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function Ei(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
function Pr(e, r, n) {
  r === "__proto__" ? Object.defineProperty(e, r, {
    configurable: !0,
    enumerable: !0,
    writable: !0,
    value: n
  }) : e[r] = n;
}
var Dr = new Array(256), Yr = new Array(256);
for (var le = 0; le < 256; le++)
  Dr[le] = Qe(le) ? 1 : 0, Yr[le] = Qe(le);
function wi(e, r) {
  this.input = e, this.filename = r.filename || null, this.schema = r.schema || Pe, this.onWarning = r.onWarning || null, this.legacy = r.legacy || !1, this.json = r.json || !1, this.listener = r.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function Br(e, r) {
  var n = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return n.snippet = On(n), new H(r, n);
}
function x(e, r) {
  throw Br(e, r);
}
function Ee(e, r) {
  e.onWarning && e.onWarning.call(null, Br(e, r));
}
var Je = {
  YAML: function(r, n, o) {
    var i, l, t;
    r.version !== null && x(r, "duplication of %YAML directive"), o.length !== 1 && x(r, "YAML directive accepts exactly one argument"), i = /^([0-9]+)\.([0-9]+)$/.exec(o[0]), i === null && x(r, "ill-formed argument of the YAML directive"), l = parseInt(i[1], 10), t = parseInt(i[2], 10), l !== 1 && x(r, "unacceptable YAML version of the document"), r.version = o[0], r.checkLineBreaks = t < 2, t !== 1 && t !== 2 && Ee(r, "unsupported YAML version of the document");
  },
  TAG: function(r, n, o) {
    var i, l;
    o.length !== 2 && x(r, "TAG directive accepts exactly two arguments"), i = o[0], l = o[1], Mr.test(i) || x(r, "ill-formed tag handle (first argument) of the TAG directive"), re.call(r.tagMap, i) && x(r, 'there is a previously declared suffix for "' + i + '" tag handle'), jr.test(l) || x(r, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      l = decodeURIComponent(l);
    } catch {
      x(r, "tag prefix is malformed: " + l);
    }
    r.tagMap[i] = l;
  }
};
function ee(e, r, n, o) {
  var i, l, t, a;
  if (r < n) {
    if (a = e.input.slice(r, n), o)
      for (i = 0, l = a.length; i < l; i += 1)
        t = a.charCodeAt(i), t === 9 || 32 <= t && t <= 1114111 || x(e, "expected valid JSON character");
    else vi.test(a) && x(e, "the stream contains non-printable characters");
    e.result += a;
  }
}
function er(e, r, n, o) {
  var i, l, t, a;
  for (j.isObject(n) || x(e, "cannot merge mappings; the provided source object is unacceptable"), i = Object.keys(n), t = 0, a = i.length; t < a; t += 1)
    l = i[t], re.call(r, l) || (Pr(r, l, n[l]), o[l] = !0);
}
function fe(e, r, n, o, i, l, t, a, c) {
  var f, h;
  if (Array.isArray(i))
    for (i = Array.prototype.slice.call(i), f = 0, h = i.length; f < h; f += 1)
      Array.isArray(i[f]) && x(e, "nested arrays are not supported inside keys"), typeof i == "object" && Ze(i[f]) === "[object Object]" && (i[f] = "[object Object]");
  if (typeof i == "object" && Ze(i) === "[object Object]" && (i = "[object Object]"), i = String(i), r === null && (r = {}), o === "tag:yaml.org,2002:merge")
    if (Array.isArray(l))
      for (f = 0, h = l.length; f < h; f += 1)
        er(e, r, l[f], n);
    else
      er(e, r, l, n);
  else
    !e.json && !re.call(n, i) && re.call(r, i) && (e.line = t || e.line, e.lineStart = a || e.lineStart, e.position = c || e.position, x(e, "duplicated mapping key")), Pr(r, i, l), delete n[i];
  return r;
}
function De(e) {
  var r;
  r = e.input.charCodeAt(e.position), r === 10 ? e.position++ : r === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : x(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function M(e, r, n) {
  for (var o = 0, i = e.input.charCodeAt(e.position); i !== 0; ) {
    for (; ne(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (r && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (z(i))
      for (De(e), i = e.input.charCodeAt(e.position), o++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return n !== -1 && o !== 0 && e.lineIndent < n && Ee(e, "deficient indentation"), o;
}
function Te(e) {
  var r = e.position, n;
  return n = e.input.charCodeAt(r), !!((n === 45 || n === 46) && n === e.input.charCodeAt(r + 1) && n === e.input.charCodeAt(r + 2) && (r += 3, n = e.input.charCodeAt(r), n === 0 || W(n)));
}
function Ye(e, r) {
  r === 1 ? e.result += " " : r > 1 && (e.result += j.repeat(`
`, r - 1));
}
function Si(e, r, n) {
  var o, i, l, t, a, c, f, h, d = e.kind, p = e.result, u;
  if (u = e.input.charCodeAt(e.position), W(u) || ce(u) || u === 35 || u === 38 || u === 42 || u === 33 || u === 124 || u === 62 || u === 39 || u === 34 || u === 37 || u === 64 || u === 96 || (u === 63 || u === 45) && (i = e.input.charCodeAt(e.position + 1), W(i) || n && ce(i)))
    return !1;
  for (e.kind = "scalar", e.result = "", l = t = e.position, a = !1; u !== 0; ) {
    if (u === 58) {
      if (i = e.input.charCodeAt(e.position + 1), W(i) || n && ce(i))
        break;
    } else if (u === 35) {
      if (o = e.input.charCodeAt(e.position - 1), W(o))
        break;
    } else {
      if (e.position === e.lineStart && Te(e) || n && ce(u))
        break;
      if (z(u))
        if (c = e.line, f = e.lineStart, h = e.lineIndent, M(e, !1, -1), e.lineIndent >= r) {
          a = !0, u = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = t, e.line = c, e.lineStart = f, e.lineIndent = h;
          break;
        }
    }
    a && (ee(e, l, t, !1), Ye(e, e.line - c), l = t = e.position, a = !1), ne(u) || (t = e.position + 1), u = e.input.charCodeAt(++e.position);
  }
  return ee(e, l, t, !1), e.result ? !0 : (e.kind = d, e.result = p, !1);
}
function Ti(e, r) {
  var n, o, i;
  if (n = e.input.charCodeAt(e.position), n !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, o = i = e.position; (n = e.input.charCodeAt(e.position)) !== 0; )
    if (n === 39)
      if (ee(e, o, e.position, !0), n = e.input.charCodeAt(++e.position), n === 39)
        o = e.position, e.position++, i = e.position;
      else
        return !0;
    else z(n) ? (ee(e, o, i, !0), Ye(e, M(e, !1, r)), o = i = e.position) : e.position === e.lineStart && Te(e) ? x(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
  x(e, "unexpected end of the stream within a single quoted scalar");
}
function ki(e, r) {
  var n, o, i, l, t, a;
  if (a = e.input.charCodeAt(e.position), a !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = o = e.position; (a = e.input.charCodeAt(e.position)) !== 0; ) {
    if (a === 34)
      return ee(e, n, e.position, !0), e.position++, !0;
    if (a === 92) {
      if (ee(e, n, e.position, !0), a = e.input.charCodeAt(++e.position), z(a))
        M(e, !1, r);
      else if (a < 256 && Dr[a])
        e.result += Yr[a], e.position++;
      else if ((t = _i(a)) > 0) {
        for (i = t, l = 0; i > 0; i--)
          a = e.input.charCodeAt(++e.position), (t = Ai(a)) >= 0 ? l = (l << 4) + t : x(e, "expected hexadecimal character");
        e.result += Ei(l), e.position++;
      } else
        x(e, "unknown escape sequence");
      n = o = e.position;
    } else z(a) ? (ee(e, n, o, !0), Ye(e, M(e, !1, r)), n = o = e.position) : e.position === e.lineStart && Te(e) ? x(e, "unexpected end of the document within a double quoted scalar") : (e.position++, o = e.position);
  }
  x(e, "unexpected end of the stream within a double quoted scalar");
}
function Oi(e, r) {
  var n = !0, o, i, l, t = e.tag, a, c = e.anchor, f, h, d, p, u, m = /* @__PURE__ */ Object.create(null), g, b, C, A;
  if (A = e.input.charCodeAt(e.position), A === 91)
    h = 93, u = !1, a = [];
  else if (A === 123)
    h = 125, u = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = a), A = e.input.charCodeAt(++e.position); A !== 0; ) {
    if (M(e, !0, r), A = e.input.charCodeAt(e.position), A === h)
      return e.position++, e.tag = t, e.anchor = c, e.kind = u ? "mapping" : "sequence", e.result = a, !0;
    n ? A === 44 && x(e, "expected the node content, but found ','") : x(e, "missed comma between flow collection entries"), b = g = C = null, d = p = !1, A === 63 && (f = e.input.charCodeAt(e.position + 1), W(f) && (d = p = !0, e.position++, M(e, !0, r))), o = e.line, i = e.lineStart, l = e.position, ue(e, r, _e, !1, !0), b = e.tag, g = e.result, M(e, !0, r), A = e.input.charCodeAt(e.position), (p || e.line === o) && A === 58 && (d = !0, A = e.input.charCodeAt(++e.position), M(e, !0, r), ue(e, r, _e, !1, !0), C = e.result), u ? fe(e, a, m, b, g, C, o, i, l) : d ? a.push(fe(e, null, m, b, g, C, o, i, l)) : a.push(g), M(e, !0, r), A = e.input.charCodeAt(e.position), A === 44 ? (n = !0, A = e.input.charCodeAt(++e.position)) : n = !1;
  }
  x(e, "unexpected end of the stream within a flow collection");
}
function Fi(e, r) {
  var n, o, i = $e, l = !1, t = !1, a = r, c = 0, f = !1, h, d;
  if (d = e.input.charCodeAt(e.position), d === 124)
    o = !1;
  else if (d === 62)
    o = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; d !== 0; )
    if (d = e.input.charCodeAt(++e.position), d === 43 || d === 45)
      $e === i ? i = d === 43 ? Ve : gi : x(e, "repeat of a chomping mode identifier");
    else if ((h = Ci(d)) >= 0)
      h === 0 ? x(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : t ? x(e, "repeat of an indentation width identifier") : (a = r + h - 1, t = !0);
    else
      break;
  if (ne(d)) {
    do
      d = e.input.charCodeAt(++e.position);
    while (ne(d));
    if (d === 35)
      do
        d = e.input.charCodeAt(++e.position);
      while (!z(d) && d !== 0);
  }
  for (; d !== 0; ) {
    for (De(e), e.lineIndent = 0, d = e.input.charCodeAt(e.position); (!t || e.lineIndent < a) && d === 32; )
      e.lineIndent++, d = e.input.charCodeAt(++e.position);
    if (!t && e.lineIndent > a && (a = e.lineIndent), z(d)) {
      c++;
      continue;
    }
    if (e.lineIndent < a) {
      i === Ve ? e.result += j.repeat(`
`, l ? 1 + c : c) : i === $e && l && (e.result += `
`);
      break;
    }
    for (o ? ne(d) ? (f = !0, e.result += j.repeat(`
`, l ? 1 + c : c)) : f ? (f = !1, e.result += j.repeat(`
`, c + 1)) : c === 0 ? l && (e.result += " ") : e.result += j.repeat(`
`, c) : e.result += j.repeat(`
`, l ? 1 + c : c), l = !0, t = !0, c = 0, n = e.position; !z(d) && d !== 0; )
      d = e.input.charCodeAt(++e.position);
    ee(e, n, e.position, !1);
  }
  return !0;
}
function rr(e, r) {
  var n, o = e.tag, i = e.anchor, l = [], t, a = !1, c;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = l), c = e.input.charCodeAt(e.position); c !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), !(c !== 45 || (t = e.input.charCodeAt(e.position + 1), !W(t)))); ) {
    if (a = !0, e.position++, M(e, !0, -1) && e.lineIndent <= r) {
      l.push(null), c = e.input.charCodeAt(e.position);
      continue;
    }
    if (n = e.line, ue(e, r, Nr, !1, !0), l.push(e.result), M(e, !0, -1), c = e.input.charCodeAt(e.position), (e.line === n || e.lineIndent > r) && c !== 0)
      x(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < r)
      break;
  }
  return a ? (e.tag = o, e.anchor = i, e.kind = "sequence", e.result = l, !0) : !1;
}
function $i(e, r, n) {
  var o, i, l, t, a, c, f = e.tag, h = e.anchor, d = {}, p = /* @__PURE__ */ Object.create(null), u = null, m = null, g = null, b = !1, C = !1, A;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = d), A = e.input.charCodeAt(e.position); A !== 0; ) {
    if (!b && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), o = e.input.charCodeAt(e.position + 1), l = e.line, (A === 63 || A === 58) && W(o))
      A === 63 ? (b && (fe(e, d, p, u, m, null, t, a, c), u = m = g = null), C = !0, b = !0, i = !0) : b ? (b = !1, i = !0) : x(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, A = o;
    else {
      if (t = e.line, a = e.lineStart, c = e.position, !ue(e, n, Lr, !1, !0))
        break;
      if (e.line === l) {
        for (A = e.input.charCodeAt(e.position); ne(A); )
          A = e.input.charCodeAt(++e.position);
        if (A === 58)
          A = e.input.charCodeAt(++e.position), W(A) || x(e, "a whitespace character is expected after the key-value separator within a block mapping"), b && (fe(e, d, p, u, m, null, t, a, c), u = m = g = null), C = !0, b = !1, i = !1, u = e.tag, m = e.result;
        else if (C)
          x(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = f, e.anchor = h, !0;
      } else if (C)
        x(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = f, e.anchor = h, !0;
    }
    if ((e.line === l || e.lineIndent > r) && (b && (t = e.line, a = e.lineStart, c = e.position), ue(e, r, Ce, !0, i) && (b ? m = e.result : g = e.result), b || (fe(e, d, p, u, m, g, t, a, c), u = m = g = null), M(e, !0, -1), A = e.input.charCodeAt(e.position)), (e.line === l || e.lineIndent > r) && A !== 0)
      x(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < r)
      break;
  }
  return b && fe(e, d, p, u, m, null, t, a, c), C && (e.tag = f, e.anchor = h, e.kind = "mapping", e.result = d), C;
}
function Ii(e) {
  var r, n = !1, o = !1, i, l, t;
  if (t = e.input.charCodeAt(e.position), t !== 33) return !1;
  if (e.tag !== null && x(e, "duplication of a tag property"), t = e.input.charCodeAt(++e.position), t === 60 ? (n = !0, t = e.input.charCodeAt(++e.position)) : t === 33 ? (o = !0, i = "!!", t = e.input.charCodeAt(++e.position)) : i = "!", r = e.position, n) {
    do
      t = e.input.charCodeAt(++e.position);
    while (t !== 0 && t !== 62);
    e.position < e.length ? (l = e.input.slice(r, e.position), t = e.input.charCodeAt(++e.position)) : x(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; t !== 0 && !W(t); )
      t === 33 && (o ? x(e, "tag suffix cannot contain exclamation marks") : (i = e.input.slice(r - 1, e.position + 1), Mr.test(i) || x(e, "named tag handle cannot contain such characters"), o = !0, r = e.position + 1)), t = e.input.charCodeAt(++e.position);
    l = e.input.slice(r, e.position), bi.test(l) && x(e, "tag suffix cannot contain flow indicator characters");
  }
  l && !jr.test(l) && x(e, "tag name cannot contain such characters: " + l);
  try {
    l = decodeURIComponent(l);
  } catch {
    x(e, "tag name is malformed: " + l);
  }
  return n ? e.tag = l : re.call(e.tagMap, i) ? e.tag = e.tagMap[i] + l : i === "!" ? e.tag = "!" + l : i === "!!" ? e.tag = "tag:yaml.org,2002:" + l : x(e, 'undeclared tag handle "' + i + '"'), !0;
}
function Ri(e) {
  var r, n;
  if (n = e.input.charCodeAt(e.position), n !== 38) return !1;
  for (e.anchor !== null && x(e, "duplication of an anchor property"), n = e.input.charCodeAt(++e.position), r = e.position; n !== 0 && !W(n) && !ce(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === r && x(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(r, e.position), !0;
}
function Li(e) {
  var r, n, o;
  if (o = e.input.charCodeAt(e.position), o !== 42) return !1;
  for (o = e.input.charCodeAt(++e.position), r = e.position; o !== 0 && !W(o) && !ce(o); )
    o = e.input.charCodeAt(++e.position);
  return e.position === r && x(e, "name of an alias node must contain at least one character"), n = e.input.slice(r, e.position), re.call(e.anchorMap, n) || x(e, 'unidentified alias "' + n + '"'), e.result = e.anchorMap[n], M(e, !0, -1), !0;
}
function ue(e, r, n, o, i) {
  var l, t, a, c = 1, f = !1, h = !1, d, p, u, m, g, b;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, l = t = a = Ce === n || Nr === n, o && M(e, !0, -1) && (f = !0, e.lineIndent > r ? c = 1 : e.lineIndent === r ? c = 0 : e.lineIndent < r && (c = -1)), c === 1)
    for (; Ii(e) || Ri(e); )
      M(e, !0, -1) ? (f = !0, a = l, e.lineIndent > r ? c = 1 : e.lineIndent === r ? c = 0 : e.lineIndent < r && (c = -1)) : a = !1;
  if (a && (a = f || i), (c === 1 || Ce === n) && (_e === n || Lr === n ? g = r : g = r + 1, b = e.position - e.lineStart, c === 1 ? a && (rr(e, b) || $i(e, b, g)) || Oi(e, g) ? h = !0 : (t && Fi(e, g) || Ti(e, g) || ki(e, g) ? h = !0 : Li(e) ? (h = !0, (e.tag !== null || e.anchor !== null) && x(e, "alias node should not have any properties")) : Si(e, g, _e === n) && (h = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : c === 0 && (h = a && rr(e, b))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && x(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), d = 0, p = e.implicitTypes.length; d < p; d += 1)
      if (m = e.implicitTypes[d], m.resolve(e.result)) {
        e.result = m.construct(e.result), e.tag = m.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (re.call(e.typeMap[e.kind || "fallback"], e.tag))
      m = e.typeMap[e.kind || "fallback"][e.tag];
    else
      for (m = null, u = e.typeMap.multi[e.kind || "fallback"], d = 0, p = u.length; d < p; d += 1)
        if (e.tag.slice(0, u[d].tag.length) === u[d].tag) {
          m = u[d];
          break;
        }
    m || x(e, "unknown tag !<" + e.tag + ">"), e.result !== null && m.kind !== e.kind && x(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + m.kind + '", not "' + e.kind + '"'), m.resolve(e.result, e.tag) ? (e.result = m.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : x(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || h;
}
function Ni(e) {
  var r = e.position, n, o, i, l = !1, t;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (t = e.input.charCodeAt(e.position)) !== 0 && (M(e, !0, -1), t = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || t !== 37)); ) {
    for (l = !0, t = e.input.charCodeAt(++e.position), n = e.position; t !== 0 && !W(t); )
      t = e.input.charCodeAt(++e.position);
    for (o = e.input.slice(n, e.position), i = [], o.length < 1 && x(e, "directive name must not be less than one character in length"); t !== 0; ) {
      for (; ne(t); )
        t = e.input.charCodeAt(++e.position);
      if (t === 35) {
        do
          t = e.input.charCodeAt(++e.position);
        while (t !== 0 && !z(t));
        break;
      }
      if (z(t)) break;
      for (n = e.position; t !== 0 && !W(t); )
        t = e.input.charCodeAt(++e.position);
      i.push(e.input.slice(n, e.position));
    }
    t !== 0 && De(e), re.call(Je, o) ? Je[o](e, o, i) : Ee(e, 'unknown document directive "' + o + '"');
  }
  if (M(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, M(e, !0, -1)) : l && x(e, "directives end mark is expected"), ue(e, e.lineIndent - 1, Ce, !1, !0), M(e, !0, -1), e.checkLineBreaks && yi.test(e.input.slice(r, e.position)) && Ee(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && Te(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, M(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    x(e, "end of the stream or a document separator is expected");
  else
    return;
}
function Hr(e, r) {
  e = String(e), r = r || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var n = new wi(e, r), o = e.indexOf("\0");
  for (o !== -1 && (n.position = o, x(n, "null byte is not allowed in input")), n.input += "\0"; n.input.charCodeAt(n.position) === 32; )
    n.lineIndent += 1, n.position += 1;
  for (; n.position < n.length - 1; )
    Ni(n);
  return n.documents;
}
function Mi(e, r, n) {
  r !== null && typeof r == "object" && typeof n > "u" && (n = r, r = null);
  var o = Hr(e, n);
  if (typeof r != "function")
    return o;
  for (var i = 0, l = o.length; i < l; i += 1)
    r(o[i]);
}
function ji(e, r) {
  var n = Hr(e, r);
  if (n.length !== 0) {
    if (n.length === 1)
      return n[0];
    throw new H("expected a single document in the stream, but found more");
  }
}
var Pi = Mi, Di = ji, Ur = {
  loadAll: Pi,
  load: Di
}, Wr = Object.prototype.toString, qr = Object.prototype.hasOwnProperty, Be = 65279, Yi = 9, me = 10, Bi = 13, Hi = 32, Ui = 33, Wi = 34, Re = 35, qi = 37, Ki = 38, Gi = 39, Xi = 42, Kr = 44, zi = 45, we = 58, Vi = 61, Zi = 62, Qi = 63, Ji = 64, Gr = 91, Xr = 93, eo = 96, zr = 123, ro = 124, Vr = 125, Y = {};
Y[0] = "\\0";
Y[7] = "\\a";
Y[8] = "\\b";
Y[9] = "\\t";
Y[10] = "\\n";
Y[11] = "\\v";
Y[12] = "\\f";
Y[13] = "\\r";
Y[27] = "\\e";
Y[34] = '\\"';
Y[92] = "\\\\";
Y[133] = "\\N";
Y[160] = "\\_";
Y[8232] = "\\L";
Y[8233] = "\\P";
var no = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], io = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function oo(e, r) {
  var n, o, i, l, t, a, c;
  if (r === null) return {};
  for (n = {}, o = Object.keys(r), i = 0, l = o.length; i < l; i += 1)
    t = o[i], a = String(r[t]), t.slice(0, 2) === "!!" && (t = "tag:yaml.org,2002:" + t.slice(2)), c = e.compiledTypeMap.fallback[t], c && qr.call(c.styleAliases, a) && (a = c.styleAliases[a]), n[t] = a;
  return n;
}
function to(e) {
  var r, n, o;
  if (r = e.toString(16).toUpperCase(), e <= 255)
    n = "x", o = 2;
  else if (e <= 65535)
    n = "u", o = 4;
  else if (e <= 4294967295)
    n = "U", o = 8;
  else
    throw new H("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + n + j.repeat("0", o - r.length) + r;
}
var lo = 1, xe = 2;
function ao(e) {
  this.schema = e.schema || Pe, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = j.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = oo(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? xe : lo, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function nr(e, r) {
  for (var n = j.repeat(" ", r), o = 0, i = -1, l = "", t, a = e.length; o < a; )
    i = e.indexOf(`
`, o), i === -1 ? (t = e.slice(o), o = a) : (t = e.slice(o, i + 1), o = i + 1), t.length && t !== `
` && (l += n), l += t;
  return l;
}
function Le(e, r) {
  return `
` + j.repeat(" ", e.indent * r);
}
function co(e, r) {
  var n, o, i;
  for (n = 0, o = e.implicitTypes.length; n < o; n += 1)
    if (i = e.implicitTypes[n], i.resolve(r))
      return !0;
  return !1;
}
function Se(e) {
  return e === Hi || e === Yi;
}
function ge(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== Be || 65536 <= e && e <= 1114111;
}
function ir(e) {
  return ge(e) && e !== Be && e !== Bi && e !== me;
}
function or(e, r, n) {
  var o = ir(e), i = o && !Se(e);
  return (
    // ns-plain-safe
    (n ? (
      // c = flow-in
      o
    ) : o && e !== Kr && e !== Gr && e !== Xr && e !== zr && e !== Vr) && e !== Re && !(r === we && !i) || ir(r) && !Se(r) && e === Re || r === we && i
  );
}
function fo(e) {
  return ge(e) && e !== Be && !Se(e) && e !== zi && e !== Qi && e !== we && e !== Kr && e !== Gr && e !== Xr && e !== zr && e !== Vr && e !== Re && e !== Ki && e !== Xi && e !== Ui && e !== ro && e !== Vi && e !== Zi && e !== Gi && e !== Wi && e !== qi && e !== Ji && e !== eo;
}
function uo(e) {
  return !Se(e) && e !== we;
}
function de(e, r) {
  var n = e.charCodeAt(r), o;
  return n >= 55296 && n <= 56319 && r + 1 < e.length && (o = e.charCodeAt(r + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function Zr(e) {
  var r = /^\n* /;
  return r.test(e);
}
var Qr = 1, Ne = 2, Jr = 3, en = 4, ae = 5;
function so(e, r, n, o, i, l, t, a) {
  var c, f = 0, h = null, d = !1, p = !1, u = o !== -1, m = -1, g = fo(de(e, 0)) && uo(de(e, e.length - 1));
  if (r || t)
    for (c = 0; c < e.length; f >= 65536 ? c += 2 : c++) {
      if (f = de(e, c), !ge(f))
        return ae;
      g = g && or(f, h, a), h = f;
    }
  else {
    for (c = 0; c < e.length; f >= 65536 ? c += 2 : c++) {
      if (f = de(e, c), f === me)
        d = !0, u && (p = p || // Foldable line = too long, and not more-indented.
        c - m - 1 > o && e[m + 1] !== " ", m = c);
      else if (!ge(f))
        return ae;
      g = g && or(f, h, a), h = f;
    }
    p = p || u && c - m - 1 > o && e[m + 1] !== " ";
  }
  return !d && !p ? g && !t && !i(e) ? Qr : l === xe ? ae : Ne : n > 9 && Zr(e) ? ae : t ? l === xe ? ae : Ne : p ? en : Jr;
}
function po(e, r, n, o, i) {
  e.dump = (function() {
    if (r.length === 0)
      return e.quotingType === xe ? '""' : "''";
    if (!e.noCompatMode && (no.indexOf(r) !== -1 || io.test(r)))
      return e.quotingType === xe ? '"' + r + '"' : "'" + r + "'";
    var l = e.indent * Math.max(1, n), t = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - l), a = o || e.flowLevel > -1 && n >= e.flowLevel;
    function c(f) {
      return co(e, f);
    }
    switch (so(
      r,
      a,
      e.indent,
      t,
      c,
      e.quotingType,
      e.forceQuotes && !o,
      i
    )) {
      case Qr:
        return r;
      case Ne:
        return "'" + r.replace(/'/g, "''") + "'";
      case Jr:
        return "|" + tr(r, e.indent) + lr(nr(r, l));
      case en:
        return ">" + tr(r, e.indent) + lr(nr(ho(r, t), l));
      case ae:
        return '"' + mo(r) + '"';
      default:
        throw new H("impossible error: invalid scalar style");
    }
  })();
}
function tr(e, r) {
  var n = Zr(e) ? String(r) : "", o = e[e.length - 1] === `
`, i = o && (e[e.length - 2] === `
` || e === `
`), l = i ? "+" : o ? "" : "-";
  return n + l + `
`;
}
function lr(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function ho(e, r) {
  for (var n = /(\n+)([^\n]*)/g, o = (function() {
    var f = e.indexOf(`
`);
    return f = f !== -1 ? f : e.length, n.lastIndex = f, ar(e.slice(0, f), r);
  })(), i = e[0] === `
` || e[0] === " ", l, t; t = n.exec(e); ) {
    var a = t[1], c = t[2];
    l = c[0] === " ", o += a + (!i && !l && c !== "" ? `
` : "") + ar(c, r), i = l;
  }
  return o;
}
function ar(e, r) {
  if (e === "" || e[0] === " ") return e;
  for (var n = / [^ ]/g, o, i = 0, l, t = 0, a = 0, c = ""; o = n.exec(e); )
    a = o.index, a - i > r && (l = t > i ? t : a, c += `
` + e.slice(i, l), i = l + 1), t = a;
  return c += `
`, e.length - i > r && t > i ? c += e.slice(i, t) + `
` + e.slice(t + 1) : c += e.slice(i), c.slice(1);
}
function mo(e) {
  for (var r = "", n = 0, o, i = 0; i < e.length; n >= 65536 ? i += 2 : i++)
    n = de(e, i), o = Y[n], !o && ge(n) ? (r += e[i], n >= 65536 && (r += e[i + 1])) : r += o || to(n);
  return r;
}
function xo(e, r, n) {
  var o = "", i = e.tag, l, t, a;
  for (l = 0, t = n.length; l < t; l += 1)
    a = n[l], e.replacer && (a = e.replacer.call(n, String(l), a)), (Q(e, r, a, !1, !1) || typeof a > "u" && Q(e, r, null, !1, !1)) && (o !== "" && (o += "," + (e.condenseFlow ? "" : " ")), o += e.dump);
  e.tag = i, e.dump = "[" + o + "]";
}
function cr(e, r, n, o) {
  var i = "", l = e.tag, t, a, c;
  for (t = 0, a = n.length; t < a; t += 1)
    c = n[t], e.replacer && (c = e.replacer.call(n, String(t), c)), (Q(e, r + 1, c, !0, !0, !1, !0) || typeof c > "u" && Q(e, r + 1, null, !0, !0, !1, !0)) && ((!o || i !== "") && (i += Le(e, r)), e.dump && me === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  e.tag = l, e.dump = i || "[]";
}
function go(e, r, n) {
  var o = "", i = e.tag, l = Object.keys(n), t, a, c, f, h;
  for (t = 0, a = l.length; t < a; t += 1)
    h = "", o !== "" && (h += ", "), e.condenseFlow && (h += '"'), c = l[t], f = n[c], e.replacer && (f = e.replacer.call(n, c, f)), Q(e, r, c, !1, !1) && (e.dump.length > 1024 && (h += "? "), h += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), Q(e, r, f, !1, !1) && (h += e.dump, o += h));
  e.tag = i, e.dump = "{" + o + "}";
}
function vo(e, r, n, o) {
  var i = "", l = e.tag, t = Object.keys(n), a, c, f, h, d, p;
  if (e.sortKeys === !0)
    t.sort();
  else if (typeof e.sortKeys == "function")
    t.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new H("sortKeys must be a boolean or a function");
  for (a = 0, c = t.length; a < c; a += 1)
    p = "", (!o || i !== "") && (p += Le(e, r)), f = t[a], h = n[f], e.replacer && (h = e.replacer.call(n, f, h)), Q(e, r + 1, f, !0, !0, !0) && (d = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, d && (e.dump && me === e.dump.charCodeAt(0) ? p += "?" : p += "? "), p += e.dump, d && (p += Le(e, r)), Q(e, r + 1, h, !0, d) && (e.dump && me === e.dump.charCodeAt(0) ? p += ":" : p += ": ", p += e.dump, i += p));
  e.tag = l, e.dump = i || "{}";
}
function fr(e, r, n) {
  var o, i, l, t, a, c;
  for (i = n ? e.explicitTypes : e.implicitTypes, l = 0, t = i.length; l < t; l += 1)
    if (a = i[l], (a.instanceOf || a.predicate) && (!a.instanceOf || typeof r == "object" && r instanceof a.instanceOf) && (!a.predicate || a.predicate(r))) {
      if (n ? a.multi && a.representName ? e.tag = a.representName(r) : e.tag = a.tag : e.tag = "?", a.represent) {
        if (c = e.styleMap[a.tag] || a.defaultStyle, Wr.call(a.represent) === "[object Function]")
          o = a.represent(r, c);
        else if (qr.call(a.represent, c))
          o = a.represent[c](r, c);
        else
          throw new H("!<" + a.tag + '> tag resolver accepts not "' + c + '" style');
        e.dump = o;
      }
      return !0;
    }
  return !1;
}
function Q(e, r, n, o, i, l, t) {
  e.tag = null, e.dump = n, fr(e, n, !1) || fr(e, n, !0);
  var a = Wr.call(e.dump), c = o, f;
  o && (o = e.flowLevel < 0 || e.flowLevel > r);
  var h = a === "[object Object]" || a === "[object Array]", d, p;
  if (h && (d = e.duplicates.indexOf(n), p = d !== -1), (e.tag !== null && e.tag !== "?" || p || e.indent !== 2 && r > 0) && (i = !1), p && e.usedDuplicates[d])
    e.dump = "*ref_" + d;
  else {
    if (h && p && !e.usedDuplicates[d] && (e.usedDuplicates[d] = !0), a === "[object Object]")
      o && Object.keys(e.dump).length !== 0 ? (vo(e, r, e.dump, i), p && (e.dump = "&ref_" + d + e.dump)) : (go(e, r, e.dump), p && (e.dump = "&ref_" + d + " " + e.dump));
    else if (a === "[object Array]")
      o && e.dump.length !== 0 ? (e.noArrayIndent && !t && r > 0 ? cr(e, r - 1, e.dump, i) : cr(e, r, e.dump, i), p && (e.dump = "&ref_" + d + e.dump)) : (xo(e, r, e.dump), p && (e.dump = "&ref_" + d + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && po(e, e.dump, r, l, c);
    else {
      if (a === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new H("unacceptable kind of an object to dump " + a);
    }
    e.tag !== null && e.tag !== "?" && (f = encodeURI(
      e.tag[0] === "!" ? e.tag.slice(1) : e.tag
    ).replace(/!/g, "%21"), e.tag[0] === "!" ? f = "!" + f : f.slice(0, 18) === "tag:yaml.org,2002:" ? f = "!!" + f.slice(18) : f = "!<" + f + ">", e.dump = f + " " + e.dump);
  }
  return !0;
}
function yo(e, r) {
  var n = [], o = [], i, l;
  for (Me(e, n, o), i = 0, l = o.length; i < l; i += 1)
    r.duplicates.push(n[o[i]]);
  r.usedDuplicates = new Array(l);
}
function Me(e, r, n) {
  var o, i, l;
  if (e !== null && typeof e == "object")
    if (i = r.indexOf(e), i !== -1)
      n.indexOf(i) === -1 && n.push(i);
    else if (r.push(e), Array.isArray(e))
      for (i = 0, l = e.length; i < l; i += 1)
        Me(e[i], r, n);
    else
      for (o = Object.keys(e), i = 0, l = o.length; i < l; i += 1)
        Me(e[o[i]], r, n);
}
function bo(e, r) {
  r = r || {};
  var n = new ao(r);
  n.noRefs || yo(e, n);
  var o = e;
  return n.replacer && (o = n.replacer.call({ "": o }, "", o)), Q(n, 0, o, !0, !0) ? n.dump + `
` : "";
}
var Ao = bo, _o = {
  dump: Ao
};
function He(e, r) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + r + " instead, which is now safe by default.");
  };
}
var Co = D, Eo = mr, wo = yr, So = Er, To = wr, ko = Pe, Oo = Ur.load, Fo = Ur.loadAll, $o = _o.dump, Io = H, Ro = {
  binary: Fr,
  float: Cr,
  map: vr,
  null: br,
  pairs: Ir,
  set: Rr,
  timestamp: kr,
  bool: Ar,
  int: _r,
  merge: Or,
  omap: $r,
  seq: gr,
  str: xr
}, Lo = He("safeLoad", "load"), No = He("safeLoadAll", "loadAll"), Mo = He("safeDump", "dump"), jo = {
  Type: Co,
  Schema: Eo,
  FAILSAFE_SCHEMA: wo,
  JSON_SCHEMA: So,
  CORE_SCHEMA: To,
  DEFAULT_SCHEMA: ko,
  load: Oo,
  loadAll: Fo,
  dump: $o,
  YAMLException: Io,
  types: Ro,
  safeLoad: Lo,
  safeLoadAll: No,
  safeDump: Mo
};
function Po(e) {
  const r = e.match(/^(\d+)x(\d+)x(\d+)$/);
  return r ? {
    width: parseInt(r[1], 10),
    depth: parseInt(r[2], 10),
    height: parseInt(r[3], 10)
  } : null;
}
function ur(e) {
  const r = e.match(/^(\d+)x(\d+)$/);
  return r ? {
    width: parseInt(r[1], 10),
    height: parseInt(r[2], 10)
  } : null;
}
function Do(e) {
  const r = e.match(/^(-?\d+),(-?\d+)$/);
  return r ? {
    x: parseInt(r[1], 10),
    y: parseInt(r[2], 10)
  } : null;
}
function Yo(e) {
  const r = e.match(/^(.+?)\s*@\s*(\d+)$/);
  return r ? {
    name: r[1].trim(),
    elevation: parseInt(r[2], 10)
  } : null;
}
function Bo(e, r, n) {
  let o = {};
  const i = e.match(/\{([^}]+)\}\s*$/);
  if (i) {
    const u = i[1].split(/\s+/);
    for (const m of u) {
      const [g, b] = m.split("=");
      if (g && b) {
        const C = parseFloat(b);
        o[g] = isNaN(C) ? b : C;
      }
    }
    e = e.replace(/\{[^}]+\}\s*$/, "").trim();
  }
  const l = e.trim().split(/\s+/);
  if (l.length < 4) return null;
  const t = l[0], a = l[1], c = l[2], f = l[3], h = Do(c), d = Po(f);
  if (!h || !d) return null;
  const p = n[a] || a;
  return {
    tier: r,
    label: t,
    color: p,
    x: h.x,
    y: h.y,
    width: d.width,
    depth: d.depth,
    height: d.height,
    ...o
  };
}
function Ko(e) {
  const r = jo.load(e);
  let n = { width: 1100, height: 700 };
  if (typeof r.canvas == "string") {
    const p = ur(r.canvas);
    p && (n = p);
  } else r.canvas && typeof r.canvas == "object" && (n = r.canvas);
  let o = { width: 400, depth: 280 };
  if (typeof r.floor == "string") {
    const p = ur(r.floor);
    p && (o = { width: p.width, depth: p.height });
  } else r.floor && typeof r.floor == "object" && (o = r.floor);
  let i = { x: n.width / 2, y: n.height - 80 };
  r.origin && typeof r.origin == "object" && (i = r.origin);
  const l = {};
  if (r.colors && typeof r.colors == "object")
    for (const [p, u] of Object.entries(r.colors))
      l[p] = u;
  const t = [], a = {
    dark: ["#0f172a", "#1e293b", "#334155", "#475569"],
    light: ["#f1f5f9", "#e0f2fe", "#dbeafe", "#ede9fe"]
  }, c = {
    dark: ["#334155", "#475569", "#64748b", "#94a3b8"],
    light: ["#94a3b8", "#7dd3fc", "#93c5fd", "#c4b5fd"]
  }, f = r.theme || "dark";
  Array.isArray(r.tiers) && r.tiers.forEach((p, u) => {
    if (typeof p == "string") {
      const m = Yo(p);
      m && t.push({
        name: m.name,
        elevation: m.elevation,
        floorColor: a[f][u] || a[f][0],
        floorOpacity: u === 0 ? 0.95 : 0.7 - u * 0.1,
        borderColor: c[f][u] || c[f][0]
      });
    } else if (p && typeof p == "object") {
      const m = p;
      t.push({
        name: m.name || `Tier ${u}`,
        elevation: m.elevation || u * 150,
        floorColor: m.floorColor || a[f][u],
        floorOpacity: m.floorOpacity ?? (u === 0 ? 0.95 : 0.7 - u * 0.1),
        borderColor: m.borderColor || c[f][u]
      });
    }
  });
  const h = [];
  if (r.nodes && typeof r.nodes == "object" && !Array.isArray(r.nodes)) {
    const p = r.nodes;
    for (const [u, m] of Object.entries(p)) {
      const g = parseInt(u, 10);
      if (!(isNaN(g) || !Array.isArray(m))) {
        for (const b of m)
          if (typeof b == "string") {
            const C = Bo(b, g, l);
            C && h.push(C);
          } else if (b && typeof b == "object") {
            const C = b;
            h.push({
              tier: g,
              label: C.label || "",
              color: l[C.color] || C.color || "slate",
              x: C.x || 0,
              y: C.y || 0,
              width: C.width || 100,
              depth: C.depth || 80,
              height: C.height || 40,
              opacity: C.opacity,
              blur: C.blur,
              translucent: C.translucent
            });
          }
      }
    }
  }
  const d = [];
  if (Array.isArray(r.pillars)) {
    for (const p of r.pillars)
      if (typeof p == "string") {
        const u = p.match(/^(-?\d+),(-?\d+)\s+(\d+)->(\d+)$/);
        u && d.push({
          x: parseInt(u[1], 10),
          y: parseInt(u[2], 10),
          fromTier: parseInt(u[3], 10),
          toTier: parseInt(u[4], 10)
        });
      } else if (p && typeof p == "object") {
        const u = p;
        d.push({
          x: u.x || 0,
          y: u.y || 0,
          fromTier: u.fromTier || 0,
          toTier: u.toTier || 1
        });
      }
  }
  return {
    title: r.title || "Untitled",
    description: r.description || "",
    theme: f,
    canvas: n,
    origin: i,
    cornerRadius: r.corner ?? r.cornerRadius ?? 14,
    tiers: t,
    floorSize: o,
    nodes: h,
    pillars: d.length > 0 ? d : void 0
  };
}
function Go(e) {
  const r = [];
  r.push(`title: ${e.title}`), e.description && r.push(`description: ${e.description}`), r.push(`theme: ${e.theme}`), r.push(`canvas: ${e.canvas.width}x${e.canvas.height}`), r.push(`floor: ${e.floorSize.width}x${e.floorSize.depth}`), e.cornerRadius && r.push(`corner: ${e.cornerRadius}`), r.push("");
  const n = {};
  e.nodes.forEach((i) => {
    n[i.color] = (n[i.color] || 0) + 1;
  });
  const o = Object.entries(n).filter(([, i]) => i >= 2).map(([i]) => i);
  return o.length > 0 && (r.push("colors:"), o.forEach((i) => {
    const l = i.slice(0, 3);
    r.push(`  ${l}: &${l} ${i}`);
  }), r.push("")), r.push("tiers:"), e.tiers.forEach((i) => {
    r.push(`  - ${i.name} @ ${i.elevation}`);
  }), r.push(""), r.push("nodes:"), e.tiers.forEach((i, l) => {
    const t = e.nodes.filter((a) => a.tier === l);
    t.length !== 0 && (r.push(`  ${l}: # ${i.name}`), t.forEach((a) => {
      let c = a.color;
      o.includes(a.color) && (c = `*${a.color.slice(0, 3)}`);
      const f = [];
      a.opacity !== void 0 && f.push(`opacity=${a.opacity}`), a.blur !== void 0 && f.push(`blur=${a.blur}`), a.translucent && f.push("translucent=true");
      const h = f.length > 0 ? ` { ${f.join(" ")} }` : "", d = `${a.width}x${a.depth}x${a.height}`, p = `${a.x},${a.y}`, u = a.label.padEnd(12), m = c.padEnd(8);
      r.push(`    - ${u} ${m} ${p.padEnd(8)} ${d}${h}`);
    }));
  }), e.pillars && e.pillars.length > 0 && (r.push(""), r.push("pillars:"), e.pillars.forEach((i) => {
    r.push(`  - ${i.x},${i.y} ${i.fromTier}->${i.toTier}`);
  })), r.join(`
`);
}
export {
  Wo as ArcDiagram,
  Go as configToYaml,
  Uo as getColorShading,
  Ae as isoBox,
  _ as isoToScreen,
  Ko as parseYamlConfig,
  qo as renderToElement,
  xn as renderToString
};
