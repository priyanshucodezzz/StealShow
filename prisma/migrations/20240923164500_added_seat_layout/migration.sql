-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'SELECTED', 'BOOKED');

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "seatLayout" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "eventVenueId" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_eventVenueId_fkey" FOREIGN KEY ("eventVenueId") REFERENCES "EventVenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
