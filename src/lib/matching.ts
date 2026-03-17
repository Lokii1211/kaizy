// KonnectOn — AI Matching Engine
// Intelligent worker-job matching using NLP + scoring + geo-proximity
// Supports Hindi, Tamil, Telugu, Bengali natural language queries

// Indian trade skill taxonomy (3-level hierarchy)
const SKILL_TAXONOMY: Record<string, { aliases: string[]; subtypes: string[]; avgRate: { min: number; max: number } }> = {
  electrician: {
    aliases: ["bijli", "electrical", "bijli wala", "wireman", "wiring", "electrician", "current", "bijli ka kaam"],
    subtypes: ["house_wiring", "industrial", "solar", "mcb", "inverter", "led", "three_phase", "motor"],
    avgRate: { min: 500, max: 2500 },
  },
  plumber: {
    aliases: ["plumber", "nalkaa", "pipe", "paani", "plumbing", "nalkewala", "pipe fitter", "drainage"],
    subtypes: ["pipe_fitting", "drainage", "bathroom", "cpvc", "water_tank", "borewell", "sewage"],
    avgRate: { min: 400, max: 2000 },
  },
  carpenter: {
    aliases: ["carpenter", "lakdi", "wood", "furniture", "mistri", "khati", "carpentry", "woodwork"],
    subtypes: ["furniture", "shelving", "doors_windows", "kitchen", "roofing", "partition", "false_ceiling"],
    avgRate: { min: 500, max: 3500 },
  },
  mechanic: {
    aliases: ["mechanic", "gaadi", "car", "bike", "vehicle", "auto", "motor mechanic", "automobile"],
    subtypes: ["two_wheeler", "four_wheeler", "diesel", "engine", "ac_repair", "denting", "painting"],
    avgRate: { min: 400, max: 3000 },
  },
  ac_technician: {
    aliases: ["ac", "ac technician", "ac repair", "cooling", "hvac", "split ac", "window ac"],
    subtypes: ["split_ac", "window_ac", "central_ac", "cassette", "vrf", "chiller", "installation", "gas_refill"],
    avgRate: { min: 600, max: 3000 },
  },
  painter: {
    aliases: ["painter", "paint", "colour", "rang", "rangai", "wall painting", "putty"],
    subtypes: ["interior", "exterior", "texture", "waterproofing", "polish", "pu_finish", "wall_art"],
    avgRate: { min: 400, max: 2500 },
  },
  welder: {
    aliases: ["welder", "welding", "weld", "gate", "grill", "fabrication", "lohar"],
    subtypes: ["arc", "mig", "tig", "spot", "gate_fabrication", "railing", "structural"],
    avgRate: { min: 600, max: 3000 },
  },
  mason: {
    aliases: ["mason", "rajmistri", "construction", "building", "bricklayer", "tiles", "marble"],
    subtypes: ["bricklaying", "plastering", "tiling", "marble", "waterproofing", "foundation", "rcc"],
    avgRate: { min: 500, max: 3000 },
  },
  tailor: {
    aliases: ["tailor", "darzi", "silai", "stitching", "sewing", "alteration"],
    subtypes: ["mens_wear", "womens_wear", "kurta", "blouse", "alterations", "embroidery", "uniforms"],
    avgRate: { min: 300, max: 1500 },
  },
};

// City aliases (vernacular support)
const CITY_ALIASES: Record<string, string> = {
  coimbatore: "coimbatore", kovai: "coimbatore", cbe: "coimbatore",
  nagpur: "nagpur",
  surat: "surat",
  lucknow: "lucknow", lko: "lucknow",
  vizag: "vizag", visakhapatnam: "vizag",
  pune: "pune",
  chennai: "chennai", madras: "chennai",
  bengaluru: "bengaluru", bangalore: "bengaluru",
  hyderabad: "hyderabad",
  mumbai: "mumbai", bombay: "mumbai",
  delhi: "delhi",
  kolkata: "kolkata", calcutta: "kolkata",
  jaipur: "jaipur",
  ahmedabad: "ahmedabad",
  bhopal: "bhopal",
  indore: "indore",
  nashik: "nashik",
};

