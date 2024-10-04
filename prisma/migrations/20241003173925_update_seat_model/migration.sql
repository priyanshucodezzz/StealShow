/*
  Warnings:

  - A unique constraint covering the columns `[eventVenueId,row,seatNumber]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Seat_eventVenueId_row_seatNumber_key" ON "Seat"("eventVenueId", "row", "seatNumber");
