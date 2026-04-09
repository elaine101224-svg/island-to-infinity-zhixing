export default function AboutSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-rose-500 font-medium text-center mb-2">
          Our Club
        </p>

        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 text-center tracking-tight">
          Island to Infinity
        </h2>

        <p className="text-slate-600 text-lg text-center max-w-3xl mx-auto mb-12">
          Island to Infinity is the ZhiXing club at our school, dedicated to reducing isolation among underprivileged families in Changshu. 
          Each family is considered an “island” with infinite possibilities. We empower families affected by catastrophic health events (CHE) 
          by providing holistic support addressing economic, social, and academic needs for both children and adults.
        </p>

        <p className="text-slate-600 text-lg text-center max-w-3xl mx-auto mb-12">
          Our members are paired with a family to facilitate weekly activities and home visits, while services are tailored to children’s interests 
          and the family’s holistic needs. We work closely with the Changshu Women’s Federation and organize field trips and CSC events to broaden 
          the participants’ perspectives beyond their immediate environment.
        </p>

        <p className="text-slate-600 text-lg text-center max-w-3xl mx-auto mb-12">
          Island to Infinity addresses these needs because government agencies have limited capacity to support these families directly.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Semester 1 */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Semester 1 — Building Foundations
            </h3>
            <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
              <li><strong>Weeks 1–2:</strong> Introduction, family matching, and first home visits.</li>
              <li><strong>Week 3:</strong> Reflection, skill-building workshops, and planning.</li>
              <li><strong>Week 4:</strong> First field trip chosen by the children.</li>
              <li><strong>Weeks 5–6:</strong> Weekly activities and Winterfest charity fundraising.</li>
              <li><strong>Weeks 7–10:</strong> Themed support sessions and second field trip.</li>
            </ul>
          </div>

          {/* Semester 2 */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Semester 2 — Deepening Impact
            </h3>
            <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
              <li><strong>Weeks 11–13:</strong> Continued sessions and collaboration with federation.</li>
              <li><strong>Week 14:</strong> Third field trip.</li>
              <li><strong>Week 15:</strong> Letters and photobook creation.</li>
              <li><strong>Weeks 16–17:</strong> Final structured sessions.</li>
              <li><strong>Weeks 18–20:</strong> Home visits, final trip, and reflections.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm max-w-2xl mx-auto">
            Through consistent engagement and shared experiences, Island to Infinity fosters meaningful human connection while creating lasting impact in the community.
          </p>
        </div>
      </div>
    </section>
  );
}
