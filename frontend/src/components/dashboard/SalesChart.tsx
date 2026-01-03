import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { DailySales } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface SalesChartProps {
  data: DailySales[];
}

const SalesChart = ({ data }: SalesChartProps) => {
  const maxValue = Math.max(...data.map(d => d.total));
  
  return (
    <Card className="col-span-2 border-0 shadow-elevated overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">Sales Overview</span>
              <p className="text-sm font-normal text-muted-foreground">Last 7 days performance</p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
            <ArrowUpRight className="h-4 w-4" />
            +12.5%
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="barGradientMuted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rs.${value / 1000}k`}
                dx={-4}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3, radius: 8 }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px',
                }}
                labelStyle={{ 
                  color: 'hsl(var(--foreground))', 
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Sales']}
              />
              <Bar 
                dataKey="total" 
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.total === maxValue ? 'url(#barGradient)' : 'url(#barGradientMuted)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;