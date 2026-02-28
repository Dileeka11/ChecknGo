const Invoice = require("../models/Invoice");
const Stock = require("../models/Stock");

/**
 * Get dashboard today stats
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const invoices = await Invoice.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: "completed"
    });

    let todayTotal = 0;
    let itemsSold = 0; // we will count total items or sum of weights. Let's do sum of items arrays length.
    let itemSales = {}; // to find top item

    invoices.forEach(invoice => {
      todayTotal += invoice.totalAmount;
      itemsSold += invoice.items.length; // Or we can sum weight, but let's just count item lines sold
      
      invoice.items.forEach(item => {
        if (!itemSales[item.itemName]) {
          itemSales[item.itemName] = 0;
        }
        itemSales[item.itemName] += item.weight;
      });
    });

    const avgTransaction = invoices.length > 0 ? todayTotal / invoices.length : 0;
    
    let topItem = "None";
    let maxWeight = 0;
    for (const [itemName, weight] of Object.entries(itemSales)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        topItem = itemName;
      }
    }

    // Default to Apple if no sales today, to avoid UI looking completely empty if desired, but "None" is more accurate.
    // Let's keep it accurate.

    res.json({
      success: true,
      data: {
        todayTotal,
        itemsSold,
        avgTransaction,
        topItem: maxWeight > 0 ? topItem : "N/A"
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard stats"
    });
  }
};

/**
 * Get recent transactions
 * GET /api/dashboard/recent-transactions
 */
const getRecentTransactions = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("customerId", "name");

    const transactions = invoices.map(inv => ({
      id: inv._id.toString(),
      items: inv.items.map((item, idx) => ({
        id: `${inv._id}-${idx}`,
        name: item.itemName,
        weight: item.weight,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: inv.totalAmount,
      timestamp: inv.createdAt.toISOString(),
      status: inv.status,
      staffName: inv.createdBy || "System",
      invoiceNumber: inv.invoiceNumber
    }));

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent transactions"
    });
  }
};

/**
 * Get daily sales for the past 7 days
 * GET /api/dashboard/daily-sales
 */
const getDailySales = async (req, res) => {
  try {
    const sales = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Generate array of last 7 days starting from 6 days ago
    for (let i = 6; i >= 0; i--) {
      const dateStart = new Date();
      dateStart.setDate(today.getDate() - i);
      dateStart.setHours(0, 0, 0, 0);

      const dateEnd = new Date(dateStart);
      dateEnd.setHours(23, 59, 59, 999);

      const invoices = await Invoice.find({
        createdAt: { $gte: dateStart, $lte: dateEnd },
        status: "completed"
      });

      let total = 0;
      let itemCount = 0;

      invoices.forEach(inv => {
        total += inv.totalAmount;
        itemCount += inv.items.length; 
        // Note: We could sum weights here too, but itemCount is fine for the UI.
      });

      sales.push({
        date: dateStart.toLocaleDateString("en-US", { weekday: "short" }),
        total,
        itemCount
      });
    }

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch daily sales"
    });
  }
};

/**
 * Get top sellers (by revenue or quantity)
 * GET /api/dashboard/top-sellers
 */
const getTopSellers = async (req, res) => {
  try {
    // We'll aggregate from all completed invoices. 
    // In a real app, you might want to limit this to the last 30 days.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const invoices = await Invoice.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: "completed"
    });

    const itemStats = {};

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!itemStats[item.itemName]) {
          itemStats[item.itemName] = {
            quantity: 0,
            revenue: 0
          };
        }
        itemStats[item.itemName].quantity += item.weight;
        itemStats[item.itemName].revenue += item.totalPrice;
      });
    });

    // Convert to array and sort by revenue
    const topSellers = Object.keys(itemStats).map(name => ({
      name,
      quantity: Math.round(itemStats[name].quantity * 10) / 10,
      revenue: Math.round(itemStats[name].revenue * 100) / 100,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5); // top 5

    res.json({
      success: true,
      data: topSellers
    });
  } catch (error) {
    console.error("Error fetching top sellers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch top sellers"
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentTransactions,
  getDailySales,
  getTopSellers
};
