"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/auth/auth-provider";
import { EditDistrictDialog } from "./EditDistrictDialog";
import { EditBranchDialog } from "./EditBranchDialog";
import { SubmitHandler, useForm } from "react-hook-form";
import { DistrictSchema, DistrictSchemaType } from "@/schema/DistrictSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import BranchForm from "./BrachForm";

interface District {
  id: string;
  name: string;
  code: string | null;
}

interface Branch {
  id: string;
  name: string;
  code: string | null;
  district_id: string;
  district?: District;
}

export default function DistrictsPage() {
  const { profile } = useAuthContext();
  const supabase = getSupabaseBrowserClient();

  const [districts, setDistricts] = useState<District[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [districtSearch, setDistrictSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  // District form
  const [newDistrictName, setNewDistrictName] = useState("");
  const [newDistrictCode, setNewDistrictCode] = useState("");

  // Branch form
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchDistricts();
    fetchBranches();
  }, []);

  const {
    register,
    handleSubmit,
   watch,
    formState: { errors },
  } = useForm<DistrictSchemaType>({
    resolver: zodResolver(DistrictSchema),
    defaultValues: {
      district_name: "",
      district_code: "",
    },
    mode: "onChange",
  });
  async function fetchDistricts() {
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .order("name");

    if (!error && data) {
      setDistricts(data);
    }
  }

  async function fetchBranches() {
    const { data, error } = await supabase
      .from("branches")
      .select("*, district:districts(*)")
      .order("name");

    if (!error && data) {
      setBranches(data);
    }
  }

  // async function handleAddDistrict() {
  //   if (!newDistrictName.trim()) return

  //   const { error } = await supabase.from("districts").insert({
  //     name: newDistrictName,
  //     code: newDistrictCode || null,
  //   })

  //   if (!error) {
  //     setNewDistrictName("")
  //     setNewDistrictCode("")
  //     fetchDistricts()
  //   }
  // }

  const onSubmit: SubmitHandler<DistrictSchemaType> = async (data) => {
    const { district_name, district_code } = data;
    console
    const { error } = await supabase.from("districts").insert({
      name: district_name,
      code: district_code || null,
   
    });

    if (!error) {
      fetchDistricts();
    }
  };

  async function handleAddBranch() {
    if (!newBranchName.trim() || !selectedDistrictId) return;

    const { error } = await supabase.from("branches").insert({
      name: newBranchName,
      code: newBranchCode || null,
      district_id: selectedDistrictId,
    });

    if (!error) {
      setNewBranchName("");
      setNewBranchCode("");
      setSelectedDistrictId("");
      fetchBranches();
    }
  }

  async function handleDeleteDistrict(id: string) {
    const { error } = await supabase.from("districts").delete().eq("id", id);
    if (!error) fetchDistricts();
  }

  async function handleDeleteBranch(id: string) {
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (!error) fetchBranches();
  }

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  if (profile?.role !== "system_admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Access denied. System Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Districts & Branches
          </h1>
          <p className="text-slate-600 mt-1">
            Manage organizational structure for Ansar DF.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* District Management */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              
                <CardHeader>
                  <CardTitle>District Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="district-name">
                        District Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        {...register("district_name")}
                        placeholder="Enter district name"
                      />
                      {errors.district_name && (
                        <p className="text-red-500">
                          {errors.district_name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="district-code">District Code</Label>
                      <Input
                        {...register("district_code")}
                        placeholder="Enter district code (optional)"
                      />
                      {errors.district_code && (
                        <p className="text-red-500">
                          {errors.district_code.message}
                        </p>
                      )}
                    </div>
                    <Button
                     type="submit"
                      className="w-full cursor-pointer"
                    >
                      Add District
                    </Button>
                  </div>
                </CardContent>
              
            </Card>
            </form>

            <Card>
              <CardHeader>
                <CardTitle>Existing Districts</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search districts..."
                    className="pl-9"
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredDistricts.map((district) => (
                    <div
                      key={district.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {district.name}
                        </p>
                        {district.code && (
                          <p className="text-sm text-slate-500">
                            Code: {district.code}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => setEditingDistrict(district)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDistrict(district.id)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch Management */}
          <div className="space-y-6">
           <BranchForm districts={districts} fetchBranches={fetchBranches} />
            <Card>
              <CardHeader>
                <CardTitle>Existing Branches</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search branches..."
                    className="pl-9"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {branch.name}
                        </p>
                        <div className="flex gap-3 text-sm text-slate-500">
                          <span>District: {branch.district?.name}</span>
                          {branch.code && <span>Code: {branch.code}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => setEditingBranch(branch)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => handleDeleteBranch(branch.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <EditDistrictDialog
        isOpen={!!editingDistrict}
        district={editingDistrict}
        onClose={() => setEditingDistrict(null)}
        onUpdated={() => {
          setEditingDistrict(null);
          fetchDistricts();
        }}
      />

      <EditBranchDialog
        isOpen={!!editingBranch}
        branch={editingBranch}
        districts={districts}
        onClose={() => setEditingBranch(null)}
        onUpdated={() => {
          setEditingBranch(null);
          fetchBranches();
        }}
      />
    </div>
  );
}
