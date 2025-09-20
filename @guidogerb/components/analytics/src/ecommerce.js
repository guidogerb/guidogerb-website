const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const pickString = (...candidates) => {
  for (const candidate of candidates) {
    if (isNonEmptyString(candidate)) {
      return candidate.trim()
    }
  }
  return undefined
}

const toFiniteNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const toPositiveInteger = (value) => {
  const parsed = toFiniteNumber(value)
  if (parsed === undefined) return undefined
  const rounded = Math.round(parsed)
  return rounded > 0 ? rounded : undefined
}

const normalizeCurrency = (value) =>
  isNonEmptyString(value) ? value.trim().toUpperCase() : undefined

const uniquePush = (collection, value) => {
  if (!isNonEmptyString(value)) return
  const normalized = value.trim()
  if (!collection.includes(normalized)) {
    collection.push(normalized)
  }
}

const collectCategories = (item) => {
  const categories = []

  if (Array.isArray(item?.categories)) {
    for (const entry of item.categories) {
      uniquePush(categories, entry)
    }
  }

  uniquePush(categories, item?.category)
  uniquePush(categories, item?.section)
  uniquePush(categories, item?.item_category)
  uniquePush(categories, item?.item_category2)
  uniquePush(categories, item?.item_category3)
  uniquePush(categories, item?.item_category4)
  uniquePush(categories, item?.item_category5)

  return categories.slice(0, 5)
}

const mergeExtraParams = (target, ...sources) => {
  for (const source of sources) {
    if (!isPlainObject(source)) continue
    for (const [key, value] of Object.entries(source)) {
      if (target[key] !== undefined) continue
      if (typeof value === 'string' || typeof value === 'number') {
        target[key] = value
      }
    }
  }
}

const getSharedString = (items, key) => {
  if (!Array.isArray(items) || items.length === 0) return undefined

  const values = items
    .map((item) => item?.[key])
    .filter((value) => isNonEmptyString(value))
    .map((value) => value.trim())

  if (values.length === 0) return undefined
  return values.every((value) => value === values[0]) ? values[0] : undefined
}

const normalizeEcommerceItem = (item, defaults = {}) => {
  if (!isPlainObject(item)) return null

  const normalized = {}

  const itemId = pickString(item.item_id, item.itemId, item.id, item.sku, item.skuId)
  const itemName = pickString(item.item_name, item.itemName, item.name, item.title, item.label)

  if (itemId) {
    normalized.item_id = itemId
  }

  if (itemName) {
    normalized.item_name = itemName
  }

  if (!normalized.item_id && !normalized.item_name) {
    return null
  }

  const brand = pickString(item.item_brand, item.brand)
  if (brand) {
    normalized.item_brand = brand
  }

  const variant = pickString(item.item_variant, item.variant, item.style)
  if (variant) {
    normalized.item_variant = variant
  }

  const categories = collectCategories(item)
  categories.forEach((category, index) => {
    const key = index === 0 ? 'item_category' : `item_category${index + 1}`
    normalized[key] = category
  })

  const listId = pickString(
    item.item_list_id,
    item.listId,
    defaults.item_list_id,
    defaults.itemListId,
  )
  if (listId) {
    normalized.item_list_id = listId
  }

  const listName = pickString(
    item.item_list_name,
    item.listName,
    defaults.item_list_name,
    defaults.itemListName,
  )
  if (listName) {
    normalized.item_list_name = listName
  }

  const affiliation = pickString(item.affiliation, defaults.affiliation)
  if (affiliation) {
    normalized.affiliation = affiliation
  }

  const coupon = pickString(item.coupon, item.item_coupon, defaults.coupon)
  if (coupon) {
    normalized.coupon = coupon
  }

  const price = toFiniteNumber(item.price ?? item.unitPrice ?? item.value)
  if (price !== undefined) {
    normalized.price = price
  }

  const quantity = toPositiveInteger(item.quantity ?? item.qty ?? defaults.quantity ?? 1)
  if (quantity !== undefined) {
    normalized.quantity = quantity
  }

  const discount = toFiniteNumber(item.discount)
  if (discount !== undefined) {
    normalized.discount = discount
  }

  const index = toPositiveInteger(item.index)
  if (index !== undefined) {
    normalized.index = index
  }

  const promotionId = pickString(item.promotion_id, item.promotionId)
  if (promotionId) {
    normalized.promotion_id = promotionId
  }

  const promotionName = pickString(item.promotion_name, item.promotionName)
  if (promotionName) {
    normalized.promotion_name = promotionName
  }

  mergeExtraParams(normalized, item.params, item.metadata, defaults.extraParams)

  return normalized
}

