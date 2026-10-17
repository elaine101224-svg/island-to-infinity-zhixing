
'use client';
export default function AdminError({reset}:{reset:()=>void}) { return <div role="alert" className="editor-panel"><h1 className="font-serif text-2xl mb-3">Data could not be loaded</h1><p className="mb-5">No statistics or empty lists have been assumed. Please retry.</p><button className="editor-button" onClick={reset}>Retry</button></div>; }
