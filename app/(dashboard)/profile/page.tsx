import { createClient } from "@/lib/supabase/server"
import ProfileSettings from "@/components/profile/ProfileSettings"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select(`
            full_name,
            role,
            package_name,
            companies (
                name
            )
        `)
        .eq("id", user.id)
        .single()

    return <ProfileSettings user={user} profile={profile} />
}
