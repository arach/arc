import ie, { useState as te, useEffect as fe } from "react";
const ce = 30 * (Math.PI / 180), de = Math.cos(ce), ue = Math.sin(ce);
function c(s, n, a = 0) {
  return {
    screenX: (s - n) * de,
    screenY: -(s + n) * ue - a
    // Negated so +X,+Y go UP on screen
  };
}
function K(s, n, a, l = 0, t = 0, h = 0) {
  const R = {
    // Bottom face
    frontBottom: c(s, 0, 0),
    rightBottom: c(s, n, 0),
    backBottom: c(0, n, 0),
    leftBottom: c(0, 0, 0),
    // Top face
    frontTop: c(s, 0, a),
    rightTop: c(s, n, a),
    backTop: c(0, n, a),
    leftTop: c(0, 0, a)
  }, x = (y) => ({
    x: y.screenX + l,
    y: y.screenY + t
  }), $ = Object.fromEntries(
    Object.entries(R).map(([y, E]) => [y, x(E)])
  ), M = (y, E, o, m) => {
    if (m <= 0) {
      const Y = c(0, 0, o), B = c(y, 0, o), w = c(y, E, o), b = c(0, E, o);
      return `M ${Y.screenX + l},${Y.screenY + t} L ${B.screenX + l},${B.screenY + t} L ${w.screenX + l},${w.screenY + t} L ${b.screenX + l},${b.screenY + t} Z`;
    }
    const O = Math.min(y, E) / 2, u = Math.min(m, O), T = 8, C = [], _ = (Y, B, w, b) => {
      for (let L = 0; L <= T; L++) {
        const D = w + (b - w) * (L / T), z = Y + u * Math.cos(D), e = B + u * Math.sin(D), r = c(z, e, o);
        C.push(`${r.screenX + l},${r.screenY + t}`);
      }
    };
    return _(u, u, Math.PI, Math.PI * 1.5), _(y - u, u, Math.PI * 1.5, Math.PI * 2), _(y - u, E - u, 0, Math.PI * 0.5), _(u, E - u, Math.PI * 0.5, Math.PI), `M ${C[0]} L ${C.slice(1).join(" L ")} Z`;
  }, g = (y) => `M ${y.map((E) => `${E.x},${E.y}`).join(" L ")} Z`, P = (y, E, o, m, O, u) => {
    const C = [];
    for (let w = 0; w < 6; w++) {
      const b = O + (u - O) * (w / 6), L = O + (u - O) * ((w + 1) / 6), D = (b + L) / 2, z = Math.cos(D), e = Math.sin(D), d = z * -0.577 + e * -0.577 + 0 * 0.577, U = 0.3 + Math.max(0, d + 0.4) * 0.5, J = c(y + o * Math.cos(b), E + o * Math.sin(b), 0), j = c(y + o * Math.cos(L), E + o * Math.sin(L), 0), X = c(y + o * Math.cos(b), E + o * Math.sin(b), m), Z = c(y + o * Math.cos(L), E + o * Math.sin(L), m), ee = `M ${J.screenX + l},${J.screenY + t} L ${j.screenX + l},${j.screenY + t} L ${Z.screenX + l},${Z.screenY + t} L ${X.screenX + l},${X.screenY + t} Z`;
      C.push({ path: ee, intensity: U });
    }
    return C;
  }, i = Math.min(h, Math.min(s, n) / 2), f = M(s, n, a, i);
  let k, S, A, I, N, F;
  if (i > 0) {
    const y = [
      { x: c(0, i, 0).screenX + l, y: c(0, i, 0).screenY + t },
      { x: c(0, n - i, 0).screenX + l, y: c(0, n - i, 0).screenY + t },
      { x: c(0, n - i, a).screenX + l, y: c(0, n - i, a).screenY + t },
      { x: c(0, i, a).screenX + l, y: c(0, i, a).screenY + t }
    ];
    k = g(y);
    const E = [
      { x: c(i, 0, 0).screenX + l, y: c(i, 0, 0).screenY + t },
      { x: c(s - i, 0, 0).screenX + l, y: c(s - i, 0, 0).screenY + t },
      { x: c(s - i, 0, a).screenX + l, y: c(s - i, 0, a).screenY + t },
      { x: c(i, 0, a).screenX + l, y: c(i, 0, a).screenY + t }
    ];
    S = g(E), A = P(i, i, i, a, Math.PI, Math.PI * 1.5), I = P(s - i, i, i, a, Math.PI * 1.5, Math.PI * 2), N = P(i, n - i, i, a, Math.PI * 0.5, Math.PI), F = P(s - i, n - i, i, a, 0, Math.PI * 0.5);
  } else {
    const y = [$.leftBottom, $.backBottom, $.backTop, $.leftTop], E = [$.leftBottom, $.frontBottom, $.frontTop, $.leftTop];
    k = g(y), S = g(E), A = [], I = [], N = [], F = [];
  }
  const W = `M ${$.leftBottom.x},${$.leftBottom.y} L ${$.frontBottom.x},${$.frontBottom.y} L ${$.rightBottom.x},${$.rightBottom.y} L ${$.backBottom.x},${$.backBottom.y} Z`;
  return {
    top: f,
    left: k,
    right: S,
    cornerFrontLeft: A,
    cornerFrontRight: I,
    cornerBackLeft: N,
    cornerBackRight: F,
    outline: W
  };
}
function pe(s, n = 60, a = 50) {
  return {
    top: `hsl(${s}, ${n}%, ${Math.min(a + 15, 95)}%)`,
    right: `hsl(${s}, ${n}%, ${a}%)`,
    left: `hsl(${s}, ${n}%, ${Math.max(a - 15, 15)}%)`
  };
}
const re = {
  violet: { hue: 270, saturation: 60, lightness: 55 },
  blue: { hue: 220, saturation: 70, lightness: 50 },
  cyan: { hue: 190, saturation: 80, lightness: 45 },
  emerald: { hue: 155, saturation: 65, lightness: 45 },
  amber: { hue: 40, saturation: 90, lightness: 50 },
  rose: { hue: 350, saturation: 70, lightness: 55 },
  slate: { hue: 220, saturation: 15, lightness: 50 },
  zinc: { hue: 240, saturation: 5, lightness: 50 }
};
function Re(s) {
  const n = re[s] || re.slate;
  return pe(n.hue, n.saturation, n.lightness);
}
var H = { exports: {} }, q = {};
var oe;
function he() {
  if (oe) return q;
  oe = 1;
  var s = /* @__PURE__ */ Symbol.for("react.transitional.element"), n = /* @__PURE__ */ Symbol.for("react.fragment");
  function a(l, t, h) {
    var R = null;
    if (h !== void 0 && (R = "" + h), t.key !== void 0 && (R = "" + t.key), "key" in t) {
      h = {};
      for (var x in t)
        x !== "key" && (h[x] = t[x]);
    } else h = t;
    return t = h.ref, {
      $$typeof: s,
      type: l,
      key: R,
      ref: t !== void 0 ? t : null,
      props: h
    };
  }
  return q.Fragment = n, q.jsx = a, q.jsxs = a, q;
}
var V = {};
var ne;
function be() {
  return ne || (ne = 1, process.env.NODE_ENV !== "production" && (function() {
    function s(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === T ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case A:
          return "Fragment";
        case N:
          return "Profiler";
        case I:
          return "StrictMode";
        case E:
          return "Suspense";
        case o:
          return "SuspenseList";
        case u:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case S:
            return "Portal";
          case W:
            return e.displayName || "Context";
          case F:
            return (e._context.displayName || "Context") + ".Consumer";
          case y:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case m:
            return r = e.displayName || null, r !== null ? r : s(e.type) || "Memo";
          case O:
            r = e._payload, e = e._init;
            try {
              return s(e(r));
            } catch {
            }
        }
      return null;
    }
    function n(e) {
      return "" + e;
    }
    function a(e) {
      try {
        n(e);
        var r = !1;
      } catch {
        r = !0;
      }
      if (r) {
        r = console;
        var d = r.error, v = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return d.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          v
        ), n(e);
      }
    }
    function l(e) {
      if (e === A) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === O)
        return "<...>";
      try {
        var r = s(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function t() {
      var e = C.A;
      return e === null ? null : e.getOwner();
    }
    function h() {
      return Error("react-stack-top-frame");
    }
    function R(e) {
      if (_.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function x(e, r) {
      function d() {
        w || (w = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      d.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: d,
        configurable: !0
      });
    }
    function $() {
      var e = s(this.type);
      return b[e] || (b[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function M(e, r, d, v, U, J) {
      var j = d.ref;
      return e = {
        $$typeof: k,
        type: e,
        key: r,
        props: d,
        _owner: v
      }, (j !== void 0 ? j : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: $
      }) : Object.defineProperty(e, "ref", { enumerable: !1, value: null }), e._store = {}, Object.defineProperty(e._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      }), Object.defineProperty(e, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      }), Object.defineProperty(e, "_debugStack", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: U
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: J
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function g(e, r, d, v, U, J) {
      var j = r.children;
      if (j !== void 0)
        if (v)
          if (Y(j)) {
            for (v = 0; v < j.length; v++)
              P(j[v]);
            Object.freeze && Object.freeze(j);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else P(j);
      if (_.call(r, "key")) {
        j = s(e);
        var X = Object.keys(r).filter(function(ee) {
          return ee !== "key";
        });
        v = 0 < X.length ? "{key: someKey, " + X.join(": ..., ") + ": ...}" : "{key: someKey}", z[j + v] || (X = 0 < X.length ? "{" + X.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          v,
          j,
          X,
          j
        ), z[j + v] = !0);
      }
      if (j = null, d !== void 0 && (a(d), j = "" + d), R(r) && (a(r.key), j = "" + r.key), "key" in r) {
        d = {};
        for (var Z in r)
          Z !== "key" && (d[Z] = r[Z]);
      } else d = r;
      return j && x(
        d,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), M(
        e,
        j,
        d,
        t(),
        U,
        J
      );
    }
    function P(e) {
      i(e) ? e._store && (e._store.validated = 1) : typeof e == "object" && e !== null && e.$$typeof === O && (e._payload.status === "fulfilled" ? i(e._payload.value) && e._payload.value._store && (e._payload.value._store.validated = 1) : e._store && (e._store.validated = 1));
    }
    function i(e) {
      return typeof e == "object" && e !== null && e.$$typeof === k;
    }
    var f = ie, k = /* @__PURE__ */ Symbol.for("react.transitional.element"), S = /* @__PURE__ */ Symbol.for("react.portal"), A = /* @__PURE__ */ Symbol.for("react.fragment"), I = /* @__PURE__ */ Symbol.for("react.strict_mode"), N = /* @__PURE__ */ Symbol.for("react.profiler"), F = /* @__PURE__ */ Symbol.for("react.consumer"), W = /* @__PURE__ */ Symbol.for("react.context"), y = /* @__PURE__ */ Symbol.for("react.forward_ref"), E = /* @__PURE__ */ Symbol.for("react.suspense"), o = /* @__PURE__ */ Symbol.for("react.suspense_list"), m = /* @__PURE__ */ Symbol.for("react.memo"), O = /* @__PURE__ */ Symbol.for("react.lazy"), u = /* @__PURE__ */ Symbol.for("react.activity"), T = /* @__PURE__ */ Symbol.for("react.client.reference"), C = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, _ = Object.prototype.hasOwnProperty, Y = Array.isArray, B = console.createTask ? console.createTask : function() {
      return null;
    };
    f = {
      react_stack_bottom_frame: function(e) {
        return e();
      }
    };
    var w, b = {}, L = f.react_stack_bottom_frame.bind(
      f,
      h
    )(), D = B(l(h)), z = {};
    V.Fragment = A, V.jsx = function(e, r, d) {
      var v = 1e4 > C.recentlyCreatedOwnerStacks++;
      return g(
        e,
        r,
        d,
        !1,
        v ? Error("react-stack-top-frame") : L,
        v ? B(l(e)) : D
      );
    }, V.jsxs = function(e, r, d) {
      var v = 1e4 > C.recentlyCreatedOwnerStacks++;
      return g(
        e,
        r,
        d,
        !0,
        v ? Error("react-stack-top-frame") : L,
        v ? B(l(e)) : D
      );
    };
  })()), V;
}
var se;
function me() {
  return se || (se = 1, process.env.NODE_ENV === "production" ? H.exports = he() : H.exports = be()), H.exports;
}
var p = me();
const le = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace', $e = {
  blue: { top: "#3b82f6", side: "#2563eb", front: "#1d4ed8" },
  violet: { top: "#8b5cf6", side: "#7c3aed", front: "#6d28d9" },
  cyan: { top: "#06b6d4", side: "#0891b2", front: "#0e7490" },
  emerald: { top: "#10b981", side: "#059669", front: "#047857" },
  amber: { top: "#f59e0b", side: "#d97706", front: "#b45309" },
  rose: { top: "#f43f5e", side: "#e11d48", front: "#be123c" },
  slate: { top: "#475569", side: "#334155", front: "#1e293b" }
}, xe = {
  blue: { top: "#93c5fd", side: "#60a5fa", front: "#3b82f6" },
  violet: { top: "#c4b5fd", side: "#a78bfa", front: "#8b5cf6" },
  cyan: { top: "#67e8f9", side: "#22d3ee", front: "#06b6d4" },
  emerald: { top: "#6ee7b7", side: "#34d399", front: "#10b981" },
  amber: { top: "#fcd34d", side: "#fbbf24", front: "#f59e0b" },
  rose: { top: "#fda4af", side: "#fb7185", front: "#f43f5e" },
  slate: { top: "#e2e8f0", side: "#cbd5e1", front: "#94a3b8" }
};
function G(s, n, a) {
  const l = (M) => {
    const g = M.replace("#", "");
    return {
      r: parseInt(g.substring(0, 2), 16),
      g: parseInt(g.substring(2, 4), 16),
      b: parseInt(g.substring(4, 6), 16)
    };
  }, t = l(s), h = l(n), R = Math.round(t.r + (h.r - t.r) * a), x = Math.round(t.g + (h.g - t.g) * a), $ = Math.round(t.b + (h.b - t.b) * a);
  return `rgb(${R},${x},${$})`;
}
function ye({ x: s, y: n, z: a, children: l, fontSize: t = 8, color: h = "#1e293b" }) {
  const R = c(s, n, a);
  return /* @__PURE__ */ p.jsx("g", { transform: `translate(${R.screenX}, ${R.screenY})`, children: /* @__PURE__ */ p.jsx("g", { transform: "matrix(0.866, -0.5, 0.866, 0.5, 0, 0)", children: /* @__PURE__ */ p.jsx(
    "text",
    {
      x: 0,
      y: 0,
      textAnchor: "middle",
      fill: h,
      fontSize: t,
      fontWeight: 500,
      fontFamily: le,
      style: { textTransform: "uppercase", letterSpacing: "0.08em" },
      children: l
    }
  ) }) });
}
function ve({ width: s, depth: n, elevation: a, color: l, opacity: t, borderColor: h, theme: R, isGround: x }) {
  const M = K(s, n, x ? 8 : 2, 0, 0), g = c(0, 0, a);
  return /* @__PURE__ */ p.jsxs("g", { transform: `translate(${g.screenX}, ${g.screenY})`, children: [
    x && /* @__PURE__ */ p.jsx("g", { transform: "translate(4, 4)", opacity: 0.2, children: /* @__PURE__ */ p.jsx("path", { d: M.top, fill: "#000" }) }),
    /* @__PURE__ */ p.jsx("path", { d: M.top, fill: l, opacity: t }),
    x && /* @__PURE__ */ p.jsxs(p.Fragment, { children: [
      /* @__PURE__ */ p.jsx("path", { d: M.left, fill: R === "dark" ? "#0f172a" : "#cbd5e1", opacity: 0.8 }),
      /* @__PURE__ */ p.jsx("path", { d: M.right, fill: R === "dark" ? "#1e293b" : "#94a3b8", opacity: 0.8 })
    ] }),
    /* @__PURE__ */ p.jsx(
      "path",
      {
        d: M.top,
        fill: "none",
        stroke: h || (R === "dark" ? "#475569" : "#94a3b8"),
        strokeWidth: x ? 1.5 : 0.75,
        opacity: x ? 1 : 0.6
      }
    )
  ] });
}
function Te({ config: s, options: n = {}, className: a, style: l }) {
  const { interactive: t = !0, animate: h = !0, showLabels: R = !0 } = n, { theme: x, canvas: $, origin: M, tiers: g, floorSize: P, nodes: i, cornerRadius: f = 0 } = s, k = x === "dark" ? $e : xe, S = x === "dark" ? "#0f172a" : "#fafafa", A = x === "dark" ? "#e2e8f0" : "#1e293b", I = x === "dark" ? "#64748b" : "#94a3b8", [N, F] = te(/* @__PURE__ */ new Set());
  fe(() => {
    h ? (F(/* @__PURE__ */ new Set()), g.forEach((o, m) => {
      setTimeout(() => {
        F((O) => /* @__PURE__ */ new Set([...O, m]));
      }, m * 150 + 100);
    })) : F(new Set(g.map((o, m) => m)));
  }, [s.id, h, g.length]);
  const [W, y] = te(null), E = [...i].sort((o, m) => {
    const O = g[o.tier]?.elevation || 0, u = g[m.tier]?.elevation || 0;
    if (O !== u) return O - u;
    const T = o.x + o.width + (o.y + o.depth);
    return m.x + m.width + (m.y + m.depth) - T;
  });
  return /* @__PURE__ */ p.jsx("div", { className: a, style: { display: "inline-block", ...l }, children: /* @__PURE__ */ p.jsxs("svg", { width: $.width, height: $.height, style: { backgroundColor: S }, children: [
    /* @__PURE__ */ p.jsxs("defs", { children: [
      /* @__PURE__ */ p.jsx("pattern", { id: `grid-${s.id}`, width: "24", height: "24", patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ p.jsx("circle", { cx: "12", cy: "12", r: "0.5", fill: x === "dark" ? "#1e293b" : "#e2e8f0" }) }),
      /* @__PURE__ */ p.jsx("filter", { id: `glow-${s.id}`, x: "-20%", y: "-20%", width: "140%", height: "140%", children: /* @__PURE__ */ p.jsx(
        "feDropShadow",
        {
          dx: "0",
          dy: "4",
          stdDeviation: "8",
          floodColor: x === "dark" ? "#60a5fa" : "#3b82f6",
          floodOpacity: "0.3"
        }
      ) })
    ] }),
    /* @__PURE__ */ p.jsx("rect", { width: "100%", height: "100%", fill: `url(#grid-${s.id})`, opacity: "0.5" }),
    /* @__PURE__ */ p.jsx("g", { transform: `translate(${M.x}, ${M.y})`, children: g.map((o, m) => {
      const O = E.filter((b) => b.tier === m), u = N.has(m), T = t && W === m, C = u ? 0 : 60, _ = u ? 1 : 0, Y = T ? 1.02 : 1, B = t && W !== null && !T, w = c(P.width / 2, P.depth / 2, o.elevation);
      return /* @__PURE__ */ p.jsxs(
        "g",
        {
          onMouseEnter: () => t && y(m),
          onMouseLeave: () => t && y(null),
          style: {
            transform: `translate(${w.screenX}px, ${w.screenY + C}px) scale(${Y}) translate(${-w.screenX}px, ${-w.screenY}px)`,
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out",
            opacity: _ * (B ? 0.5 : 1),
            filter: T ? `url(#glow-${s.id})` : "none",
            cursor: t ? "pointer" : "default"
          },
          children: [
            /* @__PURE__ */ p.jsx(
              ve,
              {
                width: P.width,
                depth: P.depth,
                elevation: m === 0 ? -2 : o.elevation,
                color: o.floorColor || (x === "dark" ? "#0f172a" : "#f8fafc"),
                opacity: o.floorOpacity || (m === 0 ? 0.95 : 0.5),
                borderColor: o.borderColor,
                theme: x,
                isGround: m === 0
              }
            ),
            O.map((b, L) => {
              const D = o.elevation + 5, z = c(b.x, b.y, D), e = K(b.width, b.depth, b.height, z.screenX, z.screenY, f), r = k[b.color] || k.slate;
              return /* @__PURE__ */ p.jsxs("g", { opacity: b.opacity ?? 1, children: [
                e.cornerBackRight?.map((d, v) => /* @__PURE__ */ p.jsx(
                  "path",
                  {
                    d: d.path,
                    fill: G(r.front, r.side, d.intensity)
                  },
                  `cbr-${v}`
                )),
                e.cornerBackLeft?.map((d, v) => /* @__PURE__ */ p.jsx(
                  "path",
                  {
                    d: d.path,
                    fill: G(r.side, r.front, d.intensity)
                  },
                  `cbl-${v}`
                )),
                /* @__PURE__ */ p.jsx("path", { d: e.left, fill: r.side }),
                /* @__PURE__ */ p.jsx("path", { d: e.right, fill: r.front }),
                e.cornerFrontRight?.map((d, v) => /* @__PURE__ */ p.jsx(
                  "path",
                  {
                    d: d.path,
                    fill: G(r.front, r.side, d.intensity)
                  },
                  `cfr-${v}`
                )),
                e.cornerFrontLeft?.map((d, v) => /* @__PURE__ */ p.jsx(
                  "path",
                  {
                    d: d.path,
                    fill: G(r.front, r.side, d.intensity)
                  },
                  `cfl-${v}`
                )),
                /* @__PURE__ */ p.jsx("path", { d: e.top, fill: r.top }),
                /* @__PURE__ */ p.jsx(
                  "path",
                  {
                    d: e.top,
                    fill: "none",
                    stroke: "rgba(255,255,255,0.15)",
                    strokeWidth: "0.5",
                    strokeLinejoin: "round"
                  }
                ),
                R && b.label && /* @__PURE__ */ p.jsx(
                  ye,
                  {
                    x: b.x + b.width / 2,
                    y: b.y + b.depth / 2,
                    z: D + b.height + 2,
                    fontSize: b.width > 70 ? 8 : 7,
                    color: A,
                    children: b.label
                  }
                )
              ] }, L);
            }),
            R && /* @__PURE__ */ p.jsx(
              "text",
              {
                x: c(-25, P.depth / 2, o.elevation + 15).screenX - 35,
                y: c(-25, P.depth / 2, o.elevation + 15).screenY,
                fill: I,
                fontSize: 9,
                fontWeight: 500,
                fontFamily: le,
                opacity: 0.6,
                style: { letterSpacing: "0.05em" },
                children: o.name
              }
            )
          ]
        },
        m
      );
    }) })
  ] }) });
}
const ae = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace', ge = {
  blue: { top: "#3b82f6", side: "#2563eb", front: "#1d4ed8" },
  violet: { top: "#8b5cf6", side: "#7c3aed", front: "#6d28d9" },
  cyan: { top: "#06b6d4", side: "#0891b2", front: "#0e7490" },
  emerald: { top: "#10b981", side: "#059669", front: "#047857" },
  amber: { top: "#f59e0b", side: "#d97706", front: "#b45309" },
  rose: { top: "#f43f5e", side: "#e11d48", front: "#be123c" },
  slate: { top: "#475569", side: "#334155", front: "#1e293b" }
}, ke = {
  blue: { top: "#93c5fd", side: "#60a5fa", front: "#3b82f6" },
  violet: { top: "#c4b5fd", side: "#a78bfa", front: "#8b5cf6" },
  cyan: { top: "#67e8f9", side: "#22d3ee", front: "#06b6d4" },
  emerald: { top: "#6ee7b7", side: "#34d399", front: "#10b981" },
  amber: { top: "#fcd34d", side: "#fbbf24", front: "#f59e0b" },
  rose: { top: "#fda4af", side: "#fb7185", front: "#f43f5e" },
  slate: { top: "#e2e8f0", side: "#cbd5e1", front: "#94a3b8" }
};
function Q(s, n, a) {
  const l = (M) => {
    const g = M.replace("#", "");
    return {
      r: parseInt(g.substring(0, 2), 16),
      g: parseInt(g.substring(2, 4), 16),
      b: parseInt(g.substring(4, 6), 16)
    };
  }, t = l(s), h = l(n), R = Math.round(t.r + (h.r - t.r) * a), x = Math.round(t.g + (h.g - t.g) * a), $ = Math.round(t.b + (h.b - t.b) * a);
  return `rgb(${R},${x},${$})`;
}
function Ee(s) {
  const { theme: n, canvas: a, origin: l, tiers: t, floorSize: h, nodes: R, cornerRadius: x = 0 } = s, $ = n === "dark" ? ge : ke, M = n === "dark" ? "#0f172a" : "#fafafa", g = n === "dark" ? "#e2e8f0" : "#1e293b", P = n === "dark" ? "#64748b" : "#94a3b8", i = [...R].sort((k, S) => {
    const A = t[k.tier]?.elevation || 0, I = t[S.tier]?.elevation || 0;
    return A !== I ? A - I : S.x + S.width + (S.y + S.depth) - (k.x + k.width + (k.y + k.depth));
  });
  let f = `<svg xmlns="http://www.w3.org/2000/svg" width="${a.width}" height="${a.height}" style="background:${M}">`;
  f += `<defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="0.5" fill="${n === "dark" ? "#1e293b" : "#e2e8f0"}"/>
    </pattern>
  </defs>`, f += '<rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>', f += `<g transform="translate(${l.x},${l.y})">`;
  for (let k = 0; k < t.length; k++) {
    const S = t[k], A = i.filter((o) => o.tier === k), I = k === 0 ? 8 : 2, N = K(h.width, h.depth, I, 0, 0), F = c(0, 0, k === 0 ? -2 : S.elevation), W = S.floorColor || (n === "dark" ? "#0f172a" : "#f8fafc"), y = S.floorOpacity || (k === 0 ? 0.95 : 0.5);
    f += `<g transform="translate(${F.screenX},${F.screenY})">`, k === 0 && (f += `<g transform="translate(4,4)" opacity="0.2"><path d="${N.top}" fill="#000"/></g>`), f += `<path d="${N.top}" fill="${W}" opacity="${y}"/>`, k === 0 && (f += `<path d="${N.left}" fill="${n === "dark" ? "#0f172a" : "#cbd5e1"}" opacity="0.8"/>`, f += `<path d="${N.right}" fill="${n === "dark" ? "#1e293b" : "#94a3b8"}" opacity="0.8"/>`), f += `<path d="${N.top}" fill="none" stroke="${S.borderColor || (n === "dark" ? "#475569" : "#94a3b8")}" stroke-width="${k === 0 ? 1.5 : 0.75}" opacity="${k === 0 ? 1 : 0.6}"/>`, f += "</g>";
    for (const o of A) {
      const m = S.elevation + 5, O = c(o.x, o.y, m), u = K(o.width, o.depth, o.height, O.screenX, O.screenY, x), T = $[o.color] || $.slate, C = o.opacity ?? 1;
      if (f += `<g opacity="${C}">`, u.cornerBackRight)
        for (const _ of u.cornerBackRight)
          f += `<path d="${_.path}" fill="${Q(T.front, T.side, _.intensity)}"/>`;
      if (u.cornerBackLeft)
        for (const _ of u.cornerBackLeft)
          f += `<path d="${_.path}" fill="${Q(T.side, T.front, _.intensity)}"/>`;
      if (f += `<path d="${u.left}" fill="${T.side}"/>`, f += `<path d="${u.right}" fill="${T.front}"/>`, u.cornerFrontRight)
        for (const _ of u.cornerFrontRight)
          f += `<path d="${_.path}" fill="${Q(T.front, T.side, _.intensity)}"/>`;
      if (u.cornerFrontLeft)
        for (const _ of u.cornerFrontLeft)
          f += `<path d="${_.path}" fill="${Q(T.front, T.side, _.intensity)}"/>`;
      if (f += `<path d="${u.top}" fill="${T.top}"/>`, f += `<path d="${u.top}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-linejoin="round"/>`, o.label) {
        const _ = c(o.x + o.width / 2, o.y + o.depth / 2, m + o.height + 2), Y = o.width > 70 ? 8 : 7;
        f += `<g transform="translate(${_.screenX},${_.screenY})">`, f += '<g transform="matrix(0.866,-0.5,0.866,0.5,0,0)">', f += `<text x="0" y="0" text-anchor="middle" fill="${g}" font-size="${Y}" font-weight="500" font-family="${ae}" style="text-transform:uppercase;letter-spacing:0.08em">${o.label}</text>`, f += "</g></g>";
      }
      f += "</g>";
    }
    const E = c(-25, h.depth / 2, S.elevation + 15);
    f += `<text x="${E.screenX - 35}" y="${E.screenY}" fill="${P}" font-size="9" font-weight="500" font-family="${ae}" opacity="0.6" style="letter-spacing:0.05em">${S.name}</text>`;
  }
  return f += "</g></svg>", f;
}
function je(s, n) {
  s.innerHTML = Ee(n);
}
export {
  Te as ArcDiagram,
  Re as getColorShading,
  K as isoBox,
  c as isoToScreen,
  je as renderToElement,
  Ee as renderToString
};
