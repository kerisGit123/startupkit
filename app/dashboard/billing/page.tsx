"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Calendar, ShoppingCart, ExternalLink, Gift } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function BillingPage() {
  const { user } = useUser();
  const { companyId } = useCompany();
  const { plan, entitlements, isLoading } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const handleBuyCredits = async (tokens: number, amount: number) => {
    if (!user || !companyId) {
      alert("Please sign in to buy credits");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          tokens,
          amount,
          companyId,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Manage your plan, credits, and payment methods</p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
          >
            Change Plan
          </Link>
        </div>

        {/* Current Subscription */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Current Subscription</h2>
          </div>

          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 mb-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Plan</p>
                <p className="text-xl font-bold capitalize text-gray-900">{plan}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Scans / Month</p>
                <p className="text-xl font-bold text-gray-900">
                  {entitlements?.scansPerMonth === -1 ? "Unlimited" : entitlements?.scansPerMonth || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Storage</p>
                <p className="text-xl font-bold text-gray-900">
                  {entitlements?.storageMB === -1 ? "Unlimited" : `${entitlements?.storageMB || 0} MB`}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            {subscription?.cancelAtPeriodEnd && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-semibold text-amber-800">Subscription Canceling</p>
                <p className="text-xs text-amber-700 mt-1">
                  Your subscription will end on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB') : 'N/A'}. You&apos;ll be downgraded to the Free plan.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Next billing date</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {subscription?.currentPeriodEnd 
                    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB')
                    : "N/A - Configure Stripe for billing"}
                </p>
              </div>
              {plan !== "free" && subscription?.stripeSubscriptionId && !subscription?.cancelAtPeriodEnd && (
                <button 
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50 transition-colors"
                >
                  {isCanceling ? "Canceling..." : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Credits Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Credits</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-violet-50 rounded-xl p-5 border border-violet-100">
              <p className="text-xs text-violet-600 font-medium mb-1 uppercase tracking-wider">Available</p>
              <p className="text-4xl font-bold text-gray-900">{creditsBalance ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Used This Month</p>
              <p className="text-4xl font-bold text-gray-900">0</p>
            </div>
          </div>

          {/* Buy Credits Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold mb-1 text-gray-900">Buy Credits</h3>
            <p className="text-sm text-gray-500 mb-4">One-time credit purchases for additional scans</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-100 rounded-lg p-5 bg-white">
                <p className="text-lg font-bold text-gray-900 mb-0.5">100 Credits</p>
                <p className="text-2xl font-bold text-gray-900 mb-4">MYR 10<span className="text-sm font-normal text-gray-400">.00</span></p>
                <button
                  onClick={() => handleBuyCredits(100, 1000)}
                  className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
                >
                  Buy Now
                </button>
              </div>
              <div className="border-2 border-emerald-400 rounded-lg p-5 bg-emerald-50/50 relative">
                <span className="absolute -top-2.5 left-4 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Best Value
                </span>
                <p className="text-lg font-bold text-gray-900 mb-0.5 mt-1">500 Credits</p>
                <p className="text-2xl font-bold text-gray-900 mb-4">MYR 40<span className="text-sm font-normal text-gray-400">.00</span></p>
                <button
                  onClick={() => handleBuyCredits(500, 4000)}
                  className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
                >
                  Buy Now
                </button>
              </div>
              <div className="border border-gray-100 rounded-lg p-5 bg-white">
                <p className="text-lg font-bold text-gray-900 mb-0.5">1000 Credits</p>
                <p className="text-2xl font-bold text-gray-900 mb-4">MYR 70<span className="text-sm font-normal text-gray-400">.00</span></p>
                <button
                  onClick={() => handleBuyCredits(1000, 7000)}
                  className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Payment Method</h2>
            <button className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-all text-[12px] border border-gray-200">
              Add Method
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
            <div className="p-3 bg-white rounded-xl border border-gray-100">
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">No payment method added</p>
              <p className="text-xs text-gray-400">Add a payment method to enable automatic billing</p>
            </div>
          </div>
        </div>

        {/* Subscription History */}
        {subscription && plan !== "free" && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Subscription History</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl border border-gray-100">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize text-sm">{subscription.plan} Plan</p>
                    <p className="text-xs text-gray-500">
                      Status: <span className="font-semibold capitalize">{subscription.status || "active"}</span>
                    </p>
                    {subscription.currentPeriodEnd && (
                      <p className="text-xs text-gray-400 mt-0.5">
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
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                    >
                      View in Stripe <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                {showFullHistory ? "Hide Full History" : "View Full History"}
              </button>
              
              {showFullHistory && subscriptionHistory && subscriptionHistory.length > 0 && (
                <div className="space-y-2">
                  {subscriptionHistory.map((event) => (
                    <div key={event._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-1.5 bg-white rounded-lg border border-gray-100">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium capitalize ${
                            event.action === "canceled" || event.action === "deleted" 
                              ? "text-red-600" 
                              : "text-gray-900"
                          }`}>
                            {event.action === "checkout_completed" && "Subscription Created"}
                            {event.action === "created" && "Subscription Activated"}
                            {event.action === "updated" && "Subscription Updated"}
                            {event.action === "canceled" && "Subscription Canceled"}
                            {event.action === "deleted" && "Subscription Ended"}
                            {!["checkout_completed", "created", "updated", "canceled", "deleted"].includes(event.action) && event.action}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        {event.plan && (
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">Plan: {event.plan}</p>
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
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Credit Purchase History</h2>
          </div>

          <div className="space-y-3">
            {purchaseHistory && purchaseHistory.length > 0 ? (
              purchaseHistory.map((purchase) => {
                const isReferralBonus = purchase.reason?.includes("referral") || purchase.reason?.includes("Welcome bonus");
                const isReferralReward = purchase.reason?.includes("Referral reward");
                const isReferral = isReferralBonus || isReferralReward;
                
                return (
                  <div key={purchase._id} className={`flex items-center justify-between p-4 border rounded-xl ${
                    isReferral ? 'border-violet-100 bg-violet-50/50' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${isReferral ? 'bg-violet-100' : 'bg-white border border-gray-100'}`}>
                        {isReferral ? (
                          <Gift className="w-5 h-5 text-violet-600" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {isReferralBonus ? `${purchase.tokens} Referral Bonus Credits` :
                           isReferralReward ? `${purchase.tokens} Referral Reward Credits` :
                           `${purchase.tokens} Credits Purchased`}
                        </p>
                        {purchase.reason && (
                          <p className="text-xs text-violet-600 font-medium">{purchase.reason}</p>
                        )}
                        {purchase.amountPaid && purchase.currency && (
                          <p className="text-xs font-semibold text-emerald-600">
                            {purchase.currency.toUpperCase()} {(purchase.amountPaid / 100).toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(purchase.createdAt).toLocaleDateString('en-GB')} at {new Date(purchase.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={`font-bold text-sm ${isReferral ? 'text-violet-600' : 'text-gray-900'}`}>
                        +{purchase.tokens}
                      </p>
                      <p className="text-xs text-gray-400">credits</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-3 bg-gray-100 rounded-xl inline-block mb-3">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No purchases yet</p>
                <p className="text-xs text-gray-400 mt-1">Your purchase history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
