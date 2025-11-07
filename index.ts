import express from "express"
import { PrismaClient } from "./generated/prisma/client"

const prisma = new PrismaClient()

const app = express()

const PORT = 5000;
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
    const {chipId, sersors} : {chipId: string, sersors: sensor[]} = req.body

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

        await prisma.sensor.createMany({
            data: sersors.map((sensor: sensor) => ({
                sensorId: sensor.id,
                status: sensor.status,
                chipId: chipId
            }))
        })
    }else {
        await prisma.sensor.updateMany({
            where: {
                chipId: chipId
            },
            data: sersors.map((sensor: sensor) => ({
                status: sensor.status
            }))
        })
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

          #statusGrid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
            width: 100%;
            max-width: 800px;
          }

          .chip-card {
            background: rgba(31, 41, 55, 0.85);
            border-radius: 12px;
            padding: 24px 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: transform 0.2s ease;
          }

          .chip-card:hover {
            transform: translateY(-4px);
          }

          .chip-title {
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            font-size: 0.9rem;
            color: #9ca3af;
          }

          .chair {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #111827;
            border-radius: 10px;
            padding: 12px 14px;
          }

          .chair-name {
            font-weight: 500;
          }

          .status-pill {
            font-size: 0.85rem;
            padding: 6px 12px;
            border-radius: 999px;
            font-weight: 600;
            letter-spacing: 0.03em;
          }

          .occupied {
            background: rgba(239, 68, 68, 0.18);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.35);
          }

          .available {
            background: rgba(16, 185, 129, 0.18);
            color: #6ee7b7;
            border: 1px solid rgba(16, 185, 129, 0.35);
          }

          footer {
            margin-top: auto;
            color: #6b7280;
            font-size: 0.85rem;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Mess Table Occupancy</h1>
          <p class="description">
            Live overview of each chair tracked by the ESP32 chip. A table uses a
            single chip; each sensor represents one chair's current status.
          </p>
        </header>

        <div id="statusGrid">
          <p id="emptyState">Waiting for status updates...</p>
        </div>

        <footer>Auto-refreshing every 5 seconds · Demo ready</footer>

        <script>
          const statusGrid = document.getElementById('statusGrid');
          const emptyState = document.getElementById('emptyState');

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
              statusGrid.innerHTML = '<p style="color: #f87171;">Unable to load data from the chip. Check connection.</p>';
            }
          }

          function renderStatus(chips) {
            if (!chips.length) {
              statusGrid.innerHTML = '';
              statusGrid.appendChild(emptyState);
              emptyState.textContent = 'No chip data yet. Waiting for the ESP32 to report.';
              return;
            }

            statusGrid.innerHTML = chips
              .map(function (chip) {
                const sensors = chip.sensors || [];

                const sensorMarkup = sensors
                  .map(function (sensor) {
                    const isOccupied = sensor.status;
                    return (
                      '<div class="chair">' +
                        '<span class="chair-name">Chair ' + sensor.sensorId + '</span>' +
                        '<span class="status-pill ' + (isOccupied ? 'occupied' : 'available') + '">' +
                          (isOccupied ? 'Occupied' : 'Available') +
                        '</span>' +
                      '</div>'
                    );
                  })
                  .join('');

                return (
                  '<section class="chip-card">' +
                    '<div class="chip-title">Chip ' + chip.id + '</div>' +
                    '<div>' + (sensorMarkup || '<p>No sensors registered.</p>') + '</div>' +
                  '</section>'
                );
              })
              .join('');
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

