'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceArea } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { addDays, format, parse } from 'date-fns';
import type { Product, Order } from '@/lib/types';

interface InventoryChartProps {
  product: Product;
  liveOrders?: Order[];
  timeframe?: '4w' | '6w' | '12w' | '6m' | '1y';
}

// Custom Dot component to show delivery markers
const CustomDot = (props: { cx?: number; cy?: number; payload?: { isDelivery?: boolean } }) => {
  const { cx, cy, payload } = props;

  if (!cx || !cy) return null;

  if (payload?.isDelivery) {
    return (
      <g>
        {/* Delivery arrow pointing up */}
        <polygon
          points={`${cx},${cy-10} ${cx-7},${cy+2} ${cx+7},${cy+2}`}
          fill="hsl(217, 91%, 60%)"
          stroke="white"
          strokeWidth={2}
        />
        {/* Highlighted circle */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="hsl(217, 91%, 60%)"
          stroke="white"
          strokeWidth={2}
        />
      </g>
    );
  }

  // Regular dot
  return <circle cx={cx} cy={cy} r={3} fill="var(--color-stock)" />;
};

// Custom tooltip to show delivery information
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; stock: number; target: number; isDelivery?: boolean; deliveryAmount?: number; orderNumber?: string } }> }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
      <div className="px-3 py-2">
        <p className="font-semibold text-sm">{data.date}</p>
        <p className="text-xs text-muted-foreground">Stock: {data.stock.toLocaleString()} cartons</p>
        <p className="text-xs text-muted-foreground">Target: {data.target.toLocaleString()} cartons</p>
      </div>

      {data.isDelivery && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-t border-blue-200 dark:border-blue-900/50 px-3 py-2">
          <p className="text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
            📦 Order Arrival
          </p>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{data.orderNumber}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">+{data.deliveryAmount?.toLocaleString()} cartons</p>
        </div>
      )}
    </div>
  );
};

export function InventoryChart({ product, liveOrders = [], timeframe = '6w' }: InventoryChartProps) {
  // Filter orders that contain this product
  const relevantOrders = liveOrders
    .filter(order =>
      order.products && order.products.some(p => p.productId === product.id || p.productName === product.name)
    )
    .map(order => {
      const orderProduct = order.products.find(p => p.productId === product.id || p.productName === product.name);
      return {
        deliveryDate: parse(order.deliveryDate, 'MMM dd, yyyy', new Date()),
        quantity: orderProduct?.recommendedQuantity || 0,
        orderNumber: order.orderNumber,
      };
    })
    .filter(o => o.quantity > 0)
    .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

  // Generate chart data points
  const today = new Date();

  // Timeframe configuration: weeks and interval in days
  const timeframeConfig = {
    '4w': { weeks: 4, interval: 7 },      // 7-day intervals
    '6w': { weeks: 6, interval: 7 },      // 7-day intervals
    '12w': { weeks: 12, interval: 7 },    // 7-day intervals
    '6m': { weeks: 26, interval: 14 },    // 14-day (bi-weekly) intervals
    '1y': { weeks: 52, interval: 30 },    // ~30-day (monthly) intervals
  };

  const config = timeframeConfig[timeframe];
  const dataPoints = Math.ceil((config.weeks * 7) / config.interval) + 1;

  const data = [];
  let runningStock = product.currentStock;

  for (let i = 0; i < dataPoints; i++) {
    const pointDate = addDays(today, i * config.interval);
    const periodStart = i === 0 ? today : addDays(today, (i - 1) * config.interval + 1);
    const periodEnd = addDays(today, i * config.interval);

    // Subtract consumption for this period
    if (i > 0) {
      const consumption = (product.weeklyConsumption / 7) * config.interval;
      runningStock -= consumption;
    }

    // Find delivery that falls within this period's range
    const orderThisPeriod = relevantOrders.find(order => {
      return order.deliveryDate >= periodStart && order.deliveryDate <= periodEnd;
    });

    // Add order if it arrives this period
    if (orderThisPeriod) {
      runningStock += orderThisPeriod.quantity;
    }

    data.push({
      date: format(pointDate, 'MMM dd'),
      stock: Math.max(0, Math.round(runningStock)),
      target: product.targetStock,
      isDelivery: !!orderThisPeriod,
      deliveryAmount: orderThisPeriod?.quantity,
      orderNumber: orderThisPeriod?.orderNumber,
    });

    if (runningStock <= 0) break;
  }

  const chartConfig = {
    stock: {
      label: 'Stock',
      color: product.status === 'HEALTHY' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)',
    },
    target: {
      label: 'Target',
      color: 'hsl(215, 20%, 65%)',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 90%)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            allowDuplicatedCategory={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <ChartTooltip content={<CustomTooltip />} />

          {/* Order arrival areas */}
          {data.map((point, idx) => {
            if (point.isDelivery) {
              return (
                <ReferenceArea
                  key={`delivery-${idx}`}
                  x1={point.date}
                  x2={point.date}
                  fill="hsl(217, 91%, 60%)"
                  fillOpacity={0.08}
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: `↑ ${point.orderNumber}`,
                    position: 'top',
                    fill: 'hsl(217, 91%, 40%)',
                    fontSize: 11,
                    fontWeight: 700,
                    offset: 8,
                  }}
                />
              );
            }
            return null;
          })}

          <Line
            type="monotone"
            dataKey="target"
            stroke="var(--color-target)"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="stock"
            stroke="var(--color-stock)"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
