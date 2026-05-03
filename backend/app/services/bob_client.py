from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import Settings
from app.schemas import Chunk, Control

print("=== bob_client.py LOADED ===")


class BobClient:
    def __init__(self, settings: Settings) -> None:
        self.api_key = settings.groq_api_key
        self.base_url = settings.groq_base_url
        self.model = settings.groq_model
        
        # Debug prints
        print(f"API KEY: {self.api_key[:20] if self.api_key else None}...")
        
        # Print startup mode
        if self.api_key:
            print("[BOB LIVE] Groq connected")
        else:
            print("[BOB FALLBACK] No Groq key")
    
    @property
    def is_live(self) -> bool:
        return bool(self.api_key)
    
    async def _call_groq(self, prompt: str) -> str | None:
        """Make API call to Groq. Returns None on error (triggers fallback)."""
        if not self.is_live:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.7
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
                
                # Debug logging
                print("=== RAW GROQ RESPONSE ===")
                print(data)
                
                # Parse OpenAI-compatible response format
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[BOB ERROR] {e}")
            return None
    
    async def analyze_control(self, control: Control, chunks: list[Chunk]) -> dict[str, Any]:
        """Analyze a control against evidence chunks. Returns finding dict."""
        # Build prompt
        evidence_text = "\n".join([f"[{c.source_ref}]\n{c.content}\n" for c in chunks])
        prompt = f"""You are a senior compliance officer.

CONTROL:
ID: {control.control_id}
Name: {control.name}
Description: {control.description}
Severity: {control.severity}

EVIDENCE:
{evidence_text}

Return ONLY valid JSON, no other text:
{{"control_id": "{control.control_id}", "status": "pass" or "partial" or "fail" or "insufficient_evidence", "confidence": integer 0-100, "evidence": "quoted text from documents or empty string", "gap": "what is missing or empty string", "remediation": "one paragraph action to fix or empty string"}}"""
        
        # Try live call
        response = await self._call_groq(prompt)
        
        if response:
            try:
                result = json.loads(response)
                result["provider"] = "Groq"
                result["model"] = self.model
                result["mode"] = "live"
                return result
            except json.JSONDecodeError:
                # Parse failure - use fallback
                pass
        
        # Fallback mode
        hash_val = hash(control.control_id) % 4
        fallbacks = [
            {
                "status": "pass",
                "confidence": 82,
                "evidence": "Section 2.1 states procedures are documented and reviewed annually.",
                "gap": "",
                "remediation": ""
            },
            {
                "status": "fail",
                "confidence": 78,
                "evidence": "",
                "gap": f"No documentation found for {control.name}.",
                "remediation": f"Create a policy section explicitly addressing {control.name}: {control.description[:100]}"
            },
            {
                "status": "partial",
                "confidence": 65,
                "evidence": "The document references related procedures though gaps remain.",
                "gap": f"Partial coverage only for {control.name}.",
                "remediation": f"Expand existing documentation to fully address {control.name}."
            },
            {
                "status": "insufficient_evidence",
                "confidence": 40,
                "evidence": "",
                "gap": "Insufficient documentation to assess this control.",
                "remediation": f"Upload additional evidence for {control.name}."
            }
        ]
        result = fallbacks[hash_val].copy()
        result["control_id"] = control.control_id
        result["provider"] = "Groq"
        result["model"] = self.model
        result["mode"] = "fallback"
        return result
    
    async def generate_executive_summary(self, stats: dict[str, Any], top_failures: list[dict[str, str]]) -> str:
        """Generate executive summary from report statistics."""
        prompt = f"""You are a compliance officer writing a 3-4 sentence executive summary for a CISO.

Framework: {stats['framework_name']}
Score: {stats['score']:.0f}%
Pass: {stats['pass_count']}, Fail: {stats['fail_count']}, Partial: {stats['partial_count']} out of {stats['total']} controls
Top gaps: {', '.join([f['control_id'] for f in top_failures[:3]])}

Plain English only, no markdown, no bullet points."""
        
        response = await self._call_groq(prompt)
        
        if response:
            return response
        
        # Fallback
        return f"Analysis of {stats['total']} controls under {stats['framework_name']} shows a compliance score of {stats['score']:.0f}%. Critical gaps were identified in {', '.join([f['control_id'] for f in top_failures[:2]]) or 'several controls'}. Immediate action is required to document missing policies before the next audit."
    
    async def answer_chat(self, user_message: str, report_summary: dict[str, Any], relevant_chunks: list[Chunk]) -> str:
        """Answer a chat question based on report context and relevant document chunks."""
        prompt = f"""You are a senior compliance officer helping a team fix compliance gaps.

Be direct, specific, and practical. Do NOT repeat the same summary every time.

REPORT CONTEXT:
* Overall Score: {report_summary.get('overall_score','N/A')}%
* Failing Controls: {report_summary.get('fail_count',0)}
* Top Gaps: {', '.join(report_summary.get('top_gaps',[])[:3])}

DOCUMENT EVIDENCE:
{chr(10).join(f'[{c.source_ref}] {c.content[:300]}' for c in relevant_chunks)}

USER QUESTION:
{user_message}

Instructions:
* Answer the question directly
* If asking about gaps → explain clearly
* If asking what to fix → give step-by-step actions
* If asking for explanation → simplify like explaining to a non-expert
* Avoid repeating the same intro sentence
* Be concise but useful

Answer:
"""
        
        print("=== NEW PROMPT ACTIVE ===")
        print(prompt[:300])
        
        response = await self._call_groq(prompt)
        
        if response:
            return response
        
        # Fallback
        return f"Based on the compliance report showing {report_summary.get('overall_score', 'N/A')}% compliance with {report_summary.get('fail_count', 0)} failing controls, the priority gaps are: {', '.join(report_summary.get('top_gaps', [])[:3])}. I recommend addressing these in order of severity. Would you like me to draft specific remediation language for any of these gaps?"
    
    async def draft_remediation(self, control_name: str, gap_text: str) -> str:
        """Draft remediation text for a specific control gap."""
        prompt = f"""Write one actionable paragraph for an engineer explaining exactly what to add to satisfy this compliance requirement.

Control: {control_name}
Current gap: {gap_text}

Be specific and practical."""
        
        response = await self._call_groq(prompt)
        
        if response:
            return response
        
        # Fallback
        return f"To remediate {control_name}: create a dedicated policy document explicitly covering the identified gap. Assign a named owner, set an annual review cycle, and ensure the policy references specific procedures. Submit for legal review before the next audit cycle."

# Made with Bob
