"use client";

import { useState } from "react";
import {
  Coins, ArrowUpRight, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { getCreditPackages } from "@/lib/credit-pricing";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreditTopUpCards() {
  const { userId } = useAuth();
  const creditPackages = getCreditPackages();

  const [pendingPurchase, setPendingPurchase] = useState<{
    tokens: number; amount: number; price: string;
  } | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const handleBuyCredits = (tokens: number, amount: number, price: string) => {
    if (!userId) return;
    setAgreedToTerms(false);
    setPendingPurchase({ tokens, amount, price });
  };

  const confirmPurchase = async () => {
    if (!pendingPurchase || !userId || !agreedToTerms) return;
    setPurchaseLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          tokens: pendingPurchase.tokens,
          amount: pendingPurchase.amount,
          companyId: userId,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
        setPurchaseLoading(false);
      }
    } catch {
      alert("An error occurred. Please try again.");
      setPurchaseLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative group transition-all duration-300 hover:transform hover:scale-105 ${
              pkg.highlighted ? "transform scale-105" : ""
            }`}
          >
            {pkg.highlighted && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-3xl blur-xl" />
            )}

            <div className={`relative bg-gradient-to-br from-[#1a1a1a] to-[#111] border rounded-3xl p-8 transition-all duration-300 ${
              pkg.highlighted
                ? "border-emerald-500/50 shadow-2xl"
                : "border-[#2a2a2a] hover:border-purple-500/50 hover:shadow-xl"
            }`}>
              {pkg.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg">
                  {pkg.badge}
                </span>
              )}

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-2">{pkg.credits.toLocaleString()}</p>
                <p className="text-gray-400 uppercase tracking-wider text-sm mb-4">Credits</p>
                <p className="text-4xl font-bold text-white mb-2">{pkg.price}</p>
                <p className="text-emerald-400 text-sm">
                  USD {(pkg.amountInCents / pkg.credits / 100).toFixed(4)}/credit
                </p>
              </div>

              <button
                onClick={() => handleBuyCredits(pkg.credits, pkg.amountInCents, pkg.price)}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                  pkg.highlighted
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  Buy Now
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Credit purchase confirmation dialog */}
      <Dialog
        open={!!pendingPurchase}
        onOpenChange={(open) => {
          if (!open && !purchaseLoading) {
            setPendingPurchase(null);
            setAgreedToTerms(false);
          }
        }}
      >
        <DialogContent className="max-w-lg !bg-[#111] text-white border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm credit purchase</DialogTitle>
            <DialogDescription className="text-gray-400">
              Review the terms below before continuing to payment.
            </DialogDescription>
          </DialogHeader>

          {pendingPurchase && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{pendingPurchase.tokens.toLocaleString()} credits</div>
                    <div className="text-sm text-gray-400">One-time purchase</div>
                  </div>
                  <div className="text-2xl font-bold">{pendingPurchase.price}</div>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <span>Credits are added to your <strong className="text-white">personal workspace</strong> immediately on payment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <span>Credits <strong className="text-white">never expire</strong> and are not affected by subscription changes.</span>
                </li>
                <li className="flex items-start gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span><strong>Final sale:</strong> credit top-up purchases are non-refundable and cannot be cancelled once payment completes.</span>
                </li>
                <li className="flex items-start gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Credits cannot be converted back to cash, transferred between users, or sold.</span>
                </li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3 hover:bg-[#161616] transition-colors">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-300">
                  I understand that this purchase is <strong className="text-white">final</strong> and cannot be refunded or cancelled. I agree to the{" "}
                  <a href="/billing-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">billing policy</a>.
                </span>
              </label>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => { setPendingPurchase(null); setAgreedToTerms(false); }}
              disabled={purchaseLoading}
              className="px-4 py-2 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmPurchase}
              disabled={!agreedToTerms || purchaseLoading}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {purchaseLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
