// ── Questionnaire field types ─────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'yesno'
  | 'radio'
  | 'checkbox_list'
  | 'heading'      // section divider, not a real field

export interface QuestionnaireField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]       // for select, multiselect, radio, checkbox_list
  placeholder?: string
  hint?: string            // helper text below field
  section?: string         // section heading this field belongs to
}

export interface QuestionnaireSection {
  id: string
  title: string
  fields: QuestionnaireField[]
}

export interface QuestionnaireAnswers {
  [fieldId: string]: string | string[] | boolean
}

// ── Parsed answers used to populate the day-of sheet ─────────────

export interface DayOfData {
  // Cover
  partnerOneName: string
  partnerTwoName: string
  weddingDate: string
  venueName: string
  venueAddress?: string
  engagementPhotoUrl?: string

  // Day-of details column
  leadPhotographer: string
  secondPhotographer?: string
  hoursOfCoverage?: string
  guestCount?: string
  weddingParty?: string
  dressCode?: string
  hasCoordinator?: string
  mostImportantPhotos?: string

  // Location details column
  bridalPrepAddress?: string
  groomPrepAddress?: string
  firstLookLocation?: string
  ceremonyAddress?: string
  ceremonyLocation?: string
  cocktailLocation?: string
  receptionAddress?: string
  sunsetLocation?: string

  // Contact info column
  alternateContactBride?: string
  alternateContactGroom?: string
  vendors: { role: string; name: string; phone?: string; email?: string }[]

  // Timeline
  timeline: { label: string; brideTime?: string; groomTime?: string; time?: string; notes?: string }[]

  // Shot list
  familyShots?: string
  mustHaveShots?: string
  mustHaveLocations?: string
  bridesmaidsCount?: string
  groomsmenCount?: string
  weddingPartyNames?: string
  divorcedParentsNotes?: string

  // Notes
  notes?: string
  restrictions?: string
  surprises?: string
  expectations?: string
}