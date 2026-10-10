const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PYTHON_PATH = "C:\\Users\\acer\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe";
const INFER_SCRIPT = path.join(process.cwd(), "ml", "infer.py");
const DB_FILE = path.join(process.cwd(), "data", "medisense_database.json");

const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "Elijah", "Isabella", "James",
  "Mia", "Benjamin", "Charlotte", "Lucas", "Amelia", "Mason", "Harper", "Ethan", "Evelyn", "Alexander",
  "Abigail", "Henry", "Emily", "Jacob", "Elizabeth", "Michael", "Mila", "Daniel", "Ella", "Logan",
  "Avery", "Jackson", "Sofia", "Sebastian", "Camila", "Jack", "Aria", "Aiden", "Scarlett", "Owen",
  "Victoria", "Samuel", "Madison", "Matthew", "Luna", "Joseph", "Grace", "Levi", "Chloe", "Mateo"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 1) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function generate1000Patients() {
  const records = [];
  for (let i = 1; i <= 1000; i++) {
    const fn = getRandomElement(FIRST_NAMES);
    const ln = getRandomElement(LAST_NAMES);
    const patientName = `${fn} ${ln}`;
    const patientId = `PAT-${1000 + i}`;
    const phone = `+1-555-${String(getRandomInt(100, 999))}-${String(getRandomInt(1000, 9999))}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${getRandomInt(1, 99)}@example.com`;

    // Clinical feature distributions simulating diverse clinical cohort
    const age = getRandomInt(21, 82);
    // Higher age slightly increases probability of higher glucose/BMI for realistic distribution
    const isHighRiskProfile = Math.random() < 0.35;

    const glucose = isHighRiskProfile
      ? getRandomInt(135, 230)
      : (Math.random() < 0.1 ? 0 : getRandomInt(75, 134)); // 10% unrecorded zero for data quality testing

    const bmi = isHighRiskProfile
      ? getRandomFloat(29.5, 48.0)
      : (Math.random() < 0.1 ? 0 : getRandomFloat(18.5, 29.4));

    const bp = Math.random() < 0.08 ? 0 : getRandomInt(58, 112);
    const pregnancies = age < 25 ? getRandomInt(0, 2) : getRandomInt(0, 11);
    const insulin = Math.random() < 0.4 ? 0 : getRandomInt(40, 480);
    const skinThickness = Math.random() < 0.3 ? 0 : getRandomInt(10, 52);
    const pedigree = getRandomFloat(0.08, 2.15, 3);

    records.push({
      PatientID: patientId,
      PatientName: patientName,
      PatientPhone: phone,
      PatientEmail: email,
      HospitalName: "HexaClinic for Diabetes",
      Pregnancies: pregnancies,
      Glucose: glucose,
      BloodPressure: bp,
      SkinThickness: skinThickness,
      Insulin: insulin,
      BMI: bmi,
      DiabetesPedigreeFunction: pedigree,
      Age: age,
    });
  }
  return records;
}

function runPythonInference(records) {
  return new Promise((resolve, reject) => {
    const pythonExe = fs.existsSync(PYTHON_PATH) ? PYTHON_PATH : "python";
    const child = spawn(pythonExe, [INFER_SCRIPT], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python inference failed (code ${code}): ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`JSON parse error: ${err.message}`));
      }
    });

    child.stdin.write(JSON.stringify(records));
    child.stdin.end();
  });
}

function generateMessages(rec) {
  const pId = rec.patient_id;
  const pName = rec.patient_name;
  const features = rec.clinical_features;
  const quality = rec.quality;

  const highlights = rec.key_highlights || [];
  const highlightStr = highlights.length > 0 ? highlights.join(", ") : "Standard screening indicators";

  const nursePrompt = `Intake discussion for ${pName} (${pId}, ${features.age} yrs). ML risk score: ${(rec.model_score * 100).toFixed(1)}%. Key findings: ${highlightStr}. Review lifestyle factors, recent fasting plasma glucose, and schedule clinical intake assessment. Note: Non-diagnostic triage recommendation only.`;

  const subject = `HexaClinic for Diabetes - Important Follow-Up Regarding Your Diabetes Screening`;
  const body = `Dear ${pName},

Thank you for visiting HexaClinic for Diabetes. Based on your recent health screening results, our clinical intake team recommends scheduling a routine follow-up consultation to discuss your wellness goals and personalized preventative care.

Please contact our triage coordinator at +1-555-HEXA-CLINIC or reply to this email to book your convenient appointment.

Warm regards,
Screening Triage Team
HexaClinic for Diabetes`;

  return { nursePrompt, subject, body };
}

async function main() {
  console.log("Generating 1,000 realistic dummy patient records...");
  const rawRecords = generate1000Patients();

  console.log("Executing Python Random Forest ML scoring on all 1,000 records...");
  const scoredRaw = await runPythonInference(rawRecords);

  console.log("Mapping and deterministically ranking scored records...");
  const fullRecords = scoredRaw.map((rec) => {
    const { nursePrompt, subject, body } = generateMessages(rec);
    const email = rec.patient_email;
    const isEmailValid = email && email.includes("@") && email.includes(".");

    return {
      patient_id: rec.patient_id,
      patient_name: rec.patient_name,
      patient_phone: rec.patient_phone,
      patient_email: rec.patient_email,
      hospital_name: rec.hospital_name || "HexaClinic for Diabetes",
      model_score: rec.model_score,
      secondary_lr_score: rec.secondary_lr_score,
      priority_tier: rec.priority_tier,
      clinical_features: rec.clinical_features,
      key_highlights: rec.key_highlights || [],
      quality: rec.quality,
      rank: rec.rank,
      nurse_review_status: "pending",
      nurse_prompt: nursePrompt,
      patient_email_subject: subject,
      patient_email_body: body,
      email_validation_status: isEmailValid ? "valid" : "invalid_format",
      email_send_status: "pending_review",
    };
  });

  // Re-sort deterministically: Score DESC -> Age DESC -> PatientID ASC
  fullRecords.sort((a, b) => {
    if (b.model_score !== a.model_score) return b.model_score - a.model_score;
    if (b.clinical_features.age !== a.clinical_features.age) return b.clinical_features.age - a.clinical_features.age;
    return a.patient_id.localeCompare(b.patient_id);
  });

  fullRecords.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  const dbData = {
    hospitalName: "HexaClinic for Diabetes",
    patientRecords: fullRecords,
    auditLogs: [
      {
        id: `audit_seed_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "System Administrator",
        action: "RUN_SCORING",
        details: "Seeded persistent database with 1,000 ML-scored patient records for HexaClinic for Diabetes.",
      },
    ],
    lastScoredTimestamp: new Date().toISOString(),
    emailApprovalStatus: false,
    isTestMode: true,
  };

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
  console.log(`✅ Successfully populated persistent DB (${DB_FILE}) with 1,000 patient records!`);
  console.log(`Top 1 (Highest Priority): ${fullRecords[0].patient_name} (${fullRecords[0].patient_id}) - Score: ${(fullRecords[0].model_score * 100).toFixed(1)}%`);
  console.log(`Rank #100: ${fullRecords[99].patient_name} (${fullRecords[99].patient_id}) - Score: ${(fullRecords[99].model_score * 100).toFixed(1)}%`);
  console.log(`Rank #101: ${fullRecords[100].patient_name} (${fullRecords[100].patient_id}) - Score: ${(fullRecords[100].model_score * 100).toFixed(1)}%`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
