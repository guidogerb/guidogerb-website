const DEFAULT_TITLE = 'Quarterly publishing brief'
const DEFAULT_DESCRIPTION =
  'Join our newsletter for catalog performance insights, partner spotlights, and submission deadlines. We highlight actionable trends for catalogs serving arts organizations and creative entrepreneurs.'
const DEFAULT_FORM_LABEL = 'Newsletter sign up'
const DEFAULT_BUTTON_LABEL = 'Subscribe'
const DEFAULT_PLACEHOLDER = 'you@example.com'
const DEFAULT_INPUT_LABEL = 'Email address'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

export function NewsletterSection({
  id = 'newsletter',
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  formLabel = DEFAULT_FORM_LABEL,
  buttonLabel = DEFAULT_BUTTON_LABEL,
  placeholder = DEFAULT_PLACEHOLDER,
  inputLabel = DEFAULT_INPUT_LABEL,
  onSubmit,
}) {
  const handleSubmit = onSubmit ?? ((event) => event.preventDefault())

  const resolvedFormLabel = isNonEmptyString(formLabel) ? formLabel : DEFAULT_FORM_LABEL
  const resolvedPlaceholder = isNonEmptyString(placeholder) ? placeholder : DEFAULT_PLACEHOLDER
  const resolvedButtonLabel = isNonEmptyString(buttonLabel) ? buttonLabel : DEFAULT_BUTTON_LABEL
  const resolvedInputLabel = isNonEmptyString(inputLabel) ? inputLabel : DEFAULT_INPUT_LABEL

  return (
    <section className="newsletter" id={id}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <form className="newsletter-form" aria-label={resolvedFormLabel} onSubmit={handleSubmit}>
        <label htmlFor="newsletter-email" className="visually-hidden">
          {resolvedInputLabel}
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder={resolvedPlaceholder}
          autoComplete="email"
        />
        <button type="submit">{resolvedButtonLabel}</button>
      </form>
    </section>
  )
}

NewsletterSection.DEFAULT_TITLE = DEFAULT_TITLE
NewsletterSection.DEFAULT_DESCRIPTION = DEFAULT_DESCRIPTION
NewsletterSection.DEFAULT_FORM_LABEL = DEFAULT_FORM_LABEL
NewsletterSection.DEFAULT_BUTTON_LABEL = DEFAULT_BUTTON_LABEL
NewsletterSection.DEFAULT_PLACEHOLDER = DEFAULT_PLACEHOLDER
NewsletterSection.DEFAULT_INPUT_LABEL = DEFAULT_INPUT_LABEL
