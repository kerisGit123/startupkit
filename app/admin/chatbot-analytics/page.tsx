"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function ChatbotAnalyticsPage() {
  const [selectedType, setSelectedType] = useState<"frontend" | "user_panel">("user_panel");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  const analytics = useQuery(api.analytics.getChatbotAnalytics, {
    type: selectedType,
    timeRange,
  });

  const stats = analytics?.stats;
  const conversationTrends = analytics?.conversationTrends || [];
  const topQuestions = analytics?.topQuestions || [];
  const resolutionData = analytics?.resolutionData || [];
  const adminPerformance = analytics?.adminPerformance || [];

  const COLORS = ["#854fff", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chatbot Analytics</h1>
        <p className="text-gray-500 mt-1">Monitor performance and user engagement</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
          <TabsList>
            <TabsTrigger value="frontend">Frontend Chatbot</TabsTrigger>
            <TabsTrigger value="user_panel">User Panel Chatbot</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Conversations"
          value={stats?.totalConversations || 0}
          icon={<MessageSquare className="w-5 h-5" />}
          color="bg-blue-500"
          trend={stats?.conversationTrend}
        />
        <StatCard
          title="Resolution Rate"
          value={`${stats?.resolutionRate || 0}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-green-500"
          trend={stats?.resolutionTrend}
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats?.avgResponseTime || 0}s`}
          icon={<Clock className="w-5 h-5" />}
          color="bg-purple-500"
          trend={stats?.responseTimeTrend}
        />
        <StatCard
          title="Escalation Rate"
          value={`${stats?.escalationRate || 0}%`}
          icon={<AlertCircle className="w-5 h-5" />}
          color="bg-orange-500"
          trend={stats?.escalationTrend}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Conversation Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="conversations"
                  stroke="#854fff"
                  strokeWidth={2}
                  name="Conversations"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Resolved"
                />
                <Line
                  type="monotone"
                  dataKey="escalated"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Escalated"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resolutionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resolutionData.map((entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Top Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topQuestions.map((question: { question: string; count: number }, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{question.question}</p>
                    <p className="text-xs text-gray-500">{question.count} times asked</p>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 ml-4">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${(question.count / (topQuestions[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {topQuestions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No questions data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adminPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="admin" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="conversations" fill="#854fff" name="Conversations Handled" />
                <Bar dataKey="avgResponseTime" fill="#10b981" name="Avg Response (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>User Satisfaction Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats?.satisfactionScores?.[rating] || 0;
              const total = (Object.values(stats?.satisfactionScores || {}) as number[]).reduce(
                (a, b) => a + b,
                0
              );
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={rating} className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{rating}⭐</div>
                  <div className="text-2xl font-semibold mt-2">{count}</div>
                  <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500">Average Rating</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats?.avgSatisfactionScore?.toFixed(1) || "N/A"} / 5.0
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: { title: string; value: number | string; icon: React.ReactNode; color: string; trend?: number }) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-500"
                }`}
              >
                <TrendingUp
                  className={`w-3 h-3 ${isNegative ? "rotate-180" : ""}`}
                />
                <span>{Math.abs(trend)}% vs last period</span>
              </div>
            )}
          </div>
          <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
