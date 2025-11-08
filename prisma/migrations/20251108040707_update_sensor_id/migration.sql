/*
  Warnings:

  - The primary key for the `sensor` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "sensor" DROP CONSTRAINT "sensor_pkey",
ADD CONSTRAINT "sensor_pkey" PRIMARY KEY ("id", "chipId");
