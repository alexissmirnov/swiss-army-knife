from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List


ToolHandler = Callable[[Dict[str, Any]], Dict[str, Any]]


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    required: List[str]
    keywords: List[str]
    handler: ToolHandler

    def openai_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }



def _ok(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"status": "ok", "data": payload}


TOOLS: List[ToolDefinition] = []


def register(tool: ToolDefinition) -> ToolDefinition:
    TOOLS.append(tool)
    return tool


register(
    ToolDefinition(
        name="service_catalog_search",
        description="Search the service catalog for available care services.",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query."},
                "location_id": {"type": "string", "description": "Clinic/location identifier."},
                "insurance_id": {"type": "string", "description": "Insurance plan identifier."},
                "patient_id": {"type": "string", "description": "Patient identifier."},
            },
            "required": ["query"],
        },
        required=["query"],
        keywords=["service", "catalog", "find service", "visit type"],
        handler=lambda params: _ok({"results": ["Primary Care Visit", "Dermatology", "Therapy"]}),
    )
)

register(
    ToolDefinition(
        name="provider_search",
        description="Find clinicians by specialty, location, or preference.",
        parameters={
            "type": "object",
            "properties": {
                "specialty": {"type": "string", "description": "Provider specialty."},
                "location_id": {"type": "string", "description": "Clinic/location identifier."},
                "language": {"type": "string", "description": "Preferred language."},
                "gender_preference": {"type": "string", "description": "Preferred gender."},
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "insurance_id": {"type": "string", "description": "Insurance plan identifier."},
            },
            "required": ["specialty"],
        },
        required=["specialty"],
        keywords=["provider", "doctor", "clinician", "specialist"],
        handler=lambda params: _ok({"providers": ["Dr. Patel", "Dr. Nguyen", "Dr. Chen"]}),
    )
)

register(
    ToolDefinition(
        name="availability_search",
        description="Check appointment slots for a provider and service.",
        parameters={
            "type": "object",
            "properties": {
                "provider_id": {"type": "string", "description": "Clinician identifier."},
                "service_id": {"type": "string", "description": "Service or visit type identifier."},
                "location_id": {"type": "string", "description": "Clinic/location identifier."},
                "date_range_start": {"type": "string", "description": "Start date (YYYY-MM-DD)."},
                "date_range_end": {"type": "string", "description": "End date (YYYY-MM-DD)."},
                "time_of_day": {"type": "string", "description": "morning/afternoon/evening"},
            },
            "required": ["provider_id", "service_id"],
        },
        required=["provider_id", "service_id"],
        keywords=["availability", "openings", "slots", "schedule"],
        handler=lambda params: _ok({"slots": ["2026-02-12T10:00:00", "2026-02-12T14:30:00"]}),
    )
)

register(
    ToolDefinition(
        name="appointment_book",
        description="Book an appointment for a patient.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Unique patient identifier."},
                "provider_id": {"type": "string", "description": "Clinician identifier."},
                "service_id": {"type": "string", "description": "Service or visit type identifier."},
                "start_time": {"type": "string", "description": "ISO 8601 datetime."},
                "location_id": {"type": "string", "description": "Clinic/location identifier."},
                "visit_reason": {"type": "string", "description": "Short reason for visit."},
                "insurance_id": {"type": "string", "description": "Insurance plan identifier."},
            },
            "required": ["patient_id", "provider_id", "service_id", "start_time", "location_id"],
        },
        required=["patient_id", "provider_id", "service_id", "start_time", "location_id"],
        keywords=["book", "schedule appointment", "set up appointment"],
        handler=lambda params: _ok({"appointment_id": "apt_123", "status": "confirmed"}),
    )
)

register(
    ToolDefinition(
        name="appointment_reschedule",
        description="Reschedule an existing appointment.",
        parameters={
            "type": "object",
            "properties": {
                "appointment_id": {"type": "string", "description": "Appointment identifier."},
                "new_start_time": {"type": "string", "description": "ISO 8601 datetime."},
                "reason": {"type": "string", "description": "Reason for reschedule."},
            },
            "required": ["appointment_id", "new_start_time"],
        },
        required=["appointment_id", "new_start_time"],
        keywords=["reschedule", "move appointment", "change appointment"],
        handler=lambda params: _ok({"appointment_id": params.get("appointment_id"), "status": "rescheduled"}),
    )
)

register(
    ToolDefinition(
        name="appointment_cancel",
        description="Cancel an existing appointment.",
        parameters={
            "type": "object",
            "properties": {
                "appointment_id": {"type": "string", "description": "Appointment identifier."},
                "reason": {"type": "string", "description": "Reason for cancellation."},
                "cancel_mode": {"type": "string", "description": "patient/provider"},
            },
            "required": ["appointment_id"],
        },
        required=["appointment_id"],
        keywords=["cancel appointment", "cancel visit", "cancel"],
        handler=lambda params: _ok({"appointment_id": params.get("appointment_id"), "status": "cancelled"}),
    )
)

