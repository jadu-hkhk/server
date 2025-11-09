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
            id_chipId: {
              id: sensor.id as string,
              chipId: chipId
            }
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
            padding: 0;
          }

          body {
            min-height: 100vh;
            background: #faf9f6;
            color: #3d3d3d;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            padding: 2.5rem 1.5rem;
            line-height: 1.6;
          }

          header {
            text-align: center;
            margin-bottom: 3rem;
          }

          h1 {
            font-size: 1.875rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #2d2d2d;
            letter-spacing: -0.01em;
          }

          .description {
            color: #6b6b6b;
            font-size: 0.9rem;
            font-weight: 400;
          }

          #tablesGrid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 3.5rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .table-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            position: relative;
          }

          .table-label {
            font-size: 0.875rem;
            color: #6b6b6b;
            font-weight: 500;
            text-align: center;
            margin-bottom: 1.25rem;
            letter-spacing: 0.01em;
          }

          .table-layout {
            position: relative;
            width: 100%;
            max-width: 280px;
            aspect-ratio: 1;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 0.875rem;
            align-items: center;
            justify-items: center;
          }

          .table {
            grid-column: 2 / 5;
            grid-row: 2 / 5;
            width: 100%;
            height: 100%;
            background: #f0ede8;
            border-radius: 10px;
            border: 1px solid #e8e5e0;
            position: relative;
          }

          .chair {
            width: 68px;
            height: 68px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.3rem;
            transition: transform 0.15s ease, opacity 0.15s ease;
            position: relative;
            cursor: pointer;
          }

          .chair:hover {
            transform: scale(1.03);
            opacity: 0.9;
          }

          .chair-top-left { grid-column: 1; grid-row: 1; }
          .chair-top-right { grid-column: 5; grid-row: 1; }
          .chair-bottom-left { grid-column: 1; grid-row: 5; }
          .chair-bottom-right { grid-column: 5; grid-row: 5; }
          .chair-left { grid-column: 1; grid-row: 3; }
          .chair-right { grid-column: 5; grid-row: 3; }

          .chair-available {
            background: #d4edda;
            border: 1.5px solid #b8dcc4;
            color: #2d5a3d;
          }

          .chair-occupied {
            background: #f8d7da;
            border: 1.5px solid #e8bcc0;
            color: #6d3a3f;
          }

          .chair-icon {
            font-size: 1.4rem;
            opacity: 0.85;
          }

          .chair-label {
            font-size: 0.625rem;
            font-weight: 500;
            letter-spacing: 0.01em;
          }

          #emptyState {
            color: #8b8b8b;
            text-align: center;
            padding: 4rem 2rem;
            grid-column: 1 / -1;
            font-size: 0.95rem;
          }

          footer {
            text-align: center;
            color: #8b8b8b;
            font-size: 0.8125rem;
            margin-top: 4rem;
            font-weight: 400;
          }

          @media (max-width: 768px) {
            body {
              padding: 1.5rem 1rem;
            }

            h1 {
              font-size: 1.75rem;
            }

            #tablesGrid {
              grid-template-columns: 1fr;
              gap: 2.5rem;
            }

            .table-layout {
              max-width: 260px;
              gap: 0.625rem;
            }

            .chair {
              width: 60px;
              height: 60px;
            }

            .chair-icon {
              font-size: 1.35rem;
            }
          }

          @media (max-width: 480px) {
            .table-layout {
              max-width: 240px;
              gap: 0.5rem;
            }

            .chair {
              width: 55px;
              height: 55px;
            }

            .chair-icon {
              font-size: 1.25rem;
            }

            .chair-label {
              font-size: 0.6rem;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Mess Table Monitor</h1>
          <p class="description">Real-time occupancy status</p>
        </header>

        <div id="tablesGrid">
          <p id="emptyState">Waiting for status updates...</p>
        </div>

        <footer>Auto-refreshing every 5 seconds</footer>

        <script>
          const tablesGrid = document.getElementById('tablesGrid');
          const emptyState = document.getElementById('emptyState');

          const chairPositions = [
            { class: 'chair-top-left' },
            { class: 'chair-top-right' },
            { class: 'chair-right' },
            { class: 'chair-bottom-right' },
            { class: 'chair-bottom-left' },
            { class: 'chair-left' }
          ];

          async function fetchStatus() {
            try {
              const response = await fetch('/api/status');
              if (!response.ok) throw new Error('Bad response');
              const payload = await response.json();
              renderStatus(payload.chips || []);
            } catch (error) {
              console.error('Failed to fetch status', error);
              tablesGrid.innerHTML = '<p style="color: #8b5a5a; text-align: center; padding: 2rem; grid-column: 1 / -1;">Unable to load data. Check connection.</p>';
            }
          }

          function renderStatus(chips) {
            if (!chips.length) {
              tablesGrid.innerHTML = '';
              tablesGrid.appendChild(emptyState);
              emptyState.textContent = 'No chip data yet. Waiting for ESP32 to report.';
              return;
            }

            let html = '';
            chips.forEach(function(chip) {
              const sensors = chip.sensors || [];
              if (!sensors.length) return;

              // Sort sensors by ID to ensure correct chair positioning
              const sortedSensors = sensors.slice().sort(function(a, b) {
                const numA = parseInt(a.id.match(/\d+$/)?.[0] || '0') || 0;
                const numB = parseInt(b.id.match(/\d+$/)?.[0] || '0') || 0;
                return numA - numB;
              });

              html += '<div class="table-wrapper">';
              html += '<div class="table-label">Table ' + chip.id + '</div>';
              html += '<div class="table-layout">';
              html += '<div class="table"></div>';

              sortedSensors.slice(0, 6).forEach(function(sensor, index) {
                const pos = chairPositions[index] || chairPositions[index % chairPositions.length];
                const isOccupied = sensor.status;
                const chairClass = isOccupied ? 'chair-occupied' : 'chair-available';
                const statusText = isOccupied ? 'Taken' : 'Free';
                
                html += (
                  '<div class="chair ' + pos.class + ' ' + chairClass + '">' +
                    '<div class="chair-icon">🪑</div>' +
                    '<div class="chair-label">' + statusText + '</div>' +
                  '</div>'
                );
              });

              html += '</div></div>';
            });

            tablesGrid.innerHTML = html || '<p id="emptyState">No tables found.</p>';
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

    // Sort sensors by ID to ensure consistent chair positioning
    const chipsWithSortedSensors = chips.map(chip => ({
        ...chip,
        sensors: chip.sensors.sort((a, b) => {
            // Extract numeric part from sensor IDs like "chair-1", "chair-2", etc.
            const numA = parseInt(a.id.match(/\d+$/)?.[0] || '0') || 0;
            const numB = parseInt(b.id.match(/\d+$/)?.[0] || '0') || 0;
            return numA - numB;
        })
    }))

    res.status(200).json({
        message: "Data received successfully",
        chips: chipsWithSortedSensors
    })
})

app.listen(PORT, () => {
    console.log("server is listending on the port" + PORT)
})

