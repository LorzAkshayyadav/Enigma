import { useState, useEffect, useRef } from "react";
import "./App.css";
import toast from 'react-hot-toast';
import Plot from "react-plotly.js";
import RealTimeChart from "./RealTimeChart"; 
import { Toaster } from 'react-hot-toast';
function App() {
  const [instruments, setInstruments] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const ws = useRef(null);
  useEffect(() => {
    const connectWebSocket = () => {
      if (ws.current) return;
  
      ws.current = new WebSocket("ws://localhost:5002");
  
      ws.current.onopen = () => {
        console.log("Connected to WebSocket server");
        
      };
  
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("WebSocket Data Received:", data);
        if (data.type === "initialData") {
          if (data?.instruments && Object.keys(data.instruments).length !== Object.keys(instruments).length) {
            toast.success(`${Object.keys(data.instruments).length} Instruments mounted.`);
          }
          setInstruments(data.instruments);
        }
      
        if (data.type === "update") {
          // if(data?.instruments)
          // {
          //   toast.success(`Data Updating in real time`);
          // }
          setInstruments((prev) => ({
            ...prev,
            ...data.instruments,
          }));
      
          if (selectedInstrument?.id && data.instruments[selectedInstrument.id]) {
            setSelectedInstrument(data.instruments[selectedInstrument.id]);
          }
        }
      };
      
  
      ws.current.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting in 3 seconds...");
        setTimeout(connectWebSocket, 3000);
      };
    };
  
    connectWebSocket();
  
  
  }, [selectedInstrument]); 
   
  
  const handleWriteDataChange = (instrumentId, key, value) => {
    setInstruments((prevInstruments) => {
      const updatedInstruments = {
        ...prevInstruments,
        [instrumentId]: {
          ...prevInstruments[instrumentId],
          readData: {
            ...prevInstruments[instrumentId].readData,
            [key]: Number(value),
          },
        },
      };

      return updatedInstruments;
    });
    setSelectedInstrument((prev) => ({
      ...prev,
      readData: {
        ...prev.readData,
        [key]: Number(value),
      },
    }));

    ws.current.send(
      JSON.stringify({
        type: "updateWriteData",
        instrumentId,
        key,
        value: Number(value),
      })
    );
  };

  return (
    <>
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        ></Toaster>
      </div>
      <div className="Button-Container">
        <button onClick={() => setActiveSection("Instruments")}>Instruments</button>
        <button onClick={() => setActiveSection("ReadData")}>Read Data</button>
        <button onClick={() => setActiveSection("WriteData")}>Write Data</button>
        {/* <button onClick={() => setActiveSection("PlotData")}>Plot Data</button>  */}
      </div>

      {activeSection === "Instruments" && (
        <div className="Instrument">
          <table className="table" border={4}>
            <thead>
              <tr>
                <th>Instrument No</th>
                <th>Instrument Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(instruments).map((instrument) => (
                <tr key={instrument.id}>
                  <td>{instrument.id}</td>
                  <td>
                    <button onClick={() => {
                      setSelectedInstrument(instrument);
                      setActiveSection("readWriteData");
                    }}>
                      {instrument.name}
                    </button>
                  </td>
                  <td>{instrument.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        {selectedInstrument && activeSection === "readWriteData" && (
          <div>
            <h2>{selectedInstrument.name}</h2>
            <div className="data-container">
              <Table title="Read Data" data={selectedInstrument.readData} />
              <Table1
                title="Write Data"
                data={selectedInstrument.readData}
                onDataChange={(key, value) => handleWriteDataChange(selectedInstrument.id, key, value)}
              />
              <RealTimeChart instrumentId={selectedInstrument.id} ws={ws.current} />
            </div>
          </div>
        )}
      </div>

      {selectedInstrument && activeSection === "ReadData" && (
        <div>
          <h2>{selectedInstrument.name}</h2>
          <div className="data-container">
            <Table title="Read Data" data={selectedInstrument.readData} />
          </div>
        </div>
      )}

      {selectedInstrument && activeSection === "WriteData" && (
        <div>
          <h2>{selectedInstrument.name}</h2>
          <div className="data-container">
            <Table1
              title="Write Data"
              data={selectedInstrument.readData}
              onDataChange={(key, value) => handleWriteDataChange(selectedInstrument.id, key, value)}
            />
          </div>
        </div>
      )}
       {selectedInstrument && activeSection === "PlotData" && (
         <RealTimeChart instrumentId={selectedInstrument.id} ws={ws.current} />
      )}
    </>
  );
}

function Table({ title, data }) {
  return (
    <div>
      <h3>{title}</h3>
      <table className="table" border="4">
        <thead>
          <tr>
            <th>Attributes</th>
            <th>Value</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value], index) => (
            <tr key={index}>
              <td>{key}</td>
              <td>{value}</td>
              <td>Active</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Table1({ title, data, onDataChange }) {
  return (
    <div>
      <h3>{title}</h3>
      <table className="table" border="4">
        <thead>
          <tr>
            <th>Attributes</th>
            <th>Value</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value], index) => (
            <tr key={index}>
              <td>{key}</td>
              <td>
                <input
                  type="number"
                  value={value || 0}
                  onChange={(e) => onDataChange(key, e.target.value)}
                />
              </td>
              <td>Active</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
