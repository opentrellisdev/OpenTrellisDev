import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe, createStripeCustomer, createSubscription } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { paymentMethod } = body

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        mentorExemptionActive: true,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // If user is already a mentor, they don't need to pay
    if (user.userType === 'MENTOR') {
      return new NextResponse('Mentors do not need to pay for subscriptions', { status: 400 })
    }

    // If user already has an active subscription, return error
    if (user.subscriptionStatus === 'ACTIVE' && user.stripeSubscriptionId) {
      return new NextResponse('User already has an active subscription', { status: 400 })
    }

    let customerId = user.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createStripeCustomer(user.email!, user.name || undefined)
      customerId = customer.id

      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_MONTHLY_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    // Update user with subscription details
    await db.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'ACTIVE',
        userType: 'PAID',
      },
    })

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 })
  }
} 