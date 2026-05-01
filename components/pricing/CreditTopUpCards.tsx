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

  const accents = ["teal", "emerald", "amber"];
  const accentMap: Record<string, { border: string; bg: string; text: string; glow: string; btnBg: string }> = {
    teal:    { border: "border-teal-500/30",    bg: "bg-teal-500/8",    text: "text-teal-400",    glow: "shadow-teal-500/10",    btnBg: "bg-teal-500" },
    emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/8", text: "text-emerald-400", glow: "shadow-emerald-500/10", btnBg: "bg-emerald-500" },
    amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/8",   text: "text-amber-400",   glow: "shadow-amber-500/10",   btnBg: "bg-amber-500" },
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {creditPackages.map((pkg, i) => {
          const accent = accents[i] || "teal";
          const a = accentMap[accent];
          const perCredit = (pkg.amountInCents / pkg.credits / 100).toFixed(4);
          const isHighlighted = i === 2; // Best value = largest pack

          return (
            <div
              key={pkg.id}
              className="relative group transition-all duration-300 hover:scale-[1.03]"
            >
              {isHighlighted && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 ${a.btnBg} text-black text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg ${a.glow}`}>
                  Best Value
                </span>
              )}

              <div className={`relative overflow-hidden rounded-2xl border ${isHighlighted ? a.border : "border-white/[0.08]"} bg-[#0c0c0f] transition-all duration-300 group-hover:${a.border} group-hover:shadow-xl ${isHighlighted ? `shadow-lg ${a.glow}` : ""}`}>
                {/* Top accent bar */}
                <div className={`h-1 w-full ${a.btnBg}`} />

                <div className="p-6">
                  {/* Icon */}
                  <div className="flex justify-end mb-4">
                    <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center`}>
                      <Coins className={`w-4 h-4 ${a.text}`} />
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="mb-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{pkg.credits.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-5">Credits</p>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-white">{pkg.price}</span>
                  </div>
                  <p className="text-[11px] text-white/35 mb-5">USD {perCredit}/credit</p>

                  {/* Estimated generations */}
                  <div className="mb-5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/25 mb-2">Estimated generations</p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40">Z-Image <span className="text-white/20">1 cr</span></span>
                        <span className={`font-medium ${a.text}`}>≈ {pkg.credits.toLocaleString()} images</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40">GPT Image 2 <span className="text-white/20">4 cr</span></span>
                        <span className={`font-medium ${a.text}`}>≈ {Math.floor(pkg.credits / 4).toLocaleString()} images</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40">Nano Banana 2 <span className="text-white/20">5 cr</span></span>
                        <span className={`font-medium ${a.text}`}>≈ {Math.floor(pkg.credits / 5).toLocaleString()} images</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40">Seedance 2.0 Fast <span className="text-white/20">23 cr</span></span>
                        <span className={`font-medium ${a.text}`}>≈ {Math.floor(pkg.credits / 23).toLocaleString()} videos</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleBuyCredits(pkg.credits, pkg.amountInCents, pkg.price)}
                    className={`w-full py-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                      isHighlighted
                        ? `${a.btnBg} hover:opacity-90 text-black shadow-lg ${a.glow}`
                        : "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]"
                    }`}
                  >
                    Buy Now
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>

                  <p className="text-center text-[10px] text-white/25 mt-3">One-time · Never expires</p>
                </div>
              </div>
            </div>
          );
        })}
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