const normalizeItems = (input, defaults = {}) => {
  if (input == null) return []
  const collection = Array.isArray(input) ? input : [input]
  return collection.map((item) => normalizeEcommerceItem(item, defaults)).filter(Boolean)
}

const deriveEventValue = (items, explicitValue) => {
  const explicit = toFiniteNumber(explicitValue)
  if (explicit !== undefined) {
    return explicit
  }

  if (!Array.isArray(items) || items.length === 0) {
    return undefined
  }

  const total = items.reduce((sum, item) => {
    if (typeof item.price !== 'number') return sum
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1
    const line = item.price * quantity
    const discount = typeof item.discount === 'number' ? item.discount : 0
    const contribution = line - discount
    if (!Number.isFinite(contribution)) return sum
    return sum + contribution
  }, 0)

  return Number.isFinite(total) ? Number(total) : undefined
}

const cleanObject = (value) => {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined)
  return entries.length > 0 ? Object.fromEntries(entries) : {}
}

export const buildAddToCartEvent = ({
  currency,
  value,
  item,
  items,
  coupon,
  cartId,
  affiliation,
  itemListId,
  itemListName,
} = {}) => {
  const normalizedItems = normalizeItems(items ?? item, {
    coupon,
    affiliation,
    item_list_id: itemListId,
    itemListId,
    item_list_name: itemListName,
    itemListName,
  })

  return {
    name: 'add_to_cart',
    params: cleanObject({
      currency: normalizeCurrency(currency),
      value: deriveEventValue(normalizedItems, value),
      coupon: pickString(coupon, getSharedString(normalizedItems, 'coupon')),
      cart_id: pickString(cartId),
      affiliation: pickString(affiliation, getSharedString(normalizedItems, 'affiliation')),
      items: normalizedItems.length > 0 ? normalizedItems : undefined,
    }),
  }
}

export const buildPurchaseEvent = ({
  currency,
  value,
  transactionId,
  items,
  item,
  coupon,
  affiliation,
  tax,
  shipping,
  cartId,
  paymentType,
  itemListId,
  itemListName,
} = {}) => {
  const normalizedItems = normalizeItems(items ?? item, {
    coupon,
    affiliation,
    item_list_id: itemListId,
    itemListId,
    item_list_name: itemListName,
    itemListName,
  })

  return {
    name: 'purchase',
    params: cleanObject({
      currency: normalizeCurrency(currency),
      transaction_id: pickString(transactionId),
      value: deriveEventValue(normalizedItems, value),
      coupon: pickString(coupon, getSharedString(normalizedItems, 'coupon')),
      affiliation: pickString(affiliation, getSharedString(normalizedItems, 'affiliation')),
      tax: toFiniteNumber(tax),
      shipping: toFiniteNumber(shipping),
      cart_id: pickString(cartId),
      payment_type: pickString(paymentType),
      items: normalizedItems.length > 0 ? normalizedItems : undefined,
    }),
  }
}

export const buildRefundEvent = ({
  currency,
  value,
  transactionId,
  items,
  item,
  coupon,
  affiliation,
  tax,
  shipping,
  paymentType,
  partial,
} = {}) => {
  const normalizedItems = normalizeItems(items ?? item, { coupon, affiliation })

  return {
    name: 'refund',
    params: cleanObject({
      currency: normalizeCurrency(currency),
      transaction_id: pickString(transactionId),
      value: deriveEventValue(normalizedItems, value),
      coupon: pickString(coupon, getSharedString(normalizedItems, 'coupon')),
      affiliation: pickString(affiliation, getSharedString(normalizedItems, 'affiliation')),
      tax: toFiniteNumber(tax),
      shipping: toFiniteNumber(shipping),
      payment_type: pickString(paymentType),
      partial: partial === true ? true : undefined,
      items: normalizedItems.length > 0 ? normalizedItems : undefined,
    }),
  }
}

export const ecommerce = {
  buildAddToCartEvent,
  buildPurchaseEvent,
  buildRefundEvent,
}
