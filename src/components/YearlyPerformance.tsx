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

  const calculateMonthlyPerformance = () => {
    const currentYear = new Date().getFullYear();
    const monthlyData: { [key: number]: number[] } = {};

    // جمع جميع الأسعار لكل شهر
    data.forEach((item) => {
      const date = new Date(item.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const price = currency === 'ton' ? item.priceTon : item.priceUsd;

        if (!monthlyData[month]) {
          monthlyData[month] = [];
        }
        monthlyData[month].push(price);
      }
    });

    return months.map((month) => {
      const prices = monthlyData[month.index];
      if (!prices || prices.length === 0) return { name: month.name, percentage: null };

      // ترتيب الأسعار حسب التاريخ (أول سعر وآخر سعر)
      const start = prices[0];
      const end = prices[prices.length - 1];

      if (start === 0) return { name: month.name, percentage: null };

      const change = ((end - start) / start) * 100;
      return { name: month.name, percentage: change };
    });
  };

  const monthlyPerformance = calculateMonthlyPerformance();

  const getColorClass = (percentage: number | null) => {
    if (percentage === null) return 'bg-secondary/50 text-muted-foreground';
    if (percentage > 0) return 'bg-green-500/30 text-green-100 border border-green-500/50';
    if (percentage < 0) return 'bg-red-500/30 text-red-100 border border-red-500/50';
    return 'bg-secondary/50 text-muted-foreground';
  };

  if (!isVisible) {
    return (
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Yearly Performance
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="gap-1"
        >
          Show <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    );
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
