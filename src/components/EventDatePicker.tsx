import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EventDatePickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export function EventDatePicker({ selectedDate, onDateSelect }: EventDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs font-medium rounded-full gap-1.5 transition-colors",
            selectedDate
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
              : "bg-muted text-muted-foreground border-transparent hover:bg-primary hover:text-primary-foreground"
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          {selectedDate ? format(selectedDate, "EEE d MMM") : "Pick a Date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onDateSelect(date);
            setOpen(false);
          }}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        {selectedDate && (
          <div className="px-3 pb-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onDateSelect(undefined);
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
