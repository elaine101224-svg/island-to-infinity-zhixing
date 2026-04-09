export default function AboutSection() {
  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-slate-600 text-base text-center max-w-3xl mx-auto mb-8 leading-relaxed">
          <strong className="font-semibold text-slate-700">Island to Infinity</strong> is a{" "}
          <strong className="font-semibold text-slate-700">student-led initiative</strong> dedicated to
          reducing isolation among underprivileged families in{" "}
          <strong className="font-semibold text-slate-700">Changshu</strong>. Each family is
          considered an &quot;island&quot; with infinite possibilities. Members engage in weekly
          activities and home visits, providing holistic support to children and adults. The
          initiative works closely with the{" "}
          <strong className="font-semibold text-slate-700">Changshu Women&apos;s Federation</strong>{" "}
          to ensure programs are tailored to the families&apos; needs and promote social,
          educational, and economic wellbeing.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Semester 1 */}
          <div className="bg-gradient-to-br from-white to-rose-50/30 rounded-xl p-5 border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <h3 className="text-base font-serif font-semibold text-slate-900 mb-3 tracking-wide">
              Semester 1 &mdash; Building Foundations
            </h3>
            <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
              <li>
                <strong className="text-slate-700 font-medium">Weeks 1&ndash;2:</strong>{" "}
                Introduction, family matching, and first home visits.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Week 3:</strong> Reflection,
                skill-building workshops, and planning.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Week 4:</strong> First field trip
                chosen by the children.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Weeks 5&ndash;6:</strong> Weekly
                activities and Winterfest charity fundraising.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Weeks 7&ndash;10:</strong> Themed
                support sessions and second field trip.
              </li>
            </ul>
          </div>

          {/* Semester 2 */}
          <div className="bg-gradient-to-br from-white to-violet-50/30 rounded-xl p-5 border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <h3 className="text-base font-serif font-semibold text-slate-900 mb-3 tracking-wide">
              Semester 2 &mdash; Deepening Impact
            </h3>
            <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
              <li>
                <strong className="text-slate-700 font-medium">Weeks 11&ndash;13:</strong>{" "}
                Continued sessions and collaboration with federation.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Week 14:</strong> Third field
                trip.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Week 15:</strong> Letters and
                photobook creation.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Weeks 16&ndash;17:</strong> Final
                structured sessions.
              </li>
              <li>
                <strong className="text-slate-700 font-medium">Weeks 18&ndash;20:</strong> Home
                visits, final trip, and reflections.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed italic">
            Through consistent engagement and shared experiences, Island to Infinity fosters
            meaningful human connection while creating lasting impact in the community.
          </p>
        </div>
      </div>
    </section>
  );
}
