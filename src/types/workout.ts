export type Person = 'lukas' | 'terka'
export type PersonSet = { id: string; reps: string; weight: string }
export type ExerciseSetsByPerson = Record<Person, PersonSet[]>
export type ExerciseTemplate = { id: string; name: string; enabledByDefault: boolean; order: number; createdAt: string; updatedAt: string }
export type WorkoutExercise = { id: string; exerciseTemplateId: string | null; name: string; order: number; setsByPerson: ExerciseSetsByPerson }
export type Workout = { id: string; date: string; exercises: WorkoutExercise[]; createdAt: string; updatedAt: string }
export type AppState = { version: 2; exerciseTemplates: ExerciseTemplate[]; workouts: Workout[]; activeWorkoutId: string | null }
export type WorkoutCreationMode = 'withTemplates' | 'empty'
