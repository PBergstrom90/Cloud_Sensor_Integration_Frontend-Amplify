import { Line } from "react-chartjs-2";
import moment from "moment";
import { ChartOptions } from "chart.js";

interface WeatherChartDataProps {
  weatherData: Array<{
    stationKey: string;
    timestamp: number | null;
    temperature?: number | null;
  }>;
  selectedStation: {
    stationKey: string;
  } | null;
}

function WeatherChartData({ weatherData, selectedStation }: WeatherChartDataProps) {
  const filteredData = weatherData.filter(
    (data) =>
      data.stationKey === selectedStation?.stationKey &&
      data.timestamp !== null &&
      data.temperature !== null
  );

  const smhiChartData = {
    labels: filteredData.map((data) =>
      moment.unix(data.timestamp as number).format("YYYY-MM-DD HH:mm:ss")
    ),
    datasets: [
      {
        label: "Temperature",
        data: filteredData.map((data) => data.temperature as number),
        borderColor: "rgba(54, 162, 235, 1)", // Blue
        backgroundColor: "rgba(54, 162, 235, 0.3)", // Light Blue
        fill: true,
        tension: 0.4,
        pointStyle: "circle",
        pointRadius: 4,
        pointHoverRadius: 8,
      },
    ],
  };

  const smhiChartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0]?.dataIndex;
            const item = filteredData[index];
            return moment.unix(item.timestamp as number).format("YYYY-MM-DD HH:mm:ss");
          },
          label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}°C`,
        },
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
      },
      title: {
        display: true,
        text: "SMHI Weather Data",
        font: {
          size: 15,
          weight: "normal",
        },
        color: "#fff",
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        grid: {
          color: "rgba(54, 162, 235, 0.2)",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  return <Line data={smhiChartData} options={smhiChartOptions} />;
}

export default WeatherChartData;