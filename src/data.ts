import { Language, Scenario, Voice } from "./types";

export const LANGUAGES: Language[] = [
  { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },
  { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },
  { code: "en", name: "English", flag: "🇺🇸", defaultVoice: "Charon" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" }
];

export const SCENARIOS: Scenario[] = [
  {
    id: "casual_chat",
    title: "Casual Friendly Chat",
    description: "Meet a warm local resident in a park and share your hobbies, background, and travel experiences.",
    iconName: "MessageCircle",
    promptContext: "The user is meeting you in a beautiful public park. Engage in casual friendly small talk, ask them what they like about your country, what their hobbies are, and share small anecdotes."
  },
  {
    id: "cafe_order",
    title: "Ordering at a Cafe",
    description: "Step into a cozy local cafe, order a warm drink and pastry, ask about ingredients, and settle the bill.",
    iconName: "Coffee",
    promptContext: "You are the barista at 'Cafe Aromas'. Greet the customer warmly, recommend a special pastry or pour-over coffee, help them customize their order, and request payment."
  },
  {
    id: "hotel_checkin",
    title: "Hotel Check-In",
    description: "Check into a charming boutique hotel, specify your room preferences, and ask for recommendations.",
    iconName: "Hotel",
    promptContext: "You are the receptionist at 'Hotel Splendide'. Welcome the guest, ask for their reservation details, explain breakfast times, and give them 2 hidden local tips for dinner nearby."
  },
  {
    id: "job_interview",
    title: "Mock Job Interview",
    description: "Test your skills in a professional interview for a role at a creative local startup.",
    iconName: "Briefcase",
    promptContext: "You are the hiring manager at a fast-growing local startup. Conduct a warm but professional interview. Ask about their background, why they want this job, and how they handle team collaboration."
  },
  {
    id: "asking_directions",
    title: "Asking for Directions",
    description: "You're slightly lost. Stop a friendly passerby to ask for directions to a scenic viewpoint or station.",
    iconName: "Map",
    promptContext: "You are a helpful local resident walking down the street. The user will ask you for directions to the grand square or the local station. Explain the directions using simple landmarks and turns."
  },
  {
    id: "doctors_visit",
    title: "At the Doctor's Clinic",
    description: "Explain a minor physical symptom (like a sore throat or headache) and get supportive medical advice.",
    iconName: "Activity",
    promptContext: "You are Dr. Elena, a kind and supportive family doctor. Ask the patient how they are feeling, listen to their symptoms, offer gentle medical advice, and suggest resting or drinking water."
  }
];

export const VOICES: Voice[] = [
  { name: "Zephyr", gender: "Female", description: "Warm, expressive, clear tone - excellent for Portuguese, French, and general dialogue." },
  { name: "Kore", gender: "Female", description: "Soft, gentle, calm pace - ideal for French, English, and soothing practice." },
  { name: "Aoede", gender: "Female", description: "Clear, highly articulate, balanced voice - perfect for Chinese and tonal language training." },
  { name: "Fenrir", gender: "Male", description: "Deep, resonant, steady pacing - perfect for European languages and structured sessions." },
  { name: "Charon", gender: "Male", description: "Clear, crisp, professional and highly articulation-conscious - ideal for clear pronunciation." }
];
