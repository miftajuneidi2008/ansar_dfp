import {z} from 'zod'

export const DistrictSchema = z.object({
    district_name:z.string().min(3,{message:"District name is required"}),
    district_code:z.string().min(1,{message:"District code is required"}).or(z.literal('')),
})
export type DistrictSchemaType = z.infer<typeof DistrictSchema>

