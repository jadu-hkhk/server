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
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            padding: 3rem 1.5rem;
            position: relative;
          }

          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }

          body > * {
            position: relative;
            z-index: 1;
          }

          header {
            text-align: center;
            margin-bottom: 3rem;
          }

          h1 {
            font-size: 2.25rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
          }

          .description {
            color: #94a3b8;
            font-size: 1rem;
            font-weight: 400;
          }

          #tablesGrid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
            max-width: 1400px;
            margin: 0 auto;
          }

          .table-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
            padding: 1.5rem;
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .table-wrapper:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            border-color: rgba(255, 255, 255, 0.15);
          }

          .table-label {
            font-size: 0.875rem;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
          }

          .table-layout {
            position: relative;
            width: 100%;
            max-width: 300px;
            aspect-ratio: 1;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 1rem;
            align-items: center;
            justify-items: center;
          }

          .table {
            grid-column: 2 / 5;
            grid-row: 2 / 5;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, #1e293b, #0f172a);
            border-radius: 16px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
              inset 0 2px 8px rgba(0, 0, 0, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.2);
            position: relative;
            overflow: hidden;
          }

          .table::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60%;
            height: 60%;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
          }

          .chair {
            width: 75px;
            height: 75px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            cursor: pointer;
          }

          .chair:hover {
            transform: translateY(-6px) scale(1.08);
          }

          .chair-top-left { grid-column: 1; grid-row: 1; }
          .chair-top-right { grid-column: 5; grid-row: 1; }
          .chair-bottom-left { grid-column: 1; grid-row: 5; }
          .chair-bottom-right { grid-column: 5; grid-row: 5; }
          .chair-left { grid-column: 1; grid-row: 3; }
          .chair-right { grid-column: 5; grid-row: 3; }

          .chair-available {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: 2px solid #10b981;
            box-shadow: 
              0 4px 16px rgba(34, 197, 94, 0.3),
              0 0 0 0 rgba(34, 197, 94, 0.4);
          }

          .chair-available:hover {
            box-shadow: 
              0 8px 24px rgba(34, 197, 94, 0.4),
              0 0 0 4px rgba(34, 197, 94, 0.2);
          }

          .chair-occupied {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border: 2px solid #f87171;
            box-shadow: 
              0 4px 16px rgba(239, 68, 68, 0.3),
              0 0 0 0 rgba(239, 68, 68, 0.4);
          }

          .chair-occupied:hover {
            box-shadow: 
              0 8px 24px rgba(239, 68, 68, 0.4),
              0 0 0 4px rgba(239, 68, 68, 0.2);
          }

          .chair-icon {
            font-size: 1.75rem;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            transition: transform 0.3s ease;
          }

          .chair:hover .chair-icon {
            transform: scale(1.1);
          }

          .chair-label {
            font-size: 0.7rem;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            letter-spacing: 0.05em;
          }

          #emptyState {
            color: #64748b;
            text-align: center;
            padding: 4rem 2rem;
            grid-column: 1 / -1;
            font-size: 1rem;
          }

          footer {
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
            margin-top: 4rem;
            font-weight: 400;
          }

          @media (max-width: 768px) {
            body {
              padding: 2rem 1rem;
            }

            h1 {
              font-size: 1.875rem;
            }

            #tablesGrid {
              grid-template-columns: 1fr;
              gap: 2rem;
            }

            .table-wrapper {
              padding: 1.25rem;
            }

            .table-layout {
              max-width: 260px;
              gap: 0.875rem;
            }

            .chair {
              width: 65px;
              height: 65px;
            }

            .chair-icon {
              font-size: 1.5rem;
            }
          }

          @media (max-width: 480px) {
            .table-layout {
              max-width: 240px;
              gap: 0.75rem;
            }

            .chair {
              width: 60px;
              height: 60px;
            }

            .chair-icon {
              font-size: 1.35rem;
            }

            .chair-label {
              font-size: 0.65rem;
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
              tablesGrid.innerHTML = '<p style="color: #f87171; text-align: center; padding: 2rem; grid-column: 1 / -1;">Unable to load data. Check connection.</p>';
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

              html += '<div class="table-wrapper">';
              html += '<div class="table-label">Table ' + chip.id + '</div>';
              html += '<div class="table-layout">';
              html += '<div class="table"></div>';

              sensors.slice(0, 6).forEach(function(sensor, index) {
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

    res.status(200).json({
        message: "Data received successfully",
        chips: chips
    })
})

app.listen(PORT, () => {
    console.log("server is listending on the port" + PORT)
})

