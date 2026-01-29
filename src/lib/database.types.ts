export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            transactions: {
                Row: {
                    id: string
                    created_at: string
                    description: string
                    amount: number
                    type: string
                    category: string
                    mode: string
                    status: string
                    date: string
                    project_id: string | null
                    client_id: string | null
                    recurrence_id: string | null
                    is_fixed: boolean
                    owner_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    description: string
                    amount: number
                    type: string
                    category: string
                    mode: string
                    status: string
                    date: string
                    project_id?: string | null
                    client_id?: string | null
                    recurrence_id?: string | null
                    is_fixed?: boolean
                    owner_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    description?: string
                    amount?: number
                    type?: string
                    category?: string
                    mode?: string
                    status?: string
                    date?: string
                    project_id?: string | null
                    client_id?: string | null
                    recurrence_id?: string | null
                    is_fixed?: boolean
                    owner_id?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    name: string
                    status: string
                    stage: string
                    total_value: number
                    hours_used: number
                    deadline: string | null
                    client_id: string | null
                    owner_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    status: string
                    stage: string
                    total_value?: number
                    hours_used?: number
                    deadline?: string | null
                    client_id?: string | null
                    owner_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    status?: string
                    stage?: string
                    total_value?: number
                    hours_used?: number
                    deadline?: string | null
                    client_id?: string | null
                    owner_id?: string
                    created_at?: string
                }
            }
            // Add other tables as needed strictly typed, or rely on partials
        }
    }
}
