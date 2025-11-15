'use client';

import Link from 'next/link';
import { mockContainers } from '@/lib/data/mock-containers';
import { AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendationCardProps {
  type: 'urgent' | 'multiple' | 'healthy';
}

export function RecommendationCard({ type }: RecommendationCardProps) {
  // Healthy state - calm, informative, proactive
  if (type === 'healthy') {
    const nextContainer = mockContainers.find(c => c.urgency !== 'URGENT') || mockContainers[1];

    // Calculate total pallets by summing each product's pallets (products have different piecesPerPallet values)
    const totalPallets = nextContainer.products.reduce((sum, product) =>
      sum + (product.recommendedQuantity / product.piecesPerPallet), 0
    );
    const pallets = Math.round(totalPallets);

    return (
      <div className="mb-8 bg-card border-l-4 border-l-green-500 border-y border-r border-border rounded-r overflow-hidden shadow-sm">
        <div className="px-8 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="flex-shrink-0 w-6 h-6 text-green-600 dark:text-green-500" />
            <h3 className="text-xl font-bold text-card-foreground">
              All Products On Track
            </h3>
          </div>

          {/* Subheading */}
          <p className="text-sm text-muted-foreground mb-6">
            Your next recommended order:
          </p>

          {/* Container details */}
          <div className="mb-6">
            <p className="text-base text-card-foreground font-medium mb-3">
              📦 Container {nextContainer.containerNumber} • {nextContainer.productCount} products • <span className="font-semibold">{pallets} pallets</span>
              <span className="text-muted-foreground ml-1">
                ({nextContainer.totalCartons.toLocaleString()} cartons)
              </span>
            </p>

            {/* Dates */}
            <div className="flex gap-8 text-sm">
              <div>
                <span className="text-muted-foreground">Order by: </span>
                <span className="text-card-foreground font-medium">
                  {nextContainer.orderByDate}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Delivery: </span>
                <span className="text-card-foreground">
                  {nextContainer.deliveryDate}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/orders" className="flex-1 cursor-pointer">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-950 font-semibold"
              >
                Plan This Order →
              </Button>
            </Link>
            <Link
              href="/orders"
              className="text-sm text-blue-600 dark:text-blue-500 hover:underline font-medium cursor-pointer"
            >
              View All Upcoming Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get urgent containers
  const urgentContainers = mockContainers.filter(c => c.urgency === 'URGENT');

  if (urgentContainers.length === 0) {
    return null;
  }

  const urgentContainer = urgentContainers[0];

  // Single urgent container - prominent, clear, actionable
  if (type === 'urgent' || urgentContainers.length === 1) {
    return (
      <div className="mb-8 bg-card border-l-4 border-l-amber-500 border-y border-r border-border rounded-r overflow-hidden shadow-sm">
        <div className="px-8 py-6">
          {/* Header with urgency indicator */}
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 w-7 h-7 text-amber-600 dark:text-amber-500 mt-1" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-card-foreground">
                    Container {urgentContainer.containerNumber}
                  </h3>
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider rounded">
                    Action Required
                  </span>
                </div>
                <p className="text-base text-muted-foreground">
                  {urgentContainer.productCount} products • {urgentContainer.totalCartons.toLocaleString()} cartons
                </p>
              </div>
            </div>
          </div>

          {/* Order deadline - most important information */}
          <div className="flex items-center gap-3 mb-8 px-4 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded">
            <Calendar className="flex-shrink-0 w-5 h-5 text-amber-700 dark:text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Order By
              </p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                {urgentContainer.orderByDate}
              </p>
            </div>
            <div className="ml-auto pl-6 border-l border-amber-300 dark:border-amber-700">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Delivery
              </p>
              <p className="text-base font-semibold text-amber-900 dark:text-amber-100 mt-0.5">
                {urgentContainer.deliveryDate}
              </p>
            </div>
          </div>

          {/* Primary action */}
          <Link href="/orders" className="cursor-pointer">
            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-base h-14 rounded shadow-sm hover:shadow transition-all"
            >
              Review Container {urgentContainer.containerNumber}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Multiple containers - show urgency and guide to orders page
  return (
    <div className="mb-8 bg-card border-l-4 border-l-red-500 border-y border-r border-border rounded-r overflow-hidden shadow-sm">
      <div className="px-8 py-6">
        <div className="flex items-start gap-4 mb-6">
          <AlertCircle className="flex-shrink-0 w-7 h-7 text-red-600 dark:text-red-500 mt-1" />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-card-foreground">
                {urgentContainers.length} Containers Need Ordering
              </h3>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 text-xs font-bold uppercase tracking-wider rounded">
                Multiple Actions Required
              </span>
            </div>
            <p className="text-base text-muted-foreground mt-2">
              Container {urgentContainer.containerNumber} by {urgentContainer.orderByDate} •
              Container {urgentContainers[1]?.containerNumber} by {urgentContainers[1]?.orderByDate}
            </p>
          </div>
        </div>

        <Link href="/orders" className="cursor-pointer">
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-base h-14 rounded shadow-sm hover:shadow transition-all"
          >
            View All Orders
          </Button>
        </Link>
      </div>
    </div>
  );
}
