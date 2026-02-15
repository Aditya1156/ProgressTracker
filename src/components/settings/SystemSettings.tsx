"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  institutionSettingsSchema,
  academicYearSchema,
  type InstitutionSettingsData,
  type AcademicYearData,
} from "@/lib/settings-validation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Building2,
  Calendar,
  GraduationCap,
  Loader2,
  Save,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsRow {
  id: string;
  key: string;
  value: Record<string, any>;
}

export default function SystemSettings() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, SettingsRow>>({});

  // Institution form
  const [savingInst, setSavingInst] = useState(false);
  const instForm = useForm<InstitutionSettingsData>({
    resolver: zodResolver(institutionSettingsSchema),
  });

  // Academic year form
  const [savingAcad, setSavingAcad] = useState(false);
  const acadForm = useForm<AcademicYearData>({
    resolver: zodResolver(academicYearSchema),
  });

  // Grading state
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeThresholds, setGradeThresholds] = useState<Record<string, number>>({});
  const [passMark, setPassMark] = useState(40);

  // Attendance state
  const [savingAtt, setSavingAtt] = useState(false);
  const [minAttendance, setMinAttendance] = useState(75);
  const [lateCountsPresent, setLateCountsPresent] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("system_settings")
        .select("id, key, value")
        .eq("college_id", "MAIN");

      const map: Record<string, SettingsRow> = {};
      for (const row of data ?? []) {
        map[row.key] = row as SettingsRow;
      }
      setSettings(map);

      // Populate institution form
      if (map.institution) {
        const v = map.institution.value;
        instForm.reset({
          name: v.name ?? "",
          code: v.code ?? "",
          address: v.address ?? "",
          phone: v.phone ?? "",
          email: v.email ?? "",
          website: v.website ?? "",
        });
      }

      // Populate academic year form
      if (map.academic_year) {
        const v = map.academic_year.value;
        acadForm.reset({
          current: v.current ?? "",
          start_date: v.start_date ?? "",
          end_date: v.end_date ?? "",
        });
      }

      // Populate grading
      if (map.grading) {
        setGradeThresholds(map.grading.value.thresholds ?? {});
        setPassMark(map.grading.value.pass_mark ?? 40);
      }

      // Populate attendance
      if (map.attendance) {
        setMinAttendance(map.attendance.value.minimum_percentage ?? 75);
        setLateCountsPresent(map.attendance.value.late_counts_as_present ?? true);
      }

      setLoading(false);
    }
    load();
  }, [supabase, instForm, acadForm]);

  async function saveSetting(key: string, value: Record<string, any>, setLoading: (v: boolean) => void) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("system_settings")
      .update({ value, updated_by: user?.id })
      .eq("college_id", "MAIN")
      .eq("key", key);

    if (error) {
      toast.error(`Failed to save ${key}: ${error.message}`);
    } else {
      toast.success("Settings saved");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institution Info */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Institution Information</CardTitle>
          </div>
          <CardDescription>Basic details about your institution</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={instForm.handleSubmit((data) => saveSetting("institution", data, setSavingInst))}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inst_name">Institution Name <span className="text-red-500">*</span></Label>
                <Input id="inst_name" {...instForm.register("name")} className={instForm.formState.errors.name ? "border-red-500" : ""} />
                {instForm.formState.errors.name && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />{instForm.formState.errors.name.message}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst_code">Code <span className="text-red-500">*</span></Label>
                <Input id="inst_code" {...instForm.register("code")} className={instForm.formState.errors.code ? "border-red-500" : ""} />
                {instForm.formState.errors.code && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />{instForm.formState.errors.code.message}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst_address">Address</Label>
              <Input id="inst_address" {...instForm.register("address")} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inst_phone">Phone</Label>
                <Input id="inst_phone" {...instForm.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst_email">Email</Label>
                <Input id="inst_email" type="email" {...instForm.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst_website">Website</Label>
                <Input id="inst_website" {...instForm.register("website")} placeholder="https://" />
              </div>
            </div>
            <Button type="submit" disabled={savingInst}>
              {savingInst ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Institution
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Academic Year */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Academic Year</CardTitle>
          </div>
          <CardDescription>Current academic year configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={acadForm.handleSubmit((data) => saveSetting("academic_year", data, setSavingAcad))}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acad_current">Academic Year <span className="text-red-500">*</span></Label>
                <Input id="acad_current" {...acadForm.register("current")} placeholder="2025-2026" className={acadForm.formState.errors.current ? "border-red-500" : ""} />
                {acadForm.formState.errors.current && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />{acadForm.formState.errors.current.message}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="acad_start">Start Date <span className="text-red-500">*</span></Label>
                <Input id="acad_start" type="date" {...acadForm.register("start_date")} className={acadForm.formState.errors.start_date ? "border-red-500" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acad_end">End Date <span className="text-red-500">*</span></Label>
                <Input id="acad_end" type="date" {...acadForm.register("end_date")} className={acadForm.formState.errors.end_date ? "border-red-500" : ""} />
              </div>
            </div>
            <Button type="submit" disabled={savingAcad}>
              {savingAcad ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Academic Year
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Grading Thresholds */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Grading Thresholds</CardTitle>
          </div>
          <CardDescription>Define grade boundaries and pass mark</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(gradeThresholds)
              .sort(([, a], [, b]) => b - a)
              .map(([grade, threshold]) => (
                <div key={grade} className="flex items-center gap-2">
                  <Label className="w-10 font-mono font-semibold">{grade}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={threshold}
                    onChange={(e) =>
                      setGradeThresholds((prev) => ({
                        ...prev,
                        [grade]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-20"
                  />
                  <span className="text-xs text-gray-400">%+</span>
                </div>
              ))}
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Label className="font-medium">Pass Mark</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={passMark}
              onChange={(e) => setPassMark(parseInt(e.target.value) || 0)}
              className="w-20"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <Button
            onClick={() => saveSetting("grading", { thresholds: gradeThresholds, pass_mark: passMark }, setSavingGrade)}
            disabled={savingGrade}
                     >
            {savingGrade ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Grading
          </Button>
        </CardContent>
      </Card>

      {/* Attendance Settings */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Attendance Settings</CardTitle>
          </div>
          <CardDescription>Configure attendance policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="font-medium">Minimum Attendance</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={minAttendance}
              onChange={(e) => setMinAttendance(parseInt(e.target.value) || 0)}
              className="w-20"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Late Counts as Present</Label>
              <p className="text-xs text-gray-400">Include late arrivals in attendance percentage</p>
            </div>
            <Switch
              checked={lateCountsPresent}
              onCheckedChange={setLateCountsPresent}
            />
          </div>
          <Button
            onClick={() =>
              saveSetting(
                "attendance",
                { minimum_percentage: minAttendance, late_counts_as_present: lateCountsPresent },
                setSavingAtt
              )
            }
            disabled={savingAtt}
                     >
            {savingAtt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Attendance
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
