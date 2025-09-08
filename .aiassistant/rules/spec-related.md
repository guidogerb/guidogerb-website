---
apply: always
---

{
"$schema": "https://stream4cloud/specs/ai-self-review.schema.json",
"project": "stream4cloud",
"version": "1.0.0",
"defaults": {
"mustPassAll": true,
"failOnPhase2InMVP": true
},
"rules": [
{
"id": "arch-stack",
"severity": "error",
"description": "Answers must reflect SPEC-1 stack.",
"mustIncludeAll": ["Vite", "React", "TypeScript", "AWS", "API Gateway", "Lambda", "DynamoDB", "CloudFront", "S3", "Cognito", "Stripe"],
"mustNotIncludeAny": ["Next.js", "Vue", "Angular", "MongoDB Atlas", "Express server rendering", "Non-Stripe PSP"]
},
{
"id": "phase2-flag",
"severity": "error",
"description": "Crypto/DeFi and WYSIWYG profiles are Phase 2 only.",
"ifMentionsAny": ["crypto", "Coinbase Commerce", "BitPay", "DeFi", "WYSIWYG"],
"thenMustAlsoIncludeAny": ["feature-flag", "Phase 2", "future"],
"message": "Phase 2 items must be clearly flagged as Phase 2/feature-flagged."
},
{
"id": "multi-tenant-domains",
"severity": "error",
"description": "Multi-tenant + BYO custom domains at launch.",
"mustIncludeAll": ["multi-tenant", "custom domains", "CloudFront", "ACM", "Route 53"]
},
{
"id": "pwa-offline",
"severity": "error",
"description": "PWA with service worker and offline fallbacks.",
"mustIncludeAll": ["PWA", "service worker", "offline", "precache", "Background Sync", "offline.html"]
},
{
"id": "security-compliance",
"severity": "error",
"description": "Security, PCI SAQ-A, GDPR/CCPA, KMS, WAF.",
"mustIncludeAll": ["PCI SAQ-A", "GDPR", "encryption", "KMS", "WAF", "least privilege"]
},
{
"id": "downloads-permission-hash",
"severity": "error",
"description": "Secure downloads must use pre-signed URLs + permission hash with TTL/limited uses.",
"mustIncludeAll": ["pre-signed URL", "permission-hash", "TTL", "limited uses", "audit logging"]
},
{
"id": "search-spec",
"severity": "warn",
"description": "Catalog search via OpenSearch Serverless (BM25); optional vector/RAG.",
"mustIncludeAny": ["OpenSearch", "BM25", "Serverless", "vector", "RAG"]
},
{
"id": "observability-kpis",
"severity": "warn",
"description": "Mention Powertools, tracing, KPIs, Core Web Vitals.",
"mustIncludeAny": ["Lambda Powertools", "X-Ray", "CloudWatch", "p95", "Core Web Vitals", "LCP", "INP", "CLS"]
}
]
}
