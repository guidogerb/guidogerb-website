export function NewsletterSection() {
  return (
    <section className="newsletter" id="newsletter">
      <div>
        <h2>Quarterly publishing brief</h2>
        <p>
          Join our newsletter for catalog performance insights, partner spotlights, and submission
          deadlines. We highlight actionable trends for catalogs serving arts organizations and
          creative entrepreneurs.
        </p>
      </div>
      <form
        className="newsletter-form"
        aria-label="Newsletter sign up"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="newsletter-email" className="visually-hidden">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  )
}
