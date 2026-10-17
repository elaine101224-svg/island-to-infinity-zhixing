export default function SemesterOutline() { return <section className="mt-12"><h2 className="font-serif text-2xl mb-3">Semester planning framework</h2><p className="text-earth-mid mb-5">Our general planning approach, rather than a confirmed calendar. See Schedule for approved public events.</p>        <div className="grid md:grid-cols-2 gap-4">
          {/* Semester 1 */}
          <div className="bg-gradient-to-br from-white to-amber-light/30 rounded-sm p-5 border border-sand hover:shadow-md transition-all duration-300">
            <h3 className="heading-display text-base font-medium text-earth-dark mb-3">
              Semester 1 &mdash; Building Foundations
            </h3>
            <ul className="space-y-2 text-earth-mid text-sm leading-relaxed">
              <li>
                <strong className="text-earth-dark font-medium">Weeks 1&ndash;2:</strong>{" "}
                Introduction, family matching, and first home visits.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Week 3:</strong> Reflection,
                skill-building workshops, and planning.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Week 4:</strong> First field trip
                chosen by the children.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Weeks 5&ndash;6:</strong> Weekly
                activities and Winterfest charity fundraising.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Weeks 7&ndash;10:</strong> Themed
                support sessions and second field trip.
              </li>
            </ul>
          </div>

          {/* Semester 2 */}
          <div className="bg-gradient-to-br from-white to-sage-light/30 rounded-sm p-5 border border-sand hover:shadow-md transition-all duration-300">
            <h3 className="heading-display text-base font-medium text-earth-dark mb-3">
              Semester 2 &mdash; Deepening Impact
            </h3>
            <ul className="space-y-2 text-earth-mid text-sm leading-relaxed">
              <li>
                <strong className="text-earth-dark font-medium">Weeks 11&ndash;13:</strong>{" "}
                Continued sessions and collaboration with federation.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Week 14:</strong> Third field
                trip.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Week 15:</strong> Letters and
                photobook creation.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Weeks 16&ndash;17:</strong> Final
                structured sessions.
              </li>
              <li>
                <strong className="text-earth-dark font-medium">Weeks 18&ndash;20:</strong> Home
                visits, final trip, and reflections.
              </li>
            </ul>
          </div>
        </div>
</section>; }
