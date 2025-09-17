import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!

    console.log('Webhook received:', { bodyLength: body.length, hasSignature: !!signature })

    let event: any

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook event type:', event.type)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new NextResponse('Webhook signature verification failed', { status: 400 })
    }

    const session = event.data.object

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = session as any
        if (checkoutSession.mode === 'subscription') {
          await db.user.update({
            where: { stripeCustomerId: checkoutSession.customer },
            data: {
              subscriptionStatus: 'ACTIVE',
              userType: 'PAID',
            },
          })
        }
        break

      case 'invoice.payment_succeeded':
        const invoice = session as any
        if (invoice.subscription) {
          await db.user.update({
            where: { stripeSubscriptionId: invoice.subscription },
            data: {
              subscriptionStatus: 'ACTIVE',
              userType: 'PAID',
            },
          })
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = session as any
        if (failedInvoice.subscription) {
          await db.user.update({
            where: { stripeSubscriptionId: failedInvoice.subscription },
            data: {
              subscriptionStatus: 'PAST_DUE',
            },
          })
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = session as any
        await db.user.update({
          where: { stripeSubscriptionId: deletedSubscription.id },
          data: {
            subscriptionStatus: 'CANCELED',
            userType: 'FREE',
          },
        })
        break

      case 'customer.subscription.updated':
        const updatedSubscription = session as any
        const status = updatedSubscription.status === 'active' ? 'ACTIVE' : 
                      updatedSubscription.status === 'past_due' ? 'PAST_DUE' : 
                      updatedSubscription.status === 'canceled' ? 'CANCELED' : 'INACTIVE'
        
        await db.user.update({
          where: { stripeSubscriptionId: updatedSubscription.id },
          data: {
            subscriptionStatus: status,
            userType: status === 'ACTIVE' ? 'PAID' : 'FREE',
          },
        })
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Webhook error', { status: 500 })
  }
} 