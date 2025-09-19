export { PointOfSale } from './src/PointOfSale.jsx'
export { PointOfSale as default } from './src/PointOfSale.jsx'

export { ProductList } from './src/ProductList.jsx'
export { ProductCard } from './src/ProductCard.jsx'
export { InvoiceView } from './src/InvoiceView.jsx'
export { OrderHistory } from './src/OrderHistory.jsx'
export { UserProfile } from './src/UserProfile.jsx'

export { UserProvider, useUser } from './src/context/UserContext.jsx'

export { createPOSApi } from './src/services/api.js'
export {
  loadStripeInstance,
  confirmStripePayment,
  createDefaultPaymentParams,
} from './src/services/stripe.js'

export { POSPage } from './src/pages/POSPage.jsx'
export { InvoicePage } from './src/pages/InvoicePage.jsx'
export { HistoryPage } from './src/pages/HistoryPage.jsx'

export {
  CartProvider,
  CheckoutForm,
  ShoppingCart,
  ShoppingCart as Cart,
  useCart,
} from '@guidogerb/components-shopping-cart'
