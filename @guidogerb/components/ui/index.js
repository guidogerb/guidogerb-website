// Re-export library entry for consumers that import from the package root
export * from './src/JsonViewer/JsonViewer.jsx'
export * from './src/ResponsiveSlot/ResponsiveSlot.jsx'
export { EditModeProvider, useEditMode } from './src/ResponsiveSlot/editing/EditModeContext.jsx'

// Marketing site sections
export { HeroSection } from './src/sections/HeroSection.jsx'
export { PlatformSection } from './src/sections/PlatformSection.jsx'
export { DistributionSection } from './src/sections/DistributionSection.jsx'
export { ResourcesSection } from './src/sections/ResourcesSection.jsx'
export { NewsletterSection } from './src/sections/NewsletterSection.jsx'
export { PartnerPortalSection } from './src/sections/PartnerPortalSection.jsx'

// Artist site sections
export { default as ProgramsHeroSection } from './src/artist/programs-hero/index.jsx'
export { default as ConsultingSection } from './src/artist/consulting-section/index.jsx'
export { default as RecordingsEducationSection } from './src/artist/recordings-education/index.jsx'
export { default as AboutPressSection } from './src/artist/about-press/index.jsx'
export { default as NewsletterSignupSection } from './src/artist/newsletter-signup/index.jsx'
export { default as RehearsalRoomSection } from './src/artist/rehearsal-room/index.jsx'
export { default as Welcome } from './src/artist/welcome-page/index.jsx'
