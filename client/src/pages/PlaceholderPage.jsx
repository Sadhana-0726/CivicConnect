// client/src/pages/PlaceholderPage.jsx
export default function PlaceholderPage({ title }) {
  return (
    <section className="section">
      <div className="container container--narrow">
        <h1 className="page-title">{title}</h1>
        <p className="page-lead">This page is coming in a later step.</p>
        <a href="#/" className="btn btn--secondary">Back to home</a>
      </div>
    </section>
  );
}
