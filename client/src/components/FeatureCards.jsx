// client/src/components/FeatureCards.jsx
const FEATURES = [
  {
    step: '1',
    title: 'Locate',
    text: 'Drop a pin on the map or use your current position so crews know exactly where the damage is.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    step: '2',
    title: 'Document',
    text: 'Describe what you see and pick a category. Clear details get issues routed and fixed faster.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    step: '3',
    title: 'Track',
    text: 'Follow each report from submitted to resolved and see what is being fixed around you.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12l5 5L20 6" />
      </svg>
    ),
  },
];

export default function FeatureCards() {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section__title">How it works</h2>
        <ol className="features">
          {FEATURES.map((f) => (
            <li key={f.title} className="feature">
              <div className="feature__icon">{f.icon}</div>
              <h3 className="feature__title">{f.step}. {f.title}</h3>
              <p className="feature__text">{f.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
