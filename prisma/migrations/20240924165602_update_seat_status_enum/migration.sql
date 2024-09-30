/*
  Warnings:

  - The values [SELECTED] on the enum `SeatStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SeatStatus_new" AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED');
ALTER TABLE "Seat" ALTER COLUMN "status" TYPE "SeatStatus_new" USING ("status"::text::"SeatStatus_new");
ALTER TYPE "SeatStatus" RENAME TO "SeatStatus_old";
ALTER TYPE "SeatStatus_new" RENAME TO "SeatStatus";
DROP TYPE "SeatStatus_old";
COMMIT;
