import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import legal from '../content/ar/legal.json'
import text from '../content/ar/texts.json'
import { site, siteText } from '../data/site'

export default function LegalPage() {
  const { slug } = useParams()
  const page = legal.pages.find(item => item.slug === slug)
  if (!page) return <section className="page-section"><h1>{text.notFound.title}</h1><Link to="/">{text.notFound.action}</Link></section>
  return <article className="page-section legal-page" lang="ar" dir="rtl">
    <Link className="text-link" to="/"><ArrowLeft size={16}/>{text.nav.home}</Link>
    <h1>{siteText(page.title)}</h1>
    <p>{legal.updatedLabel}: <time dateTime={legal.updatedAt}>{legal.updatedAt}</time></p>
    {page.sections.map(section => <section key={section.title}><h2>{siteText(section.title)}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{siteText(paragraph).split(site.email).map((part, index) => <span key={index}>{index > 0 && <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>}{part}</span>)}</p>)}</section>)}
  </article>
}
