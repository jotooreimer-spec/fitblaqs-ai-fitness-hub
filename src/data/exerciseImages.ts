// Upper Body Exercises
import arnoldPress from "@/assets/exercises/upperbody/arnold-press.jpg";
import barbellCurl from "@/assets/exercises/upperbody/barbell-curl.jpg";
import barbellFrontRaise from "@/assets/exercises/upperbody/barbell-front-raise.jpg";
import benchPress from "@/assets/exercises/upperbody/bench-press.jpg";
import cableFly from "@/assets/exercises/upperbody/cable-fly.jpg";
import chestPress from "@/assets/exercises/upperbody/chest-press.jpg";
import closeGripBenchPress from "@/assets/exercises/upperbody/close-grip-bench-press.jpg";
import deadlift from "@/assets/exercises/upperbody/deadlift.jpg";
import diamondPushUps from "@/assets/exercises/upperbody/diamond-push-ups.jpg";
import cableOverheadTricepExtension from "@/assets/exercises/upperbody/cable-overhead-tricep-extension.jpg";
import deadliftStandards from "@/assets/exercises/upperbody/deadlift-standards.jpg";
import dips from "@/assets/exercises/upperbody/dips.jpg";
import dumbbellConcentrationCurl from "@/assets/exercises/upperbody/dumbbell-concentration-curl.jpg";
import dumbbellBenchPress from "@/assets/exercises/upperbody/dumbbell-bench-press.jpg";
import dumbbellFacePull from "@/assets/exercises/upperbody/dumbbell-face-pull.jpg";
import dumbbellFrontRaise from "@/assets/exercises/upperbody/dumbbell-front-raise.jpg";
import dumbbellLateralRaise from "@/assets/exercises/upperbody/dumbbell-lateral-raise.jpg";
import dumbbellReverseFly from "@/assets/exercises/upperbody/dumbbell-reverse-fly.jpg";
import dumbbellRow from "@/assets/exercises/upperbody/dumbbell-row.jpg";
import dumbbellTricepKickback from "@/assets/exercises/upperbody/dumbbell-tricep-kickback.jpg";
import facePull from "@/assets/exercises/upperbody/face-pull.jpg";
import floorPress from "@/assets/exercises/upperbody/floor-press.jpg";
import hammerCurl from "@/assets/exercises/upperbody/hammer-curl.jpg";
import inclineDumbbellBenchPress from "@/assets/exercises/upperbody/incline-dumbbell-bench-press.jpg";
import inclineHammerCurl from "@/assets/exercises/upperbody/incline-hammer-curl.jpg";
import latPulldown from "@/assets/exercises/upperbody/lat-pulldown.jpg";
import machineBicepsCurl from "@/assets/exercises/upperbody/machine-biceps-curl.jpg";
import machineChestFly from "@/assets/exercises/upperbody/machine-chest-fly.jpg";
import machineLateral from "@/assets/exercises/upperbody/machine-lateral.jpg";
import machineReverseFly from "@/assets/exercises/upperbody/machine-reverse-fly.jpg";
import preacherCurl from "@/assets/exercises/upperbody/preacher-curl.jpg";
import pullUps from "@/assets/exercises/upperbody/pull-ups.jpg";
import pushUps from "@/assets/exercises/upperbody/push-ups.jpg";
import reverseGripBenchPress from "@/assets/exercises/upperbody/reverse-grip-bench-press.jpg";
import shoulderPress from "@/assets/exercises/upperbody/shoulder-press.jpg";
import smithMachineBenchPress from "@/assets/exercises/upperbody/smith-machine-bench-press.jpg";
import tricepPushdown from "@/assets/exercises/upperbody/tricep-pushdown.jpg";

