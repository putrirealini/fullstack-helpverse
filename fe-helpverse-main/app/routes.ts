import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"), // home (admin, eo, user)
    route("login", "routes/login.tsx"), // login
    route("forgot-password", "routes/forgot-password.tsx"), // forgot password
    route("change-password", "routes/change-password.tsx"), // change password
    route("register", "routes/register.tsx"), // register user
    route("register/event-organizer", "routes/register/event-organizer.tsx"), // register event organizer
    route("event/create", "routes/event/create.tsx"), // create event
    route("event/edit/:id", "routes/event/edit.$id.tsx"), // edit event
    // route("event/create/seat-arrangement", "routes/event/create/seat-arrangement.tsx"), // seat arrangement
    route("event/:id/book", "routes/event.$id.book.tsx"), // book event
    route("event/:id/payment", "routes/event.$id.payment.tsx"), // payment
    route("event/:id/join-waitlist", "routes/event.$id.join-waitlist.tsx"), // join waitlist
    route("event/:id", "routes/event.tsx"), // event detail
    route("my-bookings", "routes/my-bookings.tsx"), // my booking
    route("my-waiting-list", "routes/my-waiting-list.tsx"), // my waiting list
    route("my-events", "routes/my-events.tsx"), // my events
    route("event/:id/waitlist-book", "routes/event.$id.waitlist-book.tsx"), // waitlist book
    route("reports", "routes/reports.tsx"), // reports
    route("admin-reports", "routes/admin-reports.tsx"), // admin reports
] satisfies RouteConfig;
