/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `owner` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `place` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `venueCapacity` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `duration` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `eventVenueId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_eventId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "date",
DROP COLUMN "owner",
DROP COLUMN "place",
DROP COLUMN "venue",
DROP COLUMN "venueCapacity",
ADD COLUMN     "host" TEXT,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "eventId",
ADD COLUMN     "eventVenueId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVenue" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "showtime" TIMESTAMP(3) NOT NULL,
    "totalSeats" INTEGER NOT NULL,

    CONSTRAINT "EventVenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "EventVenue" ADD CONSTRAINT "EventVenue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVenue" ADD CONSTRAINT "EventVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventVenueId_fkey" FOREIGN KEY ("eventVenueId") REFERENCES "EventVenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
