import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { getGuideProblemsForCrop, isDetailedGuideEntry, isGeneralTipsEntry } from '../../data/vegetableGuide';

function linesFrom(value) {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter(Boolean);
  const lines = [];
  if (value.summary) lines.push(value.summary);
  if (value.intro) lines.push(value.intro);
  if (Array.isArray(value.paragraphs)) lines.push(...value.paragraphs);
  if (Array.isArray(value.lines)) lines.push(...value.lines);
  if (Array.isArray(value.details)) lines.push(...value.details);
  if (Array.isArray(value.bullets)) lines.push(...value.bullets);
  if (value.note) lines.push(value.note);
  return lines.filter(Boolean);
}

function GuideNote({ title, value }) {
  const lines = linesFrom(value);
  if (!lines.length) return null;
  return (
    <section className="guide-note">
      <h3>{title}</h3>
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </section>
  );
}

function GuideChips({ items }) {
  const chips = items.filter(Boolean);
  if (!chips.length) return null;
  return (
    <div className="guide-chips">
      {chips.map((chip, index) => (
        <span key={`${chip}-${index}`} className="guide-chip">
          {chip}
        </span>
      ))}
    </div>
  );
}

function CropArticle({ title, chips, notes }) {
  return (
    <article className="guide-crop">
      <h2 className="guide-crop-title">{title}</h2>
      <GuideChips items={chips} />
      {notes}
    </article>
  );
}

function CompanionPlants({ companions }) {
  const { t } = useTranslation();
  const good = companions?.good?.filter(Boolean) || [];
  const avoid = companions?.avoid?.filter(Boolean) || [];
  if (!good.length && !avoid.length) return null;
  return (
    <section className="guide-note">
      <h3>{t('guide.companionPlants')}</h3>
      {good.length > 0 ? (
        <p className="guide-companion guide-companion--good">
          {t('guide.good')}: {good.join(', ')}
        </p>
      ) : null}
      {avoid.length > 0 ? (
        <p className="guide-companion guide-companion--avoid">
          {t('guide.avoid')}: {avoid.join(', ')}
        </p>
      ) : null}
    </section>
  );
}

function ProblemList({ veg, onSelectProblem }) {
  const { t } = useTranslation();
  const problems = getGuideProblemsForCrop(veg.commonProblems || []);
  if (!problems.length) return null;
  return (
    <section className="guide-note">
      <h3>{t('guide.commonProblems')}</h3>
      <div className="guide-problem-pills">
        {problems.map((problem) => (
          <button
            key={problem.id}
            type="button"
            className="guide-problem-pill"
            onClick={() => onSelectProblem?.(problem.id)}
          >
            {problem.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function DetailedCrop({ veg, onSelectProblem }) {
  const { t } = useTranslation();
  const { conditions, planting, care, companions, rotation } = veg;

  return (
    <CropArticle
      title={veg.name}
      chips={[
        veg.difficulty ? t(`guide.difficulty.${veg.difficulty}`) : null,
        veg.growingSeason,
        veg.harvestTime,
      ]}
      notes={
        <>
          <GuideNote title={t('guide.overview')} value={veg.overview} />
          <GuideNote title={t('guide.sun')} value={conditions?.sun} />
          <GuideNote title={t('guide.soil')} value={conditions?.soil} />
          <GuideNote title={t('guide.temperature')} value={conditions?.temperature} />
          <GuideNote title={t('guide.water')} value={conditions?.water} />
          <GuideNote title={t('guide.sowing')} value={planting?.paragraphs} />
          <GuideNote title={t('guide.spacing')} value={planting?.spacing} />
          <GuideNote title={t('guide.sowingDepth')} value={planting?.depth} />
          <GuideNote title={t('guide.watering')} value={care?.watering} />
          <GuideNote title={t('guide.feeding')} value={care?.fertilizing} />
          <GuideNote title={t('guide.support')} value={care?.support} />
          <GuideNote title={t('guide.maintenance')} value={care?.maintenance} />
          <GuideNote title={t('guide.harvest')} value={veg.harvest} />
          <GuideNote title={t('guide.cropRotation')} value={rotation?.note} />
          <GuideNote title={t('guide.avoidAfter')} value={rotation?.avoidAfter} />
          <GuideNote title={t('guide.goodPreviousCrops')} value={rotation?.goodBefore} />
          <GuideNote title={t('guide.extraTips')} value={veg.tips} />
          <CompanionPlants companions={companions} />
          <ProblemList veg={veg} onSelectProblem={onSelectProblem} />
        </>
      }
    />
  );
}

function LegacyCrop({ veg }) {
  const { t } = useTranslation();
  return (
    <CropArticle
      title={veg.name}
      chips={[veg.difficulty ? t(`guide.difficulty.${veg.difficulty}`) : null]}
      notes={
        <>
          {veg.summary ? <p className="guide-note-lead">{veg.summary}</p> : null}
          <GuideNote title={t('guide.sun')} value={veg.sun} />
          <GuideNote title={t('guide.soil')} value={veg.soil} />
          <GuideNote title={t('guide.sowing')} value={[veg.sow, veg.transplant, veg.depth].filter(Boolean)} />
          <GuideNote title={t('guide.spacing')} value={veg.spacing} />
          <GuideNote title={t('guide.water')} value={veg.water} />
          <GuideNote title={t('guide.feeding')} value={veg.feed} />
          <GuideNote title={t('guide.harvest')} value={veg.harvest} />
          <GuideNote title={t('guide.goodToKnow')} value={veg.tips} />
        </>
      }
    />
  );
}

function GeneralTipsDetail({ tips }) {
  const { t } = useTranslation();
  return (
    <CropArticle
      title={t('guide.generalTips')}
      chips={[]}
      notes={tips.sections.map((section) => (
        <GuideNote
          key={section.title}
          title={section.title}
          value={[section.body, section.intro, ...(section.bullets || [])].filter(Boolean)}
        />
      ))}
    />
  );
}

export default function VegetableGuideDetail({ veg, onSelectProblem }) {
  if (isGeneralTipsEntry(veg)) {
    return <GeneralTipsDetail tips={veg} />;
  }
  if (isDetailedGuideEntry(veg)) {
    return <DetailedCrop veg={veg} onSelectProblem={onSelectProblem} />;
  }
  return <LegacyCrop veg={veg} />;
}
