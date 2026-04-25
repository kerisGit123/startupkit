"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueOverview } from "@/components/admin/billing/RevenueOverview";
import { SubscriptionsTab } from "@/components/admin/billing/SubscriptionsTab";
import { PurchasesTab } from "@/components/admin/billing/PurchasesTab";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Revenue, subscriptions, and credit purchases
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="purchases">Credit Purchases</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <RevenueOverview />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchasesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