// Lower Body Exercises
import barbellGluteBridge from "@/assets/exercises/lowerbody/barbell-glute-bridge.jpg";
import barbellLunge from "@/assets/exercises/lowerbody/barbell-lunge.jpg";
import bodyweightCalfRaise from "@/assets/exercises/lowerbody/bodyweight-calf-raise.jpg";
import bodyweightSquat from "@/assets/exercises/lowerbody/bodyweight-squat.jpg";
import donkeyCalf from "@/assets/exercises/lowerbody/donkey-calf.jpg";
import donkeyCalfRaise from "@/assets/exercises/lowerbody/donkey-calf-raise.jpg";
import dumbbellBulgarianSplit from "@/assets/exercises/lowerbody/dumbbell-bulgarian-split.jpg";
import frontSquat from "@/assets/exercises/lowerbody/front-squat.jpg";
import gluteBridge from "@/assets/exercises/lowerbody/glute-bridge.jpg";
import gluteKickback from "@/assets/exercises/lowerbody/glute-kickback.jpg";
import gobletSquat from "@/assets/exercises/lowerbody/goblet-squat.jpg";
import hipExtension from "@/assets/exercises/lowerbody/hip-extension.jpg";
import hipThrust from "@/assets/exercises/lowerbody/hip-thrust.jpg";
import lunge from "@/assets/exercises/lowerbody/lunge.jpg";
import sideLegRaise from "@/assets/exercises/lowerbody/side-leg-raise.jpg";
import singleLegPress from "@/assets/exercises/lowerbody/single-leg-press.jpg";
import singleLegSeatedRaise from "@/assets/exercises/lowerbody/single-leg-seated-raise.jpg";
import singleLegSquat from "@/assets/exercises/lowerbody/single-leg-squat.jpg";
import squat from "@/assets/exercises/lowerbody/squat.jpg";
import sumoDeadlift from "@/assets/exercises/lowerbody/sumo-deadlift.jpg";
import walkingLunge from "@/assets/exercises/lowerbody/walking-lunge.jpg";

// Core Exercises
import abWheelRollout from "@/assets/exercises/core/ab-wheel-rollout.jpg";
import bicycleCrunch from "@/assets/exercises/core/bicycle-crunch.jpg";
import crunches from "@/assets/exercises/core/crunches.jpg";
import flutterKicks from "@/assets/exercises/core/flutter-kicks.jpg";
import hangingLegRaise from "@/assets/exercises/core/hanging-leg-raise.jpg";
import horizontalLeg from "@/assets/exercises/core/horizontal-leg.jpg";
import jumpingJack from "@/assets/exercises/core/jumping-jack.jpg";
import lyingLegRaise from "@/assets/exercises/core/lying-leg-raise.jpg";
import mountainClimbers from "@/assets/exercises/core/mountain-climbers.jpg";
import russianTwist from "@/assets/exercises/core/russian-twist.jpg";
import sitUps from "@/assets/exercises/core/sit-ups.jpg";
import toesToBar from "@/assets/exercises/core/toes-to-bar.jpg";
import wristCurl from "@/assets/exercises/core/wrist-curl.jpg";

export interface ExerciseItem {
  id: string;
  name: string;
  name_de: string;
  image: string;
  bodyPart: "upper_body" | "lower_body" | "core";
  description?: string;
  description_de?: string;
}

