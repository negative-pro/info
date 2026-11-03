import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import legal from '../content/ar/legal.json'
import text from '../content/ar/texts.json'

export default function LegalPage() {
  const { slug } = useParams()
  const page = legal.pages.find(item => item.slug === slug)
  if (!page) return <section className="page-section"><h1>{text.notFound.title}</h1><Link to="/">{text.notFound.action}</Link></section>
  return <article className="page-section legal-page">
    <Link className="text-link" to="/"><ArrowLeft size={16}/>{text.nav.home}</Link>
    <h1>{page.title}</h1>
    {page.draft && <p className="legal-draft">{legal.draftNotice}</p>}
    {page.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
  </article>
}
