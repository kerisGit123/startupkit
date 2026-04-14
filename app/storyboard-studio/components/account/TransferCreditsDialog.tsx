"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  Building2,
} from "lucide-react";

/**
 * TransferCreditsDialog
 *
 * Move credits between the user's own workspaces:
 *   - Personal workspace (always present, companyId === user.id)
 *   - Organizations where the user has admin role (they created them)
 *
 * Backend enforces ownership + rate limiting; this dialog is pure UX.
 * Styling follows the LTX dark theme (plan_ui_components.md).
 */
type Workspace = {
  id: string;
  name: string;
  kind: "personal" | "org";
};

export function TransferCreditsDialog({
  trigger,
  defaultFromCompanyId,
}: {
  trigger?: React.ReactNode;
  defaultFromCompanyId?: string;
}) {
  // Use Convex data instead of Clerk's useOrganizationList (which has
  // cache/timing issues and often returns 0 memberships). Our
  // credits_balance table reliably tracks all owned workspaces.
  const ownedWorkspaces = useQuery(api.credits.listOwnedWorkspaces, {});

  const [open, setOpen] = useState(false);
  const [fromCompanyId, setFromCompanyId] = useState<string>("");
  const [toCompanyId, setToCompanyId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const transferCredits = useMutation(api.credits.transferCredits);

  // Build workspace list from Convex query (reliable, no Clerk cache issues)
  const workspaces: Workspace[] = (ownedWorkspaces ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    kind: w.kind,
  }));

  // Default "from" pick when the dialog opens
  useEffect(() => {
    if (!open) return;
    if (defaultFromCompanyId && workspaces.some((w) => w.id === defaultFromCompanyId)) {
      setFromCompanyId(defaultFromCompanyId);
    } else if (workspaces[0] && !fromCompanyId) {
      setFromCompanyId(workspaces[0].id);
    }
  }, [open, defaultFromCompanyId, workspaces, fromCompanyId]);

  // Reset state each time the dialog closes
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(null);
      setAmount("");
    }
  }, [open]);

  // Live balances
  const fromBalance = useQuery(
    api.credits.getBalance,
    fromCompanyId ? { companyId: fromCompanyId } : "skip",
  );
  const toBalance = useQuery(
    api.credits.getBalance,
    toCompanyId ? { companyId: toCompanyId } : "skip",
  );

  const parsedAmount = Number(amount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const hasEnoughCredits =
    fromBalance !== undefined && amountValid && parsedAmount <= fromBalance;
  const differentWorkspaces =
    fromCompanyId && toCompanyId && fromCompanyId !== toCompanyId;

  const canSubmit =
    !submitting &&
    !!fromCompanyId &&
    !!toCompanyId &&
    differentWorkspaces &&
    amountValid &&
    hasEnoughCredits;

  async function handleTransfer() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await transferCredits({
        fromCompanyId,
        toCompanyId,
        tokens: Math.floor(parsedAmount),
        reason: "user_transfer",
      });
      setSuccess(
        `Transferred ${Math.floor(parsedAmount).toLocaleString()} credits. New balances — From: ${result.fromBalance.toLocaleString()}, To: ${result.toBalance.toLocaleString()}.`,
      );
      setAmount("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transfer failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const notEnoughWorkspaces = workspaces.length < 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-(--text-primary) bg-(--bg-tertiary) hover:bg-(--border-secondary) border border-(--border-primary) transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            Transfer Credits
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md bg-(--bg-secondary) border border-(--border-primary) text-(--text-primary) rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] [&>button]:text-(--text-secondary) [&>button]:hover:text-(--text-primary)"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-(--text-primary)">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            </div>
            Transfer Credits
          </DialogTitle>
          <DialogDescription className="text-(--text-secondary)">
            Move credits between your workspaces. Maximum 10 transfers per hour.
          </DialogDescription>
        </DialogHeader>

        {/* Subtle divider under header (plan_ui_components.md convention) */}
        <div className="h-px bg-(--border-primary) -mx-6" />

        {notEnoughWorkspaces ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                You need at least 2 workspaces to transfer credits. You currently
                have only your personal workspace. Create an organization
                (requires a plan that allows org creation) to transfer credits
                between workspaces.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* From */}
            <div className="space-y-2">
              <Label
                htmlFor="transfer-from"
                className="text-(--text-secondary) text-xs font-medium uppercase tracking-wider"
              >
                From
              </Label>
              <Select
                value={fromCompanyId}
                onValueChange={(v) => {
                  setFromCompanyId(v);
                  if (v === toCompanyId) setToCompanyId("");
                }}
              >
                <SelectTrigger
                  id="transfer-from"
                  className="bg-(--bg-primary) border-(--border-primary) text-(--text-primary) focus:ring-1 focus:ring-(--accent-blue) focus:border-(--accent-blue) rounded-lg h-10"
                >
                  <SelectValue placeholder="Select source workspace" />
                </SelectTrigger>
                <SelectContent className="bg-(--bg-secondary) border-(--border-primary) text-(--text-primary)">
                  {workspaces.map((w) => (
                    <SelectItem
                      key={w.id}
                      value={w.id}
                      className="text-(--text-primary) focus:bg-(--bg-tertiary) focus:text-(--text-primary)"
                    >
                      <span className="flex items-center gap-2">
                        {w.kind === "personal" ? (
                          <UserIcon className="w-3.5 h-3.5 text-(--text-secondary)" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-(--text-secondary)" />
                        )}
                        {w.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromCompanyId && (
                <p className="text-xs text-(--text-tertiary)">
                  Balance:{" "}
                  <span className="font-medium text-(--text-primary)">
                    {fromBalance === undefined
                      ? "loading…"
                      : `${fromBalance.toLocaleString()} credits`}
                  </span>
                </p>
              )}
            </div>

            {/* To */}
            <div className="space-y-2">
              <Label
                htmlFor="transfer-to"
                className="text-(--text-secondary) text-xs font-medium uppercase tracking-wider"
              >
                To
              </Label>
              <Select
                value={toCompanyId}
                onValueChange={setToCompanyId}
                disabled={!fromCompanyId}
              >
                <SelectTrigger
                  id="transfer-to"
                  className="bg-(--bg-primary) border-(--border-primary) text-(--text-primary) focus:ring-1 focus:ring-(--accent-blue) focus:border-(--accent-blue) rounded-lg h-10 disabled:opacity-50"
                >
                  <SelectValue placeholder="Select destination workspace" />
                </SelectTrigger>
                <SelectContent className="bg-(--bg-secondary) border-(--border-primary) text-(--text-primary)">
                  {workspaces
                    .filter((w) => w.id !== fromCompanyId)
                    .map((w) => (
                      <SelectItem
                        key={w.id}
                        value={w.id}
                        className="text-(--text-primary) focus:bg-(--bg-tertiary) focus:text-(--text-primary)"
                      >
                        <span className="flex items-center gap-2">
                          {w.kind === "personal" ? (
                            <UserIcon className="w-3.5 h-3.5 text-(--text-secondary)" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-(--text-secondary)" />
                          )}
                          {w.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {toCompanyId && (
                <p className="text-xs text-(--text-tertiary)">
                  Balance:{" "}
                  <span className="font-medium text-(--text-primary)">
                    {toBalance === undefined
                      ? "loading…"
                      : `${toBalance.toLocaleString()} credits`}
                  </span>
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label
                htmlFor="transfer-amount"
                className="text-(--text-secondary) text-xs font-medium uppercase tracking-wider"
              >
                Amount
              </Label>
              <Input
                id="transfer-amount"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!fromCompanyId || !toCompanyId}
                className="bg-(--bg-primary) border-(--border-primary) text-(--text-primary) placeholder:text-(--text-tertiary) focus-visible:ring-1 focus-visible:ring-(--accent-blue) focus-visible:border-(--accent-blue) rounded-lg h-10 disabled:opacity-50"
              />
              {fromCompanyId && amountValid && !hasEnoughCredits && (
                <p className="text-xs text-red-400">
                  Amount exceeds source balance.
                </p>
              )}
            </div>

            {/* Error / success */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>{error}</div>
                </div>
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>{success}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary) transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!notEnoughWorkspaces && (
            <button
              type="button"
              onClick={handleTransfer}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-(--accent-blue) hover:bg-(--accent-blue-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Transfer
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
