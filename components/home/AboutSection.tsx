export default function AboutSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center tracking-tight">
          About Our Initiative
        </h2>
        <div className="prose prose-slate max-w-none space-y-5">
          <p className="text-lg text-slate-600 leading-relaxed">
            Island to Infinity Zhixing is a student-led community project based in Changshu, China.
            We are young people who believe that compassion and human connection can transform lives.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Our name reflects our philosophy: each family we work with is like an island — unique,
            with its own strengths and challenges. Through regular visits, companionship, and
            structured support, we help build bridges of understanding and support that connect
            these islands to the mainland of community.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            We work with underprivileged families in Changshu, focusing on three core areas:
            mental health support, companionship for isolated elderly, and helping families
            integrate into their communities. All our work is done with respect, dignity,
            and a deep commitment to ethical practices.
          </p>
        </div>
      </div>
    </section>
  );
}
