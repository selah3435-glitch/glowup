# Calendar Spine v1 — Design (implemented)

**Date:** 2026-07-31  
**Status:** Implemented (localStorage; multi-device later)

## Goal

AI Receptionist and owner dashboard share one **appointment system of record**.

## Model

`Appointment`: id, service, durationMin, dateISO, time, startMinutes, client, phone, stylist, status, source.

Storage: `glowup_appointments_v1`  
Migrates legacy `glowup_booking_holds_v1` once.

## Surfaces

- `/dashboard/calendar` — day strip, day list, add form, cancel  
- `/dashboard` overview — today’s live book + upcoming  
- AI Receptionist — books via duration-aware open slots  

## Out of scope v1

Cloud sync, payments, SMS, multi-staff matrix, deposits.
