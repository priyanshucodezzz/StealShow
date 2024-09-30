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

router.post('/book-seat',asyncHandler(async(req, res)=> {
  const body = req.body;
  const parsedData = SeatBookingSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({ message: "Invalid Input" });
  };
  
  await redisClient.del(`seatLayout:${parsedData.data?.eventVenueId}`);

  const seatSelections = parsedData.data.seats.map((seat) => ({
      row: seat.row,
      seatNumber: seat.seatNumber,
  }));

  const bookedSeats = await prismaClient.seat.findFirst({
      where: {
          eventVenueId: parsedData.data.eventVenueId,
          OR: seatSelections.map((seat) => ({
              row: seat.row,
              seatNumber: seat.seatNumber,
              status: { in: ["BOOKED", "RESERVED"] }
          })),
      }
  })

  if (bookedSeats) {
      return res.status(409).json({message: "Seat already booked"});
  }

  const reservedSeats = await Promise.all(
      seatSelections.map((seat) =>
        prismaClient.seat.create({
          data: {
            eventVenueId: parsedData.data.eventVenueId,
            row: seat.row,
            seatNumber: seat.seatNumber,
            status: "RESERVED",
          },
        })
      )
  );

  return res.status(200).json({ seatsId: reservedSeats.map(item => item.id)});
}));


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
