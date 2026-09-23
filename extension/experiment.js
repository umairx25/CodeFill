const CANDIDATE_PATTERN = /\b(?:\d{3}[- ]\d{3}|\d{4,8}|(?=[a-z0-9-]{4,12}\b)(?=[a-z0-9-]*[a-z])(?=[a-z0-9-]*\d)[a-z0-9]+(?:-[a-z0-9]+)*)\b/gi;

export function findCandidates(text) {
  return [...new Set([...text.matchAll(CANDIDATE_PATTERN)].map(match => match[0]))];
}

export function analyzeCandidate(text, candidate) {
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const occurrences = [...text.matchAll(new RegExp(`\\b${escaped}\\b`, 'gi'))];
  let best = { candidate, score: 0, reasons: [], context: '' };

  for (const occurrence of occurrences) {
    const index = occurrence.index ?? 0;
    const before = text.slice(Math.max(0, index - 150), index);
    const after = text.slice(index + candidate.length, index + candidate.length + 120);
    const nearby = `${before}${candidate}${after}`;
    const reasons = [];
    let score = 0;

    if (/(?:verification|security|authentication|one[- ]?time)\s+(?:code|passcode)|(?:code|passcode|otp|pin)\s*(?:is|:|-|—)?\s*$/i.test(before)) {
      score += 7; reasons.push('explicit code label');
    }
    if (/(?:use|enter|type|input|copy|confirm)\b[\s\S]{0,100}(?:code|passcode|otp|pin)/i.test(before)) {
      score += 3; reasons.push('entry instruction');
    }
    if (/(?:verify|verification|sign[- ]?in|login|authenticate|new device)/i.test(nearby)) {
      score += 2; reasons.push('verification context');
    }
    if (/(?:expire|expires|valid for|minutes?|hours?)/i.test(nearby)) {
      score += 1; reasons.push('expiry context');
    }
    if (/[a-z]/i.test(candidate) && /\d/.test(candidate)) {
      score += 0.5; reasons.push('mixed code format');
    }
    if (/(?:reference|postal(?: code)?|zip(?: code)?|order|invoice|account|phone|tracking)\s*(?:number|no\.?|id|:|-)?\s*$/i.test(before)) {
      score -= 8; reasons.push('non-code label');
    }
    if (/^(?:\s*(?:minutes?|hours?|days?|seconds?|am|pm)\b)/i.test(after)) {
      score -= 3; reasons.push('time value');
    }

    const result = { candidate, score, reasons, context: nearby.replace(/\s+/g, ' ').trim() };
    if (result.score > best.score || !best.context) best = result;
  }
  return best;
}

export function rankCandidates(text) {
  return findCandidates(text).map(candidate => analyzeCandidate(text, candidate)).sort((a, b) => b.score - a.score);
}

export function chooseWinner(text) {
  const ranked = rankCandidates(text);
  const winner = ranked[0];
  const runnerUp = ranked.find(item => item.candidate.toLowerCase() !== winner?.candidate.toLowerCase());
  return winner && winner.score >= 4 && (!runnerUp || winner.score - runnerUp.score >= 2) ? winner : null;
}
