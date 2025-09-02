import ne from "react";
import { useAuth as oe, AuthProvider as ae } from "react-oidc-context";
import { useAuth as pe } from "react-oidc-context";
var g = { exports: {} }, p = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var L;
function ie() {
  if (L) return p;
  L = 1;
  var n = Symbol.for("react.transitional.element"), o = Symbol.for("react.fragment");
  function t(c, a, s) {
    var f = null;
    if (s !== void 0 && (f = "" + s), a.key !== void 0 && (f = "" + a.key), "key" in a) {
      s = {};
      for (var E in a)
        E !== "key" && (s[E] = a[E]);
    } else s = a;
    return a = s.ref, {
      $$typeof: n,
      type: c,
      key: f,
      ref: a !== void 0 ? a : null,
      props: s
    };
  }
  return p.Fragment = o, p.jsx = t, p.jsxs = t, p;
}
var v = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var V;
function ce() {
  return V || (V = 1, process.env.NODE_ENV !== "production" && (function() {
    function n(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === ee ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case h:
          return "Fragment";
        case J:
          return "Profiler";
        case q:
          return "StrictMode";
        case H:
          return "Suspense";
        case Z:
          return "SuspenseList";
        case K:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case W:
            return "Portal";
          case X:
            return (e.displayName || "Context") + ".Provider";
          case z:
            return (e._context.displayName || "Context") + ".Consumer";
          case B:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case Q:
            return r = e.displayName || null, r !== null ? r : n(e.type) || "Memo";
          case I:
            r = e._payload, e = e._init;
            try {
              return n(e(r));
            } catch {
            }
        }
      return null;
    }
    function o(e) {
      return "" + e;
    }
    function t(e) {
      try {
        o(e);
        var r = !1;
      } catch {
        r = !0;
      }
      if (r) {
        r = console;
        var i = r.error, u = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return i.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          u
        ), o(e);
      }
    }
    function c(e) {
      if (e === h) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === I)
        return "<...>";
      try {
        var r = n(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function a() {
      var e = S.A;
      return e === null ? null : e.getOwner();
    }
    function s() {
      return Error("react-stack-top-frame");
    }
    function f(e) {
      if (C.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function E(e, r) {
      function i() {
        N || (N = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      i.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: i,
        configurable: !0
      });
    }
    function O() {
      var e = n(this.type);
      return U[e] || (U[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function G(e, r, i, u, _, d, k, w) {
      return i = d.ref, e = {
        $$typeof: y,
        type: e,
        key: r,
        props: d,
        _owner: _
      }, (i !== void 0 ? i : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: O
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
        value: k
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: w
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function P(e, r, i, u, _, d, k, w) {
      var l = r.children;
      if (l !== void 0)
        if (u)
          if (re(l)) {
            for (u = 0; u < l.length; u++)
              j(l[u]);
            Object.freeze && Object.freeze(l);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else j(l);
      if (C.call(r, "key")) {
        l = n(e);
        var T = Object.keys(r).filter(function(te) {
          return te !== "key";
        });
        u = 0 < T.length ? "{key: someKey, " + T.join(": ..., ") + ": ...}" : "{key: someKey}", $[l + u] || (T = 0 < T.length ? "{" + T.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          u,
          l,
          T,
          l
        ), $[l + u] = !0);
      }
      if (l = null, i !== void 0 && (t(i), l = "" + i), f(r) && (t(r.key), l = "" + r.key), "key" in r) {
        i = {};
        for (var x in r)
          x !== "key" && (i[x] = r[x]);
      } else i = r;
      return l && E(
        i,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), G(
        e,
        l,
        d,
        _,
        a(),
        i,
        k,
        w
      );
    }
    function j(e) {
      typeof e == "object" && e !== null && e.$$typeof === y && e._store && (e._store.validated = 1);
    }
    var b = ne, y = Symbol.for("react.transitional.element"), W = Symbol.for("react.portal"), h = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), J = Symbol.for("react.profiler"), z = Symbol.for("react.consumer"), X = Symbol.for("react.context"), B = Symbol.for("react.forward_ref"), H = Symbol.for("react.suspense"), Z = Symbol.for("react.suspense_list"), Q = Symbol.for("react.memo"), I = Symbol.for("react.lazy"), K = Symbol.for("react.activity"), ee = Symbol.for("react.client.reference"), S = b.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, C = Object.prototype.hasOwnProperty, re = Array.isArray, A = console.createTask ? console.createTask : function() {
      return null;
    };
    b = {
      react_stack_bottom_frame: function(e) {
        return e();
      }
    };
    var N, U = {}, D = b.react_stack_bottom_frame.bind(
      b,
      s
    )(), Y = A(c(s)), $ = {};
    v.Fragment = h, v.jsx = function(e, r, i, u, _) {
      var d = 1e4 > S.recentlyCreatedOwnerStacks++;
      return P(
        e,
        r,
        i,
        !1,
        u,
        _,
        d ? Error("react-stack-top-frame") : D,
        d ? A(c(e)) : Y
      );
    }, v.jsxs = function(e, r, i, u, _) {
      var d = 1e4 > S.recentlyCreatedOwnerStacks++;
      return P(
        e,
        r,
        i,
        !0,
        u,
        _,
        d ? Error("react-stack-top-frame") : D,
        d ? A(c(e)) : Y
      );
    };
  })()), v;
}
var F;
function se() {
  return F || (F = 1, process.env.NODE_ENV === "production" ? g.exports = ie() : g.exports = ce()), g.exports;
}
var m = se();
const ue = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 }, R = (n, o) => {
  try {
    const t = ue?.[n];
    return t == null || t === "" ? o : t;
  } catch {
    return o;
  }
};
function M() {
  const n = R("VITE_COGNITO_AUTHORITY", void 0), o = R("VITE_COGNITO_CLIENT_ID", void 0), t = R("VITE_REDIRECT_URI", typeof window < "u" ? window.location.origin : void 0), c = R("VITE_RESPONSE_TYPE", "code"), a = R("VITE_COGNITO_SCOPE", "email openid phone"), s = R("VITE_COGNITO_DOMAIN", void 0), f = R("VITE_LOGOUT_URI", t);
  return {
    authority: n,
    clientId: o,
    redirectUri: t,
    responseType: c,
    scope: a,
    cognitoDomain: s,
    logoutUri: f
  };
}
function le(n = {}) {
  const o = M(), t = n.authority ?? o.authority, c = n.clientId ?? o.clientId, a = n.redirectUri ?? o.redirectUri, s = n.responseType ?? o.responseType, f = n.scope ?? o.scope;
  return {
    authority: t,
    client_id: c,
    redirect_uri: a,
    response_type: s,
    scope: f
  };
}
function fe(n = {}) {
  const o = M(), t = n.clientId ?? o.clientId, c = n.logoutUri ?? o.logoutUri, a = n.cognitoDomain ?? o.cognitoDomain;
  return !t || !c || !a ? void 0 : `${a.replace(/\/$/, "")}/logout?client_id=${encodeURIComponent(t)}&logout_uri=${encodeURIComponent(c)}`;
}
function _e({ children: n, autoSignIn: o = !1 }) {
  const t = oe(), c = () => {
    const a = fe();
    a ? window.location.href = a : t.removeUser();
  };
  return t.isLoading ? /* @__PURE__ */ m.jsx("div", { children: "Loading..." }) : t.error ? /* @__PURE__ */ m.jsxs("div", { children: [
    "Encountering error... ",
    t.error.message
  ] }) : t.isAuthenticated ? /* @__PURE__ */ m.jsxs("div", { children: [
    n ?? null,
    /* @__PURE__ */ m.jsx("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ m.jsx("button", { onClick: () => c(), children: "Sign out" }) })
  ] }) : o ? (t.signinRedirect(), null) : /* @__PURE__ */ m.jsxs("div", { children: [
    /* @__PURE__ */ m.jsx("button", { onClick: () => t.signinRedirect(), children: "Sign in" }),
    /* @__PURE__ */ m.jsx("button", { onClick: () => c(), style: { marginLeft: 8 }, children: "Sign out" })
  ] });
}
function Ee({
  authority: n,
  clientId: o,
  redirectUri: t,
  responseType: c,
  scope: a,
  onSigninCallback: s,
  children: f
}) {
  const E = le({ authority: n, clientId: o, redirectUri: t, responseType: c, scope: a }), O = () => {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  };
  return /* @__PURE__ */ m.jsx(ae, { ...E, onSigninCallback: s || O, children: f });
}
export {
  _e as Auth,
  Ee as AuthProvider,
  M as getEnvConfig,
  fe as getLogoutUrl,
  le as getOidcConfig,
  pe as useAuth
};
