import {z} from 'zod'

export const BranchSchema = z.object({
    branch_name:z.string().min(3,{message:"Branch name is required"}), 
    branch_code:z.string().min(1,{message:"Branch code is required"}).or(z.literal('')),
    associated_district: z.string().min(1,{message:"Associated district is required"}),
})
export type BranchSchemaType = z.infer<typeof BranchSchema>

