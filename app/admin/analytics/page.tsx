"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const analytics = useQuery(api.adminAnalytics.getAnalytics);
  const [chartView, setChartView] = useState<"count" | "amount">("count");

  const revenueChartConfig = {
    revenue: {
      label: "Visitors",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const purchaseChartConfig = {
    value: {
      label: chartView === "count" ? "Purchases" : "Amount",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const subscriptionChartConfig = {
    value: {
      label: chartView === "count" ? "Subscriptions" : "Amount",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 md:gap-6">
      {/* Key Metrics - pic4 style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-bold">
              MYR {analytics?.totalRevenue.toFixed(2) || "20.00"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">+2.5%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trending up this month</p>
            <p className="text-xs text-primary mt-0.5">All time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">This Month</CardDescription>
            <CardTitle className="text-2xl font-bold">
              MYR {analytics?.thisMonthRevenue.toFixed(2) || "20.00"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">+4.2%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Strong performance</p>
            <p className="text-xs text-primary mt-0.5">Current month revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Users</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {analytics?.activeUsers || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">+{analytics?.newUsersThisMonth || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Growing user base</p>
            <p className="text-xs text-primary mt-0.5">+{analytics?.newUsersThisMonth || 0} new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">MRR</CardDescription>
            <CardTitle className="text-2xl font-bold">
              MYR {analytics?.mrr.toFixed(2) || "9.00"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">+1%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Steady growth</p>
            <p className="text-xs text-primary mt-0.5">Monthly recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart with Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue trends</CardDescription>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-muted-foreground text-xs">Desktop</div>
                <div className="text-2xl font-bold">{analytics?.totalRevenue ? Math.floor(analytics.totalRevenue * 0.6).toLocaleString() : '12'}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-xs">Mobile</div>
                <div className="text-2xl font-bold">{analytics?.totalRevenue ? Math.floor(analytics.totalRevenue * 0.4).toLocaleString() : '8'}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
            <BarChart
              accessibilityLayer
              data={analytics?.monthlyData.map(d => ({ 
                month: d.month, 
                revenue: d.revenue
              })) || []}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value: number | string) => `${typeof value === 'number' ? value.toLocaleString() : value} visitors`}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-subscriptions)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Purchase & Subscription Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Purchases</CardTitle>
                <CardDescription>
                  {chartView === "count" ? "Purchase count" : "Purchase amount"} - Last 6 months
                </CardDescription>
              </div>
              <div className="flex gap-2 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setChartView("count")}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    chartView === "count" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  Count
                </button>
                <button
                  onClick={() => setChartView("amount")}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    chartView === "amount" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  Amount
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={purchaseChartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={analytics?.purchaseMonthlyData.map(d => ({ 
                  month: d.month, 
                  value: chartView === "count" ? d.count : d.amount 
                })) || []}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value: number | string) => 
                        chartView === "amount" 
                          ? `MYR ${typeof value === 'number' ? value.toLocaleString() : value}` 
                          : `${value}`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscriptions</CardTitle>
                <CardDescription>
                  {chartView === "count" ? "Subscription count" : "Subscription amount"} - Last 6 months
                </CardDescription>
              </div>
              <div className="flex gap-2 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setChartView("count")}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    chartView === "count" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  Count
                </button>
                <button
                  onClick={() => setChartView("amount")}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    chartView === "amount" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  Amount
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={subscriptionChartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={analytics?.subscriptionMonthlyData.map(d => ({ 
                  month: d.month, 
                  value: chartView === "count" ? d.count : d.amount 
                })) || []}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value: number | string) => 
                        chartView === "amount" 
                          ? `MYR ${typeof value === 'number' ? value.toLocaleString() : value}` 
                          : `${value}`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
