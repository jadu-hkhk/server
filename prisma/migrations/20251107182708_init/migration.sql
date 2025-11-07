-- CreateTable
CREATE TABLE "chipId" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "chipId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "chipId" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,

    CONSTRAINT "sensor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sensor" ADD CONSTRAINT "sensor_chipId_fkey" FOREIGN KEY ("chipId") REFERENCES "chipId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
