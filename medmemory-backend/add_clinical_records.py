#!/usr/bin/env python3
"""Add test medical records with proper clinical data for risk analysis."""

import sqlite3
import json
from datetime import datetime

def add_clinical_records():
    conn = sqlite3.connect('medmemory.db')
    cursor = conn.cursor()

    # Get patient and doctor IDs
    cursor.execute("SELECT id FROM users WHERE email='test@example.com'")
    patient = cursor.fetchone()
    if not patient:
        print("❌ Patient not found")
        return

    cursor.execute("SELECT id FROM users WHERE email='doctor@clinic.com'")
    doctor = cursor.fetchone()
    if not doctor:
        print("❌ Doctor not found")
        return

    patient_id, doctor_id = patient[0], doctor[0]

    # Test records with actual clinical data
    records = [
        {
            "title": "Comprehensive Metabolic Panel - Q1 2026",
            "type": "lab",
            "data": {
                "age": 45,
                "glucose": 145,
                "bp_sys": 138,
                "bp_dia": 88,
                "hba1c": 6.8,
                "cholesterol": 215,
                "bmi": 27.5,
                "diagnosis": ["Type 2 Diabetes", "Hypertension"],
                "medications": ["Metformin 1000mg", "Lisinopril 10mg"],
                "summary": "45-year-old with controlled Type 2 Diabetes and Hypertension. Recent labs show glucose trending upward."
            }
        },
        {
            "title": "Quarterly BP Monitoring - April 2026",
            "type": "consultation",
            "data": {
                "age": 45,
                "glucose": 152,
                "bp_sys": 142,
                "bp_dia": 92,
                "hba1c": 7.1,
                "cholesterol": 220,
                "bmi": 28.0,
                "diagnosis": ["Type 2 Diabetes", "Hypertension", "Overweight"],
                "medications": ["Metformin 1000mg", "Lisinopril 10mg", "Atorvastatin 20mg"],
                "summary": "BP elevated at 142/92. Recommend medication adjustment and lifestyle changes."
            }
        },
        {
            "title": "Previous Year Labs - Q1 2025",
            "type": "lab",
            "data": {
                "age": 44,
                "glucose": 118,
                "bp_sys": 128,
                "bp_dia": 80,
                "hba1c": 6.2,
                "cholesterol": 195,
                "bmi": 26.5,
                "diagnosis": ["Pre-diabetes"],
                "medications": ["Lifestyle modification"],
                "summary": "Baseline labs from one year ago showing better control."
            }
        }
    ]

    for i, rec in enumerate(records, 1):
        content = json.dumps({"structured_data": rec["data"], "summary": rec.get("summary", "")})

        cursor.execute("""
            INSERT INTO medical_records 
            (patient_id, provider_id, provider_name, type, title, content, status, date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            doctor_id,
            "Dr. Smith",
            rec["type"],
            rec["title"],
            content,
            "active",
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        print(f"✅ Record {i}: {rec['title']}")
        print(f"   Data: glucose={rec['data']['glucose']}, hba1c={rec['data']['hba1c']}, bp={rec['data']['bp_sys']}/{rec['data']['bp_dia']}")

    conn.commit()
    conn.close()
    print("\n✅ All clinical records created successfully!")
    print("🚀 Risk analysis will now use real clinical data with XGBoost + Gemini")

if __name__ == "__main__":
    add_clinical_records()
