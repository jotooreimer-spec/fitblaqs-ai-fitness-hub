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
}

export const allExercises: ExerciseItem[] = [
  // Upper Body
  { id: "arnold-press", name: "Arnold Press", name_de: "Arnold Press", image: arnoldPress, bodyPart: "upper_body" },
  { id: "barbell-curl", name: "Barbell Curl", name_de: "Langhantel Curl", image: barbellCurl, bodyPart: "upper_body" },
  { id: "barbell-front-raise", name: "Barbell Front Raise", name_de: "Langhantel Frontheben", image: barbellFrontRaise, bodyPart: "upper_body" },
  { id: "bench-press", name: "Bench Press", name_de: "Bankdrücken", image: benchPress, bodyPart: "upper_body" },
  { id: "cable-fly", name: "Cable Fly", name_de: "Kabelzug Fly", image: cableFly, bodyPart: "upper_body" },
  { id: "cable-overhead-tricep", name: "Cable Overhead Tricep Extension", name_de: "Kabel Trizeps Extension", image: cableOverheadTricepExtension, bodyPart: "upper_body" },
  { id: "chest-press", name: "Chest Press", name_de: "Brustpresse", image: chestPress, bodyPart: "upper_body" },
  { id: "close-grip-bench", name: "Close Grip Bench Press", name_de: "Enges Bankdrücken", image: closeGripBenchPress, bodyPart: "upper_body" },
  { id: "deadlift", name: "Deadlift", name_de: "Kreuzheben", image: deadlift, bodyPart: "upper_body" },
  { id: "deadlift-standards", name: "Deadlift Standards", name_de: "Kreuzheben Standard", image: deadliftStandards, bodyPart: "upper_body" },
  { id: "diamond-push-ups", name: "Diamond Push Ups", name_de: "Diamant Liegestütze", image: diamondPushUps, bodyPart: "upper_body" },
  { id: "dips", name: "Dips", name_de: "Dips", image: dips, bodyPart: "upper_body" },
  { id: "dumbbell-bench-press", name: "Dumbbell Bench Press", name_de: "Kurzhantel Bankdrücken", image: dumbbellBenchPress, bodyPart: "upper_body" },
  { id: "dumbbell-concentration-curl", name: "Dumbbell Concentration Curl", name_de: "Konzentrationscurls", image: dumbbellConcentrationCurl, bodyPart: "upper_body" },
  { id: "dumbbell-face-pull", name: "Dumbbell Face Pull", name_de: "Kurzhantel Face Pull", image: dumbbellFacePull, bodyPart: "upper_body" },
  { id: "dumbbell-front-raise", name: "Dumbbell Front Raise", name_de: "Kurzhantel Frontheben", image: dumbbellFrontRaise, bodyPart: "upper_body" },
  { id: "dumbbell-lateral-raise", name: "Dumbbell Lateral Raise", name_de: "Kurzhantel Seitheben", image: dumbbellLateralRaise, bodyPart: "upper_body" },
  { id: "dumbbell-reverse-fly", name: "Dumbbell Reverse Fly", name_de: "Kurzhantel Reverse Fly", image: dumbbellReverseFly, bodyPart: "upper_body" },
  { id: "dumbbell-row", name: "Dumbbell Row", name_de: "Kurzhantel Rudern", image: dumbbellRow, bodyPart: "upper_body" },
  { id: "dumbbell-tricep-kickback", name: "Dumbbell Tricep Kickback", name_de: "Trizeps Kickbacks", image: dumbbellTricepKickback, bodyPart: "upper_body" },
  { id: "face-pull", name: "Face Pull", name_de: "Face Pull", image: facePull, bodyPart: "upper_body" },
  { id: "floor-press", name: "Floor Press", name_de: "Bodendrücken", image: floorPress, bodyPart: "upper_body" },
  { id: "hammer-curl", name: "Hammer Curl", name_de: "Hammer Curl", image: hammerCurl, bodyPart: "upper_body" },
  { id: "incline-dumbbell-bench", name: "Incline Dumbbell Bench Press", name_de: "Schrägbank Kurzhantel", image: inclineDumbbellBenchPress, bodyPart: "upper_body" },
  { id: "incline-hammer-curl", name: "Incline Hammer Curl", name_de: "Schräg Hammer Curl", image: inclineHammerCurl, bodyPart: "upper_body" },
  { id: "lat-pulldown", name: "Lat Pulldown", name_de: "Latzug", image: latPulldown, bodyPart: "upper_body" },
  { id: "machine-biceps-curl", name: "Machine Biceps Curl", name_de: "Maschine Bizeps Curl", image: machineBicepsCurl, bodyPart: "upper_body" },
  { id: "machine-chest-fly", name: "Machine Chest Fly", name_de: "Maschine Butterfly", image: machineChestFly, bodyPart: "upper_body" },
  { id: "machine-lateral", name: "Machine Lateral Raise", name_de: "Maschine Seitheben", image: machineLateral, bodyPart: "upper_body" },
  { id: "machine-reverse-fly", name: "Machine Reverse Fly", name_de: "Maschine Reverse Fly", image: machineReverseFly, bodyPart: "upper_body" },
  { id: "preacher-curl", name: "Preacher Curl", name_de: "Preacher Curl", image: preacherCurl, bodyPart: "upper_body" },
  { id: "pull-ups", name: "Pull Ups", name_de: "Klimmzüge", image: pullUps, bodyPart: "upper_body" },
  { id: "push-ups", name: "Push Ups", name_de: "Liegestütze", image: pushUps, bodyPart: "upper_body" },
  { id: "reverse-grip-bench", name: "Reverse Grip Bench Press", name_de: "Untergriff Bankdrücken", image: reverseGripBenchPress, bodyPart: "upper_body" },
  { id: "shoulder-press", name: "Shoulder Press", name_de: "Schulterdrücken", image: shoulderPress, bodyPart: "upper_body" },
  { id: "smith-machine-bench", name: "Smith Machine Bench Press", name_de: "Multipresse Bankdrücken", image: smithMachineBenchPress, bodyPart: "upper_body" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", name_de: "Trizepsdrücken", image: tricepPushdown, bodyPart: "upper_body" },

  // Lower Body
  { id: "barbell-glute-bridge", name: "Barbell Glute Bridge", name_de: "Langhantel Glute Bridge", image: barbellGluteBridge, bodyPart: "lower_body" },
  { id: "barbell-lunge", name: "Barbell Lunge", name_de: "Langhantel Ausfallschritt", image: barbellLunge, bodyPart: "lower_body" },
  { id: "bodyweight-calf-raise", name: "Bodyweight Calf Raise", name_de: "Wadenheben", image: bodyweightCalfRaise, bodyPart: "lower_body" },
  { id: "bodyweight-squat", name: "Bodyweight Squat", name_de: "Kniebeugen", image: bodyweightSquat, bodyPart: "lower_body" },
  { id: "donkey-calf", name: "Donkey Calf", name_de: "Donkey Wadenheben", image: donkeyCalf, bodyPart: "lower_body" },
  { id: "donkey-calf-raise", name: "Donkey Calf Raise", name_de: "Eselswadenheben", image: donkeyCalfRaise, bodyPart: "lower_body" },
  { id: "dumbbell-bulgarian-split", name: "Dumbbell Bulgarian Split Squat", name_de: "Bulgarische Kniebeugen", image: dumbbellBulgarianSplit, bodyPart: "lower_body" },
  { id: "front-squat", name: "Front Squat", name_de: "Frontkniebeugen", image: frontSquat, bodyPart: "lower_body" },
  { id: "glute-bridge", name: "Glute Bridge", name_de: "Glute Bridge", image: gluteBridge, bodyPart: "lower_body" },
  { id: "glute-kickback", name: "Glute Kickback", name_de: "Glute Kickback", image: gluteKickback, bodyPart: "lower_body" },
  { id: "goblet-squat", name: "Goblet Squat", name_de: "Goblet Squat", image: gobletSquat, bodyPart: "lower_body" },
  { id: "hip-extension", name: "Hip Extension", name_de: "Hüftstrecker", image: hipExtension, bodyPart: "lower_body" },
  { id: "hip-thrust", name: "Hip Thrust", name_de: "Hip Thrust", image: hipThrust, bodyPart: "lower_body" },
  { id: "lunge", name: "Lunge", name_de: "Ausfallschritt", image: lunge, bodyPart: "lower_body" },
  { id: "side-leg-raise", name: "Side Leg Raise", name_de: "Seitliches Beinheben", image: sideLegRaise, bodyPart: "lower_body" },
  { id: "single-leg-press", name: "Single Leg Press", name_de: "Einbeinige Beinpresse", image: singleLegPress, bodyPart: "lower_body" },
  { id: "single-leg-seated-raise", name: "Single Leg Seated Raise", name_de: "Einbeiniges Wadenheben", image: singleLegSeatedRaise, bodyPart: "lower_body" },
  { id: "single-leg-squat", name: "Single Leg Squat", name_de: "Einbeinige Kniebeuge", image: singleLegSquat, bodyPart: "lower_body" },
  { id: "squat", name: "Squat", name_de: "Kniebeugen", image: squat, bodyPart: "lower_body" },
  { id: "sumo-deadlift", name: "Sumo Deadlift", name_de: "Sumo Kreuzheben", image: sumoDeadlift, bodyPart: "lower_body" },
  { id: "walking-lunge", name: "Walking Lunge", name_de: "Gehender Ausfallschritt", image: walkingLunge, bodyPart: "lower_body" },

  // Core
  { id: "ab-wheel-rollout", name: "Ab Wheel Rollout", name_de: "Bauchroller", image: abWheelRollout, bodyPart: "core" },
  { id: "bicycle-crunch", name: "Bicycle Crunch", name_de: "Fahrrad Crunches", image: bicycleCrunch, bodyPart: "core" },
  { id: "crunches", name: "Crunches", name_de: "Crunches", image: crunches, bodyPart: "core" },
  { id: "flutter-kicks", name: "Flutter Kicks", name_de: "Flutter Kicks", image: flutterKicks, bodyPart: "core" },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", name_de: "Hängendes Beinheben", image: hangingLegRaise, bodyPart: "core" },
  { id: "horizontal-leg", name: "Horizontal Leg Raise", name_de: "Horizontales Beinheben", image: horizontalLeg, bodyPart: "core" },
  { id: "jumping-jack", name: "Jumping Jack", name_de: "Hampelmänner", image: jumpingJack, bodyPart: "core" },
  { id: "lying-leg-raise", name: "Lying Leg Raise", name_de: "Liegendes Beinheben", image: lyingLegRaise, bodyPart: "core" },
  { id: "mountain-climbers", name: "Mountain Climbers", name_de: "Bergsteiger", image: mountainClimbers, bodyPart: "core" },
  { id: "russian-twist", name: "Russian Twist", name_de: "Russian Twist", image: russianTwist, bodyPart: "core" },
  { id: "sit-ups", name: "Sit Ups", name_de: "Sit Ups", image: sitUps, bodyPart: "core" },
  { id: "toes-to-bar", name: "Toes to Bar", name_de: "Zehen zur Stange", image: toesToBar, bodyPart: "core" },
  { id: "wrist-curl", name: "Wrist Curl", name_de: "Handgelenkscurls", image: wristCurl, bodyPart: "core" },
];

export const getExercisesByBodyPart = (bodyPart: "upper_body" | "lower_body" | "core") => {
  return allExercises.filter(ex => ex.bodyPart === bodyPart);
};
