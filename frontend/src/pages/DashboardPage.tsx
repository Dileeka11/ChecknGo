import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SalesChart from '@/components/dashboard/SalesChart';
import TopSellers from '@/components/dashboard/TopSellers';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { 
  getDashboardStats, 
  getDashboardRecentTransactions, 
  getDashboardDailySales, 
  getDashboardTopSellers 
} from '@/lib/api';
import { LoadingCard } from '@/components/ui/loading';

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [todayStats, setTodayStats] = useState({
    todayTotal: 0,
    itemsSold: 0,
    avgTransaction: 0,
    topItem: 'None',
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, transRes, salesRes, sellersRes] = await Promise.all([
          getDashboardStats(),
          getDashboardRecentTransactions(),
          getDashboardDailySales(),
          getDashboardTopSellers()
        ]);

        if (statsRes.success) setTodayStats(statsRes.data);
        if (transRes.success) setTransactions(transRes.data);
        if (salesRes.success) setDailySales(salesRes.data);
        if (sellersRes.success) setTopSellers(sellersRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
