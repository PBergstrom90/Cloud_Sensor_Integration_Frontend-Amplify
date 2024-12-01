import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

interface WeatherOverviewProps {

}
const WeatherOverview: React.FC<WeatherOverviewProps> = () => {
  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          maxWidth: "1100px",
          display: "flex",
          justifyContent: "center",
          margin: "0 auto",
          alignItems: "center",
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            textAlign="center"
            fontFamily="inherit"
          >
            Weather Overview
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WeatherOverview;