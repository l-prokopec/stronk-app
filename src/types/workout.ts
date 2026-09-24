export type Person = 'lukas' | 'terka'
export type PersonSet = { id: string; reps: string; weight: string }
export type ExerciseSetsByPerson = Record<Person, PersonSet[]>
export type ExerciseTemplate = { id: string; name: string; enabledByDefault: boolean; order: number; createdAt: string; updatedAt: string }
export type WorkoutTemplate = { id: string; name: string; exercises: ExerciseTemplate[]; createdAt: string; updatedAt: string }
export type WorkoutExercise = { id: string; exerciseTemplateId: string | null; name: string; order: number; setsByPerson: ExerciseSetsByPerson; isCompleted?: boolean }
export type Workout = { id: string; name: string; date: string; sourceTemplateId?: string | null; sourceTemplateName: string; exercises: WorkoutExercise[]; createdAt: string; updatedAt: string }
export type AppState = { version: 5; workoutTemplates: WorkoutTemplate[]; workouts: Workout[]; activeWorkoutId: string | null }