export const allExercises: ExerciseItem[] = [
  // Upper Body
  { 
    id: "arnold-press", 
    name: "Arnold Press", 
    name_de: "Arnold Press", 
    image: arnoldPress, 
    bodyPart: "upper_body",
    description: "Rotating shoulder press targeting all three deltoid heads with dumbbells.",
    description_de: "Rotierende Schulterübung für alle drei Deltamuskel-Köpfe mit Kurzhanteln."
  },
  { 
    id: "barbell-curl", 
    name: "Barbell Curl", 
    name_de: "Langhantel Curl", 
    image: barbellCurl, 
    bodyPart: "upper_body",
    description: "Classic bicep exercise using a barbell for maximum arm strength.",
    description_de: "Klassische Bizeps-Übung mit Langhantel für maximale Armkraft."
  },
  { 
    id: "barbell-front-raise", 
    name: "Barbell Front Raise", 
    name_de: "Langhantel Frontheben", 
    image: barbellFrontRaise, 
    bodyPart: "upper_body",
    description: "Shoulder isolation exercise lifting barbell to front for anterior deltoids.",
    description_de: "Schulter-Isolationsübung mit Langhantel für vorderen Deltamuskel."
  },
  { 
    id: "bench-press", 
    name: "Bench Press", 
    name_de: "Bankdrücken", 
    image: benchPress, 
    bodyPart: "upper_body",
    description: "Fundamental chest exercise lying on bench, pressing barbell upward.",
    description_de: "Grundübung für Brust, liegend auf Bank, Langhantel nach oben drücken."
  },
  { 
    id: "cable-fly", 
    name: "Cable Fly", 
    name_de: "Kabelzug Fly", 
    image: cableFly, 
    bodyPart: "upper_body",
    description: "Chest isolation using cables for constant tension and muscle definition.",
    description_de: "Brust-Isolation mit Kabelzug für konstante Spannung und Definition."
  },
  { 
    id: "cable-overhead-tricep", 
    name: "Cable Overhead Tricep Extension", 
    name_de: "Kabel Trizeps Extension", 
    image: cableOverheadTricepExtension, 
    bodyPart: "upper_body",
    description: "Tricep exercise with cable overhead for long head emphasis.",
    description_de: "Trizeps-Übung am Kabelzug über Kopf für langen Trizepskopf."
  },
  { 
    id: "chest-press", 
    name: "Chest Press", 
    name_de: "Brustpresse", 
    image: chestPress, 
    bodyPart: "upper_body",
    description: "Machine-based chest exercise for controlled pressing movement.",
    description_de: "Maschinen-Brustübung für kontrollierte Drückbewegung."
  },
  { 
    id: "close-grip-bench", 
    name: "Close Grip Bench Press", 
    name_de: "Enges Bankdrücken", 
    image: closeGripBenchPress, 
    bodyPart: "upper_body",
    description: "Bench press with narrow grip emphasizing triceps over chest.",
    description_de: "Bankdrücken mit engem Griff für mehr Trizeps-Aktivierung."
  },
  { 
    id: "deadlift", 
    name: "Deadlift", 
    name_de: "Kreuzheben", 
    image: deadlift, 
    bodyPart: "upper_body",
    description: "Compound lift for entire posterior chain: back, glutes, hamstrings.",
    description_de: "Verbundübung für gesamte Rückseite: Rücken, Po, Beinbeuger."
  },
  { 
    id: "deadlift-standards", 
    name: "Deadlift Standards", 
    name_de: "Kreuzheben Standard", 
    image: deadliftStandards, 
    bodyPart: "upper_body",
    description: "Standard deadlift form for proper technique and safety.",
    description_de: "Standard Kreuzheben für richtige Technik und Sicherheit."
  },
  { 
    id: "diamond-push-ups", 
    name: "Diamond Push Ups", 
    name_de: "Diamant Liegestütze", 
    image: diamondPushUps, 
    bodyPart: "upper_body",
    description: "Push-up variation with hands forming diamond, targeting triceps.",
    description_de: "Liegestütze-Variante mit Händen in Diamantform für Trizeps."
  },
  { 
    id: "dips", 
    name: "Dips", 
    name_de: "Dips", 
    image: dips, 
    bodyPart: "upper_body",
    description: "Bodyweight exercise for chest and triceps using parallel bars.",
    description_de: "Eigengewichtsübung für Brust und Trizeps am Barren."
  },
  { 
    id: "dumbbell-bench-press", 
    name: "Dumbbell Bench Press", 
    name_de: "Kurzhantel Bankdrücken", 
    image: dumbbellBenchPress, 
    bodyPart: "upper_body",
    description: "Bench press with dumbbells for greater range of motion.",
    description_de: "Bankdrücken mit Kurzhanteln für größeren Bewegungsumfang."
  },
  { 
    id: "dumbbell-concentration-curl", 
    name: "Dumbbell Concentration Curl", 
    name_de: "Konzentrationscurls", 
    image: dumbbellConcentrationCurl, 
    bodyPart: "upper_body",
    description: "Isolated bicep curl with elbow braced against inner thigh.",
    description_de: "Isolierte Bizeps-Curl mit Ellbogen am Oberschenkel gestützt."
  },
  { 
    id: "dumbbell-face-pull", 
    name: "Dumbbell Face Pull", 
    name_de: "Kurzhantel Face Pull", 
    image: dumbbellFacePull, 
    bodyPart: "upper_body",
    description: "Rear delt and upper back exercise pulling weight toward face.",
    description_de: "Hintere Schulter und oberer Rücken, Gewicht zum Gesicht ziehen."
  },
  { 
    id: "dumbbell-front-raise", 
    name: "Dumbbell Front Raise", 
    name_de: "Kurzhantel Frontheben", 
    image: dumbbellFrontRaise, 
    bodyPart: "upper_body",
    description: "Shoulder exercise raising dumbbells to front for anterior deltoids.",
    description_de: "Schulterübung mit Kurzhanteln nach vorne heben."
  },
  { 
    id: "dumbbell-lateral-raise", 
    name: "Dumbbell Lateral Raise", 
    name_de: "Kurzhantel Seitheben", 
    image: dumbbellLateralRaise, 
    bodyPart: "upper_body",
    description: "Side raise targeting lateral deltoid for wider shoulders.",
    description_de: "Seitliches Heben für breitere Schultern."
  },
  { 
    id: "dumbbell-reverse-fly", 
    name: "Dumbbell Reverse Fly", 
    name_de: "Kurzhantel Reverse Fly", 
    image: dumbbellReverseFly, 
    bodyPart: "upper_body",
    description: "Rear deltoid exercise with bent-over reverse flying motion.",
    description_de: "Hintere Schulter mit vorgebeugter Flugbewegung."
  },
  { 
    id: "dumbbell-row", 
    name: "Dumbbell Row", 
    name_de: "Kurzhantel Rudern", 
    image: dumbbellRow, 
    bodyPart: "upper_body",
    description: "Back exercise rowing dumbbell toward hip while bent over.",
    description_de: "Rückenübung, Kurzhantel zur Hüfte rudern."
  },
  { 
    id: "dumbbell-tricep-kickback", 
    name: "Dumbbell Tricep Kickback", 
    name_de: "Trizeps Kickbacks", 
    image: dumbbellTricepKickback, 
    bodyPart: "upper_body",
    description: "Tricep isolation extending arm back while bent over.",
    description_de: "Trizeps-Isolation, Arm nach hinten strecken."
  },
  { 
    id: "face-pull", 
    name: "Face Pull", 
    name_de: "Face Pull", 
    image: facePull, 
    bodyPart: "upper_body",
    description: "Cable exercise for rear delts and rotator cuff health.",
    description_de: "Kabelübung für hintere Schulter und Rotatorenmanschette."
  },
  { 
    id: "floor-press", 
    name: "Floor Press", 
    name_de: "Bodendrücken", 
    image: floorPress, 
    bodyPart: "upper_body",
    description: "Bench press variation on floor limiting range for tricep focus.",
    description_de: "Bankdrücken am Boden mit begrenztem Bewegungsumfang."
  },
  { 
    id: "hammer-curl", 
    name: "Hammer Curl", 
    name_de: "Hammer Curl", 
    image: hammerCurl, 
    bodyPart: "upper_body",
    description: "Bicep curl with neutral grip targeting brachialis muscle.",
    description_de: "Bizeps-Curl mit neutralem Griff für Brachialis."
  },
  { 
    id: "incline-dumbbell-bench", 
    name: "Incline Dumbbell Bench Press", 
    name_de: "Schrägbank Kurzhantel", 
    image: inclineDumbbellBenchPress, 
    bodyPart: "upper_body",
    description: "Inclined bench press for upper chest emphasis.",
    description_de: "Schrägbankdrücken für obere Brustmuskulatur."
  },
  { 
    id: "incline-hammer-curl", 
    name: "Incline Hammer Curl", 
    name_de: "Schräg Hammer Curl", 
    image: inclineHammerCurl, 
    bodyPart: "upper_body",
    description: "Hammer curl on incline bench for stretched bicep position.",
    description_de: "Hammer Curl auf Schrägbank für gedehnten Bizeps."
  },
  { 
    id: "lat-pulldown", 
    name: "Lat Pulldown", 
    name_de: "Latzug", 
    image: latPulldown, 
    bodyPart: "upper_body",
    description: "Cable exercise pulling bar down for latissimus development.",
    description_de: "Kabelübung, Stange nach unten ziehen für breiten Rücken."
  },
  { 
    id: "machine-biceps-curl", 
    name: "Machine Biceps Curl", 
    name_de: "Maschine Bizeps Curl", 
    image: machineBicepsCurl, 
    bodyPart: "upper_body",
    description: "Guided bicep curl machine for controlled isolation.",
    description_de: "Geführte Bizeps-Curl Maschine für kontrollierte Isolation."
  },
  { 
    id: "machine-chest-fly", 
    name: "Machine Chest Fly", 
    name_de: "Maschine Butterfly", 
    image: machineChestFly, 
    bodyPart: "upper_body",
    description: "Chest fly machine for pec isolation and definition.",
    description_de: "Butterfly-Maschine für Brust-Isolation und Definition."
  },
  { 
    id: "machine-lateral", 
    name: "Machine Lateral Raise", 
    name_de: "Maschine Seitheben", 
    image: machineLateral, 
    bodyPart: "upper_body",
    description: "Machine-guided lateral raise for shoulder isolation.",
    description_de: "Maschinen-geführtes Seitheben für Schulter-Isolation."
  },
  { 
    id: "machine-reverse-fly", 
    name: "Machine Reverse Fly", 
    name_de: "Maschine Reverse Fly", 
    image: machineReverseFly, 
    bodyPart: "upper_body",
    description: "Machine for rear deltoid and upper back isolation.",
    description_de: "Maschine für hintere Schulter und oberen Rücken."
  },
  { 
    id: "preacher-curl", 
    name: "Preacher Curl", 
    name_de: "Preacher Curl", 
    image: preacherCurl, 
    bodyPart: "upper_body",
    description: "Bicep curl on preacher bench for strict isolation.",
    description_de: "Bizeps-Curl am Scottbank für strikte Isolation."
  },
  { 
    id: "pull-ups", 
    name: "Pull Ups", 
    name_de: "Klimmzüge", 
    image: pullUps, 
    bodyPart: "upper_body",
    description: "Bodyweight exercise pulling up to bar for back and biceps.",
    description_de: "Eigengewichtsübung an der Stange für Rücken und Bizeps."
  },
  { 
    id: "push-ups", 
    name: "Push Ups", 
    name_de: "Liegestütze", 
    image: pushUps, 
    bodyPart: "upper_body",
    description: "Classic bodyweight exercise for chest, shoulders, and triceps.",
    description_de: "Klassische Eigengewichtsübung für Brust, Schultern und Trizeps."
  },
  { 
    id: "reverse-grip-bench", 
    name: "Reverse Grip Bench Press", 
    name_de: "Untergriff Bankdrücken", 
    image: reverseGripBenchPress, 
    bodyPart: "upper_body",
    description: "Bench press with underhand grip for upper chest activation.",
    description_de: "Bankdrücken mit Untergriff für obere Brust."
  },
  { 
    id: "shoulder-press", 
    name: "Shoulder Press", 
    name_de: "Schulterdrücken", 
    image: shoulderPress, 
    bodyPart: "upper_body",
    description: "Overhead pressing for overall shoulder strength and mass.",
    description_de: "Überkopf-Drücken für Schulterkraft und Masse."
  },
  { 
    id: "smith-machine-bench", 
    name: "Smith Machine Bench Press", 
    name_de: "Multipresse Bankdrücken", 
    image: smithMachineBenchPress, 
    bodyPart: "upper_body",
    description: "Guided bench press on Smith machine for safety.",
    description_de: "Geführtes Bankdrücken an der Multipresse."
  },
  { 
    id: "tricep-pushdown", 
    name: "Tricep Pushdown", 
    name_de: "Trizepsdrücken", 
    image: tricepPushdown, 
    bodyPart: "upper_body",
    description: "Cable exercise pushing down for tricep isolation.",
    description_de: "Kabelübung nach unten drücken für Trizeps-Isolation."
  },

  // Lower Body
  { 
    id: "barbell-glute-bridge", 
    name: "Barbell Glute Bridge", 
    name_de: "Langhantel Glute Bridge", 
    image: barbellGluteBridge, 
    bodyPart: "lower_body",
    description: "Hip thrust from floor with barbell for glute activation.",
    description_de: "Hüftstoß vom Boden mit Langhantel für Po-Aktivierung."
  },
  { 
    id: "barbell-lunge", 
    name: "Barbell Lunge", 
    name_de: "Langhantel Ausfallschritt", 
    image: barbellLunge, 
    bodyPart: "lower_body",
    description: "Lunging with barbell on back for legs and glutes.",
    description_de: "Ausfallschritt mit Langhantel für Beine und Po."
  },
  { 
    id: "bodyweight-calf-raise", 
    name: "Bodyweight Calf Raise", 
    name_de: "Wadenheben", 
    image: bodyweightCalfRaise, 
    bodyPart: "lower_body",
    description: "Standing calf raise using bodyweight for calf development.",
    description_de: "Wadenheben mit Eigengewicht für Wadenmuskulatur."
  },
  { 
    id: "bodyweight-squat", 
    name: "Bodyweight Squat", 
    name_de: "Kniebeugen", 
    image: bodyweightSquat, 
    bodyPart: "lower_body",
    description: "Basic squat without weights for leg strength foundation.",
    description_de: "Grundkniebeugen ohne Gewicht für Bein-Grundlage."
  },
  { 
    id: "donkey-calf", 
    name: "Donkey Calf", 
    name_de: "Donkey Wadenheben", 
    image: donkeyCalf, 
    bodyPart: "lower_body",
    description: "Bent-over calf raise for deep stretch and contraction.",
    description_de: "Vorgebeugtes Wadenheben für tiefe Dehnung."
  },
  { 
    id: "donkey-calf-raise", 
    name: "Donkey Calf Raise", 
    name_de: "Eselswadenheben", 
    image: donkeyCalfRaise, 
    bodyPart: "lower_body",
    description: "Machine-assisted donkey calf raise for calf mass.",
    description_de: "Maschinen-Eselswadenheben für Waden-Masse."
  },
  { 
    id: "dumbbell-bulgarian-split", 
    name: "Dumbbell Bulgarian Split Squat", 
    name_de: "Bulgarische Kniebeugen", 
    image: dumbbellBulgarianSplit, 
    bodyPart: "lower_body",
    description: "Single-leg squat with rear foot elevated for balance and strength.",
    description_de: "Einbeinige Kniebeuge mit erhöhtem hinteren Fuß."
  },
  { 
    id: "front-squat", 
    name: "Front Squat", 
    name_de: "Frontkniebeugen", 
    image: frontSquat, 
    bodyPart: "lower_body",
    description: "Squat with barbell in front for quad emphasis.",
    description_de: "Kniebeugen mit Langhantel vorne für Quadrizeps."
  },
  { 
    id: "glute-bridge", 
    name: "Glute Bridge", 
    name_de: "Glute Bridge", 
    image: gluteBridge, 
    bodyPart: "lower_body",
    description: "Floor exercise lifting hips for glute activation.",
    description_de: "Bodenübung, Hüfte heben für Po-Aktivierung."
  },
  { 
    id: "glute-kickback", 
    name: "Glute Kickback", 
    name_de: "Glute Kickback", 
    image: gluteKickback, 
    bodyPart: "lower_body",
    description: "Leg kick back movement isolating glute muscles.",
    description_de: "Beinkickback-Bewegung für isolierte Po-Muskeln."
  },
  { 
    id: "goblet-squat", 
    name: "Goblet Squat", 
    name_de: "Goblet Squat", 
    image: gobletSquat, 
    bodyPart: "lower_body",
    description: "Squat holding weight at chest for proper form.",
    description_de: "Kniebeuge mit Gewicht vor der Brust für richtige Form."
  },
  { 
    id: "hip-extension", 
    name: "Hip Extension", 
    name_de: "Hüftstrecker", 
    image: hipExtension, 
    bodyPart: "lower_body",
    description: "Exercise extending hips for glutes and hamstrings.",
    description_de: "Übung zur Hüftstreckung für Po und Beinbeuger."
  },
  { 
    id: "hip-thrust", 
    name: "Hip Thrust", 
    name_de: "Hip Thrust", 
    image: hipThrust, 
    bodyPart: "lower_body",
    description: "Best glute exercise thrusting hips with back on bench.",
    description_de: "Beste Po-Übung, Hüfte stoßen mit Rücken auf Bank."
  },
  { 
    id: "lunge", 
    name: "Lunge", 
    name_de: "Ausfallschritt", 
    image: lunge, 
    bodyPart: "lower_body",
    description: "Forward step exercise for legs and glutes.",
    description_de: "Vorwärtsschritt-Übung für Beine und Po."
  },
  { 
    id: "side-leg-raise", 
    name: "Side Leg Raise", 
    name_de: "Seitliches Beinheben", 
    image: sideLegRaise, 
    bodyPart: "lower_body",
    description: "Lateral leg lift for hip abductors and outer thigh.",
    description_de: "Seitliches Beinheben für Hüftabduktoren."
  },
  { 
    id: "single-leg-press", 
    name: "Single Leg Press", 
    name_de: "Einbeinige Beinpresse", 
    image: singleLegPress, 
    bodyPart: "lower_body",
    description: "Leg press one leg at a time for balanced development.",
    description_de: "Beinpresse einbeinig für ausgeglichene Entwicklung."
  },
  { 
    id: "single-leg-seated-raise", 
    name: "Single Leg Seated Raise", 
    name_de: "Einbeiniges Wadenheben", 
    image: singleLegSeatedRaise, 
    bodyPart: "lower_body",
    description: "Seated calf raise one leg for isolation.",
    description_de: "Sitzendes Wadenheben einbeinig für Isolation."
  },
  { 
    id: "single-leg-squat", 
    name: "Single Leg Squat", 
    name_de: "Einbeinige Kniebeuge", 
    image: singleLegSquat, 
    bodyPart: "lower_body",
    description: "Pistol squat or single leg squat for advanced balance.",
    description_de: "Pistol Squat für fortgeschrittene Balance."
  },
  { 
    id: "squat", 
    name: "Squat", 
    name_de: "Kniebeugen", 
    image: squat, 
    bodyPart: "lower_body",
    description: "King of exercises for full leg development.",
    description_de: "König der Übungen für volle Beinentwicklung."
  },
  { 
    id: "sumo-deadlift", 
    name: "Sumo Deadlift", 
    name_de: "Sumo Kreuzheben", 
    image: sumoDeadlift, 
    bodyPart: "lower_body",
    description: "Wide stance deadlift targeting inner thighs and glutes.",
    description_de: "Breite Kreuzheben-Variante für innere Oberschenkel und Po."
  },
  { 
    id: "walking-lunge", 
    name: "Walking Lunge", 
    name_de: "Gehender Ausfallschritt", 
    image: walkingLunge, 
    bodyPart: "lower_body",
    description: "Continuous lunging movement for cardio and legs.",
    description_de: "Kontinuierliche Ausfallschritte für Cardio und Beine."
  },

  // Core
  { 
    id: "ab-wheel-rollout", 
    name: "Ab Wheel Rollout", 
    name_de: "Bauchroller", 
    image: abWheelRollout, 
    bodyPart: "core",
    description: "Rolling wheel forward for intense ab contraction.",
    description_de: "Rad nach vorne rollen für intensive Bauch-Kontraktion."
  },
  { 
    id: "bicycle-crunch", 
    name: "Bicycle Crunch", 
    name_de: "Fahrrad Crunches", 
    image: bicycleCrunch, 
    bodyPart: "core",
    description: "Rotating crunch mimicking bicycle motion for obliques.",
    description_de: "Rotierende Crunches wie Fahrradfahren für seitliche Bauchmuskeln."
  },
  { 
    id: "crunches", 
    name: "Crunches", 
    name_de: "Crunches", 
    image: crunches, 
    bodyPart: "core",
    description: "Basic ab exercise curling upper body toward knees.",
    description_de: "Grundlegende Bauchübung, Oberkörper zu Knien curlen."
  },
  { 
    id: "flutter-kicks", 
    name: "Flutter Kicks", 
    name_de: "Flutter Kicks", 
    image: flutterKicks, 
    bodyPart: "core",
    description: "Alternating leg kicks while lying for lower abs.",
    description_de: "Wechselnde Beintritte im Liegen für untere Bauchmuskeln."
  },
  { 
    id: "hanging-leg-raise", 
    name: "Hanging Leg Raise", 
    name_de: "Hängendes Beinheben", 
    image: hangingLegRaise, 
    bodyPart: "core",
    description: "Hanging from bar, raising legs for lower abs.",
    description_de: "An Stange hängend, Beine heben für untere Bauchmuskeln."
  },
  { 
    id: "horizontal-leg", 
    name: "Horizontal Leg Raise", 
    name_de: "Horizontales Beinheben", 
    image: horizontalLeg, 
    bodyPart: "core",
    description: "Leg raise while lying flat for core strength.",
    description_de: "Beinheben im Liegen für Core-Stärke."
  },
  { 
    id: "jumping-jack", 
    name: "Jumping Jack", 
    name_de: "Hampelmänner", 
    image: jumpingJack, 
    bodyPart: "core",
    description: "Full body cardio exercise with jumping and arm movement.",
    description_de: "Ganzkörper-Cardio mit Springen und Armbewegung."
  },
  { 
    id: "lying-leg-raise", 
    name: "Lying Leg Raise", 
    name_de: "Liegendes Beinheben", 
    image: lyingLegRaise, 
    bodyPart: "core",
    description: "Lying flat, raising legs straight up for abs.",
    description_de: "Flach liegen, Beine gerade heben für Bauchmuskeln."
  },
  { 
    id: "mountain-climbers", 
    name: "Mountain Climbers", 
    name_de: "Bergsteiger", 
    image: mountainClimbers, 
    bodyPart: "core",
    description: "Dynamic plank with running motion for core and cardio.",
    description_de: "Dynamische Planke mit Laufbewegung für Core und Cardio."
  },
  { 
    id: "russian-twist", 
    name: "Russian Twist", 
    name_de: "Russian Twist", 
    image: russianTwist, 
    bodyPart: "core",
    description: "Seated rotation exercise for obliques with weight.",
    description_de: "Sitzende Rotationsübung für seitliche Bauchmuskeln."
  },
  { 
    id: "sit-ups", 
    name: "Sit Ups", 
    name_de: "Sit Ups", 
    image: sitUps, 
    bodyPart: "core",
    description: "Full sit up movement for upper and lower abs.",
    description_de: "Vollständige Sit-Up Bewegung für obere und untere Bauchmuskeln."
  },
  { 
    id: "toes-to-bar", 
    name: "Toes to Bar", 
    name_de: "Zehen zur Stange", 
    image: toesToBar, 
    bodyPart: "core",
    description: "Hanging exercise bringing toes up to touch bar.",
    description_de: "Hängeübung, Zehen zur Stange bringen."
  },
  { 
    id: "wrist-curl", 
    name: "Wrist Curl", 
    name_de: "Handgelenkscurls", 
    image: wristCurl, 
    bodyPart: "core",
    description: "Forearm exercise curling wrists for grip strength.",
    description_de: "Unterarmübung, Handgelenke curlen für Griffstärke."
  },
];

export const getExercisesByBodyPart = (bodyPart: "upper_body" | "lower_body" | "core") => {
  return allExercises.filter(ex => ex.bodyPart === bodyPart);
};