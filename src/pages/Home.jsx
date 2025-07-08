import React, { useEffect, useState, useRef } from 'react';
import DailyConsumptionChart from '../components/DailyConsumptionChart';
import styles from '../styles/Home.module.css';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export default function Home() {
  const [dailyData, setDailyData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('formList') || '[]');
    const agg = raw.reduce((acc, { DateConsultation, Montant }) => {
      const date = DateConsultation;
      const amount = Number(Montant) || 0;
      const ex = acc.find(i => i.date === date);
      if (ex) ex.total += amount;
      else acc.push({ date, total: amount });
      return acc;
    }, []);
    agg.sort((a, b) => new Date(a.date) - new Date(b.date));
    setDailyData(agg);
  }, []);

  const exportChartToExcel = async () => {
    if (!dailyData.length) {
      alert('Aucune donnée à exporter.');
      return;
    }

    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL('image/png');
    const base64 = imgData.split(',')[1];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Consommation');

    const imageId = workbook.addImage({
      base64,
      extension: 'png',
    });

    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      br: { col: 7, row: 20 }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'graphique_consommation.xlsx');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tableau de bord – Consommation Mutuelle</h1>

      <section>
        <h2>Consommation journalière/annuel</h2>
        <button onClick={exportChartToExcel} className={styles.exportBtn}>
          Exporter en Excel
        </button>
        <div ref={chartRef} className={styles.chartWrapper}>
          <DailyConsumptionChart data={dailyData} />
        </div>
      </section>
    </div>
  );
  
}
