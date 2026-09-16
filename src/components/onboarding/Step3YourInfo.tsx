import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Sparkles } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const step3Schema = z.object({
  position: z.string().min(1, "Your position is required").max(100),
  yourPhone: z.string().optional(),
});

type Step3FormData = z.infer<typeof step3Schema>;

interface Step3YourInfoProps {
  onBack: () => void;
  onContinue: (data: Step3FormData) => void;
}

export const Step3YourInfo: React.FC<Step3YourInfoProps> = ({
  onBack,
  onContinue,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
    defaultValues: {
      position: "",
      yourPhone: "",
    },
  });

  const onSubmit = (data: Step3FormData) => {
    onContinue(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Step 3 of 4</span>
        </div>
        <h3 className="text-lg font-semibold">Your Information</h3>
        <p className="text-sm text-muted-foreground">
          Tell us about your role in the company
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="position" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Your Position *
          </Label>
          <Input
            id="position"
            {...register("position")}
            placeholder="e.g., HR Manager, Recruiter"
          />
          {errors.position && (
            <p className="text-sm text-destructive">{errors.position.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yourPhone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Your Phone
          </Label>
          <Controller
            name="yourPhone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="yourPhone"
                international
                defaultCountry="US"
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter phone number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            )}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={!isValid} size="lg" className="min-w-[120px]">
          Continue
        </Button>
      </div>
    </form>
  );
};
