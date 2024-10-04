import { Router } from "express";
import { prismaClient } from "../db";
import { SeatBookingSchema } from "../types";
import { asyncHandler } from "../errorHandling/asyncHandler";
import redisClient from "../redis/redisClient";

const router = Router();

router.get('/get-booking-details/:id', asyncHandler(async(req, res) => {
    const data = await prismaClient.eventVenue.findFirst({
        where: {
            id: req.params.id,
        },
        select: {
            event: {
                select: {
                    name: true,
                    langauge: true
                },
            },
            venue: {
                select: {
                    name: true,
                    address: true,
                    city: true,
                },
            },
            date: true,
            showtime: true,
        },
    });
    if(data){
        return res.status(200).json(data);
    }
}));

router.post("/book-seat", asyncHandler(async (req, res) => {
    const body = req.body;
    const parsedData = SeatBookingSchema.safeParse(body);

    if (!parsedData.success) {
      return res.status(411).json({ message: "Invalid Input" });
    }

    const seatSelections = parsedData.data.seats.map((seat) => ({
      eventVenueId: parsedData.data.eventVenueId,
      row: seat.row,
      seatNumber: seat.seatNumber,
    }));

    try {
      const result = (await prismaClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"
        );

        const conflictingSeats = await tx.seat.findMany({
          where: {
            eventVenueId: parsedData.data.eventVenueId,
            OR: seatSelections.map((seat) => ({
              row: seat.row,
              seatNumber: seat.seatNumber,
              status: { in: ["BOOKED", "RESERVED"] },
            })),
          },
        });

        if (conflictingSeats.length > 0) {
          return res.status(409).json({ message: "Seat already booked" });
        }

        // Reserve the seats
        const reservedSeats = await Promise.all(
          seatSelections.map((seat) =>
            tx.seat.upsert({
              where: {
                eventVenueId_row_seatNumber: {
                  eventVenueId: seat.eventVenueId,
                  row: seat.row,
                  seatNumber: seat.seatNumber,
                },
              },
              update: {
                status: "RESERVED",
                version: { increment: 1 },
              },
              create: {
                eventVenueId: seat.eventVenueId,
                row: seat.row,
                seatNumber: seat.seatNumber,
                status: "RESERVED",
                version: 1,
              },
            })
          )
        );
        return reservedSeats;
      })) as { id: string }[];

      // Clear Redis cache to ensure fresh seat data for this venue
      await redisClient.del(`seatLayout:${parsedData.data?.eventVenueId}`);
      return res.status(200).json({ seatsId: result?.map((seat) => seat.id) });
    } catch (error) {
      return res.status(500).json({ message: "Error booking seats" });
    }
  })
);


//After payment confirmation
router.post("/update-seat-status", asyncHandler(async (req, res) => {
  const eventVenueId = req.body.eventVenueId;
  const seatIds = req.body.seatIds;
  
  const data = await prismaClient.seat.updateMany({
    where: {
      eventVenueId: eventVenueId,
      id: {
        in: seatIds,
      },
    },
    data: {
      status: "BOOKED",
    },
  });
  return res.status(200).json({message: "Seats booked successfully! We sent tickets on your mail!"})
}));


export const seatRouter = router;
