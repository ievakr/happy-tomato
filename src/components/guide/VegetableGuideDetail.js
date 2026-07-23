import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { isDetailedGuideEntry, isGeneralTipsEntry, getGuideProblemsForCrop } from '../../data/vegetableGuide';
import Icon from '../common/Icon';

const DIFFICULTY_CLASS = {
  Easy: 'text-success',
  Moderate: 'text-warning',
  Advanced: 'text-danger',
};

function Paragraphs({ items }) {
  const lines = Array.isArray(items) ? items : [items];
  return (
    <>
      {lines.filter(Boolean).map((text, i) => (
        <p key={i} className={i > 0 ? 'mb-2' : 'mb-0'}>
          {text}
        </p>
      ))}
    </>
  );
}

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

function GuideSection({ icon, title, children }) {
  if (!children) return null;
  return (
    <section className="mb-4 vegetable-guide-section">
      <h3
        className="h6 text-uppercase text-dark fw-bold mb-3 d-flex align-items-center gap-2"
        style={{ letterSpacing: '0.03em' }}
      >
        {icon ? (
          <Icon name={icon} className="text-dark" style={{ fontSize: '1.15rem' }} />
        ) : null}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ConditionBlock({ icon, label, children }) {
  if (!children) return null;
  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-1">
        <Icon name={icon} className="text-secondary" style={{ fontSize: '1.1rem' }} />
        <h4 className="h6 mb-0 fw-bold text-secondary">{label}</h4>
      </div>
      <div className="ps-1">{children}</div>
    </div>
  );
}

function CareBlock({ icon, title, children }) {
  if (!children) return null;
  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-1">
        {icon ? (
          <Icon name={icon} className="text-secondary" style={{ fontSize: '1.1rem' }} />
        ) : null}
        <h4 className="h6 mb-0 fw-bold text-secondary">{title}</h4>
      </div>
      <div>{children}</div>
    </div>
  );
}

function renderCareValue(value) {
  if (!value) return null;
  if (typeof value === 'string') return <Paragraphs items={value} />;
  return (
    <>
      {value.intro ? <p className="mb-2">{value.intro}</p> : null}
      <BulletList items={value.bullets} />
    </>
  );
}

