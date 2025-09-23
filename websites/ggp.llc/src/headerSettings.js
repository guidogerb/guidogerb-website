import { createHeaderSettings } from '@guidogerb/header'

export const headerSettings = createHeaderSettings({
  brand: {
    title: 'GGP Regulatory Platform',
    tagline: 'Licensing, compliance, and analytics for government agencies',
    href: '/',
  },
  announcements: [
    {
      id: 'modernization-cohort',
      message: '2025 modernization cohort now onboarding agencies across 6 states.',
      href: '/licensing',
      tone: 'highlight',
    },
    {
      id: 'ai-guardrails',
      message: 'AI guardrail toolkit available for policy, ethics, and legal review.',
      href: '/ai-support',
      tone: 'info',
    },
  ],
  primaryLinks: [
    {
      id: 'licensing',
      label: 'Licensing',
      href: '/licensing',
      description: 'Digital intake, queue automation, and determinations.',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      href: '/compliance',
      description: 'Complaint intake through enforcement and restitution.',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/analytics',
      description: 'Oversight dashboards, exports, and KPI guardrails.',
    },
  ],
  secondaryLinks: [
    {
      id: 'ai-support',
      label: 'AI assistance',
      href: '/ai-support',
      description: 'Responsible automation for policy-ready workflows.',
    },
    {
      id: 'portal-preview',
      label: 'Portal preview',
      href: '/portal-preview',
      description: 'See the secure regulator workspace in action.',
    },
  ],
  utilityLinks: [
    { id: 'contact', label: 'Contact', href: '/contact' },
    {
      id: 'resource-center',
      label: 'Resource center',
      href: 'https://docs.ggp.llc/regulatory',
      external: true,
      description: 'Architecture, security, and implementation playbooks.',
    },
  ],
  actions: [
    {
      id: 'portal-login',
      label: 'Portal login',
      href: '/portal',
      variant: 'primary',
    },
    {
      id: 'schedule-briefing',
      label: 'Schedule briefing',
      href: 'https://calendly.com/ggp-regulation/modernization',
      external: true,
    },
  ],
  showAuthControls: false,
  showTenantSwitcher: false,
  showThemeToggle: false,
})

export default headerSettings
