"use client";

import { ShieldAlert, Globe, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              Your access to this service has been restricted.
            </p>
            <p className="text-sm">
              This may be due to one of the following reasons:
            </p>
          </div>

          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-700">Geographic Restriction</p>
                <p className="text-gray-600">Access from your location is not permitted</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-700">Security Policy</p>
                <p className="text-gray-600">Your IP address has been flagged by our security system</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              If you believe this is an error, please contact our support team:
            </p>
            <a
              href="mailto:support@yourapp.com"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Mail className="w-4 h-4" />
              support@yourapp.com
            </a>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Error Code: ACCESS_DENIED
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
