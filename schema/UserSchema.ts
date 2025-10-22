import {z} from 'zod'

export const UserSchema = z.object({
    full_name:z.string().min(3,{message:"Full name is required"}),
    email:z.string().email({message:"Valid email is required"}),
    password:z.string().min(6,{message:"Password must be at least 6 characters"}),
    user_role:z.enum(['system_admin','head_office_approver','branch_user'],{message:"User role is required"}),
    user_branch:z.string().min(1,{message:"User branch is required"}).or(z.literal(''))
}).superRefine((data, ctx) => { 
    
    if (data.user_role === 'branch_user') {
        
        if (!data.user_branch || data.user_branch.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "User branch is required for 'Branch User' role",
                path: ['user_branch'], 
            });
        }
    }
});

export type UserSchemaType = z.infer<typeof UserSchema>