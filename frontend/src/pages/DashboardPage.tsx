import { useMemo } from 'react';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SalesChart from '@/components/dashboard/SalesChart';
import TopSellers from '@/components/dashboard/TopSellers';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { generateMockTransactions, generateTopSellers, generateDailySales } from '@/data/mockData';
import { useLoadingState } from '@/hooks/use-loading-state';
import { LoadingCard, LoadingSpinner } from '@/components/ui/loading';

const DashboardPage = () => {
  const isLoading = useLoadingState(1200);
  const transactions = useMemo(() => generateMockTransactions(), []);
  const topSellers = useMemo(() => generateTopSellers(), []);
  const dailySales = useMemo(() => generateDailySales(), []);

  const todayStats = useMemo(() => {
    const todayTotal = dailySales[dailySales.length - 1]?.total || 0;
    const itemsSold = dailySales[dailySales.length - 1]?.itemCount || 0;
    const avgTransaction = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.totalAmount, 0) / transactions.length
      : 0;
    const topItem = topSellers[0]?.name || 'Apple';
    return { todayTotal, itemsSold, avgTransaction, topItem };
  }, [dailySales, transactions, topSellers]);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container px-4 py-6 md:px-6 space-y-6">
        <div className="flex items-center justify-between animate-slide-down">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Overview of today's sales and performance
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">Live</span>
          </div>
        </div>

        {isLoading ? (
          <>
            {/* Loading Summary Cards */}
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

            {/* Loading Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
              <LoadingCard className="lg:col-span-2 h-[400px]" />
              <LoadingCard className="h-[400px]" />
            </div>

            {/* Loading Transactions */}
            <LoadingCard className="h-[300px]" />
          </>
        ) : (
          <>
            <SummaryCards
              totalSales={todayStats.todayTotal}
              itemsSold={todayStats.itemsSold}
              avgTransaction={todayStats.avgTransaction}
              topItem={todayStats.topItem}
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <SalesChart data={dailySales} />
              <TopSellers sellers={topSellers} />
            </div>

            <RecentTransactions transactions={transactions} />
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
