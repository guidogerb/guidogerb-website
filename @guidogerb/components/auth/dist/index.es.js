import { useAuth as re, AuthProvider as te } from "react-oidc-context";
import { useAuth as _e } from "react-oidc-context";
import ne, { useRef as oe, useEffect as ae } from "react";
var p = { exports: {} }, T = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var D;
function ie() {
  if (D) return T;
  D = 1;
  var s = Symbol.for("react.transitional.element"), u = Symbol.for("react.fragment");
  function n(d, i, c) {
    var _ = null;
    if (c !== void 0 && (_ = "" + c), i.key !== void 0 && (_ = "" + i.key), "key" in i) {
      c = {};
      for (var R in i)
        R !== "key" && (c[R] = i[R]);
    } else c = i;
    return i = c.ref, {
      $$typeof: s,
      type: d,
      key: _,
      ref: i !== void 0 ? i : null,
      props: c
    };
  }
  return T.Fragment = u, T.jsx = n, T.jsxs = n, T;
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
var $;
function se() {
  return $ || ($ = 1, process.env.NODE_ENV !== "production" && (function() {
    function s(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === Q ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case h:
          return "Fragment";
        case G:
          return "Profiler";
        case W:
          return "StrictMode";
        case X:
          return "Suspense";
        case H:
          return "SuspenseList";
        case Z:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case V:
            return "Portal";
          case q:
            return (e.displayName || "Context") + ".Provider";
          case J:
            return (e._context.displayName || "Context") + ".Consumer";
          case z:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case B:
            return r = e.displayName || null, r !== null ? r : s(e.type) || "Memo";
          case w:
            r = e._payload, e = e._init;
            try {
              return s(e(r));
            } catch {
            }
        }
      return null;
    }
    function u(e) {
      return "" + e;
    }
    function n(e) {
      try {
        u(e);
        var r = !1;
      } catch {
        r = !0;
      }
      if (r) {
        r = console;
        var t = r.error, o = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return t.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          o
        ), u(e);
      }
    }
    function d(e) {
      if (e === h) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === w)
        return "<...>";
      try {
        var r = s(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function i() {
      var e = g.A;
      return e === null ? null : e.getOwner();
    }
    function c() {
      return Error("react-stack-top-frame");
    }
    function _(e) {
      if (y.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function R(e, r) {
      function t() {
        C || (C = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      t.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: t,
        configurable: !0
      });
    }
    function F() {
      var e = s(this.type);
      return N[e] || (N[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function M(e, r, t, o, m, l, A, k) {
      return t = l.ref, e = {
        $$typeof: P,
        type: e,
        key: r,
        props: l,
        _owner: m
      }, (t !== void 0 ? t : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: F
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
        value: A
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: k
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function x(e, r, t, o, m, l, A, k) {
      var a = r.children;
      if (a !== void 0)
        if (o)
          if (K(a)) {
            for (o = 0; o < a.length; o++)
              j(a[o]);
            Object.freeze && Object.freeze(a);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else j(a);
      if (y.call(r, "key")) {
        a = s(e);
        var E = Object.keys(r).filter(function(ee) {
          return ee !== "key";
        });
        o = 0 < E.length ? "{key: someKey, " + E.join(": ..., ") + ": ...}" : "{key: someKey}", L[a + o] || (E = 0 < E.length ? "{" + E.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          o,
          a,
          E,
          a
        ), L[a + o] = !0);
      }
      if (a = null, t !== void 0 && (n(t), a = "" + t), _(r) && (n(r.key), a = "" + r.key), "key" in r) {
        t = {};
        for (var S in r)
          S !== "key" && (t[S] = r[S]);
      } else t = r;
      return a && R(
        t,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), M(
        e,
        a,
        l,
        m,
        i(),
        t,
        A,
        k
      );
    }
    function j(e) {
      typeof e == "object" && e !== null && e.$$typeof === P && e._store && (e._store.validated = 1);
    }
    var b = ne, P = Symbol.for("react.transitional.element"), V = Symbol.for("react.portal"), h = Symbol.for("react.fragment"), W = Symbol.for("react.strict_mode"), G = Symbol.for("react.profiler"), J = Symbol.for("react.consumer"), q = Symbol.for("react.context"), z = Symbol.for("react.forward_ref"), X = Symbol.for("react.suspense"), H = Symbol.for("react.suspense_list"), B = Symbol.for("react.memo"), w = Symbol.for("react.lazy"), Z = Symbol.for("react.activity"), Q = Symbol.for("react.client.reference"), g = b.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, y = Object.prototype.hasOwnProperty, K = Array.isArray, O = console.createTask ? console.createTask : function() {
      return null;
    };
    b = {
      react_stack_bottom_frame: function(e) {
        return e();
      }
    };
    var C, N = {}, I = b.react_stack_bottom_frame.bind(
      b,
      c
    )(), Y = O(d(c)), L = {};
    v.Fragment = h, v.jsx = function(e, r, t, o, m) {
      var l = 1e4 > g.recentlyCreatedOwnerStacks++;
      return x(
        e,
        r,
        t,
        !1,
        o,
        m,
        l ? Error("react-stack-top-frame") : I,
        l ? O(d(e)) : Y
      );
    }, v.jsxs = function(e, r, t, o, m) {
      var l = 1e4 > g.recentlyCreatedOwnerStacks++;
      return x(
        e,
        r,
        t,
        !0,
        o,
        m,
        l ? Error("react-stack-top-frame") : I,
        l ? O(d(e)) : Y
      );
    };
  })()), v;
}
var U;
function ue() {
  return U || (U = 1, process.env.NODE_ENV === "production" ? p.exports = ie() : p.exports = se()), p.exports;
}
var f = ue();
function fe({ children: s, autoSignIn: u = !1 }) {
  const n = re(), d = oe(!1);
  ae(() => {
    u && !n.isAuthenticated && !n.isLoading && !d.current && (d.current = !0, n.signinRedirect());
  }, [u, n.isAuthenticated, n.isLoading, n]);
  const i = () => {
    n.removeUser();
  };
  return n.isLoading ? /* @__PURE__ */ f.jsx("div", { children: "Loading..." }) : n.error ? /* @__PURE__ */ f.jsxs("div", { children: [
    "Encountering error... ",
    n.error.message,
    /* @__PURE__ */ f.jsx("div", { style: { marginTop: 8, color: "#a00" }, children: "Hint: ensure OIDC is configured. Set either VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL, and also VITE_COGNITO_CLIENT_ID, VITE_REDIRECT_URI, VITE_COGNITO_SCOPE in your app’s .env." })
  ] }) : n.isAuthenticated ? /* @__PURE__ */ f.jsxs("div", { children: [
    s ?? null,
    /* @__PURE__ */ f.jsx("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ f.jsx("button", { onClick: () => i(), children: "Sign out" }) })
  ] }) : u ? null : /* @__PURE__ */ f.jsxs("div", { children: [
    /* @__PURE__ */ f.jsx("button", { onClick: () => n.signinRedirect(), children: "Sign in" }),
    /* @__PURE__ */ f.jsx("button", { onClick: () => i(), style: { marginLeft: 8 }, children: "Sign out" })
  ] });
}
function de({ children: s }) {
  const u = {
    authority: void 0,
    metadataUrl: void 0,
    client_id: void 0,
    redirect_uri: void 0,
    post_logout_redirect_uri: void 0,
    scope: "openid profile email",
    response_type: "code"
  };
  console.log("AuthProvider config: ", JSON.stringify(config));
  const n = () => {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  };
  return /* @__PURE__ */ f.jsx(te, { ...u, onSigninCallback: n, children: s });
}
export {
  fe as Auth,
  de as AuthProvider,
  _e as useAuth
};
