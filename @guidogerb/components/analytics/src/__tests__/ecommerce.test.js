import { describe, expect, it } from 'vitest'

import { buildAddToCartEvent, buildPurchaseEvent, buildRefundEvent } from '../ecommerce.js'

describe('ecommerce event presets', () => {
  it('builds add_to_cart payloads with derived totals and metadata', () => {
    const event = buildAddToCartEvent({
      currency: 'usd',
      item: {
        id: 'sku-hoodie',
        name: 'Guidogerb Hoodie',
        price: '49.99',
        quantity: 2,
        brand: 'Guidogerb',
        categories: ['Apparel', 'Outerwear', 'Limited Edition'],
        coupon: 'WELCOME10',
      },
    })

    expect(event.name).toBe('add_to_cart')
    expect(event.params.currency).toBe('USD')
    expect(event.params.coupon).toBe('WELCOME10')
    expect(event.params.items).toHaveLength(1)
    expect(event.params.items[0]).toMatchObject({
      item_id: 'sku-hoodie',
      item_name: 'Guidogerb Hoodie',
      item_brand: 'Guidogerb',
      item_category: 'Apparel',
      item_category2: 'Outerwear',
      item_category3: 'Limited Edition',
      price: 49.99,
      quantity: 2,
      coupon: 'WELCOME10',
    })
    expect(event.params.value).toBeCloseTo(99.98, 2)
  })

  it('respects explicit totals and optional metadata for purchase events', () => {
    const event = buildPurchaseEvent({
      currency: 'USD',
      transactionId: 'order-123',
      value: 132.5,
      tax: '5.5',
      shipping: 12,
      coupon: 'SUMMER',
      affiliation: 'Guidogerb Store',
      cartId: 'cart-77',
      paymentType: 'card',
      items: [
        { item_id: 'sku-vinyl', item_name: 'Vinyl Bundle', price: 89.99, quantity: 1 },
        {
          id: 'sku-poster',
          name: 'Tour Poster',
          item_category: 'Merch',
          price: '14.25',
          quantity: 3,
          params: { color: 'navy' },
        },
      ],
    })

    expect(event).toMatchObject({
      name: 'purchase',
      params: {
        currency: 'USD',
        transaction_id: 'order-123',
        value: 132.5,
        tax: 5.5,
        shipping: 12,
        coupon: 'SUMMER',
        affiliation: 'Guidogerb Store',
        cart_id: 'cart-77',
        payment_type: 'card',
      },
    })
    expect(event.params.items).toHaveLength(2)
    expect(event.params.items[1]).toMatchObject({
      item_id: 'sku-poster',
      item_name: 'Tour Poster',
      item_category: 'Merch',
      price: 14.25,
      quantity: 3,
      color: 'navy',
    })
  })

  it('derives totals for refund events and marks partial refunds', () => {
    const event = buildRefundEvent({
      currency: 'cad',
      transactionId: 'order-9',
      partial: true,
      items: [
        { item_id: 'sku-lessons', item_name: 'Lesson Credits', price: 25, quantity: 1 },
        {
          item_id: 'sku-workshop',
          item_name: 'Workshop Pass',
          price: 40,
          quantity: 1,
          discount: 10,
        },
      ],
    })

    expect(event).toMatchObject({
      name: 'refund',
      params: {
        currency: 'CAD',
        transaction_id: 'order-9',
        value: 55,
        partial: true,
      },
    })
    expect(event.params.items).toHaveLength(2)
  })
})
