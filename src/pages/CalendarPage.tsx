import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

const CalendarPage = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const storedUser = localStorage.getItem("fitblaqs_user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setIsGerman(user.language === "de");
  }, [navigate]);

  const workoutDates = [
    new Date(2025, 2, 10),
    new Date(2025, 2, 8),
    new Date(2025, 2, 6),
    new Date(2025, 2, 3),
  ];

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? "Trainingskalender" : "Workout Calendar"}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Plane deine Trainingseinheiten" : "Plan your workouts"}
          </p>
        </div>

        {/* Calendar */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-8">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            modifiers={{
              workout: workoutDates,
            }}
            modifiersClassNames={{
              workout: "bg-primary text-primary-foreground font-bold",
            }}
          />
        </Card>

        {/* Workout Schedule */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Diese Woche" : "This Week"}
          </h2>
          <div className="space-y-4">
            {[
              { day: isGerman ? "Montag" : "Monday", workout: isGerman ? "Brust & Trizeps" : "Chest & Triceps", completed: true },
              { day: isGerman ? "Mittwoch" : "Wednesday", workout: isGerman ? "Rücken & Bizeps" : "Back & Biceps", completed: true },
              { day: isGerman ? "Freitag" : "Friday", workout: isGerman ? "Beine & Schultern" : "Legs & Shoulders", completed: false },
              { day: isGerman ? "Samstag" : "Saturday", workout: "Cardio", completed: false },
            ].map((item, index) => (
              <Card
                key={index}
                className={`gradient-card card-shadow border-white/10 p-4 transition-all ${
                  item.completed ? "opacity-60" : "hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.day}</div>
                    <div className="text-sm text-muted-foreground">{item.workout}</div>
                  </div>
                  <div>
                    {item.completed ? (
                      <span className="text-green-400 font-semibold">
                        {isGerman ? "✓ Erledigt" : "✓ Completed"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {isGerman ? "Geplant" : "Planned"}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;