function LegacyCareRow({ icon, label, children }) {
  if (!children) return null;
  return (
    <div className="d-flex gap-3 py-2 border-bottom border-light">
      <div className="text-secondary d-flex align-items-start" style={{ minWidth: '1.5rem' }}>
        <Icon name={icon} style={{ fontSize: '1.25rem' }} />
      </div>
      <div className="flex-grow-1">
        <div className="small text-uppercase text-secondary fw-semibold" style={{ letterSpacing: '0.02em' }}>
          {label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function LegacyVegetableDetail({ veg }) {
  const { t } = useTranslation();
  return (
    <article>
      <div className="d-flex align-items-center gap-3 mb-2">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-light border"
          style={{ width: '56px', height: '56px', flexShrink: 0 }}
        >
          <Icon plantIcon={veg.icon} style={{ fontSize: '1.75rem' }} />
        </span>
        <div>
          <h2 className="h4 mb-1 fw-bold text-dark">{veg.name}</h2>
          <span className={`small fw-semibold ${DIFFICULTY_CLASS[veg.difficulty] || 'text-secondary'}`}>
            {t(`guide.difficulty.${veg.difficulty}`)}
          </span>
        </div>
      </div>

      <p>{veg.summary}</p>

      <div className="mt-3">
        <LegacyCareRow icon="wb_sunny" label={t('guide.sunlight')}>{veg.sun}</LegacyCareRow>
        <LegacyCareRow icon="terrain" label={t('guide.soil')}>{veg.soil}</LegacyCareRow>
        <LegacyCareRow icon="grass" label={t('guide.sowing')}>{veg.sow}</LegacyCareRow>
        <LegacyCareRow icon="park" label={t('guide.transplanting')}>{veg.transplant}</LegacyCareRow>
        <LegacyCareRow icon="straighten" label={t('guide.spacing')}>{veg.spacing}</LegacyCareRow>
        <LegacyCareRow icon="south" label={t('guide.sowingDepth')}>{veg.depth}</LegacyCareRow>
        <LegacyCareRow icon="water_drop" label={t('guide.watering')}>{veg.water}</LegacyCareRow>
        <LegacyCareRow icon="eco" label={t('guide.feeding')}>{veg.feed}</LegacyCareRow>
        <LegacyCareRow icon="agriculture" label={t('guide.harvest')}>{veg.harvest}</LegacyCareRow>
      </div>

      {veg.tips?.length ? (
        <div className="mt-4 p-3 rounded-3 bg-light border">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Icon name="tips_and_updates" className="text-secondary" style={{ fontSize: '1.15rem' }} />
            <span className="small text-uppercase text-secondary fw-semibold">{t('guide.goodToKnow')}</span>
          </div>
          <BulletList items={veg.tips} />
        </div>
      ) : null}
    </article>
  );
}

function DetailedVegetableDetail({ veg, onSelectProblem }) {
  const { t } = useTranslation();
  const { conditions, planting, care, companions, rotation } = veg;
  const problems = getGuideProblemsForCrop(veg.commonProblems || []);

  return (
    <article>
      <div className="d-flex align-items-center gap-3 mb-3">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-light border"
          style={{ width: '56px', height: '56px', flexShrink: 0 }}
        >
          <Icon plantIcon={veg.icon} style={{ fontSize: '1.75rem' }} />
        </span>
        <div>
          <h2 className="h4 mb-1 fw-bold text-dark">{veg.name}</h2>
        </div>
      </div>

      <GuideSection icon="menu_book" title={t('guide.overview')}>
        <p className="mb-3">{veg.overview}</p>
        <dl className="row g-2 mb-0">
          <dt className="col-sm-4 text-secondary">{t('guide.difficultyLabel')}</dt>
          <dd className={`col-sm-8 mb-0 fw-semibold ${DIFFICULTY_CLASS[veg.difficulty] || ''}`}>
            {t(`guide.difficulty.${veg.difficulty}`)}
          </dd>
          {veg.growingSeason ? (
            <>
              <dt className="col-sm-4 text-secondary">{t('guide.growingSeason')}</dt>
              <dd className="col-sm-8 mb-0">{veg.growingSeason}</dd>
            </>
          ) : null}
          {veg.harvestTime ? (
            <>
              <dt className="col-sm-4 text-secondary">{t('guide.timeToHarvest')}</dt>
              <dd className="col-sm-8 mb-0">{veg.harvestTime}</dd>
            </>
          ) : null}
        </dl>
      </GuideSection>

      <GuideSection icon="nature" title={t('guide.idealConditions')}>
        <ConditionBlock icon="wb_sunny" label={t('guide.sunlight')}>
          <Paragraphs items={conditions.sun} />
        </ConditionBlock>
        <ConditionBlock icon="terrain" label={t('guide.soil')}>
          <Paragraphs items={conditions.soil.summary} />
          <BulletList items={conditions.soil.details} />
        </ConditionBlock>
        {conditions.temperature ? (
          <ConditionBlock icon="device_thermostat" label={t('guide.temperature')}>
            <BulletList items={conditions.temperature.lines} />
            {conditions.temperature.note ? (
              <p className="mb-0 mt-2">{conditions.temperature.note}</p>
            ) : null}
          </ConditionBlock>
        ) : null}
        <ConditionBlock icon="water_drop" label={t('guide.water')}>
          <Paragraphs items={conditions.water} />
        </ConditionBlock>
      </GuideSection>

      <GuideSection icon="yard" title={t('guide.planting')}>
        <Paragraphs items={planting.paragraphs} />
        {planting.spacing ? (
          <p className="mb-0 mt-2">
            <span className="fw-semibold">{t('guide.spacing')}:</span> {planting.spacing}
          </p>
        ) : null}
        {planting.depth ? (
          <p className="mb-0 mt-2">
            <span className="fw-semibold">{t('guide.sowingDepth')}:</span> {planting.depth}
          </p>
        ) : null}
      </GuideSection>

      <GuideSection icon="spa" title={t('guide.care')}>
        <CareBlock icon="water_drop" title={t('guide.watering')}>
          {renderCareValue(care.watering)}
        </CareBlock>
        {care.fertilizing ? (
          <CareBlock icon="eco" title={t('guide.feeding')}>
            {renderCareValue(care.fertilizing)}
          </CareBlock>
        ) : null}
        {care.support ? (
          <CareBlock icon="foundation" title={t('guide.support')}>
            {renderCareValue(care.support)}
          </CareBlock>
        ) : null}
        {care.maintenance ? (
          <CareBlock icon="build" title={t('guide.maintenance')}>
            {renderCareValue(care.maintenance)}
          </CareBlock>
        ) : null}
      </GuideSection>

      {problems.length ? (
        <GuideSection icon="bug_report" title={t('guide.commonProblems')}>
          <ul className="list-group list-group-flush border rounded">
            {problems.map((problem) => (
              <li key={problem.id} className="list-group-item p-0">
                <button
                  type="button"
                  className="btn w-100 text-start d-flex align-items-center gap-3 py-2 px-3 rounded-0"
                  onClick={() => onSelectProblem?.(problem.id)}
                >
                  <Icon
                    name={problem.icon || 'bug_report'}
                    plantIcon={problem.plantIcon}
                    className="text-secondary"
                    style={{ fontSize: '1.25rem' }}
                  />
                  <span className="flex-grow-1">{problem.name}</span>
                  <Icon name="chevron_right" className="text-secondary" style={{ fontSize: '1.25rem' }} />
                </button>
              </li>
            ))}
          </ul>
        </GuideSection>
      ) : null}

      <GuideSection icon="agriculture" title={t('guide.harvest')}>
        <Paragraphs items={veg.harvest} />
      </GuideSection>

      {companions ? (
        <GuideSection icon="diversity_3" title={t('guide.companionPlants')}>
          {companions.good?.length ? (
            <div className="mb-3">
              <div className="fw-bold text-secondary mb-1 d-flex align-items-center gap-1">
                <Icon name="check_circle" className="text-success" style={{ fontSize: '1rem' }} />
                {t('guide.goodCompanions')}
              </div>
              <BulletList items={companions.good} />
            </div>
          ) : null}
          {companions.avoid?.length ? (
            <div>
              <div className="fw-bold text-secondary mb-1 d-flex align-items-center gap-1">
                <Icon name="block" className="text-danger" style={{ fontSize: '1rem' }} />
                {t('guide.avoid')}
              </div>
              <BulletList items={companions.avoid} />
            </div>
          ) : null}
        </GuideSection>
      ) : null}

      {rotation ? (
        <GuideSection icon="autorenew" title={t('guide.cropRotation')}>
          {rotation.note ? <p className="mb-3">{rotation.note}</p> : null}
          {rotation.avoidAfter?.length ? (
            <div className="mb-3">
              <div className="fw-bold text-secondary mb-1 d-flex align-items-center gap-1">
                <Icon name="block" className="text-danger" style={{ fontSize: '1rem' }} />
                {t('guide.avoidAfter')}
              </div>
              <BulletList items={rotation.avoidAfter} />
            </div>
          ) : null}
          {rotation.goodBefore?.length ? (
            <div className="mb-2">
              <div className="fw-bold text-secondary mb-1 d-flex align-items-center gap-1">
                <Icon name="check_circle" className="text-success" style={{ fontSize: '1rem' }} />
                {t('guide.goodPreviousCrops')}
              </div>
              <BulletList items={rotation.goodBefore} />
            </div>
          ) : null}
        </GuideSection>
      ) : null}

      {veg.tips?.length ? (
        <GuideSection icon="tips_and_updates" title={t('guide.extraTips')}>
          <BulletList items={veg.tips} />
        </GuideSection>
      ) : null}
    </article>
  );
}

function GeneralTipsDetail({ tips }) {
  const { t } = useTranslation();
  return (
    <article>
      <div className="d-flex align-items-center gap-3 mb-3">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-light border"
          style={{ width: '56px', height: '56px', flexShrink: 0 }}
        >
          <Icon name={tips.iconName || 'tips_and_updates'} style={{ fontSize: '1.75rem' }} />
        </span>
        <div>
          <h2 className="h4 mb-1 fw-bold text-dark">{t('guide.generalTips')}</h2>
        </div>
      </div>

      {tips.sections.map((section) => (
        <GuideSection key={section.title} icon={section.icon} title={section.title}>
          {section.body ? <Paragraphs items={section.body} /> : null}
          {section.intro ? <p className="mb-2">{section.intro}</p> : null}
          <BulletList items={section.bullets} />
        </GuideSection>
      ))}
    </article>
  );
}

export default function VegetableGuideDetail({ veg, onSelectProblem }) {
  if (isGeneralTipsEntry(veg)) {
    return <GeneralTipsDetail tips={veg} />;
  }
  if (isDetailedGuideEntry(veg)) {
    return <DetailedVegetableDetail veg={veg} onSelectProblem={onSelectProblem} />;
  }
  return <LegacyVegetableDetail veg={veg} />;
}

export { DIFFICULTY_CLASS };
