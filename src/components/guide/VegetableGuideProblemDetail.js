import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  getGuideProblem,
  getCropsAffectedByProblem,
  vegetableGuide,
} from '../../data/vegetableGuide';
import Icon from '../common/Icon';

function GuideNote({ title, lines }) {
  const items = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="guide-note">
      <h3>{title}</h3>
      {items.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
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
      <article className="guide-crop">
        {onBack ? (
          <button type="button" className="guide-back" onClick={onBack}>
            <Icon name="chevron_left" />
            {t('common.back')}
          </button>
        ) : null}
        <p className="guide-empty">{t('guide.problemNotFound')}</p>
      </article>
    );
  }

  const categoryLabel = problem.category
    ? t(`guide.problemCategory.${problem.category}`)
    : null;

  return (
    <article className="guide-crop">
      {onBack ? (
        <button type="button" className="guide-back" onClick={onBack}>
          <Icon name="chevron_left" />
          {t('common.back')}
        </button>
      ) : null}
      <h2 className="guide-crop-title">{problem.name}</h2>
      {categoryLabel ? (
        <div className="guide-chips">
          <span className="guide-chip">{categoryLabel}</span>
        </div>
      ) : null}
      <GuideNote title={t('guide.problemWhatIsIt')} lines={problem.whatIsIt} />
      <GuideNote title={t('guide.problemIdentify')} lines={problem.identify} />
      <GuideNote title={t('guide.problemWhy')} lines={problem.why} />
      <GuideNote title={t('guide.problemFix')} lines={problem.fix} />
      <GuideNote title={t('guide.problemPrevent')} lines={problem.prevent} />
      {affectedCrops.length ? (
        <section className="guide-note">
          <h3>{t('guide.problemPlantsAffected')}</h3>
          <p>{affectedCrops.join(', ')}</p>
        </section>
      ) : null}
    </article>
  );
}
