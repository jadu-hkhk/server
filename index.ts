import express from "express"
import { PrismaClient } from "./generated/prisma/client"

const prisma = new PrismaClient()

const app = express()

const PORT = 3000;
app.use(express.json())

type sensor = {
    id: string,
    status: boolean
}

const demoChips = [
    {
        id: "esp32-demo",
        sensors: [
            { sensorId: "chair-1", status: true },
            { sensorId: "chair-2", status: false },
            { sensorId: "chair-3", status: false },
            { sensorId: "chair-4", status: true }
        ]
    }
]

app.post("/data", async (req, res) => {
    const {chipId, sensors} : {chipId: string, sensors: sensor[]} = req.body

    const chip = await prisma.chipId.findUnique({
        where: {
            id: chipId
        },
        include: {
            sensors: true
        }
    })

    // create a new chip if it is not in the database
    if (!chip) {
        await prisma.chipId.create({
            data: {
                id: chipId,
                name: chipId
            }
        })

        // this is wrong, we should create the sensors one by one
        for (const sensor of sensors) {
            await prisma.sensor.create({
                data: {
                    id: sensor.id,
                    status: sensor.status,
                    chipId: chipId
                }
            })
        }
    }else {
      // this is wrong, we should update the sensors one by one
      for (const sensor of sensors) {
        await prisma.sensor.update({
          where: {
            chipId: chipId,
            id: sensor.id as string,
          },
          data: {
            status: sensor.status
          }
        })
      }
    }

    res.status(200).json({
        message: "Data received successfully"
    })
})

app.get("/", (_req, res) => {
    res.send(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mess Table Monitor</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            min-height: 100vh;
            background: linear-gradient(135deg, #1f2937, #111827);
            color: #f9fafb;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 32px 16px;
            gap: 24px;
          }

          header {
            text-align: center;
            max-width: 600px;
          }

          h1 {
            font-size: 2rem;
            margin-bottom: 8px;
          }

          p.description {
            color: #d1d5db;
            line-height: 1.5;
          }

          #tableContainer {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            width: 100%;
            max-width: 700px;
            min-height: 500px;
          }

          .table-layout {
            position: relative;
            width: 400px;
            height: 400px;
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            grid-template-rows: 1fr 2fr 1fr;
            gap: 20px;
            align-items: center;
            justify-items: center;
          }

          .table {
            grid-column: 2;
            grid-row: 2;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #4a5568, #2d3748);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #374151;
            position: relative;
          }

          .table::before {
            content: '';
            position: absolute;
            width: 80%;
            height: 80%;
            border: 2px dashed rgba(255, 255, 255, 0.1);
            border-radius: 15px;
          }

          .table-label {
            position: absolute;
            bottom: -30px;
            font-size: 0.9rem;
            color: #9ca3af;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .chair {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .chair:hover {
            transform: scale(1.1);
          }

          .chair-top {
            grid-column: 2;
            grid-row: 1;
          }

          .chair-bottom {
            grid-column: 2;
            grid-row: 3;
          }

          .chair-left {
            grid-column: 1;
            grid-row: 2;
          }

          .chair-right {
            grid-column: 3;
            grid-row: 2;
          }

          .chair-available {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2));
            border: 3px solid rgba(16, 185, 129, 0.6);
          }

          .chair-occupied {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2));
            border: 3px solid rgba(239, 68, 68, 0.6);
          }

          .chair-icon {
            font-size: 2rem;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }

          .chair-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .chair-available .chair-label {
            color: #6ee7b7;
          }

          .chair-occupied .chair-label {
            color: #fca5a5;
          }

          .status-indicator {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid #1f2937;
          }

          .chair-available .status-indicator {
            background: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
          }

          .chair-occupied .status-indicator {
            background: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
          }

          #emptyState {
            color: #9ca3af;
            text-align: center;
            padding: 40px;
          }

          footer {
            margin-top: auto;
            color: #6b7280;
            font-size: 0.85rem;
          }

          @media (max-width: 600px) {
            .table-layout {
              width: 300px;
              height: 300px;
            }

            .chair {
              width: 60px;
              height: 60px;
            }

            .chair-icon {
              font-size: 1.5rem;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Mess Table Occupancy</h1>
          <p class="description">
            Live overview of table occupancy. Chairs are arranged around the table.
          </p>
        </header>

        <div id="tableContainer">
          <p id="emptyState">Waiting for status updates...</p>
        </div>

        <footer>Auto-refreshing every 5 seconds</footer>

        <script>
          const tableContainer = document.getElementById('tableContainer');
          const emptyState = document.getElementById('emptyState');

          const chairPositions = ['top', 'right', 'bottom', 'left'];
          const chairIcons = {
            top: '🪑',
            right: '🪑',
            bottom: '🪑',
            left: '🪑'
          };

          async function fetchStatus() {
            try {
              const response = await fetch('/api/status');
              if (!response.ok) {
                throw new Error('Bad response');
              }

              const payload = await response.json();
              renderStatus(payload.chips || []);
            } catch (error) {
              console.error('Failed to fetch status', error);
              tableContainer.innerHTML = '<p style="color: #f87171;">Unable to load data from the chip. Check connection.</p>';
            }
          }

          function renderStatus(chips) {
            if (!chips.length || !chips[0].sensors || !chips[0].sensors.length) {
              tableContainer.innerHTML = '';
              tableContainer.appendChild(emptyState);
              emptyState.textContent = 'No chip data yet. Waiting for the ESP32 to report.';
              return;
            }

            const chip = chips[0];
            const sensors = chip.sensors || [];
            
            let chairsHtml = '<div class="table-layout">';
            chairsHtml += '<div class="table"><div class="table-label">Table</div></div>';

            sensors.forEach(function(sensor, index) {
              const position = chairPositions[index % chairPositions.length];
              const isOccupied = sensor.status;
              const chairClass = isOccupied ? 'chair-occupied' : 'chair-available';
              const statusText = isOccupied ? 'Occupied' : 'Available';
              
              chairsHtml += (
                '<div class="chair chair-' + position + ' ' + chairClass + '">' +
                  '<div class="status-indicator"></div>' +
                  '<div class="chair-icon">' + chairIcons[position] + '</div>' +
                  '<div class="chair-label">' + statusText + '</div>' +
                '</div>'
              );
            });

            chairsHtml += '</div>';
            tableContainer.innerHTML = chairsHtml;
          }

          fetchStatus();
          setInterval(fetchStatus, 5000);
        </script>
      </body>
    </html>`)
})

app.get("/api/status", async (_req, res) => {
    const chips = await prisma.chipId.findMany({
        include: {
            sensors: true
        }
    })

    res.status(200).json({
        message: "Data received successfully",
        chips: chips
    })
})

app.listen(PORT, () => {
    console.log("server is listending on the port" + PORT)
})

