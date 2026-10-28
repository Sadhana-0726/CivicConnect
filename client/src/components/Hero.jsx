import React from 'react';
import CivicWorkflowIllustration from './CivicWorkflowIllustration';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__text">
          <h1 className="hero__title">
            Pinpoint.<br />
            Report.<br />
            Resolve.
          </h1>
          <p className="hero__subtitle">
            Efficiently report public property damage in your neighborhood.
          </p>
          <div className="hero__actions">
            <a href="#/report" className="btn btn--primary">
              Report Infrastructure Issue
            </a>
            <a href="#/map" className="btn btn--secondary">
              View Map
            </a>
          </div>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <CivicWorkflowIllustration />
        </div>
      </div>
    </section>
  );
}
