export interface DuplicateCandidate {
  complaintId: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface DuplicateCheckResult {
  isDuplicateSuspect: boolean;
  suspectComplaintId: string | null;
  similarityPercentage: number;
  reason: string | null;
  distanceMeters: number | null;
}

// Haversine formula to compute distance in meters between two lat/lng coordinates
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Text similarity using token Jaccard & keyword overlap
export function calculateTextSimilarity(text1: string, text2: string): number {
  const cleanTokens = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  };

  const tokens1 = cleanTokens(text1);
  const tokens2 = cleanTokens(text2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

export function detectDuplicates(
  newComplaint: {
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
  },
  existingComplaints: DuplicateCandidate[]
): DuplicateCheckResult {
  let bestMatch: DuplicateCandidate | null = null;
  let highestScore = 0;
  let bestDistance = 0;
  let bestExplanation = '';

  const newText = `${newComplaint.title} ${newComplaint.description}`;

  for (const existing of existingComplaints) {
    // Skip closed or resolved cases older than active window if necessary, but keep open ones
    const dist = calculateHaversineDistance(
      newComplaint.latitude,
      newComplaint.longitude,
      existing.latitude,
      existing.longitude
    );

    const existingText = `${existing.title} ${existing.description}`;
    const textSim = calculateTextSimilarity(newText, existingText);

    const categoryMatch =
      newComplaint.category.toLowerCase() === existing.category.toLowerCase() ? 1.0 : 0.2;

    // Distance scoring
    let distScore = 0;
    if (dist <= 60) {
      distScore = 1.0;
    } else if (dist <= 200) {
      distScore = 0.85;
    } else if (dist <= 500) {
      distScore = 0.6;
    } else if (dist <= 1500) {
      distScore = 0.3;
    } else {
      distScore = 0.0;
    }

    // Weighted composite similarity
    // Text: 45%, Distance: 35%, Category: 20%
    const compositeScore = textSim * 0.45 + distScore * 0.35 + categoryMatch * 0.2;
    const scorePercentage = Math.round(compositeScore * 100);

    if (scorePercentage > highestScore) {
      highestScore = scorePercentage;
      bestMatch = existing;
      bestDistance = dist;

      const reasons: string[] = [];
      if (dist <= 150) {
        reasons.push(`very close proximity (${dist}m away)`);
      } else if (dist <= 500) {
        reasons.push(`within 500m radius (${dist}m)`);
      }
      if (textSim > 0.4) {
        reasons.push(`high issue description correlation (${Math.round(textSim * 100)}% keyword overlap)`);
      }
      if (categoryMatch === 1.0) {
        reasons.push(`matching ${existing.category} classification`);
      }

      bestExplanation = `Potential duplicate of ${existing.complaintId} due to ${reasons.join(', ')}.`;
    }
  }

  // Threshold: if score >= 55%, mark as duplicate suspect
  if (highestScore >= 55 && bestMatch) {
    return {
      isDuplicateSuspect: true,
      suspectComplaintId: bestMatch.complaintId,
      similarityPercentage: Math.min(98, highestScore),
      reason: bestExplanation,
      distanceMeters: bestDistance,
    };
  }

  return {
    isDuplicateSuspect: false,
    suspectComplaintId: null,
    similarityPercentage: highestScore,
    reason: null,
    distanceMeters: bestMatch ? bestDistance : null,
  };
}
