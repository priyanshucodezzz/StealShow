import { Router } from "express";
import { prismaClient } from "../db";

import { AddEventOnVenueSchema, EventSchema } from "../types/index";
import { asyncHandler } from "../errorHandling/asyncHandler";
import redisClient from "../redis/redisClient";
import { authMiddleware } from "../middleware";

const router = Router();

//Create Event
router.post("/create", authMiddleware, asyncHandler(async (req, res) => {
   const body = req.body;
   const parsedData = EventSchema.safeParse(body);
   
  if (!parsedData.success) {
    return res.status(400).json({ message: "Invalid Input", errors: parsedData.error.errors  });
  }
 
  const event = await prismaClient.event.create({
    data: {
      name: parsedData.data.name,
      host: parsedData.data.host,
      description: parsedData.data.description,
      ageRestriction: parsedData.data.ageRestriction,
      thumbnail: parsedData.data.thumbnail,
      headerImage: parsedData.data.headerImage,
      category: parsedData.data.category,
      duration: parsedData.data.duration,
      langauge: parsedData.data.language,
      type: parsedData.data.type
    },
  });
 
   // Create EventVenue entries for each venue
  const eventVenues = parsedData.data.venues.map(venue => {
     return prismaClient.eventVenue.create({
      data: {
        eventId: event.id,
        venueId: venue.venueId, 
        date: new Date(venue.date), 
        showtime: new Date(venue.showtime),
        totalSeats: venue.totalSeats,
      },
    });
  })
 
   await Promise.all(eventVenues);
 
   return res.json({
     message: "Event created successfully!",
   })
}));

// Add Event on Venue 
router.patch('/add-event', authMiddleware, asyncHandler(async(req, res)=> {
  const body = req.body;
  const parsedData = AddEventOnVenueSchema.safeParse(body);
   
  if (!parsedData.success) {
    return res.status(400).json({ message: "Invalid Input", errors: parsedData.error.errors});
  }

  const data = await prismaClient.event.update({
    where: {
      id: parsedData.data.eventId,
    },
    data: {
      eventVenues: {
        create: {
          venueId: parsedData.data.venueId ,
          date: new Date(parsedData.data.date),
          showtime: new Date(parsedData.data.showtime),
          totalSeats: parsedData.data.totalSeats,
        }
      }
    }
  })
  return res.status(200).json({message: "Event added successfully on Venue"});
}))


//Get all Events
router.get("/explore/:location", asyncHandler(async (req, res) => {
    const location  = req.params.location;
    if (!location) {
      return res.status(404).json({ message: "No event found" });
    }

    const cacheData = await redisClient.get(`events:${location}`)
    if(cacheData){
      const events = JSON.parse(cacheData);
      return res.json({events});
    }

    const events = await prismaClient.event.findMany({
      where: {
        eventVenues: {
          some: {
            venue: {
              city: location,
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        category: true,
      },
    });
    await redisClient.setex(`events:${location}`, 5 , JSON.stringify(events));
    return res.json({ events });
  }
));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = req.params.id;

  const cacheData = await redisClient.get(`eventFromId:${id}`)

  if(cacheData){
    const event = JSON.parse(cacheData);
    return res.json({event});
  }
  const event = await prismaClient.event.findFirst({
    where: {
      id,
    },
  });

  await redisClient.set(`eventFromId:${id}`, JSON.stringify(event));
  return res.json({ event });
}));

export const eventRouter = router;
