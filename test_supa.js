const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hnitylbmghqimvzaukgy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaXR5bGJtZ2hxaW12emF1a2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Nzc1MjcsImV4cCI6MjA5NzI1MzUyN30.KugJkHPKTr-SeBaYrQMftN8Ealovad2DfSRqi3tB_ME'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log("Testing sign up...")
    const { data, error } = await supabase.auth.signUp({
        email: 'test_node_' + Date.now() + '@example.com',
        password: 'Password123!'
    })
    console.log("Data:", data)
    console.log("Error:", error)
}
test()
