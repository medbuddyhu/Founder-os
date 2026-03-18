import { supabase } from "../lib/supabaseClient"

// Fetch all files
export async function getFiles() {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching files:", error.message)
    return []
  }

  return data
}


// Create new file record
export async function createFile(file) {
  const { data, error } = await supabase
    .from("files")
    .insert([file])
    .select()

  if (error) {
    console.error("Error creating file:", error.message)
    return null
  }

  return data
}