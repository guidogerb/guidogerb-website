import { useAuth as me, AuthProvider as he } from "react-oidc-context";
import { useAuth as Fe } from "react-oidc-context";
import ye, { useRef as be, useEffect as Ee } from "react";
var _e = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function fe(l) {
  return l && l.__esModule && Object.prototype.hasOwnProperty.call(l, "default") ? l.default : l;
}
function we(l) {
  if (Object.prototype.hasOwnProperty.call(l, "__esModule")) return l;
  var d = l.default;
  if (typeof d == "function") {
    var g = function O() {
      var y = !1;
      try {
        y = this instanceof O;
      } catch {
      }
      return y ? Reflect.construct(d, arguments, this.constructor) : d.apply(this, arguments);
    };
    g.prototype = d.prototype;
  } else g = {};
  return Object.defineProperty(g, "__esModule", { value: !0 }), Object.keys(l).forEach(function(O) {
    var y = Object.getOwnPropertyDescriptor(l, O);
    Object.defineProperty(g, O, y.get ? y : {
      enumerable: !0,
      get: function() {
        return l[O];
      }
    });
  }), g;
}
var Z = { exports: {} }, H = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ne;
function Te() {
  if (ne) return H;
  ne = 1;
  var l = Symbol.for("react.transitional.element"), d = Symbol.for("react.fragment");
  function g(O, y, I) {
    var _ = null;
    if (I !== void 0 && (_ = "" + I), y.key !== void 0 && (_ = "" + y.key), "key" in y) {
      I = {};
      for (var U in y)
        U !== "key" && (I[U] = y[U]);
    } else I = y;
    return y = I.ref, {
      $$typeof: l,
      type: O,
      key: _,
      ref: y !== void 0 ? y : null,
      props: I
    };
  }
  return H.Fragment = d, H.jsx = g, H.jsxs = g, H;
}
var Q = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var oe;
function Oe() {
  return oe || (oe = 1, process.env.NODE_ENV !== "production" && (function() {
    function l(t) {
      if (t == null) return null;
      if (typeof t == "function")
        return t.$$typeof === j ? null : t.displayName || t.name || null;
      if (typeof t == "string") return t;
      switch (t) {
        case i:
          return "Fragment";
        case h:
          return "Profiler";
        case c:
          return "StrictMode";
        case D:
          return "Suspense";
        case P:
          return "SuspenseList";
        case q:
          return "Activity";
      }
      if (typeof t == "object")
        switch (typeof t.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), t.$$typeof) {
          case o:
            return "Portal";
          case R:
            return (t.displayName || "Context") + ".Provider";
          case T:
            return (t._context.displayName || "Context") + ".Consumer";
          case k:
            var u = t.render;
            return t = t.displayName, t || (t = u.displayName || u.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
          case x:
            return u = t.displayName || null, u !== null ? u : l(t.type) || "Memo";
          case G:
            u = t._payload, t = t._init;
            try {
              return l(t(u));
            } catch {
            }
        }
      return null;
    }
    function d(t) {
      return "" + t;
    }
    function g(t) {
      try {
        d(t);
        var u = !1;
      } catch {
        u = !0;
      }
      if (u) {
        u = console;
        var f = u.error, p = typeof Symbol == "function" && Symbol.toStringTag && t[Symbol.toStringTag] || t.constructor.name || "Object";
        return f.call(
          u,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          p
        ), d(t);
      }
    }
    function O(t) {
      if (t === i) return "<>";
      if (typeof t == "object" && t !== null && t.$$typeof === G)
        return "<...>";
      try {
        var u = l(t);
        return u ? "<" + u + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function y() {
      var t = s.A;
      return t === null ? null : t.getOwner();
    }
    function I() {
      return Error("react-stack-top-frame");
    }
    function _(t) {
      if (m.call(t, "key")) {
        var u = Object.getOwnPropertyDescriptor(t, "key").get;
        if (u && u.isReactWarning) return !1;
      }
      return t.key !== void 0;
    }
    function U(t, u) {
      function f() {
        S || (S = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          u
        ));
      }
      f.isReactWarning = !0, Object.defineProperty(t, "key", {
        get: f,
        configurable: !0
      });
    }
    function $() {
      var t = l(this.type);
      return w[t] || (w[t] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), t = this.props.ref, t !== void 0 ? t : null;
    }
    function B(t, u, f, p, v, N, L, J) {
      return f = N.ref, t = {
        $$typeof: r,
        type: t,
        key: u,
        props: N,
        _owner: v
      }, (f !== void 0 ? f : null) !== null ? Object.defineProperty(t, "ref", {
        enumerable: !1,
        get: $
      }) : Object.defineProperty(t, "ref", { enumerable: !1, value: null }), t._store = {}, Object.defineProperty(t._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      }), Object.defineProperty(t, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      }), Object.defineProperty(t, "_debugStack", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: L
      }), Object.defineProperty(t, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: J
      }), Object.freeze && (Object.freeze(t.props), Object.freeze(t)), t;
    }
    function Y(t, u, f, p, v, N, L, J) {
      var C = u.children;
      if (C !== void 0)
        if (p)
          if (b(C)) {
            for (p = 0; p < C.length; p++)
              A(C[p]);
            Object.freeze && Object.freeze(C);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else A(C);
      if (m.call(u, "key")) {
        C = l(t);
        var z = Object.keys(u).filter(function(ve) {
          return ve !== "key";
        });
        p = 0 < z.length ? "{key: someKey, " + z.join(": ..., ") + ": ...}" : "{key: someKey}", a[C + p] || (z = 0 < z.length ? "{" + z.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          p,
          C,
          z,
          C
        ), a[C + p] = !0);
      }
      if (C = null, f !== void 0 && (g(f), C = "" + f), _(u) && (g(u.key), C = "" + u.key), "key" in u) {
        f = {};
        for (var K in u)
          K !== "key" && (f[K] = u[K]);
      } else f = u;
      return C && U(
        f,
        typeof t == "function" ? t.displayName || t.name || "Unknown" : t
      ), B(
        t,
        C,
        N,
        v,
        y(),
        f,
        L,
        J
      );
    }
    function A(t) {
      typeof t == "object" && t !== null && t.$$typeof === r && t._store && (t._store.validated = 1);
    }
    var V = ye, r = Symbol.for("react.transitional.element"), o = Symbol.for("react.portal"), i = Symbol.for("react.fragment"), c = Symbol.for("react.strict_mode"), h = Symbol.for("react.profiler"), T = Symbol.for("react.consumer"), R = Symbol.for("react.context"), k = Symbol.for("react.forward_ref"), D = Symbol.for("react.suspense"), P = Symbol.for("react.suspense_list"), x = Symbol.for("react.memo"), G = Symbol.for("react.lazy"), q = Symbol.for("react.activity"), j = Symbol.for("react.client.reference"), s = V.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, m = Object.prototype.hasOwnProperty, b = Array.isArray, E = console.createTask ? console.createTask : function() {
      return null;
    };
    V = {
      react_stack_bottom_frame: function(t) {
        return t();
      }
    };
    var S, w = {}, e = V.react_stack_bottom_frame.bind(
      V,
      I
    )(), n = E(O(I)), a = {};
    Q.Fragment = i, Q.jsx = function(t, u, f, p, v) {
      var N = 1e4 > s.recentlyCreatedOwnerStacks++;
      return Y(
        t,
        u,
        f,
        !1,
        p,
        v,
        N ? Error("react-stack-top-frame") : e,
        N ? E(O(t)) : n
      );
    }, Q.jsxs = function(t, u, f, p, v) {
      var N = 1e4 > s.recentlyCreatedOwnerStacks++;
      return Y(
        t,
        u,
        f,
        !0,
        p,
        v,
        N ? Error("react-stack-top-frame") : e,
        N ? E(O(t)) : n
      );
    };
  })()), Q;
}
var ie;
function Re() {
  return ie || (ie = 1, process.env.NODE_ENV === "production" ? Z.exports = Te() : Z.exports = Oe()), Z.exports;
}
var M = Re(), F = { exports: {} };
const Ne = {}, Ae = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Ne
}, Symbol.toStringTag, { value: "Module" })), ee = /* @__PURE__ */ we(Ae);
var W = { exports: {} }, re = {}, te, se;
function Se() {
  return se || (se = 1, te = function(d) {
    return d && typeof d == "object" && typeof d.copy == "function" && typeof d.fill == "function" && typeof d.readUInt8 == "function";
  }), te;
}
var X = { exports: {} }, ae;
function je() {
  return ae || (ae = 1, typeof Object.create == "function" ? X.exports = function(d, g) {
    d.super_ = g, d.prototype = Object.create(g.prototype, {
      constructor: {
        value: d,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    });
  } : X.exports = function(d, g) {
    d.super_ = g;
    var O = function() {
    };
    O.prototype = g.prototype, d.prototype = new O(), d.prototype.constructor = d;
  }), X.exports;
}
var ue;
function De() {
  return ue || (ue = 1, (function(l) {
    var d = /%[sdj%]/g;
    l.format = function(e) {
      if (!R(e)) {
        for (var n = [], a = 0; a < arguments.length; a++)
          n.push(y(arguments[a]));
        return n.join(" ");
      }
      for (var a = 1, t = arguments, u = t.length, f = String(e).replace(d, function(v) {
        if (v === "%%") return "%";
        if (a >= u) return v;
        switch (v) {
          case "%s":
            return String(t[a++]);
          case "%d":
            return Number(t[a++]);
          case "%j":
            try {
              return JSON.stringify(t[a++]);
            } catch {
              return "[Circular]";
            }
          default:
            return v;
        }
      }), p = t[a]; a < u; p = t[++a])
        c(p) || !x(p) ? f += " " + p : f += " " + y(p);
      return f;
    }, l.deprecate = function(e, n) {
      if (D(_e.process))
        return function() {
          return l.deprecate(e, n).apply(this, arguments);
        };
      if (process.noDeprecation === !0)
        return e;
      var a = !1;
      function t() {
        if (!a) {
          if (process.throwDeprecation)
            throw new Error(n);
          process.traceDeprecation ? console.trace(n) : console.error(n), a = !0;
        }
        return e.apply(this, arguments);
      }
      return t;
    };
    var g = {}, O;
    l.debuglog = function(e) {
      if (D(O) && (O = process.env.NODE_DEBUG || ""), e = e.toUpperCase(), !g[e])
        if (new RegExp("\\b" + e + "\\b", "i").test(O)) {
          var n = process.pid;
          g[e] = function() {
            var a = l.format.apply(l, arguments);
            console.error("%s %d: %s", e, n, a);
          };
        } else
          g[e] = function() {
          };
      return g[e];
    };
    function y(e, n) {
      var a = {
        seen: [],
        stylize: _
      };
      return arguments.length >= 3 && (a.depth = arguments[2]), arguments.length >= 4 && (a.colors = arguments[3]), i(n) ? a.showHidden = n : n && l._extend(a, n), D(a.showHidden) && (a.showHidden = !1), D(a.depth) && (a.depth = 2), D(a.colors) && (a.colors = !1), D(a.customInspect) && (a.customInspect = !0), a.colors && (a.stylize = I), $(a, e, a.depth);
    }
    l.inspect = y, y.colors = {
      bold: [1, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      white: [37, 39],
      grey: [90, 39],
      black: [30, 39],
      blue: [34, 39],
      cyan: [36, 39],
      green: [32, 39],
      magenta: [35, 39],
      red: [31, 39],
      yellow: [33, 39]
    }, y.styles = {
      special: "cyan",
      number: "yellow",
      boolean: "yellow",
      undefined: "grey",
      null: "bold",
      string: "green",
      date: "magenta",
      // "name": intentionally not styling
      regexp: "red"
    };
    function I(e, n) {
      var a = y.styles[n];
      return a ? "\x1B[" + y.colors[a][0] + "m" + e + "\x1B[" + y.colors[a][1] + "m" : e;
    }
    function _(e, n) {
      return e;
    }
    function U(e) {
      var n = {};
      return e.forEach(function(a, t) {
        n[a] = !0;
      }), n;
    }
    function $(e, n, a) {
      if (e.customInspect && n && j(n.inspect) && // Filter out the util module, it's inspect function is special
      n.inspect !== l.inspect && // Also filter out any prototype objects using the circular check.
      !(n.constructor && n.constructor.prototype === n)) {
        var t = n.inspect(a, e);
        return R(t) || (t = $(e, t, a)), t;
      }
      var u = B(e, n);
      if (u)
        return u;
      var f = Object.keys(n), p = U(f);
      if (e.showHidden && (f = Object.getOwnPropertyNames(n)), q(n) && (f.indexOf("message") >= 0 || f.indexOf("description") >= 0))
        return Y(n);
      if (f.length === 0) {
        if (j(n)) {
          var v = n.name ? ": " + n.name : "";
          return e.stylize("[Function" + v + "]", "special");
        }
        if (P(n))
          return e.stylize(RegExp.prototype.toString.call(n), "regexp");
        if (G(n))
          return e.stylize(Date.prototype.toString.call(n), "date");
        if (q(n))
          return Y(n);
      }
      var N = "", L = !1, J = ["{", "}"];
      if (o(n) && (L = !0, J = ["[", "]"]), j(n)) {
        var C = n.name ? ": " + n.name : "";
        N = " [Function" + C + "]";
      }
      if (P(n) && (N = " " + RegExp.prototype.toString.call(n)), G(n) && (N = " " + Date.prototype.toUTCString.call(n)), q(n) && (N = " " + Y(n)), f.length === 0 && (!L || n.length == 0))
        return J[0] + N + J[1];
      if (a < 0)
        return P(n) ? e.stylize(RegExp.prototype.toString.call(n), "regexp") : e.stylize("[Object]", "special");
      e.seen.push(n);
      var z;
      return L ? z = A(e, n, a, p, f) : z = f.map(function(K) {
        return V(e, n, a, p, K, L);
      }), e.seen.pop(), r(z, N, J);
    }
    function B(e, n) {
      if (D(n))
        return e.stylize("undefined", "undefined");
      if (R(n)) {
        var a = "'" + JSON.stringify(n).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
        return e.stylize(a, "string");
      }
      if (T(n))
        return e.stylize("" + n, "number");
      if (i(n))
        return e.stylize("" + n, "boolean");
      if (c(n))
        return e.stylize("null", "null");
    }
    function Y(e) {
      return "[" + Error.prototype.toString.call(e) + "]";
    }
    function A(e, n, a, t, u) {
      for (var f = [], p = 0, v = n.length; p < v; ++p)
        w(n, String(p)) ? f.push(V(
          e,
          n,
          a,
          t,
          String(p),
          !0
        )) : f.push("");
      return u.forEach(function(N) {
        N.match(/^\d+$/) || f.push(V(
          e,
          n,
          a,
          t,
          N,
          !0
        ));
      }), f;
    }
    function V(e, n, a, t, u, f) {
      var p, v, N;
      if (N = Object.getOwnPropertyDescriptor(n, u) || { value: n[u] }, N.get ? N.set ? v = e.stylize("[Getter/Setter]", "special") : v = e.stylize("[Getter]", "special") : N.set && (v = e.stylize("[Setter]", "special")), w(t, u) || (p = "[" + u + "]"), v || (e.seen.indexOf(N.value) < 0 ? (c(a) ? v = $(e, N.value, null) : v = $(e, N.value, a - 1), v.indexOf(`
`) > -1 && (f ? v = v.split(`
`).map(function(L) {
        return "  " + L;
      }).join(`
`).substr(2) : v = `
` + v.split(`
`).map(function(L) {
        return "   " + L;
      }).join(`
`))) : v = e.stylize("[Circular]", "special")), D(p)) {
        if (f && u.match(/^\d+$/))
          return v;
        p = JSON.stringify("" + u), p.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (p = p.substr(1, p.length - 2), p = e.stylize(p, "name")) : (p = p.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), p = e.stylize(p, "string"));
      }
      return p + ": " + v;
    }
    function r(e, n, a) {
      var t = e.reduce(function(u, f) {
        return f.indexOf(`
`) >= 0, u + f.replace(/\u001b\[\d\d?m/g, "").length + 1;
      }, 0);
      return t > 60 ? a[0] + (n === "" ? "" : n + `
 `) + " " + e.join(`,
  `) + " " + a[1] : a[0] + n + " " + e.join(", ") + " " + a[1];
    }
    function o(e) {
      return Array.isArray(e);
    }
    l.isArray = o;
    function i(e) {
      return typeof e == "boolean";
    }
    l.isBoolean = i;
    function c(e) {
      return e === null;
    }
    l.isNull = c;
    function h(e) {
      return e == null;
    }
    l.isNullOrUndefined = h;
    function T(e) {
      return typeof e == "number";
    }
    l.isNumber = T;
    function R(e) {
      return typeof e == "string";
    }
    l.isString = R;
    function k(e) {
      return typeof e == "symbol";
    }
    l.isSymbol = k;
    function D(e) {
      return e === void 0;
    }
    l.isUndefined = D;
    function P(e) {
      return x(e) && m(e) === "[object RegExp]";
    }
    l.isRegExp = P;
    function x(e) {
      return typeof e == "object" && e !== null;
    }
    l.isObject = x;
    function G(e) {
      return x(e) && m(e) === "[object Date]";
    }
    l.isDate = G;
    function q(e) {
      return x(e) && (m(e) === "[object Error]" || e instanceof Error);
    }
    l.isError = q;
    function j(e) {
      return typeof e == "function";
    }
    l.isFunction = j;
    function s(e) {
      return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" || typeof e == "symbol" || // ES6 symbol
      typeof e > "u";
    }
    l.isPrimitive = s, l.isBuffer = Se();
    function m(e) {
      return Object.prototype.toString.call(e);
    }
    function b(e) {
      return e < 10 ? "0" + e.toString(10) : e.toString(10);
    }
    var E = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    function S() {
      var e = /* @__PURE__ */ new Date(), n = [
        b(e.getHours()),
        b(e.getMinutes()),
        b(e.getSeconds())
      ].join(":");
      return [e.getDate(), E[e.getMonth()], n].join(" ");
    }
    l.log = function() {
      console.log("%s - %s", S(), l.format.apply(l, arguments));
    }, l.inherits = je(), l._extend = function(e, n) {
      if (!n || !x(n)) return e;
      for (var a = Object.keys(n), t = a.length; t--; )
        e[a[t]] = n[a[t]];
      return e;
    };
    function w(e, n) {
      return Object.prototype.hasOwnProperty.call(e, n);
    }
  })(re)), re;
}
var ce;
function de() {
  if (ce) return W.exports;
  ce = 1;
  var l = process.platform === "win32", d = De();
  function g(r, o) {
    for (var i = [], c = 0; c < r.length; c++) {
      var h = r[c];
      !h || h === "." || (h === ".." ? i.length && i[i.length - 1] !== ".." ? i.pop() : o && i.push("..") : i.push(h));
    }
    return i;
  }
  function O(r) {
    for (var o = r.length - 1, i = 0; i <= o && !r[i]; i++)
      ;
    for (var c = o; c >= 0 && !r[c]; c--)
      ;
    return i === 0 && c === o ? r : i > c ? [] : r.slice(i, c + 1);
  }
  var y = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/, I = /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/, _ = {};
  function U(r) {
    var o = y.exec(r), i = (o[1] || "") + (o[2] || ""), c = o[3] || "", h = I.exec(c), T = h[1], R = h[2], k = h[3];
    return [i, T, R, k];
  }
  function $(r) {
    var o = y.exec(r), i = o[1] || "", c = !!i && i[1] !== ":";
    return {
      device: i,
      isUnc: c,
      isAbsolute: c || !!o[2],
      // UNC paths are always absolute
      tail: o[3]
    };
  }
  function B(r) {
    return "\\\\" + r.replace(/^[\\\/]+/, "").replace(/[\\\/]+/g, "\\");
  }
  _.resolve = function() {
    for (var r = "", o = "", i = !1, c = arguments.length - 1; c >= -1; c--) {
      var h;
      if (c >= 0 ? h = arguments[c] : r ? (h = process.env["=" + r], (!h || h.substr(0, 3).toLowerCase() !== r.toLowerCase() + "\\") && (h = r + "\\")) : h = process.cwd(), d.isString(h)) {
        if (!h)
          continue;
      } else throw new TypeError("Arguments to path.resolve must be strings");
      var T = $(h), R = T.device, k = T.isUnc, D = T.isAbsolute, P = T.tail;
      if (!(R && r && R.toLowerCase() !== r.toLowerCase()) && (r || (r = R), i || (o = P + "\\" + o, i = D), r && i))
        break;
    }
    return k && (r = B(r)), o = g(
      o.split(/[\\\/]+/),
      !i
    ).join("\\"), r + (i ? "\\" : "") + o || ".";
  }, _.normalize = function(r) {
    var o = $(r), i = o.device, c = o.isUnc, h = o.isAbsolute, T = o.tail, R = /[\\\/]$/.test(T);
    return T = g(T.split(/[\\\/]+/), !h).join("\\"), !T && !h && (T = "."), T && R && (T += "\\"), c && (i = B(i)), i + (h ? "\\" : "") + T;
  }, _.isAbsolute = function(r) {
    return $(r).isAbsolute;
  }, _.join = function() {
    for (var r = [], o = 0; o < arguments.length; o++) {
      var i = arguments[o];
      if (!d.isString(i))
        throw new TypeError("Arguments to path.join must be strings");
      i && r.push(i);
    }
    var c = r.join("\\");
    return /^[\\\/]{2}[^\\\/]/.test(r[0]) || (c = c.replace(/^[\\\/]{2,}/, "\\")), _.normalize(c);
  }, _.relative = function(r, o) {
    r = _.resolve(r), o = _.resolve(o);
    for (var i = r.toLowerCase(), c = o.toLowerCase(), h = O(o.split("\\")), T = O(i.split("\\")), R = O(c.split("\\")), k = Math.min(T.length, R.length), D = k, P = 0; P < k; P++)
      if (T[P] !== R[P]) {
        D = P;
        break;
      }
    if (D == 0)
      return o;
    for (var x = [], P = D; P < T.length; P++)
      x.push("..");
    return x = x.concat(h.slice(D)), x.join("\\");
  }, _._makeLong = function(r) {
    if (!d.isString(r))
      return r;
    if (!r)
      return "";
    var o = _.resolve(r);
    return /^[a-zA-Z]\:\\/.test(o) ? "\\\\?\\" + o : /^\\\\[^?.]/.test(o) ? "\\\\?\\UNC\\" + o.substring(2) : r;
  }, _.dirname = function(r) {
    var o = U(r), i = o[0], c = o[1];
    return !i && !c ? "." : (c && (c = c.substr(0, c.length - 1)), i + c);
  }, _.basename = function(r, o) {
    var i = U(r)[2];
    return o && i.substr(-1 * o.length) === o && (i = i.substr(0, i.length - o.length)), i;
  }, _.extname = function(r) {
    return U(r)[3];
  }, _.format = function(r) {
    if (!d.isObject(r))
      throw new TypeError(
        "Parameter 'pathObject' must be an object, not " + typeof r
      );
    var o = r.root || "";
    if (!d.isString(o))
      throw new TypeError(
        "'pathObject.root' must be a string or undefined, not " + typeof r.root
      );
    var i = r.dir, c = r.base || "";
    return i ? i[i.length - 1] === _.sep ? i + c : i + _.sep + c : c;
  }, _.parse = function(r) {
    if (!d.isString(r))
      throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof r
      );
    var o = U(r);
    if (!o || o.length !== 4)
      throw new TypeError("Invalid path '" + r + "'");
    return {
      root: o[0],
      dir: o[0] + o[1].slice(0, -1),
      base: o[2],
      ext: o[3],
      name: o[2].slice(0, o[2].length - o[3].length)
    };
  }, _.sep = "\\", _.delimiter = ";";
  var Y = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/, A = {};
  function V(r) {
    return Y.exec(r).slice(1);
  }
  return A.resolve = function() {
    for (var r = "", o = !1, i = arguments.length - 1; i >= -1 && !o; i--) {
      var c = i >= 0 ? arguments[i] : process.cwd();
      if (d.isString(c)) {
        if (!c)
          continue;
      } else throw new TypeError("Arguments to path.resolve must be strings");
      r = c + "/" + r, o = c[0] === "/";
    }
    return r = g(
      r.split("/"),
      !o
    ).join("/"), (o ? "/" : "") + r || ".";
  }, A.normalize = function(r) {
    var o = A.isAbsolute(r), i = r && r[r.length - 1] === "/";
    return r = g(r.split("/"), !o).join("/"), !r && !o && (r = "."), r && i && (r += "/"), (o ? "/" : "") + r;
  }, A.isAbsolute = function(r) {
    return r.charAt(0) === "/";
  }, A.join = function() {
    for (var r = "", o = 0; o < arguments.length; o++) {
      var i = arguments[o];
      if (!d.isString(i))
        throw new TypeError("Arguments to path.join must be strings");
      i && (r ? r += "/" + i : r += i);
    }
    return A.normalize(r);
  }, A.relative = function(r, o) {
    r = A.resolve(r).substr(1), o = A.resolve(o).substr(1);
    for (var i = O(r.split("/")), c = O(o.split("/")), h = Math.min(i.length, c.length), T = h, R = 0; R < h; R++)
      if (i[R] !== c[R]) {
        T = R;
        break;
      }
    for (var k = [], R = T; R < i.length; R++)
      k.push("..");
    return k = k.concat(c.slice(T)), k.join("/");
  }, A._makeLong = function(r) {
    return r;
  }, A.dirname = function(r) {
    var o = V(r), i = o[0], c = o[1];
    return !i && !c ? "." : (c && (c = c.substr(0, c.length - 1)), i + c);
  }, A.basename = function(r, o) {
    var i = V(r)[2];
    return o && i.substr(-1 * o.length) === o && (i = i.substr(0, i.length - o.length)), i;
  }, A.extname = function(r) {
    return V(r)[3];
  }, A.format = function(r) {
    if (!d.isObject(r))
      throw new TypeError(
        "Parameter 'pathObject' must be an object, not " + typeof r
      );
    var o = r.root || "";
    if (!d.isString(o))
      throw new TypeError(
        "'pathObject.root' must be a string or undefined, not " + typeof r.root
      );
    var i = r.dir ? r.dir + A.sep : "", c = r.base || "";
    return i + c;
  }, A.parse = function(r) {
    if (!d.isString(r))
      throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof r
      );
    var o = V(r);
    if (!o || o.length !== 4)
      throw new TypeError("Invalid path '" + r + "'");
    return o[1] = o[1] || "", o[2] = o[2] || "", o[3] = o[3] || "", {
      root: o[0],
      dir: o[0] + o[1].slice(0, -1),
      base: o[2],
      ext: o[3],
      name: o[2].slice(0, o[2].length - o[3].length)
    };
  }, A.sep = "/", A.delimiter = ":", l ? W.exports = _ : W.exports = A, W.exports.posix = A, W.exports.win32 = _, W.exports;
}
const Pe = "17.2.2", Ie = {
  version: Pe
};
var le;
function ke() {
  if (le) return F.exports;
  le = 1;
  const l = ee, d = de(), g = ee, O = ee, I = Ie.version, _ = [
    "🔐 encrypt with Dotenvx: https://dotenvx.com",
    "🔐 prevent committing .env to code: https://dotenvx.com/precommit",
    "🔐 prevent building .env in docker: https://dotenvx.com/prebuild",
    "📡 observe env with Radar: https://dotenvx.com/radar",
    "📡 auto-backup env with Radar: https://dotenvx.com/radar",
    "📡 version env with Radar: https://dotenvx.com/radar",
    "🛠️  run anywhere with `dotenvx run -- yourcommand`",
    "⚙️  specify custom .env file path with { path: '/custom/path/.env' }",
    "⚙️  enable debug logging with { debug: true }",
    "⚙️  override existing env vars with { override: true }",
    "⚙️  suppress all logs with { quiet: true }",
    "⚙️  write to custom object with { processEnv: myObject }",
    "⚙️  load multiple .env files with { path: ['.env.local', '.env'] }"
  ];
  function U() {
    return _[Math.floor(Math.random() * _.length)];
  }
  function $(s) {
    return typeof s == "string" ? !["false", "0", "no", "off", ""].includes(s.toLowerCase()) : !!s;
  }
  function B() {
    return process.stdout.isTTY;
  }
  function Y(s) {
    return B() ? `\x1B[2m${s}\x1B[0m` : s;
  }
  const A = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function V(s) {
    const m = {};
    let b = s.toString();
    b = b.replace(/\r\n?/mg, `
`);
    let E;
    for (; (E = A.exec(b)) != null; ) {
      const S = E[1];
      let w = E[2] || "";
      w = w.trim();
      const e = w[0];
      w = w.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), e === '"' && (w = w.replace(/\\n/g, `
`), w = w.replace(/\\r/g, "\r")), m[S] = w;
    }
    return m;
  }
  function r(s) {
    s = s || {};
    const m = R(s);
    s.path = m;
    const b = j.configDotenv(s);
    if (!b.parsed) {
      const e = new Error(`MISSING_DATA: Cannot parse ${m} for an unknown reason`);
      throw e.code = "MISSING_DATA", e;
    }
    const E = h(s).split(","), S = E.length;
    let w;
    for (let e = 0; e < S; e++)
      try {
        const n = E[e].trim(), a = T(b, n);
        w = j.decrypt(a.ciphertext, a.key);
        break;
      } catch (n) {
        if (e + 1 >= S)
          throw n;
      }
    return j.parse(w);
  }
  function o(s) {
    console.error(`[dotenv@${I}][WARN] ${s}`);
  }
  function i(s) {
    console.log(`[dotenv@${I}][DEBUG] ${s}`);
  }
  function c(s) {
    console.log(`[dotenv@${I}] ${s}`);
  }
  function h(s) {
    return s && s.DOTENV_KEY && s.DOTENV_KEY.length > 0 ? s.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
  }
  function T(s, m) {
    let b;
    try {
      b = new URL(m);
    } catch (n) {
      if (n.code === "ERR_INVALID_URL") {
        const a = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        throw a.code = "INVALID_DOTENV_KEY", a;
      }
      throw n;
    }
    const E = b.password;
    if (!E) {
      const n = new Error("INVALID_DOTENV_KEY: Missing key part");
      throw n.code = "INVALID_DOTENV_KEY", n;
    }
    const S = b.searchParams.get("environment");
    if (!S) {
      const n = new Error("INVALID_DOTENV_KEY: Missing environment part");
      throw n.code = "INVALID_DOTENV_KEY", n;
    }
    const w = `DOTENV_VAULT_${S.toUpperCase()}`, e = s.parsed[w];
    if (!e) {
      const n = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${w} in your .env.vault file.`);
      throw n.code = "NOT_FOUND_DOTENV_ENVIRONMENT", n;
    }
    return { ciphertext: e, key: E };
  }
  function R(s) {
    let m = null;
    if (s && s.path && s.path.length > 0)
      if (Array.isArray(s.path))
        for (const b of s.path)
          l.existsSync(b) && (m = b.endsWith(".vault") ? b : `${b}.vault`);
      else
        m = s.path.endsWith(".vault") ? s.path : `${s.path}.vault`;
    else
      m = d.resolve(process.cwd(), ".env.vault");
    return l.existsSync(m) ? m : null;
  }
  function k(s) {
    return s[0] === "~" ? d.join(g.homedir(), s.slice(1)) : s;
  }
  function D(s) {
    const m = $(process.env.DOTENV_CONFIG_DEBUG || s && s.debug), b = $(process.env.DOTENV_CONFIG_QUIET || s && s.quiet);
    (m || !b) && c("Loading env from encrypted .env.vault");
    const E = j._parseVault(s);
    let S = process.env;
    return s && s.processEnv != null && (S = s.processEnv), j.populate(S, E, s), { parsed: E };
  }
  function P(s) {
    const m = d.resolve(process.cwd(), ".env");
    let b = "utf8", E = process.env;
    s && s.processEnv != null && (E = s.processEnv);
    let S = $(E.DOTENV_CONFIG_DEBUG || s && s.debug), w = $(E.DOTENV_CONFIG_QUIET || s && s.quiet);
    s && s.encoding ? b = s.encoding : S && i("No encoding is specified. UTF-8 is used by default");
    let e = [m];
    if (s && s.path)
      if (!Array.isArray(s.path))
        e = [k(s.path)];
      else {
        e = [];
        for (const u of s.path)
          e.push(k(u));
      }
    let n;
    const a = {};
    for (const u of e)
      try {
        const f = j.parse(l.readFileSync(u, { encoding: b }));
        j.populate(a, f, s);
      } catch (f) {
        S && i(`Failed to load ${u} ${f.message}`), n = f;
      }
    const t = j.populate(E, a, s);
    if (S = $(E.DOTENV_CONFIG_DEBUG || S), w = $(E.DOTENV_CONFIG_QUIET || w), S || !w) {
      const u = Object.keys(t).length, f = [];
      for (const p of e)
        try {
          const v = d.relative(process.cwd(), p);
          f.push(v);
        } catch (v) {
          S && i(`Failed to load ${p} ${v.message}`), n = v;
        }
      c(`injecting env (${u}) from ${f.join(",")} ${Y(`-- tip: ${U()}`)}`);
    }
    return n ? { parsed: a, error: n } : { parsed: a };
  }
  function x(s) {
    if (h(s).length === 0)
      return j.configDotenv(s);
    const m = R(s);
    return m ? j._configVault(s) : (o(`You set DOTENV_KEY but you are missing a .env.vault file at ${m}. Did you forget to build it?`), j.configDotenv(s));
  }
  function G(s, m) {
    const b = Buffer.from(m.slice(-64), "hex");
    let E = Buffer.from(s, "base64");
    const S = E.subarray(0, 12), w = E.subarray(-16);
    E = E.subarray(12, -16);
    try {
      const e = O.createDecipheriv("aes-256-gcm", b, S);
      return e.setAuthTag(w), `${e.update(E)}${e.final()}`;
    } catch (e) {
      const n = e instanceof RangeError, a = e.message === "Invalid key length", t = e.message === "Unsupported state or unable to authenticate data";
      if (n || a) {
        const u = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        throw u.code = "INVALID_DOTENV_KEY", u;
      } else if (t) {
        const u = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        throw u.code = "DECRYPTION_FAILED", u;
      } else
        throw e;
    }
  }
  function q(s, m, b = {}) {
    const E = !!(b && b.debug), S = !!(b && b.override), w = {};
    if (typeof m != "object") {
      const e = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      throw e.code = "OBJECT_REQUIRED", e;
    }
    for (const e of Object.keys(m))
      Object.prototype.hasOwnProperty.call(s, e) ? (S === !0 && (s[e] = m[e], w[e] = m[e]), E && i(S === !0 ? `"${e}" is already defined and WAS overwritten` : `"${e}" is already defined and was NOT overwritten`)) : (s[e] = m[e], w[e] = m[e]);
    return w;
  }
  const j = {
    configDotenv: P,
    _configVault: D,
    _parseVault: r,
    config: x,
    decrypt: G,
    parse: V,
    populate: q
  };
  return F.exports.configDotenv = j.configDotenv, F.exports._configVault = j._configVault, F.exports._parseVault = j._parseVault, F.exports.config = j.config, F.exports.decrypt = j.decrypt, F.exports.parse = j.parse, F.exports.populate = j.populate, F.exports = j, F.exports;
}
var Ce = ke();
const pe = /* @__PURE__ */ fe(Ce);
var $e = de();
const ge = /* @__PURE__ */ fe($e);
pe.config({ path: ge.resolve(__dirname, "../../../.env") });
function Ue({ children: l, autoSignIn: d = !1 }) {
  const g = me(), O = be(!1);
  Ee(() => {
    d && !g.isAuthenticated && !g.isLoading && !O.current && (O.current = !0, g.signinRedirect());
  }, [d, g.isAuthenticated, g.isLoading, g]);
  const y = () => {
    g.removeUser();
  };
  return g.isLoading ? /* @__PURE__ */ M.jsx("div", { children: "Loading..." }) : g.error ? /* @__PURE__ */ M.jsxs("div", { children: [
    "Encountering error... ",
    g.error.message,
    /* @__PURE__ */ M.jsx("div", { style: { marginTop: 8, color: "#a00" }, children: "Hint: ensure OIDC is configured. Set either VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL, and also VITE_COGNITO_CLIENT_ID, VITE_REDIRECT_URI, VITE_COGNITO_SCOPE in your app’s .env." })
  ] }) : g.isAuthenticated ? /* @__PURE__ */ M.jsxs("div", { children: [
    l ?? null,
    /* @__PURE__ */ M.jsx("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ M.jsx("button", { onClick: () => y(), children: "Sign out" }) })
  ] }) : d ? null : /* @__PURE__ */ M.jsxs("div", { children: [
    /* @__PURE__ */ M.jsx("button", { onClick: () => g.signinRedirect(), children: "Sign in" }),
    /* @__PURE__ */ M.jsx("button", { onClick: () => y(), style: { marginLeft: 8 }, children: "Sign out" })
  ] });
}
pe.config({ path: ge.resolve(__dirname, "../../../.env") });
function Le({ children: l }) {
  const d = {
    authority: void 0,
    metadataUrl: void 0,
    client_id: void 0,
    redirect_uri: void 0,
    post_logout_redirect_uri: void 0,
    scope: "openid profile email",
    response_type: "code"
  };
  console.log("AuthProvider config: ", JSON.stringify(d));
  const g = () => {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  };
  return /* @__PURE__ */ M.jsx(he, { ...d, onSigninCallback: g, children: l });
}
export {
  Ue as Auth,
  Le as AuthProvider,
  Fe as useAuth
};
