import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { getSalesPrediction } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { LoadingCard } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Package, ShoppingCart,
  AlertTriangle, CheckCircle, Search, ArrowUpRight, ArrowDownRight,
  BarChart3, Weight, Boxes, XCircle,
} from 'lucide-react';

interface DailyBreakdown {
  date: string;
  day: string;
  weight: number;
  revenue: number;
  count: number;
}

interface PredictionItem {
  itemName: string;
  itemCode: string;
  itemId: string;
  totalWeightSold: number;
  totalRevenue: number;
  totalTransactions: number;
  activeDays: number;
  avgDailyUsage: number;
  weightedAvgDaily: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  currentStock: number;
  predictedWeekly: number;
  purchaseNeeded: number;
  status: 'sufficient' | 'needs_restock' | 'critical' | 'out_of_stock';
  dailyBreakdown: DailyBreakdown[];
}

interface PredictionData {
  summary: {
    totalItemsAnalyzed: number;
    totalWeightSold: number;
    highestDemandItem: string;
    itemsNeedingRestock: number;
    periodStart: string;
    periodEnd: string;
  };
  predictions: PredictionItem[];
  dailyTotals: { date: string; day: string; weight: number; revenue: number }[];
}

const statusConfig = {
  sufficient: { label: 'Sufficient', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
  needs_restock: { label: 'Needs Restock', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
};

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Rising' },
  down: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Falling' },
  stable: { icon: Minus, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Stable' },
};

const SalesPredictionPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PredictionData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PredictionItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getSalesPrediction();
        if (res.success && res.data) {
          setData(res.data);
          if (res.data.predictions.length > 0) {
            setSelectedItem(res.data.predictions[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sales prediction:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPredictions = data?.predictions.filter((p) =>
    p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const SparkLine = ({ dailyData }: { dailyData: DailyBreakdown[] }) => (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dailyData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--primary))"
            fill="url(#sparkGrad)"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container px-4 py-6 md:px-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between animate-slide-down">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Sales Prediction
            </h1>
            <p className="text-muted-foreground mt-0.5">
              AI-powered purchase recommendations based on past week's sales
            </p>
          </div>
          {data && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {data.summary.periodStart} — {data.summary.periodEnd}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 rounded bg-muted" />
                      <div className="h-8 w-28 rounded bg-muted" />
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-muted" />
                  </div>
                </div>
              ))}
            </div>
            <LoadingCard className="h-[400px]" />
            <LoadingCard className="h-[300px]" />
          </>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
              {[
                {
                  title: 'Items Analyzed',
                  value: data.summary.totalItemsAnalyzed,
                  icon: Package,
                  gradient: 'from-blue-500 to-cyan-500',
                  sub: 'Past 7 days',
                },
                {
                  title: 'Total Weight Sold',
                  value: `${data.summary.totalWeightSold} kg`,
                  icon: Weight,
                  gradient: 'from-emerald-500 to-green-500',
                  sub: 'Weekly total',
                },
                {
                  title: 'Highest Demand',
                  value: data.summary.highestDemandItem,
                  icon: TrendingUp,
                  gradient: 'from-violet-500 to-purple-500',
                  sub: 'Most sold item',
                },
                {
                  title: 'Need Restock',
                  value: data.summary.itemsNeedingRestock,
                  icon: AlertTriangle,
                  gradient: data.summary.itemsNeedingRestock > 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-green-500',
                  sub: data.summary.itemsNeedingRestock > 0 ? 'Action required' : 'All stocked',
                },
              ].map((card, idx) => (
                <Card key={idx} className="border-0 shadow-elevated overflow-hidden card-hover" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.sub}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3 animate-slide-up stagger-2">
              {/* Daily Overview Chart */}
              <Card className="lg:col-span-2 border-0 shadow-elevated overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                        <BarChart3 className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-foreground">Weekly Sales Overview</span>
                        <p className="text-sm font-normal text-muted-foreground">Daily weight sold (kg)</p>
                      </div>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyTotals} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="predBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="day"
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
                          tickFormatter={(v) => `${v}kg`}
                          dx={-4}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3, radius: 8 } as any}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
                            padding: '12px 16px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'weight') return [`${value} kg`, 'Weight Sold'];
                            return [formatCurrency(value), 'Revenue'];
                          }}
                        />
                        <Bar dataKey="weight" fill="url(#predBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Item Detail */}
              <Card className="border-0 shadow-elevated overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-foreground">Item Detail</span>
                      <p className="text-sm font-normal text-muted-foreground truncate max-w-[180px]">
                        {selectedItem?.itemName || 'Select an item'}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {selectedItem ? (
                    <div className="space-y-4">
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedItem.dailyBreakdown} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <defs>
                              <linearGradient id="detailLineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}`} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '10px',
                                boxShadow: '0 8px 24px -8px rgba(0, 0, 0, 0.12)',
                                padding: '8px 12px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [`${value} kg`, 'Weight']}
                            />
                            <Line
                              type="monotone"
                              dataKey="weight"
                              stroke="hsl(262, 83%, 58%)"
                              strokeWidth={2.5}
                              dot={{ r: 3, fill: 'hsl(262, 83%, 58%)' }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Weekly Sales</p>
                          <p className="text-lg font-bold font-mono-numbers">{selectedItem.totalWeightSold} kg</p>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Avg Daily</p>
                          <p className="text-lg font-bold font-mono-numbers">{selectedItem.avgDailyUsage} kg</p>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                          <p className="text-lg font-bold font-mono-numbers">{selectedItem.currentStock} kg</p>
                        </div>
                        <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
                          <p className="text-xs text-primary mb-1 font-medium">Purchase Needed</p>
                          <p className="text-lg font-bold font-mono-numbers text-primary">{selectedItem.purchaseNeeded} kg</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                      Click an item in the table below
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Prediction Table */}
            <Card className="border-0 shadow-elevated overflow-hidden animate-slide-up stagger-4">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-foreground">Purchase Predictions</span>
                      <p className="text-sm font-normal text-muted-foreground">Recommended quantities based on sales trends</p>
                    </div>
                  </CardTitle>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl border-border/50 bg-secondary/30"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">Item</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">Week Sales</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">Avg/Day</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">Trend</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3 hidden lg:table-cell">7-Day Chart</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">Stock</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">
                          <span className="text-primary">Purchase</span>
                        </th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPredictions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16">
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                <Boxes className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="text-muted-foreground font-medium">No sales data found</p>
                              <p className="text-sm text-muted-foreground/70">Sales from the past 7 days will appear here</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPredictions.map((item, idx) => {
                          const TrendIcon = trendConfig[item.trend].icon;
                          const StatusIcon = statusConfig[item.status].icon;
                          const isSelected = selectedItem?.itemName === item.itemName;

                          return (
                            <tr
                              key={idx}
                              className={`border-b border-border/50 cursor-pointer transition-all duration-200 hover:bg-primary/5 ${
                                isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                              }`}
                              onClick={() => setSelectedItem(item)}
                            >
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground">{item.itemName}</span>
                                  <span className="text-xs text-muted-foreground">{item.itemCode}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-semibold font-mono-numbers">{item.totalWeightSold} kg</span>
                                <p className="text-xs text-muted-foreground">{formatCurrency(item.totalRevenue)}</p>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono-numbers">{item.avgDailyUsage} kg</span>
                              </td>
                              <td className="p-3 text-center">
                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${trendConfig[item.trend].bg} ${trendConfig[item.trend].color}`}>
                                  <TrendIcon className="h-3 w-3" />
                                  {item.trendPercent > 0 ? '+' : ''}{item.trendPercent}%
                                </div>
                              </td>
                              <td className="p-3 hidden lg:table-cell">
                                <div className="flex justify-center">
                                  <SparkLine dailyData={item.dailyBreakdown} />
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono-numbers">{item.currentStock} kg</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-bold font-mono-numbers text-primary text-lg">
                                  {item.purchaseNeeded} kg
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].bg} ${statusConfig[item.status].color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span className="hidden sm:inline">{statusConfig[item.status].label}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">Failed to load prediction data</p>
            <p className="text-muted-foreground">Please check your connection and try again</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SalesPredictionPage;
