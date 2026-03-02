const Invoice = require("../models/Invoice");
const Stock = require("../models/Stock");

/**
 * Get sales prediction based on past week's data
 * GET /api/sales-prediction
 *
 * Analyzes last 7 days of completed invoices,
 * calculates weighted average demand per item,
 * and predicts purchase quantities needed.
 */
const getSalesPrediction = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Fetch all completed invoices from the past 7 days
    const invoices = await Invoice.find({
      createdAt: { $gte: sevenDaysAgo },
      status: "completed",
    });

    // 2. Build per-item, per-day aggregation
    // Structure: { itemName: { itemId, itemCode, category, days: { 'YYYY-MM-DD': { weight, revenue, count } } } }
    const itemAggregation = {};

    invoices.forEach((invoice) => {
      const dayKey = invoice.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD

      invoice.items.forEach((item) => {
        const key = item.itemName;

        if (!itemAggregation[key]) {
          itemAggregation[key] = {
            itemId: item.itemId?.toString() || "",
            itemCode: item.itemCode || "",
            itemName: item.itemName,
            days: {},
            totalWeight: 0,
            totalRevenue: 0,
            totalTransactions: 0,
          };
        }

        if (!itemAggregation[key].days[dayKey]) {
          itemAggregation[key].days[dayKey] = {
            weight: 0,
            revenue: 0,
            count: 0,
          };
        }

        itemAggregation[key].days[dayKey].weight += item.weight;
        itemAggregation[key].days[dayKey].revenue += item.totalPrice;
        itemAggregation[key].days[dayKey].count += 1;
        itemAggregation[key].totalWeight += item.weight;
        itemAggregation[key].totalRevenue += item.totalPrice;
        itemAggregation[key].totalTransactions += 1;
      });
    });

    // 3. Generate ordered array of day keys for the 7-day window
    const dayKeys = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dayKeys.push(d.toISOString().split("T")[0]);
    }

    // Day labels for frontend (e.g., "Mon", "Tue")
    const dayLabels = dayKeys.map((dk) => {
      const d = new Date(dk);
      return d.toLocaleDateString("en-US", { weekday: "short" });
    });

    // 4. Get current stock levels for all items
    const stockAgg = await Stock.aggregate([
      { $match: { status: "available" } },
      {
        $group: {
          _id: "$itemName",
          currentStock: { $sum: "$remainingWeight" },
          itemId: { $first: "$itemId" },
        },
      },
    ]);

    const stockMap = {};
    stockAgg.forEach((s) => {
      stockMap[s._id] = {
        currentStock: Math.round(s.currentStock * 100) / 100,
        itemId: s.itemId?.toString() || "",
      };
    });

    // 5. Calculate predictions for each item
    const predictions = Object.values(itemAggregation).map((item) => {
      // Daily weights array (ordered oldest → newest)
      const dailyWeights = dayKeys.map(
        (dk) => item.days[dk]?.weight || 0
      );
      const dailyRevenue = dayKeys.map(
        (dk) => item.days[dk]?.revenue || 0
      );
      const dailyCounts = dayKeys.map(
        (dk) => item.days[dk]?.count || 0
      );

      // Days with actual sales
      const activeDays = dailyWeights.filter((w) => w > 0).length;

      // Simple average
      const avgDailyUsage =
        activeDays > 0 ? item.totalWeight / 7 : 0; // divide by 7 (full week)

      // Weighted average: recent 3 days get 1.5x weight
      let weightedSum = 0;
      let weightDivisor = 0;
      dailyWeights.forEach((w, idx) => {
        const factor = idx >= 4 ? 1.5 : 1.0; // last 3 days (idx 4,5,6) get 1.5x
        weightedSum += w * factor;
        weightDivisor += factor;
      });
      const weightedAvgDaily = weightDivisor > 0 ? weightedSum / weightDivisor : 0;

      // Trend: compare first half (days 0-2) vs second half (days 4-6)
      const firstHalf =
        dailyWeights.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const secondHalf =
        dailyWeights.slice(4, 7).reduce((a, b) => a + b, 0) / 3;
      let trend = "stable";
      let trendPercent = 0;
      if (firstHalf > 0) {
        trendPercent = ((secondHalf - firstHalf) / firstHalf) * 100;
        if (trendPercent > 15) trend = "up";
        else if (trendPercent < -15) trend = "down";
      } else if (secondHalf > 0) {
        trend = "up";
        trendPercent = 100;
      }

      // Predicted weekly purchase = weighted avg daily × 7 × 1.15 (15% safety buffer)
      const predictedWeekly =
        Math.round(weightedAvgDaily * 7 * 1.15 * 100) / 100;

      // Current stock
      const currentStock = stockMap[item.itemName]?.currentStock || 0;

      // How much to purchase = predicted - current stock (minimum 0)
      const purchaseNeeded =
        Math.round(Math.max(0, predictedWeekly - currentStock) * 100) / 100;

      // Status
      let status = "sufficient";
      if (currentStock <= 0) status = "out_of_stock";
      else if (currentStock < predictedWeekly * 0.3) status = "critical";
      else if (currentStock < predictedWeekly) status = "needs_restock";

      return {
        itemName: item.itemName,
        itemCode: item.itemCode,
        itemId: item.itemId,
        totalWeightSold: Math.round(item.totalWeight * 100) / 100,
        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        totalTransactions: item.totalTransactions,
        activeDays,
        avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
        weightedAvgDaily: Math.round(weightedAvgDaily * 100) / 100,
        trend,
        trendPercent: Math.round(trendPercent),
        currentStock,
        predictedWeekly,
        purchaseNeeded,
        status,
        dailyBreakdown: dayKeys.map((dk, idx) => ({
          date: dk,
          day: dayLabels[idx],
          weight: Math.round((item.days[dk]?.weight || 0) * 100) / 100,
          revenue: Math.round((item.days[dk]?.revenue || 0) * 100) / 100,
          count: item.days[dk]?.count || 0,
        })),
      };
    });

    // Sort by purchase needed (highest first)
    predictions.sort((a, b) => b.purchaseNeeded - a.purchaseNeeded);

    // 6. Summary stats
    const totalItemsAnalyzed = predictions.length;
    const totalWeightSold = predictions.reduce(
      (sum, p) => sum + p.totalWeightSold,
      0
    );
    const highestDemandItem =
      predictions.length > 0 ? predictions.reduce((max, p) => p.totalWeightSold > max.totalWeightSold ? p : max, predictions[0]).itemName : "N/A";
    const itemsNeedingRestock = predictions.filter(
      (p) => p.status === "needs_restock" || p.status === "critical" || p.status === "out_of_stock"
    ).length;

    // Daily total sales for the overview chart
    const dailyTotals = dayKeys.map((dk, idx) => {
      let totalWeight = 0;
      let totalRev = 0;
      predictions.forEach((p) => {
        const dayData = p.dailyBreakdown.find((d) => d.date === dk);
        if (dayData) {
          totalWeight += dayData.weight;
          totalRev += dayData.revenue;
        }
      });
      return {
        date: dk,
        day: dayLabels[idx],
        weight: Math.round(totalWeight * 100) / 100,
        revenue: Math.round(totalRev * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalItemsAnalyzed,
          totalWeightSold: Math.round(totalWeightSold * 100) / 100,
          highestDemandItem,
          itemsNeedingRestock,
          periodStart: dayKeys[0],
          periodEnd: dayKeys[6],
        },
        predictions,
        dailyTotals,
      },
    });
  } catch (error) {
    console.error("Error fetching sales prediction:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate sales prediction",
    });
  }
};

module.exports = {
  getSalesPrediction,
};
