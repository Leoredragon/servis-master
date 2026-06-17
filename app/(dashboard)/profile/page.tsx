import { createClient } from "@/lib/supabase/server"
import ProfileSettings from "@/components/profile/ProfileSettings"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return <ProfileSettings user={user} />
}
