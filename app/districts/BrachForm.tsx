"use client"
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitHandler,Controller, useForm } from "react-hook-form";
import { BranchSchema, BranchSchemaType } from "@/schema/BrachSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/notifications/toast-provider";
const BranchForm = ({ districts, fetchBranches }:any) => {
  const supabase = getSupabaseBrowserClient();
  const {showToast} = useToast()
 console.log(districts);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BranchSchemaType>({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      branch_name: "",
      branch_code: "",
      associated_district: "",
    },
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<BranchSchemaType> = async (data) => {
    const { branch_name, branch_code, associated_district } = data;
    console;
    const { error } = await supabase.from("branches").insert({
      name: branch_name,
      code: branch_code || null,
      district_id: associated_district,
    });

    if (!error) {
         showToast({
          title: "Branch Saved",
          message: "Successfully created Branch.",
          type: "success",
        })
      fetchBranches();
      reset()
    }
    else if(error){
         showToast({
          title: "Save Branch",
          message: "SFailed to careate barnch.",
          type: "error",
        })
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Branch Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="branch-name">
                Branch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="branch-name"
                placeholder="Enter branch name"
                {...register("branch_name")}
              />
              {errors.branch_name && (
                <p className="text-red-500">{errors.branch_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="associated-district">
                Associated District <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="associated_district" // This must match your schema field name
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <SelectTrigger id="associated-district">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district:any) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
                 {errors.associated_district && (
                <p className="text-red-500">{errors.associated_district.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="branch-code">Branch Code</Label>
              <Input
                {...register("branch_code")}
                id="branch-code"
                placeholder="Enter branch code (optional)"
              />
                 {errors.branch_code && (
                <p className="text-red-500">{errors.branch_code.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">Add New Branch</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default BranchForm;
