import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import moment from "moment";
import { useAuthenticator } from "@aws-amplify/ui-react";
import type { Schema } from "../amplify/data/resource";
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
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const client = generateClient<Schema>();


function App() {
  const [telemetries, setTelemetry] = useState<Array<Schema["telemetry"]["type"]>>([]);
  const [devices, setDevices] = useState<Array<Schema["devices"]["type"]>>([]);
  const [weatherStationData, setWeatherStationData] = useState<Array<Schema["weatherStationData"]["type"]>>([]);
  const { user, signOut } = useAuthenticator();

  useEffect(() => {
    client.models.weatherStationData.observeQuery().subscribe({
      next: (data) => {
        console.log("Weather Station Data:", data.items);
        setWeatherStationData([...data.items]);
      },
    });
  }, []);
  

  useEffect(() => {
    client.models.telemetry.observeQuery().subscribe({
      next: (data) => setTelemetry([...data.items]),
    });

    client.models.devices.observeQuery().subscribe({
      next: (data) => setDevices([...data.items]),
    });
  }, []);

  const createDevice = () => {
    const device = String(window.prompt("Device ID"));
    if (device) {
      client.models.devices.create({ device_id: device, owner: user.userId });
    }
  };

  const deleteDevice = (device_id: string) => {
    client.models.devices.delete({ device_id });
  };

  const fetchWeatherData = async () => {
    const API_GATEWAY_URL =
      "https://4b2wryytb8.execute-api.eu-central-1.amazonaws.com/default/amplify-d3c0g3rqfmqtvl-ma-smhiWeatherTelemetrylamb-sZKmSo6ygs8m";
  
    try {
      const response = await fetch(API_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to trigger Lambda: ${response.statusText}`);
      }
  
    // Re-fetch weather station data
    const weatherStationSubscription = client.models.weatherStationData.observeQuery();
    weatherStationSubscription.subscribe({
      next: (snapshot) => {
        console.log("Updated Weather Station Data:", snapshot.items);
        setWeatherStationData([...snapshot.items]);
      },
    });
  } catch (error) {
    console.error(error);
  }
}
  

  const chartData = {
    labels: telemetries.map((data) => moment(data?.timestamp).format("HH:mm:ss")),
    datasets: [
      {
        label: "Temperature",
        data: telemetries.map((data) => data?.temperature),
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
        data: telemetries.map((data) => data?.humidity),
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
          label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
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

  const smhiChartData = {
    labels: weatherStationData.map((data) =>
      moment(data?.timestamp).format("HH:mm:ss")),
    datasets: [
      {
        label: "SMHI Temperature",
        data: weatherStationData.map((data) => data.temperature),
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
          label: (tooltipItem) =>
            `${tooltipItem.dataset.label}: ${tooltipItem.raw}°C`,
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
  
  return (
    <PerfectScrollbar>
    <Box p={6} sx={{ display: "flex", 
    flexDirection: "column", 
    alignItems: "center" }}>
      {/* Overview Section */}
      <Card sx={{ 
        mb: 3, 
        width: "100%",
        backgroundColor: "#1a1a2e", 
        maxWidth: "1100px", 
        display: "flex", 
        justifyContent: "center", 
        margin: "0auto", 
        alignItems: "center" }}>
        <CardContent>
          <Typography variant="h4" gutterBottom textAlign="center" fontFamily="inherit">
            Overview
          </Typography>
          <Box
          sx={{
          mb: 1,
          display: "flex",
          flexDirection: "line",
          margin: "0auto",
          justifyContent: "space-around",
          gap: 15,
          alignItems: "center",
          textAlign: "center",
        }}
    >
      <Box textAlign="center">
        <Typography variant="h5">User</Typography>
        <Typography variant="body1">{user?.signInDetails?.loginId || "N/A"}</Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="h5">Temperature</Typography>
        <Typography variant="body1">
          {telemetries[telemetries.length - 1]?.temperature || "N/A"} °C
        </Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="h5">Humidity</Typography>
        <Typography variant="body1">
          {telemetries[telemetries.length - 1]?.humidity || "N/A"} %
        </Typography>
      </Box>
    </Box>
  </CardContent>
</Card>

{/* Devices Section */}
<Box sx={{ 
  mb: 3, 
  width: "100%",
  maxWidth: "1000px", 
  margin: "0auto" }}>
  <Typography variant="h4" gutterBottom textAlign="left">
    Devices
  </Typography>
  <Box display="flex" justifyContent="left" mb={2}>
    <Button variant="contained" color="primary" onClick={createDevice}>
      Add Device
    </Button>
  </Box>
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 2,     
      justifyContent: "left",
    }}
  >
    {devices.map((device, index) => (
      <Box
        key={index}
        sx={{
          width: "100%",
          maxWidth: "300px",
          flex: "1 1 calc(33.333% - 16px)",
          display: "flex",
        }}
      >
        <Card sx={{ width: "100%", backgroundColor: "#1b1b1b" }}>
          <CardContent>
            <Typography variant="h6">
              Device ID: {device.device_id}
            </Typography>
            <Typography sx={{ mt: 0.5 }}>
              Last Seen:{" "}
              {moment(telemetries[telemetries.length - 1]?.timestamp).fromNow()}
            </Typography>
            <Typography sx={{ mt: 1 }}>
              Status:{" "}
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor:
                    device.status === "connected" ? "green" : "red",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                {device.status === "connected" ? "Connected" : "Disconnected"}
              </Box>
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              color="secondary"
              onClick={() => deleteDevice(device.device_id)}
            >
              Delete Device
            </Button>
          </CardContent>
        </Card>
      </Box>
    ))}
  </Box>
</Box>
  
{/* Telemetry Chart Section */}
<Card sx={{ 
  mb: 3, 
  width: "110%", 
  maxWidth: "1100px", 
  backgroundColor: "#1a1a2e", 
  color: "#fff" }}>
  <CardContent>
    <Typography variant="h5" gutterBottom textAlign="center">
      Live Telemetry Data
    </Typography>
    <Line data={chartData} options={chartOptions} />
  </CardContent>
</Card>

{/* SMHI Weather Data Chart Section */}
<Card
  sx={{
    mb: 3,
    width: "110%",
    maxWidth: "1100px",
    backgroundColor: "#1a1a2e",
    color: "#fff",
  }}
>
  <CardContent>
  <Typography variant="subtitle1" textAlign="center">
    Station: {weatherStationData[0]?.stationName || "N/A"} <br />
    Location: {weatherStationData[0]?.latitude}, {weatherStationData[0]?.longitude}
  </Typography>
    <Line data={smhiChartData} options={smhiChartOptions} />
  </CardContent>
</Card>

<Button
  variant="contained"
  color="primary"
  onClick={fetchWeatherData}
>
  Fetch SMHI Weather Data
</Button>


{/* Sign Out Button */}
<Button variant="contained" color="secondary" 
  sx={{ 
    width: "100%", 
    maxWidth: "200px", 
    textAlign: "center" }} 
  onClick={signOut}>
        Sign Out
      </Button>
    </Box>
    </PerfectScrollbar>
  );
}
export default App;