import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, UserRound } from 'lucide-react'
import type { Article } from '../models/article'
import { articles, articleImage } from '../data/articles'
import text from '../content/ar/texts.json'
import MixedText from './MixedText'

const labels = text.blog
function ArticleMeta({ article, showReadTime = true }: { article: Article; showReadTime?: boolean }) {
  return <dl className="article-facts">
    <div className="article-fact-author"><dt>{labels.writtenBy}</dt><dd><UserRound size={12} aria-hidden="true"/><span>{article.writer}</span></dd></div>
    {showReadTime && <div><dt>{labels.readingTime}</dt><dd><Clock size={12} aria-hidden="true"/><span>{article.readMinutes} {labels.minutes}</span></dd></div>}
    <div><dt>{labels.publishedOn}</dt><dd><CalendarDays size={12} aria-hidden="true"/><time dateTime={article.publishedAt}>{new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(article.publishedAt))}</time></dd></div>
  </dl>
}
function ArticleCard({ article, home = false }: { article: Article; home?: boolean }) {
  return <article className="blog-card"><Link to={`/blog/${article.id}`} className="blog-card-link"><img src={articleImage(article.id)} alt={article.imageAlt} loading="lazy"/><div className="blog-card-copy"><h3><MixedText>{article.title}</MixedText></h3><p><MixedText>{article.excerpt}</MixedText></p>{!home && <span className="text-link">{labels.read}<ArrowLeft size={15} aria-hidden="true"/></span>}</div></Link>{home ? <div className="home-article-author"><span className="home-article-writer"><UserRound size={13} aria-hidden="true"/>{article.writer}</span><Link className="text-link" to={`/blog/${article.id}`}>{labels.read}<ArrowLeft size={14} aria-hidden="true"/></Link></div> : <ArticleMeta article={article} showReadTime={false}/>}</article>
}
export function ArticlesSection() {
  return <section className="home-articles" aria-labelledby="home-articles-title"><div className="section-heading"><div><h2 id="home-articles-title">{labels.title}</h2><p>{labels.description}</p></div><Link className="text-link" to="/blog">{labels.all}<ArrowLeft size={17} aria-hidden="true"/></Link></div>{articles.length ? <div className="blog-grid">{articles.slice(0, 3).map(article => <ArticleCard key={article.id} article={article} home/>)}</div> : <p className="blog-empty">{labels.empty}</p>}</section>
}
export function BlogPage() {
  return <section className="page-section blog-page"><h1>{labels.title}</h1><p className="page-description">{labels.description}</p>{articles.length ? <div className="blog-grid">{articles.map(article => <ArticleCard key={article.id} article={article}/>)}</div> : <p className="blog-empty">{labels.empty}</p>}</section>
}
export function ArticleDetail({ notFound }: { notFound: ReactNode }) {
  const { id } = useParams()
  const article = articles.find(item => item.id === id)
  if (!article) return notFound
  return <article className="page-section blog-detail"><Link className="text-link" to="/blog"><ArrowLeft size={16} aria-hidden="true"/>{labels.back}</Link><header><h1><MixedText>{article.title}</MixedText></h1><p className="page-description"><MixedText>{article.excerpt}</MixedText></p><ArticleMeta article={article}/></header><img className="blog-cover" src={articleImage(article.id)} alt={article.imageAlt} fetchPriority="high"/><div className="blog-body">{article.paragraphs.map((paragraph, index) => typeof paragraph === 'string' ? <p key={index}><MixedText>{paragraph}</MixedText></p> : <h2 key={index}><MixedText>{paragraph.text}</MixedText></h2>)}</div></article>
}
