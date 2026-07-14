export const normalizeExerciseName = (name: string): string => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ')
export const cleanExerciseName = (name: string): string => name.trim().replace(/\s+/g, ' ')
export const validateExerciseName = (name: string): string | null => {
  const cleaned = cleanExerciseName(name)
  if (!cleaned) return 'Zadejte název cviku.'
  if (cleaned.length > 80) return 'Název může mít nejvýše 80 znaků.'
  return null
}
