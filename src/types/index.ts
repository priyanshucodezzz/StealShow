import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(7),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(7),
});

export const EventSchema = z.object({
  name: z.string(),
  host: z.string(),
  description: z.string().min(10),
  ageRestriction: z.number(),
  type: z.enum(['MOVIE', 'SHOW', 'CONCERT' , 'OTHER']),
  thumbnail: z.string(),
  headerImage: z.string(),
  category: z.string(),
  duration: z.number(),
  language: z.string(),
  venues: z.array(
    z.object({
      venueId: z.string(),
      date: z.string().refine(
        (value) => !isNaN(Date.parse(value)), 
        { message: "Invalid date format" }
      ),
      showtime: z.string().refine(
        (value) => /\d{2}:\d{2}/.test(value), 
        { message: 'Invalid showtime format. Please use HH:MM format.' }
      ),
      totalSeats: z.number(),
    })
  ),
});

export const VenueSchema = z.object({
  name: z.string(),
  city : z.string().min(3),
  address: z.string().min(10),
  capacity: z.number(),
  seatLayout: z.any()
});


export const TicketSchema = z.object({
  price: z.number(),
  seatNumber: z.string(),
  status: z.enum(['BOOKED']),
  eventVenue: z.array(
    z.object({
      date: z.string().refine(
        (value) => !isNaN(Date.parse(value)),
        { message: "Invalid date format" }
      ),
      showtime: z.string().refine(
        (value) => /\d{2}:\d{2}/.test(value),
        { message: 'Invalid showtime format. Please use HH:MM format.' }
      ),
      address: z.string().min(10),
    })
  ),
  user: z.string(),
  seats: z.array(z.string())
})


export const SeatBookingSchema = z.object({
  seats: z.array(z.object({
    row: z.string(), 
    seatNumber: z.string(),
  })),
  eventVenueId: z.string(),
})

export const AddEventOnVenueSchema = z.object({
  eventId: z.string(),
  venueId: z.string(),
  date: z.string().refine(
    (value) => !isNaN(Date.parse(value)),
    { message: "Invalid date format" }
  ),
  showtime: z.string().refine(
    (value) => /\d{2}:\d{2}/.test(value),
    { message: 'Invalid showtime format. Please use HH:MM format.' }
  ),
  totalSeats: z.number()
})


export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(7),
  newPassword: z.string().min(7),
  confirmNewPassword: z.string().min(7)
})