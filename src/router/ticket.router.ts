import { Router } from "express";
import { prismaClient } from "../db";
import { asyncHandler } from "../errorHandling/asyncHandler";

const router = Router();

//Buy Ticket
router.post("/:eventId/:venueId" , asyncHandler( async (req, res) => {
    //TODO: Zod Validation Check

    const SEAT_NUMBER = req.body.seatNumber;
    const eventId = req.params.eventId;
    const venueId = req.params.venueId;

    if(!SEAT_NUMBER){
        return res.status(400).json({message: "Please select seat to proceed!"});
    };
    
    const eventVenue = await prismaClient.eventVenue.findFirst({
        where: {
            eventId: eventId, venueId: venueId
        }
    });

    if(!eventVenue){
        return res.status(404).json({message: "No event found or event has been ended!"});
    };

    const ticket = await prismaClient.ticket.create({
        //@ts-ignore
        data: {
            eventVenueId: eventVenue?.id,
            seatNumber: String(SEAT_NUMBER),
            price : 200,
            status: "CONFIRMED",
        }
    });
    return res.status(200).json({message: "Ticket Booked Successfully", ticket});
}));

export const ticketRouter = router;
