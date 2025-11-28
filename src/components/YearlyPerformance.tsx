import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ChartData {
  date: string;
  priceTon: number;
  priceUsd: number;
}

interface YearlyPerformanceProps {
  data: ChartData[];
  currency: 'ton' | 'usd';
}

const YearlyPerformance: React.FC<YearlyPerformanceProps> = ({ data, currency }) => {
  const [isVisible, setIsVisible] = useState(true);

  const months = [
    { name: 'Jan', index: 0 },
    { name: 'Feb', index: 1 },
    { name: 'Mar', index: 2 },
    { name: 'Apr', index: 3 },
    { name: 'May', index: 4 },
    { name: 'Jun', index: 5 },
    { name: 'Jul', index: 6 },
    { name: 'Aug', index: 7 },
    { name: 'Sep', index: 8 },
    { name: 'Oct', index: 9 },
    { name: 'Nov', index: 10 },
    { name: 'Dec', index: 11 },
  ];

  const parseDateUTC = (value: string) => {
    // Treat plain YYYY-MM-DD as UTC start of day to avoid timezone shifts
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      return new Date(Date.UTC(y, mo - 1, d));
    }
    return new Date(value);
  };

  const calculateMonthlyPerformance = () => {
    const currentYear = new Date().getUTCFullYear();
    const EPS_USD = 0.01;
    const EPS_TON = 0.000001;
    const EPS = currency === 'usd' ? EPS_USD : EPS_TON;

    type Stat = {
      firstTs: number;
      firstPrice: number;
      lastTs: number;
      lastPrice: number;
      validCount: number;
    };

    const stats: Record<number, Stat | undefined> = {};
    const statsTon: Record<number, Stat | undefined> = {};

    data.forEach((item) => {
      const date = parseDateUTC(item.date);
      if (date.getUTCFullYear() !== currentYear) return;

      const month = date.getUTCMonth();
      const ts = date.getTime();

      // Primary currency tracking with EPS filter
      const pricePrimary = currency === 'usd' ? item.priceUsd : item.priceTon;
      if (pricePrimary != null && pricePrimary > EPS) {
        const s = stats[month];
        if (!s) {
          stats[month] = {
            firstTs: ts,
            firstPrice: pricePrimary,
            lastTs: ts,
            lastPrice: pricePrimary,
            validCount: 1,
          };
        } else {
          if (ts < s.firstTs) {
            s.firstTs = ts;
            s.firstPrice = pricePrimary;
          }
          if (ts > s.lastTs) {
            s.lastTs = ts;
            s.lastPrice = pricePrimary;
          }
          s.validCount += 1;
        }
      }

      // TON tracking for fallback (esp. when currency === 'usd')
      const priceTon = item.priceTon;
      if (priceTon != null && priceTon > EPS_TON) {
        const st = statsTon[month];
        if (!st) {
          statsTon[month] = {
            firstTs: ts,
            firstPrice: priceTon,
            lastTs: ts,
            lastPrice: priceTon,
            validCount: 1,
          };
        } else {
          if (ts < st.firstTs) {
            st.firstTs = ts;
            st.firstPrice = priceTon;
          }
          if (ts > st.lastTs) {
            st.lastTs = ts;
            st.lastPrice = priceTon;
          }
          st.validCount += 1;
        }
      }
    });

    const results = months.map((month) => {
      const s = stats[month.index];

      const safeCompute = (st: Stat | undefined, eps: number) => {
        if (!st) return { percentage: null as number | null, reason: 'no_data' };
        if (st.validCount === 0) return { percentage: null as number | null, reason: 'no_valid' };
        if (st.validCount === 1) return { percentage: 0 as number, reason: 'single_point' };
        const spanDays = (st.lastTs - st.firstTs) / 86400000; // ms -> days
        if (st.firstPrice <= eps) return { percentage: null as number | null, reason: 'first_below_eps' };
        const change = ((st.lastPrice - st.firstPrice) / st.firstPrice) * 100;
        const anomalous = Math.abs(change) > 500 && (st.firstPrice < eps * 5 || spanDays < 7);
        if (anomalous) return { percentage: null as number | null, reason: 'anomalous' };
        return { percentage: change, reason: 'ok' };
      };

      let primary = safeCompute(s, EPS);
      let usedFallback = false;

      if (currency === 'usd' && primary.percentage === null) {
        const st = statsTon[month.index];
        const fb = safeCompute(st, EPS_TON);
        if (fb.percentage !== null) {
          primary = fb;
          usedFallback = true;
        }
      }

      // Temporary debug log; remove if too noisy
      console.debug('[YearlyPerformance]', {
        month: month.name,
        currency,
        primaryStat: s,
        tonStat: statsTon[month.index],
        result: primary,
        usedFallback,
      });

      return { name: month.name, percentage: primary.percentage };
    });

    return results;
  };

  const monthlyPerformance = calculateMonthlyPerformance();

  const getColorClass = (percentage: number | null) => {
    if (percentage === null) return 'bg-secondary/50 text-muted-foreground';
    if (percentage > 0) return 'bg-green-500/30 text-green-100 border border-green-500/50';
    if (percentage < 0) return 'bg-red-500/30 text-red-100 border border-red-500/50';
    return 'bg-secondary/50 text-muted-foreground';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">
          Yearly Performance
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="gap-1"
        >
          Hide <ChevronDown className="w-4 h-4 rotate-180" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {monthlyPerformance.map((month) => (
          <div
            key={month.name}
            className={`p-3 rounded-lg text-center transition-all ${getColorClass(month.percentage)}`}
          >
            <div className="font-semibold text-sm mb-1">{month.name}</div>
            {month.percentage !== null ? (
              <div className="text-xs font-bold">
                {month.percentage > 0 ? '+' : ''}
                {month.percentage.toFixed(1)}%
              </div>
            ) : (
              <div className="text-xs opacity-50">-</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default YearlyPerformance;
