import os
import json
from typing import List, Dict, Any, Tuple
from app.schemas import UserProfile, Scheme

# Cache loaded schemes
_schemes_cache: List[Dict[str, Any]] = []

def load_all_schemes() -> List[Dict[str, Any]]:
    global _schemes_cache
    if _schemes_cache:
        return _schemes_cache
        
    # Find schemes_db.json
    base_dir = os.path.dirname(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "app", "data", "schemes_db.json")
    
    # Check fallback if running from scripts or elsewhere
    if not os.path.exists(db_path):
        db_path = os.path.join(base_dir, "data", "schemes_db.json")
        
    if not os.path.exists(db_path):
        # Return empty if not seeded yet
        return []
        
    with open(db_path, "r", encoding="utf-8") as f:
        _schemes_cache = json.load(f)
    return _schemes_cache

def check_eligibility(profile: UserProfile, scheme_data: Dict[str, Any]) -> Tuple[str, int]:
    """
    Evaluates profile against scheme rules.
    Returns: (status: str, score: int)
    Statuses: "Eligible", "Partially Eligible", "Not Eligible"
    """
    score = 100
    reasons = []
    
    # 1. State check (Hard Constraint)
    # Scheme state must match user state OR be Central
    scheme_state = scheme_data.get("state", "Central")
    if scheme_state != "Central" and scheme_state.lower() != profile.state.lower():
        return "Not Eligible", 0
        
    # 2. Gender check (Hard Constraint)
    gender_req = scheme_data.get("gender_restriction", "None")
    if gender_req != "None" and gender_req.lower() != profile.gender.lower():
        return "Not Eligible", 0

    # 3. Category/Caste check
    category_reqs = scheme_data.get("category_restriction", ["Any"])
    if "Any" not in category_reqs and profile.category not in category_reqs:
        # If student/applicant category doesn't match, they don't qualify
        return "Not Eligible", 0

    # 4. Age Check
    age_min = scheme_data.get("age_min")
    age_max = scheme_data.get("age_max")
    if age_min is not None and profile.age < age_min:
        diff = age_min - profile.age
        if diff <= 2:
            score -= 20  # minor age mismatch
        else:
            return "Not Eligible", 0
            
    if age_max is not None and profile.age > age_max:
        diff = profile.age - age_max
        if diff <= 3:
            score -= 20  # minor age mismatch
        else:
            return "Not Eligible", 0

    # 5. Income check
    income_limit = scheme_data.get("income_limit")
    if income_limit is not None and profile.income > income_limit:
        excess_ratio = (profile.income - income_limit) / income_limit
        if excess_ratio <= 0.25:  # within 25% over the limit
            score -= 30
        else:
            return "Not Eligible", 0

    # 6. Target Group / Occupation matching
    target_groups = [tg.lower() for tg in scheme_data.get("target_groups", [])]
    user_occ = profile.occupation.lower()
    
    # If the user's occupation matches one of the scheme's target groups, it is highly relevant
    occupation_matches = False
    
    if not target_groups or "any" in target_groups or "all" in target_groups:
        occupation_matches = True
    else:
        for tg in target_groups:
            # Direct match
            if tg in user_occ or user_occ in tg:
                occupation_matches = True
                break
            # Smart mapping: gender-based target groups
            if (tg == "women" or tg == "female") and profile.gender.lower() == "female":
                occupation_matches = True
                break
            # Smart mapping: age-based target groups (Senior Citizens)
            if (tg == "senior citizen" or tg == "old age") and profile.age >= 60:
                occupation_matches = True
                break
            # Smart mapping: student-based groups
            if tg == "student" and user_occ in ["student", "job seeker"]:
                occupation_matches = True
                break
            if user_occ == "student" and tg in ["student", "graduate", "undergraduate", "postgraduate"]:
                occupation_matches = True
                break
            # Smart mapping: low income groups
            if (tg == "low income family" or tg == "bpl" or tg == "poor") and user_occ == "low income family":
                occupation_matches = True
                break

    if not occupation_matches:
        return "Not Eligible", 0

    # Determine status based on final score
    if score >= 90:
        status = "Eligible"
    elif score >= 50:
        status = "Partially Eligible"
    else:
        status = "Not Eligible"
        
    return status, max(0, score)

def search_and_rank_schemes(profile: UserProfile) -> List[Dict[str, Any]]:
    """
    Search all local schemes, matches them against profile, and ranks by eligibility score.
    """
    raw_schemes = load_all_schemes()
    results = []
    
    for s_data in raw_schemes:
        status, score = check_eligibility(profile, s_data)
        
        # Pydantic Scheme matching
        scheme = Scheme(**s_data)
        
        results.append({
            "scheme": scheme,
            "status": status,
            "score": score,
            "documents_checklist": s_data.get("required_documents", [])
        })
        
    # Sort: Eligible first (highest score), then Partially Eligible, then Not Eligible.
    # Within status, sort by score descending.
    results.sort(key=lambda x: (
        0 if x["status"] == "Eligible" else (1 if x["status"] == "Partially Eligible" else 2),
        -x["score"],
        x["scheme"].scheme_name
    ))
    
    return results
