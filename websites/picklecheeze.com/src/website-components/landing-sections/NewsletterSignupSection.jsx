export function NewsletterSignupSection() {
  return (
    <section className="newsletter" id="newsletter">
      <div>
        <h2>Join the brine dispatch</h2>
        <p>
          Monthly emails share fermentation tips, release calendars, and behind-the-scenes looks at
          experiments happening in the cheeze lab.
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
        <button type="submit">Notify me</button>
      </form>
    </section>
  )
}
