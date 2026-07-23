import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  getGuideProblem,
  getCropsAffectedByProblem,
  vegetableGuide,
} from '../../data/vegetableGuide';
import Icon from '../common/Icon';

function BulletList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="mb-0 vegetable-guide-bullets">
      {items.map((item, i) => (
        <li key={i} className="mb-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProblemSection({ icon, title, children }) {
  if (!children) return null;
  return (
    <section className="mb-4 vegetable-guide-section">
      <h3 className="h6 text-uppercase text-dark fw-bold mb-3 d-flex align-items-center gap-2">
        {icon ? <Icon name={icon} style={{ fontSize: '1.15rem' }} /> : null}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function VegetableGuideProblemDetail({ problemId, onBack }) {
  const { t } = useTranslation();
  const problem = getGuideProblem(problemId);
  const affectedCrops = problem?.appliesToAll
    ? [t('guide.allVegetables')]
    : getCropsAffectedByProblem(problemId, vegetableGuide);

  if (!problem) {
    return (
      <div>
        <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={onBack}>
          <Icon name="chevron_left" style={{ fontSize: '1.15rem', verticalAlign: 'middle' }} />
          {t('guide.backToGuide')}
        </button>
        <p>{t('guide.problemNotFound')}</p>
      </div>
    );
  }

  return (
    <article>
      {onBack ? (
        <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={onBack}>
          <Icon name="chevron_left" style={{ fontSize: '1.15rem', verticalAlign: 'middle' }} />
          {t('guide.backToGuide')}
        </button>
      ) : null}

      <div className="d-flex align-items-center gap-3 mb-3">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-light border"
          style={{ width: '56px', height: '56px', flexShrink: 0 }}
        >
          <Icon
            name={problem.icon || 'bug_report'}
            plantIcon={problem.plantIcon}
            style={{ fontSize: '1.75rem' }}
          />
        </span>
        <h2 className="h4 mb-0 fw-bold text-dark">{problem.name}</h2>
      </div>

      <ProblemSection icon="info" title={t('guide.problemWhatIsIt')}>
        <p className="mb-0">{problem.whatIsIt}</p>
      </ProblemSection>

      <ProblemSection icon="visibility" title={t('guide.problemIdentify')}>
        <BulletList items={problem.identify} />
      </ProblemSection>

      <ProblemSection icon="help_outline" title={t('guide.problemWhy')}>
        <BulletList items={problem.why} />
      </ProblemSection>

      <ProblemSection icon="build" title={t('guide.problemFix')}>
        <BulletList items={problem.fix} />
      </ProblemSection>

      <ProblemSection icon="shield" title={t('guide.problemPrevent')}>
        <BulletList items={problem.prevent} />
      </ProblemSection>

      {affectedCrops.length ? (
        <ProblemSection icon="eco" title={t('guide.problemPlantsAffected')}>
          <BulletList items={affectedCrops} />
        </ProblemSection>
      ) : null}
    </article>
  );
}
