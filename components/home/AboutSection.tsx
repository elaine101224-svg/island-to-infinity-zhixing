export default function AboutSection() {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
          About Our Initiative
        </h2>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600">
          <p className="text-lg leading-relaxed">
            Island to Infinity Zhixing is a student-led community project based in Changshu, China.
            We are young people who believe that compassion and human connection can transform lives.
          </p>
          <p className="text-lg leading-relaxed">
            Our name reflects our philosophy: each family we work with is like an island — unique,
            with its own strengths and challenges. Through regular visits, companionship, and
            structured support, we help build bridges of understanding and support that connect
            these islands to the mainland of community.
          </p>
          <p className="text-lg leading-relaxed">
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
