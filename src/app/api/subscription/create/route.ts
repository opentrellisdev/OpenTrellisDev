import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe, createStripeCustomer } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

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

    // Get the base URL for success/cancel URLs
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://open-trellis-dev.vercel.app'
      : 'http://localhost:3000'

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/settings?success=true`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 })
  }
} 