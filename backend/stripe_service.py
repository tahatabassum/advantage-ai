import stripe
import os
from sqlalchemy.orm import Session
import models
import datetime

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
stripe.api_key = STRIPE_SECRET_KEY

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

PRICE_IDS = {
    "pro": os.getenv("STRIPE_PRO_PRICE_ID"),
    "agency": os.getenv("STRIPE_AGENCY_PRICE_ID")
}

def create_checkout_session(user: models.User, tier: str, success_url: str, cancel_url: str):
    if not STRIPE_SECRET_KEY:
        print("Stripe not configured")
        return None

    price_id = PRICE_IDS.get(tier)
    if not price_id:
        return None

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email,
            client_reference_id=str(user.id),
            metadata={
                "tier": tier,
                "user_id": str(user.id)
            }
        )
        return session.url
    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return None

def handle_webhook(payload, sig_header, db: Session):
    if not STRIPE_WEBHOOK_SECRET:
        print("Stripe webhook secret not configured")
        return None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        print(f"Invalid payload: {e}")
        return None
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"Invalid signature: {e}")
        return None

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        tier = session.get('metadata', {}).get('tier')
        
        if user_id and tier:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            if user:
                user.subscription_tier = tier
                # Set reset date for the first time if not set
                if not user.subscription_reset_date:
                    user.subscription_reset_date = datetime.datetime.utcnow() + datetime.timedelta(days=30)
                db.commit()
                print(f"User {user_id} upgraded to {tier}")

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        # Find user by customer ID or other means
        # For simplicity in this demo, you might need to store customer_id in user model
        # But for now, we'll assume we can't easily map it back without customer_id
        pass

    elif event['type'] == 'invoice.payment_failed':
        print("Payment failed for customer")

    return True

def create_portal_session(customer_id: str, return_url: str):
    if not STRIPE_SECRET_KEY or not customer_id:
        return None
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session.url
    except Exception as e:
        print(f"Error creating portal session: {e}")
        return None
