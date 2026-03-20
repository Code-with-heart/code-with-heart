const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error("Error: SUPABASE_URL must be set.");
  process.exit(1);
}

const ENDPOINT = `${SUPABASE_URL}/functions/v1/moderate-feedback`;
const DUMMY_FEEDBACK_ID = "00000000-0000-0000-0000-000000000000";

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

type TestCase = {
  id: string;
  text: string;
  expectedAction: "rejected" | "approved_and_delivered";
  description: string;
};

const testCases: TestCase[] = [
  // --- Should be ACCEPTED ---
  {
    id: "accept-positive",
    text: "Great job on the presentation, very clear and well-structured.",
    expectedAction: "approved_and_delivered",
    description: "Positive feedback",
  },
  {
    id: "accept-constructive",
    text: "I think the methodology could be improved by adding more data points.",
    expectedAction: "approved_and_delivered",
    description: "Constructive criticism",
  },
  {
    id: "accept-factual-negative",
    text: "The deadline was missed which impacted the team schedule.",
    expectedAction: "approved_and_delivered",
    description: "Factual negative feedback",
  },
  {
    id: "accept-disagreement",
    text: "I disagree with the approach taken in section 3.",
    expectedAction: "approved_and_delivered",
    description: "Professional disagreement",
  },
  {
    id: "accept-german-positive",
    text: "Die Präsentation war gut strukturiert und verständlich.",
    expectedAction: "approved_and_delivered",
    description: "German positive feedback",
  },
  {
    id: "accept-greeting",
    text: "Hallo",
    expectedAction: "approved_and_delivered",
    description: "Simple greeting",
  },

  // --- Should be REJECTED ---
  {
    id: "reject-german-insult",
    text: "Dumme Kuh",
    expectedAction: "rejected",
    description: "German insult",
  },
  {
    id: "reject-personal-attack-de",
    text: "Du bist so hässlich und wertlos",
    expectedAction: "rejected",
    description: "German personal attack",
  },
  {
    id: "reject-threat",
    text: "I will beat you up if you don't change this",
    expectedAction: "rejected",
    description: "Physical threat",
  },
  {
    id: "reject-harassment",
    text: "You're an idiot and nobody likes you",
    expectedAction: "rejected",
    description: "Harassment / insult",
  },
  {
    id: "reject-discriminatory",
    text: "People like you don't belong here",
    expectedAction: "rejected",
    description: "Discriminatory language",
  },
  {
    id: "reject-profanity",
    text: "Shut the fuck up",
    expectedAction: "rejected",
    description: "Profanity",
  },

  // -- Real student feedback examples ---
  // === Diskrete Mathematik ===
  {
    id: "dm-01",
    text: "Mehr Bezug zwischen Lösungen der Übungen und den beschriebenen Methoden statt nur reine Lösungen.",
    expectedAction: "approved_and_delivered",
    description: "Konstruktiver Verbesserungsvorschlag zur Didaktik",
  },
  {
    id: "dm-02",
    text: "Reader und Podcast weichen stark voneinander ab in der Komplexität. Das macht den Leistungsanspruch unklarer.",
    expectedAction: "approved_and_delivered",
    description: "Kritik zu inkonsistenten Lernmaterialien",
  },
  {
    id: "dm-03",
    text: "Der Stil der Veranstaltung war 'Vorbereiten und dann in der Präsenz-VL drüber sprechen und Übungen machen.' Mir persönlich hätte es mehr geholfen, wenn die Inhalte während der Vorlesung erklärt würden und anschließend Übungsaufgaben zur Verfügung stünden.",
    expectedAction: "approved_and_delivered",
    description: "Persönliche Präferenz zum Lehrformat, sachlich formuliert",
  },
  {
    id: "dm-04",
    text: "Gruppenübungen, Kahoot. Wesentlich besser als frontal. Erfordert aber Disziplin in der Vorbereitung.",
    expectedAction: "approved_and_delivered",
    description: "Positives Feedback zu interaktiven Lehrformaten",
  },

  // === Algorithmen und Datenstrukturen (WIN) ===
  {
    id: "aw-01",
    text: "Arbeitsaufwand schwankt teils erheblich, insbesondere die Lab-Aufgaben waren mal 5 min Aufwand oder mit dem vermittelten Wissen nahezu unmöglich zu lösen.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an ungleichmäßigem Schwierigkeitsgrad der Labs",
  },
  {
    id: "aw-02",
    text: "Bei den Videos wird sehr viel nebenher gesagt, dass nicht auf den Folien steht. Wenn man das alles mitschreibt, dauert es sehr lange (meist doppelte Zeit), bis man ein Video durch hat.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an Diskrepanz zwischen Video und Folienmaterial",
  },
  {
    id: "aw-03",
    text: "Die Vorlesung in Präsenz halten und die Aufgaben mit den Lösungen online bei Moodle zur Verfügung stellen.",
    expectedAction: "approved_and_delivered",
    description: "Konkreter Verbesserungsvorschlag zum Lehrformat",
  },
  {
    id: "aw-04",
    text: "Durch die Aufteilung in Vorlesung/Videos + Übungsstunden + Labor ist der Zeitaufwand deutlich höher als erwartet.",
    expectedAction: "approved_and_delivered",
    description: "Feedback zu unerwartet hohem Gesamtaufwand",
  },
  {
    id: "aw-05",
    text: "Aufgaben im Lab besser an die Vorlesung anpassen. Evtl. auch mögliche Klausuraufgaben im Programmcode umsetzen.",
    expectedAction: "approved_and_delivered",
    description: "Konstruktiver Vorschlag zur Abstimmung von Lab und Vorlesung",
  },
  {
    id: "aw-06",
    text: "Vereinzelt wurden organisatorisch wichtige Informationen ausschließlich in Präsenz kommuniziert, dies betraf leider auch einmal die Änderung eines Termins für eine Abgabe oder eine zusätzliche Veranstaltung.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an fehlender Dokumentation organisatorischer Änderungen",
  },
  {
    id: "aw-07",
    text: "Das Niveau der Labs war sehr schwankend. Es gab öfter Labs die, nur mit den Lehrinhalten, nicht machbar waren da weiterreichendes Verständnis erforderlich war.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an mangelnder Abstimmung der Laboraufgaben",
  },
  {
    id: "aw-08",
    text: "Die Übungen waren entweder zu schwierig oder zu einfach, aber genau desw ist irgendwie schwer anzumessen, wie die Schwierigkeit von der Prüfung sein könnte. Sonst, dass die Folien auf Englisch waren war gut, aber manchmal verwirrend um die Videos (auf deutsch) bzw. Die Begriffe zu folgen, da die in beide Sprachen manchmal anders sind.",
    expectedAction: "approved_and_delivered",
    description: "Gemischtes Feedback zu Schwierigkeitsniveau und Sprachinkonsistenz",
  },
  {
    id: "aw-09",
    text: "Evtl könnte man Probleme besser einbauen also in Coding Interviews hat man ja ein Problem und dann muss man eine Lösung machen, sagen welche O Notation der Algorithmus hat und dann eine bessere Lösung finden.",
    expectedAction: "approved_and_delivered",
    description: "Vorschlag zur praxisnahen Aufgabengestaltung",
  },
  {
    id: "aw-10",
    text: "Die Schwierigkeit von manche Übungen war sehr hoch, so dass man nur mit Hilfe von KI die lösen könnte.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an übermäßigem Schwierigkeitsgrad einzelner Aufgaben",
  },
  {
    id: "aw-11",
    text: "Warum 100 Punkte in einer 90 minütigen Klausur? 90 Punkte in 90 Minuten…",
    expectedAction: "approved_and_delivered",
    description: "Kritik am Verhältnis Punktzahl zu Klausurzeit",
  },
  {
    id: "aw-12",
    text: "In anderen Fächern hat man meist Altklausuren um eine grobe Einordnung zu haben. Hier erhält man nur eine alte Probeklausur die auf alter Literatur besteht und schwankendes Niveau im Vergleich zur anstehenden Klausur hat.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an mangelnden Prüfungsvorbereitungsunterlagen",
  },
  {
    id: "aw-13",
    text: "Da viel Codeverständnis erwartet wird, kam das zu kurz. Es ist nicht gut darauf eingegangen worden, wie dieses entwickelt werden kann. Üben, üben, üben ist schlicht zu allgemein, um als Anfänger daraus etwas hilfreiches ableiten zu können.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an fehlender Anleitung zur Entwicklung von Codeverständnis",
  },
  {
    id: "aw-14",
    text: "Die Vorbereitung auf die Prüfung stellte sich als herausfordernd dar. Es gab leider keine Altklausuren oder andere Möglichkeiten die Lehrinhalte in einer prüfungsorientierten Art zu üben.",
    expectedAction: "approved_and_delivered",
    description: "Kritik an fehlenden prüfungsnahen Übungsmaterialien",
  },
  {
    id: "aw-15",
    text: "Gut finde ich die Offenheit der Dozentin bzgl Fragen und zusätzlich gewünschter Erklärung.",
    expectedAction: "approved_and_delivered",
    description: "Positives Feedback zur Zugänglichkeit der Dozentin",
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

type Result = {
  id: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  reason?: string;
  error?: string;
};

async function runTestCase(tc: TestCase): Promise<Result> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feedbackId: DUMMY_FEEDBACK_ID,
        originalText: tc.text,
      }),
    });

    const body = await res.json();
    const actualAction: string = body.action ?? body.error ?? "unknown";

    const passed = actualAction === tc.expectedAction;
    return {
      id: tc.id,
      description: tc.description,
      expected: tc.expectedAction,
      actual: actualAction,
      passed,
      reason: body.reason,
    };
  } catch (err) {
    return {
      id: tc.id,
      description: tc.description,
      expected: tc.expectedAction,
      actual: "error",
      passed: false,
      error: String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\nModeration endpoint: ${ENDPOINT}`);
console.log(`Running ${testCases.length} test cases...\n`);

const results: Result[] = [];

for (const tc of testCases) {
  const result = await runTestCase(tc);
  results.push(result);

  if (result.passed) {
    console.log(`  ✓ PASS  ${result.id} — ${result.description}`);
  } else {
    console.log(`  ✗ FAIL  ${result.id} — ${result.description}`);
    console.log(`          expected: ${result.expected}, got: ${result.actual}`);
    if (result.reason) console.log(`          reason: ${result.reason}`);
    if (result.error) console.log(`          error: ${result.error}`);
  }

  // Small delay to avoid rate limiting
  await new Promise((r) => setTimeout(r, 500));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const passed = results.filter((r) => r.passed === true).length;
const failed = results.filter((r) => r.passed === false).length;

console.log(`\n${"—".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"—".repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
