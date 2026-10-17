'use client';
export default function PublicError({ reset }: { reset: () => void }) {
  return <div className="max-w-3xl mx-auto px-5 py-16"><h1 className="font-serif text-3xl mb-4">We couldn’t load this page</h1><p className="text-earth-mid mb-6">Please try again in a moment.</p><button onClick={reset} className="editor-button">Try again</button></div>;
}
