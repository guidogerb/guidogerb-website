import ne from "react";
import { useAuth as oe, AuthProvider as ie } from "react-oidc-context";
import { useAuth as Re } from "react-oidc-context";
var b = { exports: {} }, v = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var $;
function ae() {
  if ($) return v;
  $ = 1;
  var n = Symbol.for("react.transitional.element"), o = Symbol.for("react.fragment");
  function t(c, a, s) {
    var d = null;
    if (s !== void 0 && (d = "" + s), a.key !== void 0 && (d = "" + a.key), "key" in a) {
      s = {};
      for (var f in a)
        f !== "key" && (s[f] = a[f]);
    } else s = a;
    return a = s.ref, {
      $$typeof: n,
      type: c,
      key: d,
      ref: a !== void 0 ? a : null,
      props: s
    };
  }
  return v.Fragment = o, v.jsx = t, v.jsxs = t, v;
}
var g = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var G;
function ce() {
  return G || (G = 1, process.env.NODE_ENV !== "production" && (function() {
    function n(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === ee ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case I:
          return "Fragment";
        case q:
          return "Profiler";
        case J:
          return "StrictMode";
        case B:
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
          case H:
            return (e.displayName || "Context") + ".Provider";
          case z:
            return (e._context.displayName || "Context") + ".Consumer";
          case X:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case Q:
            return r = e.displayName || null, r !== null ? r : n(e.type) || "Memo";
          case j:
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
      if (e === I) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === j)
        return "<...>";
      try {
        var r = n(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function a() {
      var e = A.A;
      return e === null ? null : e.getOwner();
    }
    function s() {
      return Error("react-stack-top-frame");
    }
    function d(e) {
      if (N.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function f(e, r) {
      function i() {
        U || (U = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      i.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: i,
        configurable: !0
      });
    }
    function R() {
      var e = n(this.type);
      return D[e] || (D[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function h(e, r, i, u, m, _, k, w) {
      return i = _.ref, e = {
        $$typeof: x,
        type: e,
        key: r,
        props: _,
        _owner: m
      }, (i !== void 0 ? i : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: R
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
    function C(e, r, i, u, m, _, k, w) {
      var l = r.children;
      if (l !== void 0)
        if (u)
          if (re(l)) {
            for (u = 0; u < l.length; u++)
              P(l[u]);
            Object.freeze && Object.freeze(l);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else P(l);
      if (N.call(r, "key")) {
        l = n(e);
        var p = Object.keys(r).filter(function(te) {
          return te !== "key";
        });
        u = 0 < p.length ? "{key: someKey, " + p.join(": ..., ") + ": ...}" : "{key: someKey}", V[l + u] || (p = 0 < p.length ? "{" + p.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          u,
          l,
          p,
          l
        ), V[l + u] = !0);
      }
      if (l = null, i !== void 0 && (t(i), l = "" + i), d(r) && (t(r.key), l = "" + r.key), "key" in r) {
        i = {};
        for (var y in r)
          y !== "key" && (i[y] = r[y]);
      } else i = r;
      return l && f(
        i,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), h(
        e,
        l,
        _,
        m,
        a(),
        i,
        k,
        w
      );
    }
    function P(e) {
      typeof e == "object" && e !== null && e.$$typeof === x && e._store && (e._store.validated = 1);
    }
    var O = ne, x = Symbol.for("react.transitional.element"), W = Symbol.for("react.portal"), I = Symbol.for("react.fragment"), J = Symbol.for("react.strict_mode"), q = Symbol.for("react.profiler"), z = Symbol.for("react.consumer"), H = Symbol.for("react.context"), X = Symbol.for("react.forward_ref"), B = Symbol.for("react.suspense"), Z = Symbol.for("react.suspense_list"), Q = Symbol.for("react.memo"), j = Symbol.for("react.lazy"), K = Symbol.for("react.activity"), ee = Symbol.for("react.client.reference"), A = O.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, N = Object.prototype.hasOwnProperty, re = Array.isArray, S = console.createTask ? console.createTask : function() {
      return null;
    };
    O = {
      react_stack_bottom_frame: function(e) {
        return e();
      }
    };
    var U, D = {}, Y = O.react_stack_bottom_frame.bind(
      O,
      s
    )(), L = S(c(s)), V = {};
    g.Fragment = I, g.jsx = function(e, r, i, u, m) {
      var _ = 1e4 > A.recentlyCreatedOwnerStacks++;
      return C(
        e,
        r,
        i,
        !1,
        u,
        m,
        _ ? Error("react-stack-top-frame") : Y,
        _ ? S(c(e)) : L
      );
    }, g.jsxs = function(e, r, i, u, m) {
      var _ = 1e4 > A.recentlyCreatedOwnerStacks++;
      return C(
        e,
        r,
        i,
        !0,
        u,
        m,
        _ ? Error("react-stack-top-frame") : Y,
        _ ? S(c(e)) : L
      );
    };
  })()), g;
}
var M;
function se() {
  return M || (M = 1, process.env.NODE_ENV === "production" ? b.exports = ae() : b.exports = ce()), b.exports;
}
var E = se();
const ue = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1, VITE_APP_OAUTH2_CLIENT_ID: "neurale-Bow-789393" }, T = (n, o) => {
  try {
    const t = ue?.[n];
    return t == null || t === "" ? o : t;
  } catch {
    return o;
  }
};
function F() {
  const n = T("VITE_COGNITO_AUTHORITY", void 0), o = T("VITE_COGNITO_METADATA_URL", void 0), t = T("VITE_COGNITO_CLIENT_ID", void 0), c = T("VITE_REDIRECT_URI", typeof window < "u" ? window.location.origin : void 0), a = T("VITE_RESPONSE_TYPE", "code"), s = T("VITE_COGNITO_SCOPE", "email openid phone"), d = T("VITE_COGNITO_DOMAIN", void 0), f = T("VITE_LOGOUT_URI", c);
  return {
    authority: n,
    metadataUrl: o,
    clientId: t,
    redirectUri: c,
    responseType: a,
    scope: s,
    cognitoDomain: d,
    logoutUri: f
  };
}
function _e(n = {}) {
  const o = F();
  console.log(JSON.stringify(o, null, 2));
  const t = n.authority ?? o.authority;
  let c = n.metadataUrl ?? o.metadataUrl;
  const a = n.clientId ?? o.clientId, s = n.redirectUri ?? o.redirectUri, d = n.responseType ?? o.responseType, f = n.scope ?? o.scope;
  return !c && t && (c = `${String(t).replace(/\/$/, "")}/.well-known/openid-configuration`), {
    authority: t,
    metadataUrl: c,
    client_id: a,
    redirect_uri: s,
    response_type: d,
    scope: f
  };
}
function le(n = {}) {
  const o = F(), t = n.clientId ?? o.clientId, c = n.logoutUri ?? o.logoutUri, a = n.cognitoDomain ?? o.cognitoDomain;
  return !t || !c || !a ? void 0 : `${a.replace(/\/$/, "")}/logout?client_id=${encodeURIComponent(t)}&logout_uri=${encodeURIComponent(c)}`;
}
function Ee({ children: n, autoSignIn: o = !1 }) {
  const t = oe(), c = () => {
    const a = le();
    a ? window.location.href = a : t.removeUser();
  };
  return t.isLoading ? /* @__PURE__ */ E.jsx("div", { children: "Loading..." }) : t.error ? /* @__PURE__ */ E.jsxs("div", { children: [
    "Encountering error... ",
    t.error.message,
    /* @__PURE__ */ E.jsx("div", { style: { marginTop: 8, color: "#a00" }, children: "Hint: ensure OIDC is configured. Set either VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL, and also VITE_COGNITO_CLIENT_ID, VITE_REDIRECT_URI, VITE_COGNITO_SCOPE in your app’s .env." })
  ] }) : t.isAuthenticated ? /* @__PURE__ */ E.jsxs("div", { children: [
    n ?? null,
    /* @__PURE__ */ E.jsx("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ E.jsx("button", { onClick: () => c(), children: "Sign out" }) })
  ] }) : o ? (t.signinRedirect(), null) : /* @__PURE__ */ E.jsxs("div", { children: [
    /* @__PURE__ */ E.jsx("button", { onClick: () => t.signinRedirect(), children: "Sign in" }),
    /* @__PURE__ */ E.jsx("button", { onClick: () => c(), style: { marginLeft: 8 }, children: "Sign out" })
  ] });
}
function me({
  children: n,
  authority: o,
  metadataUrl: t,
  client_id: c,
  redirect_uri: a,
  response_type: s,
  scope: d,
  post_logout_redirect_uri: f
}) {
  const R = {
    authority: void 0,
    // optional if using metadataUrl
    metadataUrl: void 0,
    // optional if using authority
    client_id: void 0,
    redirect_uri: void 0,
    on_signin_callback: void 0,
    post_logout_redirect_uri: void 0,
    scope: "openid profile email",
    response_type: "code"
  };
  console.log("AuthProvider config: ", JSON.stringify(R));
  const h = () => {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  };
  return /* @__PURE__ */ E.jsx(ie, { ...R, onSigninCallback: R.on_signin_callback || h, children: n });
}
export {
  Ee as Auth,
  me as AuthProvider,
  F as getEnvConfig,
  le as getLogoutUrl,
  _e as getOidcConfig,
  Re as useAuth
};
