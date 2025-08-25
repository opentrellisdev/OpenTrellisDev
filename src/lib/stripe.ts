import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  throw new Error('STRIPE_PUBLISHABLE_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY

// Monthly subscription price ID - you'll need to create this in your Stripe dashboard
export const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1OqX2X2X2X2X2X2X2X2X2X2X'

export const createStripeCustomer = async (email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'opentrellis',
    },
  })
}

export const createSubscription = async (customerId: string) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: MONTHLY_PRICE_ID }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
}

export const cancelSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId)
} 