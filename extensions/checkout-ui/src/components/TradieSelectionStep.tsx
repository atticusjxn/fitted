import { BadgeCheck, Clock3, ShieldCheck, Star } from 'lucide-react';
import type { Tradie } from '../types/index.js';

interface TradieSelectionStepProps {
  tradies: Tradie[];
  selectedTradieId: string | null;
  onSelect: (tradieId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function TradieSelectionStep({ tradies, selectedTradieId, onSelect, onBack, onNext }: TradieSelectionStepProps) {
  return (
    <section className="form-card" aria-labelledby="installer-heading">
      <div className="form-header">
        <p className="eyebrow">Step 2 of 4</p>
        <h2 id="installer-heading" className="form-title">
          Choose your preferred installer
        </h2>
        <p className="form-subtitle">
          Every professional is verified for insurance, licensing, and consistently high customer ratings.
        </p>
      </div>

      <div className="tradie-list" role="radiogroup" aria-label="Available installers">
        {tradies.map((tradie, index) => {
          const isSelected = tradie.id === selectedTradieId;
          const recommendedClass = tradie.isRecommended ? 'tradie-card--recommended' : '';
          return (
            <label
              key={tradie.id}
              className={`tradie-card ${isSelected ? 'tradie-card--selected' : ''} ${recommendedClass}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <input
                type="radio"
                name="tradie"
                value={tradie.id}
                checked={isSelected}
                onChange={() => onSelect(tradie.id)}
                className="hidden-radio"
              />
              <div className="tradie-card__body">
                <div className="tradie-card__header">
                  <h3 className="tradie-card__title">{tradie.name}</h3>
                  <div className="tradie-card__rating" aria-label={`${tradie.rating} stars`}>
                    <Star aria-hidden size={16} className="icon-star" />
                    <span>{tradie.rating.toFixed(1)}</span>
                    <span className="tradie-card__reviews">({tradie.reviewCount} reviews)</span>
                  </div>
                </div>
                {tradie.isRecommended ? <span className="tradie-card__badge">Recommended</span> : null}
                <p className="tradie-card__meta">{tradie.distanceKm.toFixed(1)} km away</p>
                <ul className="tradie-card__tags">
                  {tradie.specialties.map((tag) => (
                    <li key={tag} className="tag">
                      {tag}
                    </li>
                  ))}
                </ul>
                <div className="tradie-card__traits">
                  {tradie.insured ? (
                    <span className="trait">
                      <ShieldCheck size={16} aria-hidden />
                      <span>Insured</span>
                    </span>
                  ) : null}
                  {tradie.licensed ? (
                    <span className="trait">
                      <BadgeCheck size={16} aria-hidden />
                      <span>Licensed</span>
                    </span>
                  ) : null}
                  {tradie.responseTime ? (
                    <span className="trait">
                      <Clock3 size={16} aria-hidden />
                      <span>{tradie.responseTime}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="form-actions">
        <button type="button" className="button button--secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onNext}
          disabled={!selectedTradieId}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
