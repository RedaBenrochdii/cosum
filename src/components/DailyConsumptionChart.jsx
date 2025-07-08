import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function DailyConsumptionChart({ data }) {
  // Préparation des données avec montant remboursé estimé
  const chartData = data.map(({ date, total }) => ({
    date,
    Montant: total,
    Rembourse: +(total * 0.8).toFixed(2)
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="rembourseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9d423" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(str) => str.slice(5)} />
          <YAxis />
          <Tooltip formatter={(value) => `${value} MAD`} />
          <Legend />
          <Bar dataKey="Montant" name="Montant total (MAD)" fill="#3b82f6" barSize={30} />
          <Bar dataKey="Rembourse" name="Montant remboursé (80%)" fill="url(#rembourseGradient)" barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
