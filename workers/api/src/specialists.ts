// Verified specialist directory (ported from the Python doctor_agent service).
export interface Specialist {
  id: string; name: string; specialty: string; qualification: string; hospital: string;
  location: string; district: string; state: string; available_days: string[];
  consultation_type: string; contact_phone: string;
}
export const SPECIALISTS: Specialist[] = [
  {
    "id": "DOC-CKM-01",
    "name": "Dr. Srinivas Murthy, M.D.",
    "specialty": "General Medicine / Internal Medicine",
    "qualification": "MBBS, MD (General Medicine)",
    "hospital": "District Hospital Chikkamagaluru",
    "location": "MG Road, Chikkamagaluru",
    "district": "Chikkamagaluru",
    "state": "Karnataka",
    "available_days": [
      "Monday",
      "Wednesday",
      "Friday",
      "Saturday"
    ],
    "consultation_type": "In-Person",
    "contact_phone": "+91 8262 230230"
  },
  {
    "id": "DOC-CKM-02",
    "name": "Dr. Rashmi Gowda, M.D.",
    "specialty": "Pulmonology & Respiratory Medicine",
    "qualification": "MBBS, MD (Pulmonary Medicine)",
    "hospital": "Chikkamagaluru Medical Sciences Hospital",
    "location": "Kadur Road, Chikkamagaluru",
    "district": "Chikkamagaluru",
    "state": "Karnataka",
    "available_days": [
      "Tuesday",
      "Thursday",
      "Saturday"
    ],
    "consultation_type": "In-Person",
    "contact_phone": "+91 8262 245100"
  },
  {
    "id": "DOC-CKM-03",
    "name": "Dr. Pradeep Kumar, D.P.M.",
    "specialty": "Clinical Psychiatry & Mental Health",
    "qualification": "MBBS, DPM, MD (Psychiatry)",
    "hospital": "District Mental Health Clinic & De-Addiction Centre",
    "location": "Indira Gandhi Road, Chikkamagaluru",
    "district": "Chikkamagaluru",
    "state": "Karnataka",
    "available_days": [
      "Monday",
      "Tuesday",
      "Thursday"
    ],
    "consultation_type": "In-Person & Telemedicine",
    "contact_phone": "+91 8262 235544"
  },
  {
    "id": "DOC-BLR-01",
    "name": "Dr. K. Ananth, M.D., DM",
    "specialty": "Cardiology & Cardiovascular Sciences",
    "qualification": "MBBS, MD, DM (Cardiology)",
    "hospital": "Sri Jayadeva Institute of Cardiovascular Sciences",
    "location": "Bannerghatta Road, Bengaluru",
    "district": "Bengaluru Urban",
    "state": "Karnataka",
    "available_days": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "consultation_type": "In-Person & Telemedicine",
    "contact_phone": "+91 80 2297 7400"
  },
  {
    "id": "DOC-MYS-01",
    "name": "Dr. Kavitha Hegde, M.D.",
    "specialty": "Endocrinology & Diabetology",
    "qualification": "MBBS, MD, DNB (Endocrinology)",
    "hospital": "K.R. Hospital & Mysore Medical College",
    "location": "Irwin Road, Mysuru",
    "district": "Mysuru",
    "state": "Karnataka",
    "available_days": [
      "Monday",
      "Wednesday",
      "Thursday"
    ],
    "consultation_type": "In-Person & Telemedicine",
    "contact_phone": "+91 821 242 0100"
  }
];