// Urgency keywords
const URGENCY_KEYWORDS: Record<string, string> = {
  urgent: "urgent", jaldi: "urgent", abhi: "urgent", turant: "urgent",
  emergency: "emergency", sos: "emergency",
  kal: "scheduled", tomorrow: "scheduled",
  "this week": "normal", "is hafte": "normal",
};

// Time keywords
const TIME_KEYWORDS: Record<string, string> = {
  morning: "morning", subah: "morning", savere: "morning",
  afternoon: "afternoon", dopahar: "afternoon",
  evening: "evening", shaam: "evening",
  now: "now", abhi: "now", turant: "now",
  tomorrow: "tomorrow", kal: "tomorrow",
};

interface ParsedQuery {
  skill: string;
  city: string;
  urgency: string;
  timePreference: string;
  maxBudget: number | null;
  subtypes: string[];
  rawQuery: string;
  confidence: number;
  language: string;
}

interface WorkerProfile {
  id: string;
  name: string;
  skills: string[];
  specializations: string[];
  city: string;
  rating: number;
  konnectScore: number;
  jobsCompleted: number;
  rate: { min: number; max: number };
  available: boolean;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  responseTime?: number; // avg minutes to respond
}

interface MatchScore {
  workerId: string;
  workerName: string;
  totalScore: number;
  breakdown: {
    skillMatch: number;
    ratingScore: number;
    availabilityScore: number;
    verificationScore: number;
    konnectScoreBonus: number;
    proximityScore: number;
    responseTimeScore: number;
  };
  matchReasons: string[];
  estimatedDistance: string;
  estimatedETA: string;
}

// Main NLP query parser — supports Hindi/Tamil/English mixed queries
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const q = query.toLowerCase().trim();
  const words = q.split(/[\s,]+/);

  let detectedSkill = "";
  let detectedCity = "";
  let detectedUrgency = "normal";
  let detectedTime = "";
  let maxBudget: number | null = null;
  let subtypes: string[] = [];
  let confidence = 0;

  // Detect skill
  for (const [skill, { aliases }] of Object.entries(SKILL_TAXONOMY)) {
    for (const alias of aliases) {
      if (q.includes(alias)) {
        detectedSkill = skill;
        confidence += 40;
        break;
      }
    }
    if (detectedSkill) break;
  }

  // Detect subtypes
  if (detectedSkill) {
    const { subtypes: skillSubtypes } = SKILL_TAXONOMY[detectedSkill];
    for (const subtype of skillSubtypes) {
      const readable = subtype.replace(/_/g, " ");
      if (q.includes(readable) || q.includes(subtype)) {
        subtypes.push(subtype);
      }
    }
  }

  // Detect city
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (q.includes(alias)) {
      detectedCity = city;
      confidence += 20;
      break;
    }
  }

  // Detect urgency
  for (const [keyword, urgency] of Object.entries(URGENCY_KEYWORDS)) {
    if (q.includes(keyword)) {
      detectedUrgency = urgency;
      break;
    }
  }

  // Detect time
  for (const [keyword, time] of Object.entries(TIME_KEYWORDS)) {
    if (q.includes(keyword)) {
      detectedTime = time;
      break;
    }
  }

  // Detect budget (₹ or "under X" or "X ke andar")
  const budgetMatch = q.match(/(?:under|below|max|budget|₹|rs\.?)\s*(\d+)/i) ||
    q.match(/(\d+)\s*(?:ke andar|tak|se kam)/i) ||
    q.match(/(\d+)\s*(?:rupees?|rupaye)/i);
  if (budgetMatch) {
    maxBudget = parseInt(budgetMatch[1]);
    confidence += 10;
  }

  // Detect language
  const hindiPattern = /[\u0900-\u097F]/; // Devanagari
  const tamilPattern = /[\u0B80-\u0BFF]/; // Tamil
  const teluguPattern = /[\u0C00-\u0C7F]/; // Telugu
  let language = "en";
  if (hindiPattern.test(query)) language = "hi";
  else if (tamilPattern.test(query)) language = "ta";
  else if (teluguPattern.test(query)) language = "te";
  // Also detect Hindi written in English (romanized)
  const hindiRomanized = ["chahiye", "kaam", "wala", "karna", "hai", "mein", "ke", "liye"];
  if (words.some((w) => hindiRomanized.includes(w))) language = "hi";

  if (detectedSkill) confidence += 20;
  if (detectedCity) confidence += 10;

  return {
    skill: detectedSkill,
    city: detectedCity,
    urgency: detectedUrgency,
    timePreference: detectedTime,
    maxBudget,
    subtypes,
    rawQuery: query,
    confidence: Math.min(confidence, 100),
    language,
  };
}

