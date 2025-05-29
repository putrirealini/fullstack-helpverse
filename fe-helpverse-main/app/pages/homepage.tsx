import { ButtonAdmin } from "~/components/buttonAdmin";
import { ButtonEventOrganizer } from "~/components/buttonEventOrganizer";
import { Footer } from "~/components/footer";
import { Hero } from "~/components/hero";
import { Navbar } from "~/components/navbar";
import { PromotionSection } from "~/components/promotionSection";
import { TicketSection } from "~/components/ticketSection";
import { useAuth } from "../contexts/auth";

export default function Homepage() {
  const { user, loading } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const isEventOrganizer = user?.role === "eventOrganizer";
  const isRegularUser = !user || user.role === "user";

  return (
    <main>
      <Navbar />
      <Hero />
      <TicketSection />
      
      {/* Display content based on valid role */}
      {!loading && (
        <>
          {isRegularUser && <PromotionSection />}
          
          {isEventOrganizer && (
            <ButtonEventOrganizer />
          )}
          
          {isAdmin && (
            <ButtonAdmin />
          )}
        </>
      )}
      
      <Footer />
    </main>
  )
}
