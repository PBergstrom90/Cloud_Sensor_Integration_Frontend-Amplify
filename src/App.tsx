import { 
  useEffect, 
  useState,
} from "react";
import { generateClient } from "aws-amplify/data";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { type Schema } from "../amplify/data/resource";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import 'react-perfect-scrollbar/dist/css/styles.css';
import { SelectField } from '@aws-amplify/ui-react';

import DeviceOverview from "./components/DeviceOverview";
import DevicesSection from "./components/DevicesSection";
import TelemetryChartData from "./components/TelemetryChartData";
import WeatherChartData from "./components/WeatherChartData";
import WeatherMap from "./components/WeatherMap";
import WeatherOverview from "./components/WeatherOverview";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherStation {
  stationKey: string;
  stationName: string;
  latitude: number;
  longitude: number;
}

const client = generateClient<Schema>();

function App() {
  const [telemetries, setTelemetry] = useState<Array<Omit<Schema["telemetry"]["type"], "temperature" | "humidity"> & { temperature: number; humidity: number }>>([]);
  const [devices, setDevices] = useState<Array<Omit<Schema["devices"]["type"], "status"> & { status: string }>>([]);
  const [weatherData, setWeatherData] = useState<Array<Schema["weatherData"]["type"]>>([]);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [stations, setStations] = useState<Array<{ stationKey: string; label: string }>>([]);

  const {user, signOut } = useAuthenticator();
  const [isLoading, setIsLoading] = useState(false);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  useEffect(() => {
    client.models.weatherData.observeQuery().subscribe({
      next: (data) => setWeatherData([...data.items]),
    });
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const result = await client.models.weatherStation.list();
        // Fetch dynamic station names and add them to stations
        const fetchedStations = await Promise.all(
          result.data.map(async (station) => {
            let stationName = station.stationKey; // Default to stationKey if no name found
            try {
              const smhiResponse = await fetch(
                `https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/${station.stationKey}/period/latest-hour/data.json`
              );
              const smhiData = await smhiResponse.json();
              stationName = smhiData.station?.name || stationName;
            } catch (error) {
              console.error(`Failed to fetch station name for ${station.stationKey}`, error);
            }
            return {
              ...station,
              label: stationName,
            };
          })
        );
        setStations(fetchedStations);
        console.log("Fetched stations with dynamic labels:", fetchedStations);
      } catch (error) {
        console.error("Error fetching stations:", error);
        setStations([]); // Fallback to an empty array on error
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    client.models.telemetry.observeQuery().subscribe({
      next: (data) => setTelemetry(data.items.map(item => ({
        ...item,
        temperature: item.temperature ?? 0,
        humidity: item.humidity ?? 0,
      }))),
    });
    client.models.devices.observeQuery().subscribe({
      next: (data) => setDevices(data.items.map(item => ({
        ...item,
        status: item.status ?? "unknown",
      }))),
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

  const deleteTelemetry = (device_id: string, timestamp: number) => {
    client.models.telemetry.delete({ device_id, timestamp });
  };

  const createStation = () => {
    const newStationKey = String(window.prompt("Enter a new Station Key"));
    if (newStationKey) {
      client.models.weatherStation
        .create({ stationKey: newStationKey, owner: user.userId })
        .then(() => {
          console.log("Weather station created successfully.");
          setSnackbarMessage("Weather station created successfully!");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
    })
    .catch((error) => {
      setSnackbarMessage("Error creating weather station. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      console.error("Error creating weather station:", error);
    });
    }
  };

const fetchWeatherData = async () => {
  const API_GATEWAY_URL =
    "https://4b2wryytb8.execute-api.eu-central-1.amazonaws.com/default/amplify-d3c0g3rqfmqtvl-ma-smhiWeatherTelemetrylamb-sZKmSo6ygs8m";
    setIsLoading(true);
  try {
    if (!selectedStation?.stationKey) {
      throw new Error("No station selected. Please select a station.");
    }
    const payload = { stationKey: selectedStation.stationKey };
    const response = await fetch(API_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("Weather data fetched:", data);
    
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format: Weather data is not an array.");
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    
    setWeatherData(data.map((item: any) => ({
      ...item,
      temperature: item.temperature ?? undefined,
    })));
    setSnackbarMessage("Weather data fetched successfully!");
    setSnackbarSeverity("success")
    console.log("Weather data fetch triggered successfully.");
    
    // Reload the page to update the map (TEMPORARY FIX, can be improved in the future)
    window.location.reload();

  } catch (error) {
    if (error instanceof Error) {
      setSnackbarMessage(error.message || "Failed to fetch weather data.");
    }
    setSnackbarSeverity("error");
    console.error("Error fetching weather data:", error);
  } finally {
    setIsLoading(false);
    setSnackbarOpen(true);
  }
};

{/* App Frontend */}
return (
<Box p={6} sx={{ 
  display: "flex", 
  flexDirection: "column", 
  flexShrink: 0,
  alignItems: "center",
  gap: 4,
  }}>
<Snackbar
  open={snackbarOpen}
  autoHideDuration={3000} // Closes after 3 seconds
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
<Alert
onClose={() => setSnackbarOpen(false)}
severity={snackbarSeverity}
sx={{ width: "80%" }}
  >
  {snackbarMessage}
</Alert>
</Snackbar>
  
{/* Overview Section */}
  <DeviceOverview
  user={user}
  telemetries={telemetries}
  isLoading={isLoading}
/>

{/* Devices Section */}
<DevicesSection
  devices={devices}
  telemetries={telemetries}
  createDevice={createDevice}
  deleteDevice={deleteDevice}
/>
  
{/* Telemetry Chart Section */}
<TelemetryChartData 
  telemetries={telemetries} 
  deleteTelemetry={deleteTelemetry} 
  />

{/*Open Weather Data API Section*/}
<WeatherOverview 
/>


{/* SMHI Weather Data Chart Section */}
{weatherData && weatherData.length > 0 ? (
  <Card
    sx={{
      width: "80%",
      maxWidth: "1100px",
      backgroundColor: "#1a1a2e",
      color: "#fff",
    }}
  >
    <CardContent>
      <div style={{ color: "white" }}>
        <label style={{ color: "white" }}>Select SMHI Weather Station</label>
        <SelectField
          label=""
          disabled={isLoading}
          placeholder="Please select a station"
          value={selectedStation?.stationKey || ""}
          onChange={(e) => {
            const selectedKey = e.target.value;
            const selectedWeatherData = weatherData.find(
              (data) => data.stationKey === selectedKey
            );
            setSelectedStation({
              stationKey: selectedKey,
              stationName: selectedWeatherData?.stationName || "Unknown Station",
              latitude: selectedWeatherData?.latitude ?? 59.3293, // Default latitude
              longitude: selectedWeatherData?.longitude ?? 18.0686, // Default longitude
            });
          }}
          >
  {stations.map((station) => (
  <option key={station.stationKey} value={station.stationKey}>
  {station.label}
  </option>
  ))}
  </SelectField>
      </div>
      <Typography variant="subtitle1" textAlign="center">
        Station: {selectedStation?.stationName || "N/A"} <br />
        Location 'latitude': {selectedStation?.latitude}, 'longitude':{" "}
        {selectedStation?.longitude}
      </Typography>
      <WeatherChartData
        weatherData={weatherData}
        selectedStation={selectedStation}
      />
    </CardContent>
  </Card>
) : (
  <Card
    sx={{
      width: "60%",
      maxWidth: "1100px",
      backgroundColor: "#1a1a2e",
      color: "#fff",
      textAlign: "center",
      padding: "20px",
    }}
  >
    <Typography variant="h6" color="error">
      No weather data available. Please fetch data or select a valid station.
    </Typography>
  </Card>
)}

<Button
variant="contained"
color="primary"
disabled={isLoading}
onClick={fetchWeatherData}
>
{isLoading ? <CircularProgress size={20} /> : "Fetch SMHI Weather Data"}
</Button>

{/* Map Section */}
<WeatherMap selectedStation={selectedStation} weatherData={weatherData} />

<Button onClick={createStation} variant="contained" color="primary">
Create Weather Station (Work in Progress)
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
);
}
export default App;