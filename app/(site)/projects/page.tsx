import ProjectGrid from '@/components/projects/ProjectGrid';
import {readPublishedContent} from '@/lib/websiteContent';
export const revalidate = 300;
export default async function Projects(){const content=await readPublishedContent();return <section className="max-w-6xl mx-auto px-5 py-12 sm:py-16"><header className="mb-8"><h1 className="font-serif text-4xl sm:text-5xl text-earth-dark">Our Projects</h1><p className="text-earth-mid mt-3">{content.schoolYear} · Plans, people and progress</p></header><ProjectGrid projects={content.projects}/>{!content.projects.some(project=>project.published)&&<p className="text-earth-mid">Projects for this term will appear here once published.</p>}</section>;}
