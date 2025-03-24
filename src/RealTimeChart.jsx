import { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";

const RealTimeChart = ({ instrumentId, ws }) => {
  const [dataPoints, setDataPoints] = useState({ x: [], position: [], velocity: [] });
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!ws || !instrumentId) return;

    const handleDataUpdate = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "update" && data.instruments?.[instrumentId]) {
          const position = data.instruments[instrumentId].readData?.["Actual Position"] ?? 0;
          const velocity = data.instruments[instrumentId].readData?.["Actual Velocity"] ?? 0;
          const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
          setDataPoints((prev) => ({
            x: [...prev.x, elapsedTime],
            position: [...prev.position, position],
            velocity: [...prev.velocity, velocity],
          }));
        }
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };

    ws.addEventListener("message", handleDataUpdate);
    return () => ws.removeEventListener("message", handleDataUpdate);
  }, [ws, instrumentId]);

  return (
    <div>
      <h3>Real-Time Position & Velocity Plot</h3>
      <Plot
        data={[
          {
            x: dataPoints.x,
            y: dataPoints.position,
            type: "scatter",
            mode: "lines",
            name: "Position",
            marker: { color: "red" },
          },
          {
            x: dataPoints.x,
            y: dataPoints.velocity,
            type: "scatter",
            mode: "lines",
            name: "Velocity",
            marker: { color: "blue" },
          }
        ]}
        layout={{
          title: "Actual Position & Velocity vs Time",
          xaxis: { title: "Time (s)" },
          yaxis: { title: "Values" },
        }}
      />
    </div>
  );
};

export default RealTimeChart;