import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsChartProps {
  userRole: 'student' | 'faculty' | 'admin';
  onChartInteraction?: (chartType: string) => void;
}

type ChartType = 'performance' | 'attendance' | 'activity';
type TimeRange = 'weekly' | 'monthly' | 'yearly';

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ userRole, onChartInteraction }) => {
  const [chartType, setChartType] = useState<ChartType>('performance');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [chartData, setChartData] = useState<any>({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Sample Data',
        data: [65, 59, 80, 81],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
      },
    ],
  });

  useEffect(() => {
    // Mock data fetching based on chartType and timeRange
    const fetchData = () => {
      const mockData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: `${chartType} Data`,
            data: [
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100,
            ],
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
          },
        ],
      };
      setChartData(mockData);
    };

    fetchData();
  }, [chartType, timeRange]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${chartType} Analytics (${timeRange})`,
      },
    },
  };

  return (
    <div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AnalyticsChart;