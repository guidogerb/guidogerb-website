import AnalyticsRouterBridgeDefault, {
  AnalyticsRouterBridge as AnalyticsRouterBridgeNamed,
  useAnalyticsPageViews,
} from './AnalyticsRouterBridge.jsx'

export { default as Analytics } from './Analytics.jsx'
export { AnalyticsContext, useAnalytics } from './Analytics.jsx'
export {
  buildAddToCartEvent,
  buildPurchaseEvent,
  buildRefundEvent,
  ecommerce,
} from './ecommerce.js'

const AnalyticsRouterBridge = AnalyticsRouterBridgeNamed ?? AnalyticsRouterBridgeDefault

export { AnalyticsRouterBridge, useAnalyticsPageViews }
export { AnalyticsRouterBridgeDefault as AnalyticsRouterBridgeComponent }