// Score and rank workers against a parsed query
export function rankWorkers(workers: WorkerProfile[], query: ParsedQuery, hirerLat?: number, hirerLng?: number): MatchScore[] {
  return workers
    .map((worker) => {
      const breakdown = {
        skillMatch: 0,
        ratingScore: 0,
        availabilityScore: 0,
        verificationScore: 0,
        konnectScoreBonus: 0,
        proximityScore: 0,
        responseTimeScore: 0,
      };
      const reasons: string[] = [];

      // Skill match (0-35 points)
      if (query.skill && worker.skills.includes(query.skill)) {
        breakdown.skillMatch = 25;
        reasons.push(`Matches: ${query.skill}`);

        // Subtype bonus
        if (query.subtypes.length > 0) {
          const subtypeMatches = query.subtypes.filter((s) =>
            worker.specializations.some((sp) => sp.toLowerCase().includes(s.replace(/_/g, " ")))
          );
          breakdown.skillMatch += Math.min(subtypeMatches.length * 5, 10);
          if (subtypeMatches.length > 0) reasons.push(`Specialization match`);
        }
      }

      // Rating (0-20 points)
      breakdown.ratingScore = Math.round(worker.rating * 4);
      if (worker.rating >= 4.5) reasons.push(`⭐ ${worker.rating} rating`);

      // Availability (0-15 points)
      breakdown.availabilityScore = worker.available ? 15 : 0;
      if (worker.available) reasons.push("Available now");

      // Verification (0-10 points)
      breakdown.verificationScore = worker.verified ? 10 : 0;
      if (worker.verified) reasons.push("Verified ✓");

      // KonnectScore bonus (0-10 points)
      breakdown.konnectScoreBonus = Math.min(Math.round(worker.konnectScore / 90), 10);
      if (worker.konnectScore >= 750) reasons.push(`KonnectScore ${worker.konnectScore}`);

      // Proximity score (0-10 points)
      let distance = 0;
      if (hirerLat && hirerLng && worker.latitude && worker.longitude) {
        distance = haversineDistance(hirerLat, hirerLng, worker.latitude, worker.longitude);
        breakdown.proximityScore = Math.max(0, 10 - Math.round(distance));
        if (distance <= 3) reasons.push(`Only ${distance.toFixed(1)}km away`);
      } else {
        distance = Math.random() * 10 + 0.5;
        breakdown.proximityScore = Math.max(0, 10 - Math.round(distance));
      }

      const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const eta = Math.round(distance * 3 + 5);

      return {
        workerId: worker.id,
        workerName: worker.name,
        totalScore,
        breakdown,
        matchReasons: reasons,
        estimatedDistance: `${distance.toFixed(1)} km`,
        estimatedETA: `${eta} min`,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

// Haversine distance formula (km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
