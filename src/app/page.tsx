'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';

const AUTHOR = "Yiling Xie";

// ============================================================
// TYPOGRAPHY SYSTEM
// ============================================================
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-light">
      {children}
    </span>
  );
}

function Heading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-4xl md:text-5xl font-light text-stone-900 leading-[1.15] tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-lg text-stone-500 leading-relaxed max-w-xl font-light">
      {children}
    </p>
  );
}

// ============================================================
// SECTION
// ============================================================
function Section({ children, id, className = '' }: { children: React.ReactNode; id: string; className?: string }) {
  return (
    <section id={id} className={`relative py-32 px-6 ${className}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
}

// ============================================================
// INTERACTIVE DONUT
// ============================================================
function DonutChart({ segments, total }: {
  segments: Array<{ label: string; value: number; color: string; description: string }>;
  total: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const radius = 85;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const center = { x: 120, y: 120 };

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={240} height={240} className="transform -rotate-[135deg]">
          {segments.map((seg, i) => {
            const percent = (seg.value / total) * 100;
            const dashLength = (percent / 100) * circumference;
            const dashOffset = (cumulativePercent / 100) * circumference;
            cumulativePercent += percent;
            const isActive = hovered === i || selected === i;

            return (
              <circle
                key={i}
                cx={center.x}
                cy={center.y}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-500 cursor-pointer"
                style={{ opacity: hovered !== null && hovered !== i ? 0.25 : 1 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === i ? null : i)}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={selected !== null ? selected : 'total'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {selected !== null ? (
              <>
                <div className="text-4xl font-light" style={{ color: segments[selected].color }}>{segments[selected].value}</div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">{segments[selected].label}</div>
              </>
            ) : (
              <>
                <div className="text-4xl font-light text-stone-800">{total}</div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Respondents</div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-10 flex flex-col gap-3">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 cursor-pointer transition-opacity ${hovered !== null && hovered !== i ? 'opacity-40' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(selected === i ? null : i)}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-stone-600 w-28">{seg.label}</span>
            <span className="text-sm font-light text-stone-800">{seg.value}</span>
            <span className="text-xs text-stone-400">({Math.round(seg.value / total * 100)}%)</span>
          </div>
        ))}
      </div>

      {/* Detail card */}
      <AnimatePresence>
        {(hovered !== null || selected !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 max-w-[280px] text-center"
          >
            <p className="text-sm text-stone-500 leading-relaxed">
              {segments[hovered ?? selected ?? 0].description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// INTERACTIVE COMPARISON
// ============================================================
function ComparisonChart({ items }: {
  items: Array<{
    label: string;
    current: number;
    never: number;
    max?: number;
    insight: string;
  }>;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {items.map((item, i) => {
        const isExpanded = expanded === i;
        const max = item.max || 5;
        const currPct = (item.current / max) * 100;
        const neverPct = (item.never / max) * 100;
        const diff = item.never - item.current;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
          >
            <div
              className="cursor-pointer group"
              onClick={() => setExpanded(isExpanded ? null : i)}
            >
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">Never: <span className="text-stone-600 font-medium">{item.never.toFixed(2)}</span></span>
                  <span className="text-xs text-stone-400">Users: <span className="text-stone-600 font-medium">{item.current.toFixed(2)}</span></span>
                </div>
              </div>

              {/* Bars */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-16 text-[10px] text-stone-400 text-right">Users</div>
                  <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-stone-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${currPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 text-[10px] text-stone-400 text-right">Never</div>
                  <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-stone-300"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${neverPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 + 0.1 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-stone-400">
                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <span>{isExpanded ? 'Hide insight' : 'Show insight'}</span>
                {diff > 0.5 && <span className="ml-2 text-stone-300">· Never-users score {diff.toFixed(2)} higher</span>}
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 ml-20 p-4 bg-stone-50 rounded-lg"
                >
                  <p className="text-xs text-stone-500 leading-relaxed">{item.insight}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// INTERACTIVE QUADRANTS
// ============================================================
function QuadrantGrid({ items, note }: {
  items: Array<{ name: string; pct: number; desc: string; color: string; insight: string }>;
  note?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const isActive = hovered === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className={`relative p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
                isActive ? 'border-stone-400 shadow-lg' : 'border-stone-200 hover:border-stone-300'
              }`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(isActive ? null : i)}
            >
              <div className="text-2xl font-light mb-3" style={{ color: item.color }}>{item.pct}%</div>
              <div className="text-sm font-medium text-stone-800 mb-1">{item.name}</div>
              <div className="text-xs text-stone-400">{item.desc}</div>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 pt-3 border-t border-stone-200"
                  >
                    <p className="text-xs text-stone-500 leading-relaxed">{item.insight}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {note && (
        <p className="mt-6 text-xs text-stone-400 italic leading-relaxed">{note}</p>
      )}
    </div>
  );
}

// ============================================================
// EXPANDABLE INSIGHT
// ============================================================
function ExpandableInsight({ label, value, max = 5, color, interpretation }: {
  label: string;
  value: number;
  max?: number;
  color: string;
  interpretation: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = (value / max) * 100;

  return (
    <div className="group">
      <div
        className="flex items-center gap-4 cursor-pointer py-3 border-b border-stone-100"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <div className="flex-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">{label}</span>
            <span className="text-sm font-light text-stone-800">{value.toFixed(2)}<span className="text-stone-300 text-xs">/{max}</span></span>
          </div>
          <div className="mt-2 h-0.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              viewport={{ once: true }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-8 pb-4"
          >
            <p className="text-xs text-stone-400 leading-relaxed pt-3">{interpretation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Home() {
  return (
    <main className="bg-white text-stone-900 min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-5 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="text-sm text-stone-800 tracking-tight">Quantified Selves</span>
          <div className="flex gap-8 text-xs text-stone-400">
            <a href="#overview" className="hover:text-stone-800 transition-colors">Overview</a>
            <a href="#paradox" className="hover:text-stone-800 transition-colors">Privacy</a>
            <a href="#comparison" className="hover:text-stone-800 transition-colors">Comparison</a>
            <a href="#results" className="hover:text-stone-800 transition-colors">Data</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <SectionLabel>Interactive Research</SectionLabel>
            <Heading className="mt-4 mb-6">
              When we begin<br />
              <span className="text-stone-400">understanding ourselves</span><br />
              through data
            </Heading>
            <Subheading>
              An analysis of how wearable technologies reshape self-perception, behavior, and autonomy — based on 117 survey responses.
            </Subheading>
            <div className="mt-12 flex items-center gap-12">
              <div>
                <div className="text-3xl font-light text-stone-800">117</div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Responses</div>
              </div>
              <div className="w-px h-10 bg-stone-200" />
              <div>
                <div className="text-3xl font-light text-stone-800">88</div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Users</div>
              </div>
              <div className="w-px h-10 bg-stone-200" />
              <div>
                <div className="text-3xl font-light text-stone-800">29</div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Non-adopters</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Decorative line */}
      <div className="px-6">
        <div className="max-w-3xl mx-auto h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      </div>

      {/* Overview */}
      <Section id="overview" className="bg-stone-50/50">
        <div className="text-center mb-16">
          <SectionLabel>Demographics</SectionLabel>
          <Heading className="mt-4">Who Participated</Heading>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <DonutChart
              total={117}
              segments={[
                { label: "Current Users", value: 60, color: "#1a1a1a", description: "Currently using a wearable device regularly — actively tracking health metrics daily." },
                { label: "Former Users", value: 28, color: "#737373", description: "Used to use a wearable but discontinued — reflects on reasons for abandonment." },
                { label: "Non-adopters", value: 29, color: "#a3a3a3", description: "Never adopted wearable technology — offers a critical perspective on the trade-offs." },
              ]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-sm"
          >
            <h3 className="text-lg font-light text-stone-800 mb-4">Why Include Non-adopters?</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-4">
              The 29 people who never adopted wearables provide essential counterpoint. They represent a "conscientious objector" perspective — aware of privacy risks, unwilling to make the trade-off.
            </p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Comparing their attitudes with active users reveals patterns in how privacy concern, data control desire, and risk awareness differ between those who accepted versus rejected the technology.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Key Findings */}
      <Section id="findings" className="bg-white">
        <div className="mb-16">
          <SectionLabel>Key Findings</SectionLabel>
          <Heading className="mt-4">Patterns That Emerged</Heading>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {[
            {
              num: "01",
              title: "Data Shapes Self-Perception",
              body: '83% of users reported that device data influences how they judge their own health. When the algorithm says "unhealthy," many begin to doubt their body\'s signals — even when they feel fine. This represents a fundamental shift in how self-knowledge is produced.',
              color: "#1a1a1a"
            },
            {
              num: "02",
              title: "The Privacy Paradox",
              body: "25% of all respondents exhibit the privacy paradox: high concern (avg 4.5/5) combined with continued usage intent (avg 4.4/5). They recognize the risks yet choose convenience. This reveals how surveillance has become normalized — we accept what we claim to fear.",
              color: "#404040"
            },
            {
              num: "03",
              title: "Gamification's Double Edge",
              body: '40% experience "pressured optimization" — gaining exercise benefits but also stress. Their average stress score (3.97/5) is more than double that of "empowered users" (1.86/5). Only 16% achieved the ideal: motivation without anxiety.',
              color: "#737373"
            },
            {
              num: "04",
              title: "Non-adopters Are More Cautious",
              body: 'Those who never adopted show significantly higher privacy concern (4.34 vs 3.30), stronger data control desire (4.72 vs 3.90), and greater awareness of mental health risks (3.66 vs 3.12). They are not missing out — they are making different value judgments.',
              color: "#a3a3a3"
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="border-t border-stone-200 pt-8"
            >
              <div className="text-[10px] text-stone-300 mb-3">{item.num}</div>
              <h3 className="text-lg font-light text-stone-800 mb-4">{item.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Privacy Paradox */}
      <Section id="paradox" className="bg-stone-900 text-white">
        <div className="text-center mb-16">
          <SectionLabel>The Privacy Paradox</SectionLabel>
          <Heading className="mt-4 text-white">Click to Explore Each Group</Heading>
          <p className="text-sm text-stone-400 mt-4">
            How do different users resolve the tension between privacy concern and convenience?
          </p>
        </div>

        <QuadrantGrid
          items={[
            { name: "Privacy Paradox", pct: 25, desc: "High concern, still willing to use", color: "#a3a3a3", insight: "These users recognize the risks but prioritize convenience and health benefits. This is what scholars call 'normalized surveillance' — the trade-off feels acceptable." },
            { name: "Cautious Refusers", pct: 26, desc: "High concern, reluctant to use", color: "#737373", insight: "Higher ethical standards or stronger risk aversion. They're aware of benefits but won't compromise on privacy. A model for conscientious tech adoption." },
            { name: "Pragmatic Adopters", pct: 25, desc: "Low concern, willing to use", color: "#525252", insight: "Either less aware of risks or more willing to accept them. They've decided the benefits outweigh potential downsides." },
            { name: "Unconcerned Non-adopters", pct: 24, desc: "Low concern, unlikely to use", color: "#404040", insight: "Low engagement with privacy concerns AND low interest in adoption. Not necessarily a conscious choice — may reflect limited exposure to the issues." },
          ]}
          note="Based on all 117 respondents. Hover over any quadrant to see interpretation."
        />
      </Section>

      {/* Comparison */}
      <Section id="comparison" className="bg-white">
        <div className="mb-16">
          <SectionLabel>Comparison</SectionLabel>
          <Heading className="mt-4">Adopters vs Non-adopters</Heading>
          <p className="text-sm text-stone-400 mt-4">
            Click any row to reveal deeper analysis. How do these groups differ?
          </p>
        </div>

        <div className="bg-stone-50/50 rounded-2xl p-8 md:p-12">
          <ComparisonChart
            items={[
              {
                label: "Concerned about privacy risks",
                current: 3.30,
                never: 4.34,
                insight: "Never-users score 1.04 points higher — significantly more cautious about data risks and potential misuse."
              },
              {
                label: "Would stop using if data became too intrusive",
                current: 3.58,
                never: 4.17,
                insight: "Non-adopters have a lower threshold for acceptability — they would exit more readily when boundaries are crossed."
              },
              {
                label: "Users should have full control over their data",
                current: 4.18,
                never: 4.62,
                insight: "Both groups strongly support data sovereignty, but non-adopters value it even more — reflecting deeper ethical conviction."
              },
              {
                label: "Can control or delete my data is important",
                current: 3.90,
                never: 4.72,
                insight: "The largest gap (0.82 points). Non-adopters place exceptional weight on data agency — possibly their primary reason for non-adoption."
              },
              {
                label: "Devices may negatively affect mental wellbeing",
                current: 3.12,
                never: 3.66,
                insight: "Non-adopters are more aware of psychological risks — this awareness may have influenced their decision not to adopt."
              },
            ]}
          />
        </div>
      </Section>

      {/* Survey Results */}
      <Section id="results" className="bg-stone-50/50">
        <div className="mb-12">
          <SectionLabel>Data</SectionLabel>
          <Heading className="mt-4">Survey Results</Heading>
          <p className="text-sm text-stone-400 mt-2">
            Click any question to expand interpretation. All 117 respondents, mean scores (1-5).
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm">
          <ExpandableInsight
            label="Users should have full control over data collected"
            value={4.29}
            color="#1a1a1a"
            interpretation="The highest score — a near-consensus that data sovereignty is a fundamental right, not a feature. This reflects deep ethical conviction about bodily autonomy."
          />
          <ExpandableInsight
            label="Able to control or delete my data is important"
            value={4.15}
            color="#404040"
            interpretation="Close to full agreement. The desire for data agency is nearly universal — users expect to be able to revoke access and erase their digital footprint."
          />
          <ExpandableInsight
            label="Would stop using if data became too intrusive"
            value={3.80}
            color="#737373"
            interpretation="Above midpoint but not overwhelming. Most users have a boundary — though the privacy paradox suggests some would stay despite their stated limits."
          />
          <ExpandableInsight
            label="Willing to share data for clear benefits"
            value={3.62}
            color="#a3a3a3"
            interpretation="Conditional willingness. Users are open to exchange if they perceive fair value — a transactional relationship with their own data."
          />
          <ExpandableInsight
            label="Concerned about privacy risks"
            value={3.50}
            color="#525252"
            interpretation="Above midpoint but not extreme. Users recognize risks but don't let concern dominate their decisions — practicality trumps anxiety."
          />
          <ExpandableInsight
            label="Would continue using despite privacy concerns"
            value={3.37}
            color="#a3a3a3"
            interpretation="The privacy paradox in numbers. Users are slightly above neutral on continuing despite concerns, despite high scores on privacy importance — revealing a gap between values and behavior."
          />
        </div>
      </Section>

      {/* Conclusion */}
      <Section id="conclusion" className="bg-stone-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>Conclusion</SectionLabel>
          <Heading className="mt-4 text-white">A Question to Consider</Heading>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <p className="text-xl font-light text-stone-300 leading-relaxed mb-8">
              Wearable technologies give us remarkable insight into our bodies — but they also begin to replace bodily intuition with algorithmic judgment.
            </p>

            <div className="border-t border-stone-800 pt-10">
              <p className="text-lg font-light text-white italic leading-relaxed">
                "When step counts become measures of self-worth, when heart rate becomes a proxy for emotional states, are we truly learning about ourselves — or are we letting devices define who we are?"
              </p>
              <p className="text-sm text-stone-500 mt-6 leading-relaxed">
                The goal is not to reject technology, but to remain aware of how it shapes our self-understanding — and to preserve space for bodily intuition alongside algorithmic insight.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-stone-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-stone-400">
            Interactive Research Project <span className="text-stone-300">·</span> <span className="text-stone-600">{AUTHOR}</span>
          </p>
          <p className="text-xs text-stone-300 mt-2">
            117 survey responses · All data anonymized · GDPR compliant · Helsinki Declaration principles
          </p>
        </div>
      </footer>
    </main>
  );
}