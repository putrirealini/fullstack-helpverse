import { FaChartBar, FaCalendarPlus } from "react-icons/fa";
import { Link } from "react-router";

export function ButtonEventOrganizer() {
    return (
        <div className="bg-secondary p-4 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-secondary/20 p-3 rounded-full">
                            <FaChartBar className="text-secondary text-xl" />
                        </div>
                        <h2 className="text-secondary font-bold text-lg">Analytics</h2>
                    </div>
                    <p className="text-secondary/80 text-sm mt-2">View detailed analytics and reports for all events and users</p>
                    <Link to="/reports" className="mt-4 bg-secondary text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors inline-block">
                        View Analytics
                    </Link>
                </div>
                
                <div className="bg-primary rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-secondary/20 p-3 rounded-full">
                            <FaCalendarPlus className="text-secondary text-xl" />
                        </div>
                        <h2 className="text-secondary font-bold text-lg">Create Event</h2>
                    </div>
                    <p className="text-secondary/80 text-sm mt-2">Create and manage your events</p>
                    <Link to="/event/create" className="mt-4 bg-secondary text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors inline-block">
                        Create New Event
                    </Link>
                </div>
            </div>
        </div>
    )
}
