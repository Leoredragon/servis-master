import { createClient } from "@/lib/supabase/server"
import CalendarView from "@/components/calendar/CalendarView"

export default async function CalendarPage() {
    const supabase = await createClient()

    // Fetch appointments with customer and vehicle details
    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            *,
            customers(first_name, last_name, phone, email),
            vehicles(brand, model, plate)
        `)
        .order('appointment_date', { ascending: true })

    // Fetch customers & vehicles for Scheduling Modal
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('first_name', { ascending: true })

    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('plate', { ascending: true })

    return (
        <CalendarView
            initialAppointments={appointments || []}
            customers={customers || []}
            vehicles={vehicles || []}
        />
    )
}
