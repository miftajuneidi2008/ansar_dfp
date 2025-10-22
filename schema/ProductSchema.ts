import {z} from 'zod'
export const ProductSchema = z.object({
    product_name:z.string().min(4,{message:"Product name is required"}),
    product_code:z.string().min(2,{message:"Product code is required"}).or(z.literal('')),
    product_description:z.string().min(10,{message:"Product description is required"}).or(z.literal(''))
})

export type ProductSchematype = z.infer< typeof ProductSchema>   