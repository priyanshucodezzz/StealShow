import { Router } from "express";
import { prismaClient } from "../db";
import { VenueSchema } from "../types";
import { asyncHandler } from "../errorHandling/asyncHandler";
import { authMiddleware } from "../middleware";
import redisClient from "../redis/redisClient";

const router = Router();

router.post("/create", authMiddleware, asyncHandler(async (req, res) => {
    const body = req.body;
    const parsedData = VenueSchema.safeParse(body);
  
    if (!parsedData.success) {
      return res.status(411).json({ message: "Invalid Input" });
    }
  
    await prismaClient.venue.create({
      data: {
        name: parsedData.data.name,
        city: parsedData.data.city,
        address: parsedData.data.address,
        capacity: parsedData.data.capacity,
        seatLayout: parsedData.data.seatLayout
      }
    });
  
    return res.json({
      message: "Venue added successfully!",
    });
}));

//Fetch selected event venues of single City
router.get("/get/event/:id/:city/:date", asyncHandler(async (req, res) => {
   const eventId = req.params.id;
   const city = req.params.city;
   const selectedDate = new Date(req.params.date);
   
   const startOfDay = new Date(selectedDate);
   const endOfDay = new Date(selectedDate);
   endOfDay.setDate(endOfDay.getDate() + 1);
 
   const venues = await prismaClient.eventVenue.findMany({
     where: {
       eventId: eventId,
       venue: {
         city: city,
       },
       date: {
         gte: startOfDay,
         lt: endOfDay,
       },
     },
     select: {
       id: true,
       date: true,
       showtime: true,
       totalSeats: true,
       event: {
         select: {
           name: true,
           category: true,
           langauge: true,
         },
       },
       venue: {
         select: {
           id: true,
           name: true,
           city: true,
           address: true,
         },
       },
     },
   });
 
   return res.json({
     venues,
   });
 }));


//Seat layout
router.get('/get/seatLayout/:id/:eventvenueid', asyncHandler(async(req , res) => {
  const venueId = req.params.id;
  const eventVenueId = req.params.eventvenueid;

  const cacheData = await redisClient.get(`seatLayout:${eventVenueId}`);
  if(cacheData){
    const parsedData = JSON.parse(cacheData);
    return res.json(parsedData);
  }

  const seatLayout = await prismaClient.venue.findFirst({
    where: {
      id: venueId
    },
    select: {
      seatLayout: true
    }
  });

  const eventDetails = await prismaClient.eventVenue.findFirst({
    where: {
      id: eventVenueId
    },
    select: {
      event: {
          select: {
              name: true,
          },
      },
      venue: {
          select: {
              name: true,
              address: true,
          },
      },
      date: true,
      showtime: true,
    },
  });

  const bookedSeats = await prismaClient.seat.findMany({
    where: {
      eventVenueId: eventVenueId,
    },
    select: {
      row: true,
      seatNumber: true
    }
  })

  // Update seat layout to reflect booked seats
  const updatedSeatLayout = Array.isArray(seatLayout?.seatLayout) ? seatLayout.seatLayout.map((item:any) => {
    return {
      ...item,
      seats: item.seats.map((seat:any) => {
        const isBooked = bookedSeats.some(
          (bookedSeat) => bookedSeat.row === item.row && bookedSeat.seatNumber === seat.seatNumber
        );
        return {
          ...seat,
          status: isBooked ? 'BOOKED' : seat.status 
        };
      })
    };
  }) : [];

  await redisClient.set(`seatLayout:${eventVenueId}`, JSON.stringify({seatLayout: updatedSeatLayout, eventDetails}));
  return res.json({seatLayout: updatedSeatLayout , eventDetails});
}));

export const venueRouter = router;