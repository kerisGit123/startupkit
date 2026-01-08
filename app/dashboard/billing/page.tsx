"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Calendar, ShoppingCart, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function BillingPage() {
  const { user } = useUser();
  const { companyId } = useCompany();
  const { plan, entitlements, isLoading } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const creditsBalance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip"
  );

  const purchaseHistory = useQuery(
    api.credits.getPurchaseHistory,
    companyId ? { companyId } : "skip"
  );

  const subscription = useQuery(
    api.subscriptions.getSubscription,
    companyId ? { companyId } : "skip"
  );

  const subscriptionHistory = useQuery(
    api.subscriptions.getSubscriptionHistory,
    companyId ? { companyId } : "skip"
  );

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) {
      alert("No active subscription to cancel");
      return;
    }

    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period.")) {
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Subscription canceled successfully. You'll have access until the end of your billing period.");
        window.location.reload();
      } else {
        alert(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsCanceling(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-900">Please sign in to access billing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Billing & Subscription</h1>

        {/* Current Subscription */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Current Subscription</h2>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition"
            >
              Change Plan
            </Link>
          </div>

          {isLoading ? (
            <p className="text-gray-500">Loading subscription...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Plan</p>
                <p className="text-xl font-bold capitalize text-gray-900">{plan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Scans per Month</p>
                <p className="text-xl font-bold text-gray-900">
                  {entitlements?.scansPerMonth === -1 ? "Unlimited" : entitlements?.scansPerMonth || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Storage</p>
                <p className="text-xl font-bold text-gray-900">
                  {entitlements?.storageMB === -1 ? "Unlimited" : `${entitlements?.storageMB || 0} MB`}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            {subscription?.cancelAtPeriodEnd && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800">⚠️ Subscription Canceling</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your subscription will end on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB') : 'N/A'}. You&apos;ll be downgraded to the Free plan.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Next billing date</p>
                <p className="font-medium text-gray-900">
                  {subscription?.currentPeriodEnd 
                    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB')
                    : "N/A - Configure Stripe for billing"}
                </p>
              </div>
              {plan !== "free" && subscription?.stripeSubscriptionId && !subscription?.cancelAtPeriodEnd && (
                <button 
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  {isCanceling ? "Canceling..." : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Credits Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Credits</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600 mb-1">Available Credits</p>
              <p className="text-4xl font-bold text-gray-900">{creditsBalance ?? 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Credits Used (This Month)</p>
              <p className="text-4xl font-bold text-gray-900">0</p>
            </div>
          </div>

          {/* Buy Credits Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Buy Credits</h3>
            <p className="text-sm text-gray-600 mb-4">One-time credit purchases for additional scans</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold mb-1 text-gray-900">100 Credits</h4>
                <p className="text-2xl font-bold mb-3 text-gray-900">MYR 10.00</p>
                <button
                  onClick={() => {/* Add Stripe checkout */}}
                  className="w-full py-2 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition"
                >
                  Buy Now
                </button>
              </div>
              <div className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50">
                <div className="bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
                  Best Value
                </div>
                <h4 className="text-lg font-semibold mb-1 text-gray-900">500 Credits</h4>
                <p className="text-2xl font-bold mb-3 text-gray-900">MYR 40.00</p>
                <button
                  onClick={() => {/* Add Stripe checkout */}}
                  className="w-full py-2 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition"
                >
                  Buy Now
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold mb-1 text-gray-900">1000 Credits</h4>
                <p className="text-2xl font-bold mb-3 text-gray-900">MYR 70.00</p>
                <button
                  onClick={() => {/* Add Stripe checkout */}}
                  className="w-full py-2 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Payment Method</h2>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition">
              Add Payment Method
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div className="p-3 bg-gray-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">No payment method added</p>
              <p className="text-sm text-gray-500">Add a payment method to enable automatic billing</p>
            </div>
          </div>
        </div>

        {/* Subscription History */}
        {subscription && plan !== "free" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Subscription History</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{subscription.plan} Plan</p>
                    <p className="text-sm text-gray-500">
                      Status: <span className="font-semibold capitalize">{subscription.status || "active"}</span>
                    </p>
                    {subscription.currentPeriodEnd && (
                      <p className="text-xs text-gray-400 mt-1">
                        {subscription.cancelAtPeriodEnd 
                          ? `Cancels on: ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB')}`
                          : `Renews on: ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB')}`
                        }
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {subscription.stripeSubscriptionId && (
                    <a
                      href={`https://dashboard.stripe.com/test/subscriptions/${subscription.stripeSubscriptionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                    >
                      View in Stripe <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* View Full History Button */}
              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                {showFullHistory ? "Hide Full History" : "View Full History"}
              </button>
              
              {/* Full History Timeline */}
              {showFullHistory && subscriptionHistory && subscriptionHistory.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Complete History</h3>
                  {subscriptionHistory.map((event) => (
                    <div key={event._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1.5 bg-gray-200 rounded">
                        <Calendar className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {event.action === "checkout_completed" && "Subscription Created"}
                            {event.action === "created" && "Subscription Activated"}
                            {event.action === "updated" && "Subscription Updated"}
                            {event.action === "canceled" && "Subscription Canceled"}
                            {event.action === "deleted" && "Subscription Ended"}
                            {!["checkout_completed", "created", "updated", "canceled", "deleted"].includes(event.action) && event.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.createdAt).toLocaleDateString('en-GB')} at {new Date(event.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {event.plan && (
                          <p className="text-xs text-gray-600 mt-0.5 capitalize">
                            Plan: {event.plan}
                          </p>
                        )}
                        {event.status && (
                          <p className="text-xs text-gray-600 capitalize">
                            Status: {event.status}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Credit Purchase History</h2>

          <div className="space-y-3">
            {purchaseHistory && purchaseHistory.length > 0 ? (
              purchaseHistory.map((purchase) => (
                <div key={purchase._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{purchase.tokens} Credits Purchased</p>
                      {purchase.amountPaid && purchase.currency && (
                        <p className="text-sm font-semibold text-yellow-600">
                          {purchase.currency.toUpperCase()} {(purchase.amountPaid / 100).toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString('en-GB')} at {new Date(purchase.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {purchase.stripeCheckoutSessionId && (
                        <p className="text-xs text-gray-400 mt-1">Transaction ID: {purchase.stripeCheckoutSessionId}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">+{purchase.tokens}</p>
                      <p className="text-xs text-gray-500">Credits</p>
                    </div>
                    {purchase.stripeCheckoutSessionId && (
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${purchase.stripePaymentIntentId || purchase.stripeCheckoutSessionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                      >
                        View Invoice <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">No purchases yet</p>
                    <p className="text-sm text-gray-500">Your purchase history will appear here</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