register(
    ToolDefinition(
        name="dependent_add",
        description="Add a dependent to a patient's account.",
        parameters={
            "type": "object",
            "properties": {
                "primary_patient_id": {"type": "string", "description": "Primary patient identifier."},
                "dependent_first_name": {"type": "string", "description": "First name."},
                "dependent_last_name": {"type": "string", "description": "Last name."},
                "dob": {"type": "string", "description": "Date of birth (YYYY-MM-DD)."},
                "relationship": {"type": "string", "description": "Relationship to primary patient."},
                "gender": {"type": "string", "description": "Gender."},
                "insurance_id": {"type": "string", "description": "Insurance plan identifier."},
            },
            "required": ["primary_patient_id", "dependent_first_name", "dependent_last_name", "dob", "relationship"],
        },
        required=["primary_patient_id", "dependent_first_name", "dependent_last_name", "dob", "relationship"],
        keywords=["add dependent", "add child", "add spouse"],
        handler=lambda params: _ok({"dependent_id": "dep_456", "status": "added"}),
    )
)

register(
    ToolDefinition(
        name="insurance_verify",
        description="Verify insurance eligibility and coverage.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "insurance_id": {"type": "string", "description": "Insurance plan identifier."},
                "service_id": {"type": "string", "description": "Service identifier."},
                "location_id": {"type": "string", "description": "Clinic/location identifier."},
            },
            "required": ["patient_id", "insurance_id"],
        },
        required=["patient_id", "insurance_id"],
        keywords=["insurance", "coverage", "eligibility", "verify"],
        handler=lambda params: _ok({"eligible": True, "copay": "$25"}),
    )
)

register(
    ToolDefinition(
        name="symptom_triage",
        description="Provide basic triage routing based on symptoms.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "symptoms": {"type": "string", "description": "Symptom description."},
                "duration": {"type": "string", "description": "How long symptoms have lasted."},
                "age": {"type": "string", "description": "Patient age."},
                "pregnant": {"type": "boolean", "description": "Pregnancy status."},
                "severity": {"type": "string", "description": "mild/moderate/severe"},
                "red_flags": {"type": "string", "description": "Any red flags."},
            },
            "required": ["patient_id", "symptoms", "duration"],
        },
        required=["patient_id", "symptoms", "duration"],
        keywords=["symptom", "triage", "not feeling well", "sick"],
        handler=lambda params: _ok({"recommendation": "Primary care visit within 48 hours"}),
    )
)

register(
    ToolDefinition(
        name="billing_estimate",
        description="Estimate patient out-of-pocket costs.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "service_id": {"type": "string", "description": "Service identifier."},
                "insurance_id": {"type": "string", "description": "Insurance plan identifier."},
                "location_id": {"type": "string", "description": "Clinic/location identifier."},
                "provider_id": {"type": "string", "description": "Provider identifier."},
            },
            "required": ["patient_id", "service_id", "insurance_id", "location_id"],
        },
        required=["patient_id", "service_id", "insurance_id", "location_id"],
        keywords=["estimate", "cost", "billing", "price"],
        handler=lambda params: _ok({"estimate": "$120", "breakdown": {"copay": "$25", "coinsurance": "$95"}}),
    )
)

register(
    ToolDefinition(
        name="prescription_refill",
        description="Request a prescription refill.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "medication_name": {"type": "string", "description": "Medication name."},
                "pharmacy_id": {"type": "string", "description": "Pharmacy identifier."},
                "rx_number": {"type": "string", "description": "Prescription number."},
                "dosage": {"type": "string", "description": "Dosage."},
                "quantity": {"type": "string", "description": "Quantity."},
            },
            "required": ["patient_id", "medication_name"],
        },
        required=["patient_id", "medication_name"],
        keywords=["refill", "prescription", "medication"],
        handler=lambda params: _ok({"refill_status": "submitted"}),
    )
)

register(
    ToolDefinition(
        name="lab_results_get",
        description="Retrieve lab results for a patient.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "date_range_start": {"type": "string", "description": "Start date (YYYY-MM-DD)."},
                "date_range_end": {"type": "string", "description": "End date (YYYY-MM-DD)."},
                "lab_test_name": {"type": "string", "description": "Lab test name."},
            },
            "required": ["patient_id"],
        },
        required=["patient_id"],
        keywords=["lab results", "labs", "test results"],
        handler=lambda params: _ok({"results": [{"test": "A1C", "value": "6.1%", "date": "2026-01-10"}]}),
    )
)

register(
    ToolDefinition(
        name="referral_authorization",
        description="Request authorization for a referral.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "referral_id": {"type": "string", "description": "Referral identifier."},
                "service_id": {"type": "string", "description": "Service identifier."},
                "provider_id": {"type": "string", "description": "Provider identifier."},
                "diagnosis_code": {"type": "string", "description": "Diagnosis code."},
            },
            "required": ["patient_id", "referral_id"],
        },
        required=["patient_id", "referral_id"],
        keywords=["referral", "authorization", "prior auth"],
        handler=lambda params: _ok({"authorization_status": "pending"}),
    )
)

register(
    ToolDefinition(
        name="handoff_to_human",
        description="Escalate the conversation to a human care coordinator.",
        parameters={
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier."},
                "summary": {"type": "string", "description": "Summary of the issue."},
                "reason": {"type": "string", "description": "Why handoff is needed."},
                "urgency": {"type": "string", "description": "low/medium/high"},
            },
            "required": ["patient_id", "summary"],
        },
        required=["patient_id", "summary"],
        keywords=["human", "representative", "agent", "help"],
        handler=lambda params: _ok({"handoff_id": "handoff_789", "status": "queued"}),
    )
)


def get_tool(name: str) -> ToolDefinition | None:
    for tool in TOOLS:
        if tool.name == name:
            return tool
    return None


def openai_tools_schema() -> List[Dict[str, Any]]:
    return [tool.openai_schema() for tool in TOOLS]
