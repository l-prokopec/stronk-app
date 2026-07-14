export type PersonSetData = { weight: string; reps: string }
export type WorkoutSet = { id: string; lukas: PersonSetData; terka: PersonSetData }
export type ExerciseTemplate = { id: string; name: string; enabledByDefault: boolean; order: number; createdAt: string; updatedAt: string }
export type WorkoutExercise = { id: string; exerciseTemplateId: string | null; name: string; order: number; sets: WorkoutSet[] }
export type Workout = { id: string; date: string; exercises: WorkoutExercise[]; createdAt: string; updatedAt: string }
export type AppState = { version: 1; exerciseTemplates: ExerciseTemplate[]; workouts: Workout[]; activeWorkoutId: string | null }
export type Person = 'lukas' | 'terka'
export type WorkoutCreationMode = 'withTemplates' | 'empty'
