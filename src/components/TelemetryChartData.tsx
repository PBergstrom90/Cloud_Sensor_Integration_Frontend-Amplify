import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { Line } from "react-chartjs-2";
import moment from "moment";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Telemetry {
  timestamp: number;
  temperature: number;
  humidity: number;
  device_id: string;
}

interface TelemetryChartDataProps {
  telemetries: Telemetry[];
  deleteTelemetry: (deviceId: string, timestamp: number) => void;
}

const TelemetryChartData: React.FC<TelemetryChartDataProps> = ({
  telemetries,
  deleteTelemetry,
}) => {
  const chartData = {
    labels: Array.isArray(telemetries)
      ? telemetries.map((data) => moment(data?.timestamp).format("YYYY:MM:DD HH:mm:ss"))
      : [],
    datasets: [
      {
        label: "Temperature",
        data: Array.isArray(telemetries)
          ? telemetries.map((data) => data?.temperature)
          : [],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.3)",
        fill: true,
        tension: 0.4,
        pointStyle: "circle",
        pointRadius: 4,
        pointHoverRadius: 8,
        yAxisID: "y",
      },
      {
        label: "Humidity",
        data: Array.isArray(telemetries)
          ? telemetries.map((data) => data?.humidity)
          : [],
        borderColor: "rgba(99, 255, 132, 1)",
        backgroundColor: "rgba(99, 255, 132, 0.3)",
        fill: true,
        tension: 0.4,
        pointStyle: "rectRot",
        pointRadius: 4,
        pointHoverRadius: 8,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    onClick: function (_, element) {
      if (element.length > 0) {
        const ind = element[0].index;
        deleteTelemetry(telemetries[ind].device_id, telemetries[ind].timestamp);
      }
    },
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
          label: (tooltipItem) =>
            `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
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
        text: telemetries[0]?.device_id
          ? `Device ID: ${telemetries[0]?.device_id}`
          : "Telemetry Data",
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
          color: "rgba(255, 99, 132, 0.2)",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false,
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

  return (
    <Card
      sx={{
        mb: 3,
        width: "100%",
        maxWidth: "1100px",
        backgroundColor: "#1a1a2e",
        color: "#fff",
      }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom textAlign="center">
          Live Telemetry Data
        </Typography>
        <Line data={chartData} options={chartOptions} />
      </CardContent>
    </Card>
  );
};

export default TelemetryChartData;