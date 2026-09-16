// src/constants/allowanceOptions.ts
export type AllowanceOption = {
  label: string; // shown to users
  value: string; // canonical key sent to backend for known options
  description?: string;
};

export const allowanceOptions: AllowanceOption[] = [
  {
    label: "House Rent Allowance (HRA)",
    value: "house_rent",
    description: "Help with rent or housing",
  },
  {
    label: "Transport Allowance",
    value: "transport",
    description: "Commute / transport support",
  },
  {
    label: "Meal / Food Allowance",
    value: "meal_food",
    description: "Meals or food cards",
  },
  {
    label: "Medical Allowance",
    value: "medical",
    description: "Medical reimbursements",
  },
  {
    label: "Mobile / Internet Allowance",
    value: "mobile_internet",
    description: "Mobile & internet costs",
  },
  {
    label: "Travel Allowance",
    value: "travel",
    description: "Business travel reimbursements",
  },
  {
    label: "Fuel / Vehicle Allowance",
    value: "fuel_vehicle",
    description: "Fuel or vehicle support",
  },
  {
    label: "Education / Training Allowance",
    value: "education_training",
    description: "Upskilling & training",
  },
  {
    label: "Performance Bonus / Incentive",
    value: "performance_bonus",
    description: "Performance-linked pay",
  },
  {
    label: "Relocation Allowance",
    value: "relocation",
    description: "Relocation costs",
  },
  {
    label: "Overtime Allowance",
    value: "overtime",
    description: "Overtime pay",
  },
  {
    label: "Risk / Hazard Allowance",
    value: "risk_hazard",
    description: "Hazard / risk compensation",
  },
  {
    label: "Shift / Attendance Allowance",
    value: "shift_attendance",
    description: "Shift or attendance pay",
  },
  {
    label: "Wellness / Gym Allowance",
    value: "wellness_gym",
    description: "Wellness or gym membership",
  },
  {
    label: "Childcare / Dependent Care",
    value: "childcare",
    description: "Support for dependents",
  },
  {
    label: "Uniform / Clothing Allowance",
    value: "uniform",
    description: "Work attire allowance",
  },
  {
    label: "Tool / Equipment Allowance",
    value: "tool_equipment",
    description: "Tools / equipment",
  },
  {
    label: "Cost of Living Allowance (COLA)",
    value: "cola",
    description: "Cost-of-living adjustment",
  },
  {
    label: "Entertainment Allowance",
    value: "entertainment",
    description: "Client/entertainment expenses",
  },
  {
    label: "Other (specify)",
    value: "other",
    description: "Add a custom allowance",
  },
];
