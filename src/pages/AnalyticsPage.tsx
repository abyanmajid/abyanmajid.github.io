import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  dailyTotalsForMonth,
  averageDailyForMonth,
  monthlyTotalsForYear,
  averageDailyForYear,
} from "../lib/storage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatHours(sec: number) {
  const hours = sec / 3600;
  return Number.isFinite(hours) ? hours.toFixed(2) : "0.00";
}

function formatHMS(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m`;
}

function AnalyticsPage() {
  // Default to current month-year, format "YYYY-MM"
  const now = new Date();
  const defaultMonth = now.toISOString().slice(0, 7);
  const [monthStr, setMonthStr] = useState(defaultMonth);

  // Parsed year & month
  const [year, month] = monthStr.split("-").map(Number);

  // Data for daily bar chart
  const [dailyData, setDailyData] = useState<{ day: number; hours: number }[]>(
    []
  );
  // Data for monthly bar chart
  const [monthlyData, setMonthlyData] = useState<
    { month: string; hours: number }[]
  >([]);
  // Summary metrics
  const [avgDailyMonth, setAvgDailyMonth] = useState(0);
  const [totalMonthSec, setTotalMonthSec] = useState(0);
  const [avgDailyYear, setAvgDailyYear] = useState(0);

  useEffect(() => {
    // Daily totals: Record<day, seconds>
    const totals = dailyTotalsForMonth(year, month);
    const daysInMonth = new Date(year, month, 0).getDate();
    const arr: { day: number; hours: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const sec = totals[d] || 0;
      arr.push({ day: d, hours: sec / 3600 });
    }
    setDailyData(arr);
    // Summary month:
    const avgSec = averageDailyForMonth(year, month);
    setAvgDailyMonth(avgSec / 3600);
    const totalSec = arr.reduce((sum, item) => sum + item.hours, 0) * 3600;
    setTotalMonthSec(totalSec);
    // Monthly totals for year:
    const mTotals = monthlyTotalsForYear(year); // Record<month, seconds>
    const mArr: { month: string; hours: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const sec = mTotals[m] || 0;
      // Label as abbreviated month e.g. "Jan", "Feb"
      const label = new Date(year, m - 1).toLocaleString(undefined, {
        month: "short",
      });
      mArr.push({ month: label, hours: sec / 3600 });
    }
    setMonthlyData(mArr);
    // Summary year:
    const avgYearSec = averageDailyForYear(year);
    setAvgDailyYear(avgYearSec / 3600);
  }, [monthStr, year, month]);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto my-16">
        <h1 className="text-center">Analytics</h1>
        <p className="text-center">Insights to your study/work performance</p>
        <hr />

        {/* Month selector */}
        <section className="my-6">
          <label>
            Select month:{" "}
            <input
              type="month"
              value={monthStr}
              onChange={(e) => setMonthStr(e.target.value)}
            />
          </label>
        </section>

        {/* Summary metrics */}
        <section className="grid">
          <div>
            <h2>Total this month</h2>
            <p>{formatHMS(totalMonthSec)}</p>
          </div>
          <div>
            <h2>Avg daily this month</h2>
            <p>{formatHours(avgDailyMonth)} hours</p>
          </div>
          <div>
            <h2>Avg daily this year</h2>
            <p>{formatHours(avgDailyYear)} hours</p>
          </div>
        </section>

        {/* Daily bar chart */}
        <section className="my-8">
          <h2>
            Daily study hours for {year}-{String(month).padStart(2, "0")}
          </h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(v) => String(v)} />
                <YAxis
                  label={{ value: "hrs", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} h`}
                />
                <Bar dataKey="hours" fill="#3366CC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Monthly bar chart */}
        <section className="my-8">
          <h2>Monthly totals for {year}</h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  label={{ value: "hrs", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} h`}
                />
                <Bar dataKey="hours" fill="#3366CC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AnalyticsPage;
